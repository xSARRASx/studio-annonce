import { appendPhotoRequest } from '../../../shared/photo-request';
import { DEFAULT_PHOTO_REQUEST } from '../../../shared/photo-default';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { Logo, Button, colors } from './Studio';
import { useAccount } from './AccountConnection';
import { AdminAlerts } from './AdminAlerts';
import { AdminCommerce } from './AdminCommerce';
import { ConnectedLibraryContent } from './ConnectedLibraryContent';
import { ConnectedListingImport } from './ConnectedListingImport';
import { ConnectedVideoPreparation } from './ConnectedVideoPreparation';
import { PurchaseDocument } from './PurchaseDocument';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { ApiError, canRequestGeneration, downloadLabel, generationLabel, needsDownloadCredit, previewIsProtected, type AccountPhoto, type CreatedVideo, type Limits, type Pack, type Property } from '../lib/account-api';
import { canSavePhoto, photoPayload, savePhoto } from '../lib/account-files';

const message = (error: unknown) => error instanceof Error ? error.message : 'Cette action n’a pas abouti. Réessayez.';
const euro = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
type Cart = Record<string, number>;
const cartArticles = (packs: Pack[], cart: Cart) => packs.flatMap(pack => cart[pack.id] ? [{ pack_id: pack.id, quantite: cart[pack.id] }] : []);
const cartTotal = (packs: Pack[], cart: Cart) => packs.reduce((sum, pack) => sum + pack.prix_centimes * (cart[pack.id] || 0), 0);
const cartCredits = (packs: Pack[], cart: Cart) => packs.reduce((sum, pack) => sum + pack.credits * (cart[pack.id] || 0), 0);

export function AccountScreenFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { account, ready, error } = useAccount();
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <View style={s.header}><Logo/><Pressable accessibilityRole="button" accessibilityLabel="Voir les offres et acheter des crédits" onPress={() => router.navigate('/credits')} style={s.creditPill}><Text style={s.pillText}>{account?.gratuit_illimite ? 'Créations offertes' : account ? `${account.solde} crédit${account.solde > 1 ? 's' : ''}` : 'Crédits'}</Text></Pressable></View>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <Text style={s.title} accessibilityRole="header">{title}</Text><Text style={s.subtitle}>{subtitle}</Text>
      {!!error && <Notice text={error}/>}{!ready ? <ActivityIndicator accessibilityLabel="Connexion au compte" color={colors.ink}/> : children}
      <SupportContact limits={account?.limites}/>
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
function SupportContact({ limits }: { limits?: Limits }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const phone = limits?.support_telephone || '06 34 97 26 93';
  const email = limits?.support_email?.trim() || 'contact@studioannonce.fr';
  async function contact(channel: 'whatsapp' | 'email') {
    setNotice('');
    let href = 'https://wa.me/33634972693';
    if (channel === 'email') href = `mailto:${/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : 'contact@studioannonce.fr'}`;
    else if (limits?.support_url) {
      try { const url = new URL(limits.support_url); if (url.protocol === 'https:') href = url.href; } catch { /* Use the confirmed support address. */ }
    }
    try { await Linking.openURL(href); }
    catch { setNotice(`L’ouverture n’a pas abouti. Vous pouvez nous joindre au ${phone} ou à ${email}.`); }
  }
  return <View style={s.support}>
    <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} style={s.supportToggle}><Text style={s.label}>Aide et contact</Text><Text style={s.linkText}>{open ? '−' : '+'}</Text></Pressable>
    {open && <View style={s.group}><Text style={s.body}>Une question sur votre compte, une retouche ou vos crédits ?</Text><Button title="Contacter le support" secondary onPress={() => void contact('whatsapp')}/><Text style={s.small}>{phone} · WhatsApp</Text><LinkButton title="Envoyer un email" onPress={() => void contact('email')}/><Text style={s.small}>{email}</Text>{!!notice && <Notice text={notice}/>}</View>}
  </View>;
}
function Notice({ text }: { text: string }) { return <Text accessibilityLiveRegion="polite" style={s.notice}>{text}</Text>; }
function PhotoCostQuote({ photo, owner, balance }: { photo: AccountPhoto; owner: boolean; balance: number }) {
  const costsOne = !owner && (photo.reprise_necessaire || !photo.offerte && !photo.credite_le);
  const explanation = owner
    ? 'Sur ce compte administrateur, la création est offerte. Tarif client : 1 crédit pour une photo payante gardée en HD sans filigrane ou une correction supplémentaire.'
    : photo.reprise_necessaire
      ? 'Ce crédit est débité à la confirmation de la correction supplémentaire ; son téléchargement HD sans filigrane est inclus.'
      : photo.offerte
        ? 'Votre première photo et son téléchargement HD sans filigrane sont offerts.'
        : photo.credite_le
          ? 'Cette photo est déjà acquise en HD sans filigrane. La correction encore incluse ne demande aucun nouveau crédit.'
          : `Il faut disposer d’1 crédit avant de créer la retouche. Aucun débit maintenant : 1 crédit sera utilisé seulement si vous gardez cette photo en HD sans filigrane. Solde actuel : ${balance}.`;
  return <View style={s.costQuote} accessibilityLabel="Coût avant création de la photo"><Text style={s.label}>Coût avant la prochaine retouche</Text><Text style={s.costAmount}>{costsOne ? '1 crédit photo' : '0 crédit débité'}</Text><Text style={s.small}>{explanation}</Text></View>;
}
function LinkButton({ title, onPress }: { title: string; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={s.link}><Text style={s.linkText}>{title}</Text></Pressable>; }
function Quantity({ label, value, total, onChange }: { label: string; value: number; total: number; onChange: (delta: number) => void }) {
  return <View accessibilityLabel={`Quantité pour ${label}`} style={s.quantity}><Pressable accessibilityRole="button" accessibilityLabel={`Retirer un pack ${label}`} disabled={!value} onPress={() => onChange(-1)} style={[s.quantityButton, !value && s.quantityDisabled]}><Text style={s.quantitySymbol}>−</Text></Pressable><Text style={s.quantityValue}>{value}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Ajouter un pack ${label}`} disabled={total >= 20} onPress={() => onChange(1)} style={[s.quantityButton, total >= 20 && s.quantityDisabled]}><Text style={s.quantitySymbol}>+</Text></Pressable></View>;
}
function Field({ label, value, onChangeText, placeholder, email, code, url, multiline, password }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; email?: boolean; code?: boolean; url?: boolean; multiline?: boolean; password?: boolean }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8a9081" autoCapitalize={email || code || url || password ? 'none' : 'sentences'} keyboardType={email ? 'email-address' : url ? 'url' : code ? 'number-pad' : 'default'} autoComplete={email ? 'email' : code ? 'one-time-code' : password ? 'password' : 'off'} secureTextEntry={password} maxLength={code ? 6 : password ? 128 : multiline ? 4000 : url ? 1000 : 254} multiline={multiline} style={[s.input, multiline && s.multiline]}/></View>;
}
function Gate({ children }: { children: React.ReactNode }) {
  const { ready, account } = useAccount();
  if (!ready) return null;
  if (!account) return <LoginForm/>;
  if (!account.profil_complet) return <ProfileForm/>;
  return children;
}
function CreditGate({ nature, children }: { nature: 'photo' | 'video'; children: React.ReactNode }) {
  const { account } = useAccount();
  if (!account || account.gratuit_illimite) return children;
  const disponible = nature === 'photo' ? account.photo_offerte_disponible || account.solde > 0 : account.solde_video > 0;
  if (disponible) return children;
  return <View style={s.warningCard}><Text style={s.cardTitle}>Ajoutez des crédits {nature} pour commencer</Text><Text style={s.body}>{nature === 'photo' ? 'Votre photo offerte a déjà été utilisée. Un crédit photo est nécessaire avant une nouvelle retouche.' : 'Les vidéos ne comprennent pas d’essai gratuit. Il faut des crédits vidéo avant de lancer une création.'}</Text><Button title={`Voir les crédits ${nature}`} onPress={() => router.navigate('/credits')}/><Text style={s.small}>Vos créations déjà enregistrées restent accessibles.</Text></View>;
}
function LoginForm() {
  const { api, login, health } = useAccount();
  const [mode, setMode] = useState<'connexion' | 'inscription' | 'recuperation'>('inscription');
  const [first, setFirst] = useState(''); const [last, setLast] = useState('');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [code, setCode] = useState('');
  const [sent, setSent] = useState(false); const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  function changeMode(next: 'connexion' | 'inscription' | 'recuperation') { setMode(next); setSent(false); setDone(false); setCode(''); setPassword(''); setNotice(''); }
  async function submit() {
    if (busy) return; setBusy(true); setNotice('');
    try {
      const address = email.trim().toLowerCase();
      if (mode === 'connexion') await login(address, password);
      else if (mode === 'inscription' && !sent) {
        await api.json('/auth/inscription', { method: 'POST', body: JSON.stringify({ email: address, mot_de_passe: password, prenom: first.trim(), nom: last.trim() }) });
        setSent(true); setNotice('Code envoyé. Il est valable dix minutes. Vérifiez aussi vos spams.');
      } else if (mode === 'inscription') await login(address, code, 'inscription');
      else if (!sent) {
        await api.json('/auth/mot-de-passe/code', { method: 'POST', body: JSON.stringify({ email: address }) });
        setSent(true); setNotice('Si ce compte existe, un code a été envoyé. Vérifiez aussi vos spams.');
      } else {
        await api.json('/auth/mot-de-passe/reinitialiser', { method: 'POST', body: JSON.stringify({ email: address, code, mot_de_passe: password }) });
        setDone(true); setPassword(''); setCode(''); setNotice('Mot de passe modifié. Connectez-vous avec votre email et votre nouveau mot de passe.');
      }
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  return <View style={s.card}><Text style={s.cardTitle}>{mode === 'inscription' ? 'Créer mon compte' : mode === 'recuperation' ? 'Mot de passe oublié' : 'Me connecter'}</Text><Text style={s.body}>{mode === 'inscription' ? 'Votre première photo est offerte après vérification de votre email.' : mode === 'recuperation' ? 'Recevez un code pour choisir un nouveau mot de passe.' : 'Connectez-vous avec votre email et votre mot de passe.'}</Text>
    {health && !health.connexion_disponible && <Notice text="La connexion est momentanément indisponible."/>}
    {!done && (!sent || mode === 'connexion') ? <>{mode === 'inscription' && <><Field label="Prénom" value={first} onChangeText={setFirst}/><Field label="Nom" value={last} onChangeText={setLast}/></>}<Field label="Votre email" value={email} onChangeText={setEmail} placeholder="vous@exemple.fr" email/>{mode !== 'recuperation' && <Field label="Mot de passe" value={password} onChangeText={setPassword} password/>}{mode === 'inscription' && <Text style={s.small}>12 caractères minimum.</Text>}</> : !done && <><Text style={s.body}>{email}</Text><Field label="Code reçu par email" value={code} onChangeText={v => setCode(v.replace(/\D/g, ''))} code/>{mode === 'recuperation' && <><Field label="Nouveau mot de passe" value={password} onChangeText={setPassword} password/><Text style={s.small}>12 caractères minimum.</Text></>}</>}
    {!!notice && <Notice text={notice}/>}{!done && <Button title={busy ? 'Un instant…' : mode === 'connexion' ? 'Me connecter' : sent ? mode === 'inscription' ? 'Confirmer mon compte' : 'Changer mon mot de passe' : mode === 'inscription' ? 'Créer mon compte' : 'Recevoir un code'} onPress={() => void submit()} disabled={busy || !email.includes('@') || (sent && code.length !== 6) || (mode === 'inscription' && !sent && (!first.trim() || !last.trim() || password.length < 12)) || (mode === 'connexion' && !password) || (mode === 'recuperation' && sent && password.length < 12) || health?.connexion_disponible === false}/>}
    {sent && !done && <View style={s.warningCard}><Text style={s.cardTitle}>Vous ne trouvez pas l’email ?</Text><Text style={s.body}>Vérifiez les Spams / Courriers indésirables. Cherchez no-reply@studioannonce.fr. Seul le dernier code reçu fonctionne.</Text></View>}
    <LinkButton title={mode === 'inscription' ? 'J’ai déjà un compte — me connecter' : 'Créer un compte'} onPress={() => changeMode(mode === 'inscription' ? 'connexion' : 'inscription')}/>{mode === 'connexion' && <LinkButton title="Mot de passe oublié ?" onPress={() => changeMode('recuperation')}/>}{mode === 'recuperation' && <LinkButton title="Retour à la connexion" onPress={() => changeMode('connexion')}/>}<LinkButton title="Voir les exemples et mes brouillons locaux" onPress={() => router.push('/local')}/>
  </View>;
}
function ProfileForm() {
  const { account, api, refresh } = useAccount(); const [first, setFirst] = useState(account?.prenom || ''); const [last, setLast] = useState(account?.nom || '');
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  async function save() { if (busy) return; setBusy(true); setNotice(''); try { await api.json('/compte/profil', { method: 'PATCH', body: JSON.stringify({ prenom: first.trim(), nom: last.trim() }) }); await refresh(); setNotice('Votre profil est enregistré.'); } catch (error) { setNotice(message(error)); } finally { setBusy(false); } }
  return <View style={s.card}><Text style={s.cardTitle}>{account?.profil_complet ? 'Mes coordonnées' : 'Bienvenue dans votre studio'}</Text><Text style={s.body}>{account?.email}</Text><Field label="Prénom" value={first} onChangeText={setFirst}/><Field label="Nom" value={last} onChangeText={setLast}/>{!!notice && <Notice text={notice}/>}<Button title={busy ? 'Enregistrement…' : 'Enregistrer mon profil'} onPress={() => void save()} disabled={busy || !first.trim() || !last.trim()}/></View>;
}
function LimitsCard({ limits, detailed = false }: { limits?: Limits; detailed?: boolean }) {
  if (!limits) return null;
  if (limits.proprietaire) return detailed ? <View style={s.card}><Text style={s.cardTitle}>Créations offertes sur ce compte administrateur</Text><Text style={s.body}>Photos et vidéos sans crédits client. Les appels aux fournisseurs restent facturés à Studio Annonce.</Text></View> : null;
  const blocked = limits.photo.bloque || limits.video.bloque;
  if (!blocked && !detailed) return null;
  return <View style={[s.card, blocked && s.warningCard]}><Text style={s.cardTitle}>{blocked ? 'Limite d’essais atteinte' : 'Vos essais depuis le dernier achat'}</Text>
    {detailed && <Text style={s.body}>Photos : {limits.photo.utilisees} / {limits.photo.limite} · Vidéos : {limits.video.utilisees} / {limits.video.limite}</Text>}
    <Text style={s.body}>{blocked ? 'Contactez le support pour débloquer les nouvelles créations. Vos photos déjà achetées restent accessibles.' : 'Une création est une génération ou correction réalisée par l’IA. Ce plafond est différent du solde de crédits et ne promet pas des téléchargements gratuits. Les imports, brouillons et téléchargements répétés ne consomment pas d’essai. Un achat du pack correspondant ou un déblocage par le support remet le compteur à zéro, sur le site comme sur mobile.'}</Text>
    {blocked && <View style={s.group}><LinkButton title="Contacter le support" onPress={() => { if (limits.support_url) void Linking.openURL(limits.support_url); }}/><Text style={s.small}>{limits.support_telephone}</Text>{!!limits.support_email && <LinkButton title={limits.support_email} onPress={() => { void Linking.openURL(`mailto:${limits.support_email}`); }}/>}</View>}</View>;
}
export function ConnectedLibrary() { return <AccountScreenFrame title="Mes créations" subtitle="Vos photos et leurs versions, sur tous vos appareils."><Gate><ConnectedLibraryContent/></Gate></AccountScreenFrame>; }
export function ConnectedVideoPlanScreen() { return <AccountScreenFrame title="Préparer ma vidéo" subtitle="Choisissez les photos, leur ordre et votre demande avant de confirmer."><Gate><CreditGate nature="video"><ConnectedVideoPreparation/></CreditGate></Gate></AccountScreenFrame>; }
export function ConnectedUpload() { const params = useLocalSearchParams<{ retour?: string }>(); const forVideo = params.retour === 'visite'; return <AccountScreenFrame title={forVideo ? 'Photos de ma vidéo' : 'Retoucher mes photos'} subtitle={forVideo ? 'Ajoutez les images qui serviront à votre visite.' : 'Choisissez une ou plusieurs photos, puis préparez vos retouches.'}><Gate><CreditGate nature={forVideo ? 'video' : 'photo'}><UploadContent/></CreditGate></Gate></AccountScreenFrame>; }
function UploadContent() {
  const { api, account, refresh } = useAccount(); const params = useLocalSearchParams<{ logement?: string; retour?: string }>();
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]); const [selectedUris, setSelectedUris] = useState<string[]>([]); const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState(''); const [newName, setNewName] = useState(params.logement || 'Mon logement'); const [showProperties, setShowProperties] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [photoRequest,setPhotoRequest]=useState(DEFAULT_PHOTO_REQUEST);
  const uploads = useRef(new Map<string, { home: string; key: string; body: Promise<string> }>());
  const importedIds = useRef<string[]>([]); const sending = useRef(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  const sourceHost = (() => { try { return new URL(sourceUrl.trim()).hostname.toLowerCase(); } catch { return ''; } })();
  const sourceName = sourceHost === 'booking.com' || sourceHost.endsWith('.booking.com') ? 'Booking.com' : sourceHost === 'airbnb.com' || sourceHost.endsWith('.airbnb.com') || /^(?:www\.)?airbnb\.(?:fr|de|es|it|be|nl|pt|ie|ca|co\.uk|com\.au)$/.test(sourceHost) ? 'Airbnb' : '';
  useEffect(() => { let active = true; void api.json<Property[]>('/logements').then(items => { if (active) { setProperties(items); if (!params.logement && items[0]) setPropertyId(items[0].id); } }).catch(error => { if (active) setNotice(message(error)); }); return () => { active = false; }; }, [api, params.logement]);
  async function pick(camera = false) {
    if (busy) return; setBusy(true); setNotice('');
    try { if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Autorisez l’appareil photo pour prendre une photo.');
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: .95, allowsEditing: false, allowsMultipleSelection: !camera, selectionLimit: camera ? 1 : params.retour === 'visite' ? 6 : 30 };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets.length) { if (result.assets.some(asset => (asset.fileSize || 0) > 30 * 1024 * 1024)) throw new Error('Choisissez des photos de moins de 30 Mo chacune.'); const limit = params.retour === 'visite' ? 6 : 30;
        const combined = [...assets];
        for (const asset of result.assets) if (!combined.some(item => item.uri === asset.uri || (item.assetId && item.assetId === asset.assetId))) combined.push(asset);
        const kept = combined.slice(0, limit);
        setAssets(kept); setSelectedUris(current => [...new Set([...current, ...kept.filter(item => !assets.some(previous => previous.uri === item.uri)).map(item => item.uri)])]);
        if (combined.length > limit) setNotice(`Vous pouvez préparer ${limit} photos à la fois. Les premières photos ont été conservées.`); }
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  async function upload(asDraft = false) {
    const chosen = assets.filter(asset => selectedUris.includes(asset.uri));
    if (!chosen.length || sending.current || (params.retour !== 'visite' && account?.limites?.photo.bloque)) return;
    sending.current = true; setBusy(true); setNotice('');
    try {
      let id = propertyId;
      if (sourceUrl.trim()) { try { const url = new URL(sourceUrl.trim()); if (url.protocol !== 'https:' || url.username || url.password) throw new Error(); } catch { throw new Error('Collez un lien d’annonce HTTPS valide.'); } }
      if (!id) { const created = await api.json<Property>('/logements', { method: 'POST', body: JSON.stringify({ nom: newName.trim() || 'Mon logement', ville: '', type_annonce: 'location', source_url: sourceUrl.trim() }) }); id = created.id; setPropertyId(id); setProperties(items => [...items, created]); }
      const failures: string[] = [];
      for (const asset of chosen) {
        try {
          let intent = uploads.current.get(asset.uri);
          if (!intent || intent.home !== id) { const key = Crypto.randomUUID(); intent = { home: id, key, body: photoPayload(asset, key) }; uploads.current.set(asset.uri, intent); void intent.body.catch(() => uploads.current.delete(asset.uri)); }
          const body = JSON.stringify({...JSON.parse(await intent.body),demande:photoRequest,usage_initial:params.retour === 'visite' ? 'video' : 'photo'});
          let photo: AccountPhoto;
          try { photo = await api.json<AccountPhoto>(`/photos/${id}/import`, { method: 'POST', body }); }
          catch (error) { if (!(error instanceof ApiError) || ![0, 502, 504].includes(error.status)) throw error; photo = await api.json<AccountPhoto>(`/photos/${id}/import`, { method: 'POST', body }); }
          if (!importedIds.current.includes(photo.id)) importedIds.current.push(photo.id);
          setAssets(current => current.filter(item => item.uri !== asset.uri));
          setSelectedUris(current => current.filter(uri => uri !== asset.uri));
          setNotice(`${importedIds.current.length} photo(s) conservée(s)…`);
        } catch (error) { failures.push(`${asset.fileName || 'Photo'} : ${message(error)}`); }
      }
      await refresh();
      if (failures.length) { setNotice(`${importedIds.current.length} photo(s) déjà conservée(s). ${failures.join(' · ')} Reprenez l’envoi des fichiers restants avec le bouton ci-dessus.`); return; }
      const ids = importedIds.current;
      if (!ids.length) return;
      if (asDraft) { router.push({pathname:'/',params:{brouillons:'1'}}); return; }
      if (params.retour === 'visite') router.push({ pathname: '/visite', params: { photos: ids.slice(0, 6).join(',') } });
      else if (ids.length > 1) router.push({ pathname: '/', params: { selection: ids.join(',') } });
      else router.push({ pathname: '/retouche', params: { id: ids[0], mode: 'compte' } });
    } catch (error) { setNotice(message(error)); }
    finally { sending.current = false; setBusy(false); }
  }
  async function saveSource() {
    if (busy || !sourceUrl.trim()) return;
    setBusy(true); setNotice('');
    try {
      const url = new URL(sourceUrl.trim());
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) throw new Error('Collez un lien d’annonce HTTPS valide.');
      const created = await api.json<Property>('/logements', { method: 'POST', body: JSON.stringify({ nom: newName.trim() || 'Mon logement', ville: '', type_annonce: 'location', source_url: url.toString() }) });
      setPropertyId(created.id); setProperties(items => [...items, created]);
      setNotice('Annonce enregistrée. Choisissez maintenant les photos que vous souhaitez améliorer.');
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  const count = assets.filter(asset => selectedUris.includes(asset.uri)).length;
  const credits = account?.gratuit_illimite ? 0 : Math.max(0, count - (account?.photo_offerte_disponible ? 1 : 0));
  return <><LimitsCard limits={account?.limites}/><View style={s.card}>{assets.length ? <><View style={s.photoGrid}>{assets.map((asset, index) => <Pressable key={asset.uri} accessibilityRole="button" accessibilityState={{ selected: selectedUris.includes(asset.uri) }} accessibilityLabel={`Photo ${index + 1}`} disabled={busy} onPress={() => setSelectedUris(current => current.includes(asset.uri) ? current.filter(uri => uri !== asset.uri) : [...current, asset.uri])} style={[s.photoCard, selectedUris.includes(asset.uri) && s.photoCardChosen]}><Image source={{ uri: asset.uri }} style={s.thumbnail}/><Text style={s.photoTitle}>{selectedUris.includes(asset.uri) ? '✓ ' : ''}Photo {index + 1}</Text></Pressable>)}</View><View style={s.secondaryRow}><LinkButton title="Ajouter d’autres photos" onPress={() => void pick()}/><LinkButton title="Ranger dans un logement" onPress={() => setShowProperties(v => !v)}/></View></> : <><View style={s.dropzone}><Text style={s.dropIcon}>＋</Text><Text style={s.cardTitle}>Choisissez vos photos</Text><Text style={s.small}>JPG, PNG ou WebP · 30 Mo maximum chacune</Text></View><Button title="Choisir dans mes photos" onPress={() => void pick()} disabled={busy || (params.retour !== 'visite' && account?.limites?.photo.bloque)}/><LinkButton title="Prendre une photo" onPress={() => void pick(true)}/></>}
    <ConnectedListingImport usage={params.retour === 'visite' ? 'video' : 'photo'} onImported={ids=>params.retour==='visite'?router.push({pathname:'/visite',params:{photos:ids.slice(0,6).join(',')}}):router.push({pathname:'/retouche',params:{id:ids[0],lot:ids.join(','),mode:'compte'}})}/>
    {params.retour !== 'visite' && <><Text style={s.small}>Une mise en valeur pour Airbnb et Booking est proposée. Modifiez le texte, ou effacez-le pour une retouche automatique.</Text><Field label="Votre demande de retouche · facultative" value={photoRequest} onChangeText={setPhotoRequest} multiline placeholder="Retouche automatique si ce champ est vide."/><LinkButton title="Effacer ma demande" onPress={() => setPhotoRequest('')}/><MobileBriefAssistant kind="photo" request={photoRequest} onUse={setPhotoRequest} storageKey={`studio:${account?.id}:upload-assistant`}/></>}
    {(showProperties || !properties.length) && <View style={s.group}>{properties.map(property => <LinkButton key={property.id} title={`${propertyId === property.id ? '✓ ' : ''}${property.nom}`} onPress={() => { setPropertyId(property.id); setShowProperties(false); }}/>) }{properties.length > 0 && <LinkButton title="+ Nouveau logement" onPress={() => setPropertyId('')}/>} {!propertyId && <><Field label="Nom du logement" value={newName} onChangeText={setNewName}/><Field label="Lien Airbnb ou Booking (facultatif)" value={sourceUrl} onChangeText={setSourceUrl} placeholder="https://www.airbnb.fr/rooms/…" url/>{!!sourceUrl.trim() && <Text style={s.small}>{sourceName ? `Annonce ${sourceName} reconnue. ` : 'Lien enregistré avec ce logement. '}Utilisez « Récupérer les photos » ci-dessus, ou ajoutez vos fichiers originaux.</Text>}{!!sourceUrl.trim() && !assets.length && <LinkButton title={busy ? 'Enregistrement…' : 'Enregistrer l’annonce pour plus tard'} onPress={() => void saveSource()}/>}</>}</View>}
    <Text style={s.small}>Choisissez les photos que vous possédez depuis votre appareil ; l’extraction des plateformes nécessite un accès autorisé.</Text>
    {assets.length > 0 && <><Text style={s.small}>{params.retour === 'visite' ? `${count} photo${count > 1 ? 's' : ''} pour la vidéo. Aucun crédit photo utilisé à l’ajout.` : `${count} photo${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''} · si vous gardez toutes les retouches HD : ${credits} crédit${credits > 1 ? 's' : ''}. Aucun débit à l’ajout.`}</Text><Button title={busy ? 'Import en cours…' : params.retour === 'visite' ? `Continuer ma vidéo · ${count} photo${count > 1 ? 's' : ''}` : `Vérifier ma demande · ${count} photo${count > 1 ? 's' : ''}`} onPress={() => void upload()} disabled={busy || !count || (params.retour !== 'visite' && account?.limites?.photo.bloque)}/><Button secondary title="Enregistrer le brouillon pour plus tard" disabled={busy || !count} onPress={()=>void upload(true)}/><Text style={s.small}>{params.retour === 'visite' ? 'Les crédits vidéo sont confirmés avant le lancement de la visite.' : 'Les photos seront ajoutées à votre compte. La retouche démarre seulement après votre confirmation.'}</Text></>}{!!notice && <Notice text={notice}/>}</View></>;
}
export function ConnectedEditor() { return <AccountScreenFrame title="Votre photo" subtitle="Comparez, ajustez, puis gardez la version qui vous plaît."><Gate><EditorContent/></Gate></AccountScreenFrame>; }
function EditorContent() {
  const { id, lot } = useLocalSearchParams<{ id: string; lot?: string }>(); const { api, account, health, refresh } = useAccount();
  const [photo, setPhoto] = useState<AccountPhoto | null>(null); const [selected, setSelected] = useState('');
  const [original, setOriginal] = useState(false); const [request, setRequest] = useState(''); const [adjust, setAdjust] = useState(false);
  const [busy, setBusy] = useState(false); const [generating, setGenerating] = useState(false); const [notice, setNotice] = useState(''); const [confirm, setConfirm] = useState<'correction' | 'download' | 'credit' | null>(null); const [videoOffer, setVideoOffer] = useState(false);
  const [video, setVideo] = useState<CreatedVideo | null>(null);
  const videoId = video?.id; const videoPending = !!video && ['preparation', 'en_attente', 'clips', 'montage'].includes(video.statut);
  const loading = useRef(false);
  const loadedDraftFor = useRef('');
  const load = useCallback(async () => {
    if (!id || loading.current) return; loading.current = true;
    try { const result = await api.json<AccountPhoto>(`/photos/${encodeURIComponent(id)}`); setPhoto(result); setSelected(current => result.versions.some(v => v.id === current) ? current : result.versions.at(-1)?.id || ''); if (loadedDraftFor.current !== result.id) { setRequest(result.demande_brouillon || DEFAULT_PHOTO_REQUEST); loadedDraftFor.current = result.id; } }
    catch (error) { setNotice(message(error)); } finally { loading.current = false; }
  }, [api, id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    if (!id || !account?.gratuit_illimite || !health?.video_disponible) return;
    let active = true;
    api.json<CreatedVideo | null>(`/videos/photos/${encodeURIComponent(id)}/derniere`).then(result => { if (active) setVideo(result); }).catch(() => {});
    return () => { active = false; };
  }, [api, id, account?.gratuit_illimite, health?.video_disponible]);
  useEffect(() => {
    if (!videoId || !videoPending) return;
    const timer = setInterval(() => {
      api.json<CreatedVideo>(`/videos/${encodeURIComponent(videoId)}`).then(setVideo).catch(() => setNotice('Le suivi vidéo est momentanément indisponible. Réessayez dans un instant.'));
    }, 5000);
    return () => clearInterval(timer);
  }, [api, videoId, videoPending]);
  const version = photo?.versions.find(v => v.id === selected);
  const limits = photo?.limites || account?.limites;
  const blocked = !!limits?.photo.bloque;
  const noPhotoCredit = !!photo && !account?.gratuit_illimite && !photo.offerte && !photo.credite_le && (account?.solde || 0) < 1;
  async function saveDraft() {
    if (!photo || busy) return;
    setBusy(true); setNotice('');
    try {
      await api.json(`/photos/${photo.id}/demande`, { method: 'PATCH', body: JSON.stringify({ demande: request }) });
      setNotice('Votre demande est enregistrée avec cette photo. Retrouvez-la aussi sur le site.');
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  async function generate() {
    if (!photo || busy || !canRequestGeneration(photo, blocked, account?.gratuit_illimite ? 1 : account?.solde || 0)) return;
    setBusy(true); setGenerating(true); setNotice(''); setConfirm(null);
    try {
      await api.json(`/photos/${photo.id}/demande`, { method: 'PATCH', body: JSON.stringify({ demande: request.trim() }) });
      if (photo.reprise_necessaire) {
        const reopened = await api.json<AccountPhoto>(`/photos/${photo.id}/reprendre`, { method: 'POST', body: JSON.stringify({ cycle_id: photo.cycle_id }) });
        setPhoto(reopened); await refresh();
      }
      const demandeEssai = request.trim() === DEFAULT_PHOTO_REQUEST ? '' : request.trim();
      const result = await api.json<AccountPhoto>(`/photos/${photo.id}/essai`, { method: 'POST', body: JSON.stringify({ demande: demandeEssai, depuis_version_id: original ? null : version?.id || null }) });
      setPhoto(result); setSelected(result.versions.at(-1)?.id || ''); setOriginal(false); setAdjust(false); await refresh();
    } catch (error) {
      setNotice(message(error));
      if (error instanceof ApiError && [0, 409, 502, 504].includes(error.status)) {
        let recovered = false;
        setNotice('La réponse est interrompue. Je vérifie cette photo avant de proposer un nouvel essai.');
        for (let turn = 0; turn < 36; turn++) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          const state = await api.json<AccountPhoto>(`/photos/${photo.id}`).catch(() => null);
          if (state && state.versions.length > photo.versions.length) { setPhoto(state); setSelected(state.versions.at(-1)?.id || ''); setOriginal(false); setAdjust(false); setNotice('Votre retouche a été retrouvée.'); recovered = true; break; }
        }
        if (!recovered) setNotice('Le résultat n’a pas encore été retrouvé. Actualisez cette photo avant de relancer une retouche.');
      }
      await load(); await refresh();
    } finally { setBusy(false); setGenerating(false); }
  }
  async function download() {
    if (!photo || !version || busy) return;
    setBusy(true); setNotice(''); setConfirm(null);
    try {
      await canSavePhoto();
      const result = await api.response(`/photos/${photo.id}/versions/${version.id}/telecharger`, { method: 'POST' });
      await savePhoto(result, `studio-annonce-${photo.id}-${version.numero}.jpg`);
      setNotice('Votre photo sans filigrane est prête. Vous pouvez la retrouver ici.');
      setVideoOffer(true);
    } catch (error) { setNotice(message(error)); } finally { await load(); await refresh(); setBusy(false); }
  }
  if (!photo) return <>{notice ? <Notice text={notice}/> : <ActivityIndicator color={colors.ink}/>}<LinkButton title="Retour à mes photos" onPress={() => router.navigate('/')}/></>;
  const protect = previewIsProtected(photo, !original && !!version);
  const availableHd = !!version?.hd || health?.retouche_disponible === true;
  const lotIds = (lot || '').split(',').filter(Boolean); const nextId = lotIds[lotIds.indexOf(id) + 1];
  return <><LimitsCard limits={limits}/>{generating && <View style={s.generationWait} accessibilityLiveRegion="polite"><View style={s.generationWaitHead}><ActivityIndicator color="#4f6b41"/><Text style={s.generationWaitTitle}>Votre photo prend forme.</Text></View><Text style={s.body}>La retouche peut prendre quelques minutes. Le résultat apparaîtra ici dès qu’il sera prêt.</Text><Text style={s.generationWaitTip}>À la réception, comparez les ouvertures et le mobilier avec l’original, puis ajustez un détail si besoin.</Text></View>}<View style={s.card}>
    <View style={s.previewFrame}><Image accessibilityLabel={original || !version ? 'Photo originale' : `Version ${version.numero}`} source={{ uri: original || !version ? photo.original : version.apercu }} style={s.preview}/>{protect && <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.watermark}>{Array.from({ length: 16 }, (_, i) => <Text key={i} style={s.watermarkText}>STUDIO ANNONCE</Text>)}</View>}</View>
    <View style={s.secondaryRow}><LinkButton title={original ? 'Voir la retouche' : 'Comparer à l’original'} onPress={() => setOriginal(v => !v)}/>{!!version && <LinkButton title={adjust ? 'Fermer les ajustements' : 'Ajuster la photo'} onPress={() => setAdjust(v => !v)}/>}</View>
    {photo.versions.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.versionRow}>{photo.versions.map(v => <Pressable key={v.id} accessibilityRole="button" accessibilityState={{ selected: selected === v.id && !original }} onPress={() => { setSelected(v.id); setOriginal(false); }} style={[s.version, selected === v.id && !original && s.versionSelected]}><Text style={s.label}>Version {v.numero}</Text></Pressable>)}</ScrollView>}
    {protect && <View style={s.watermarkExplainer} accessibilityRole="text"><Text style={s.watermarkExplainerTitle}>Le filigrane ne sera pas sur votre photo finale.</Text><Text style={s.body}>Il protège seulement cet aperçu. Quand vous gardez cette version en HD, le fichier téléchargé est net et sans filigrane.</Text></View>}
    {(!version || adjust) && <><Text style={s.small}>La mise en valeur Airbnb et Booking est prête. Modifiez-la ou effacez-la pour une retouche automatique.</Text><Field label={version ? 'Votre correction · facultative' : 'Retouche proposée · facultative'} value={request} onChangeText={setRequest} placeholder="Retouche automatique si ce champ est vide." multiline/><LinkButton title="Effacer ma demande" onPress={() => setRequest('')}/><View style={s.secondaryRow}>{["Plus de lumière", "Retirer le désordre", "Changer toute la décoration"].map(idea=><LinkButton key={idea} title={`+ ${idea}`} onPress={()=>{const next=appendPhotoRequest(request,idea);if(next===request&&request.length+idea.length+2>4000)setNotice("Votre brief est trop long pour ajouter cette précision. Aucun texte n’a été effacé.");else setRequest(next);}}/>)}</View><MobileBriefAssistant kind="photo" request={request} onUse={brief => { if (brief.length <= 4000) setRequest(brief); else setNotice('Ce brief dépasse 4 000 caractères. Raccourcissez-le avant de l’utiliser.'); }} storageKey={`studio-annonce.mobile.assistant.photo.${account?.id || 'session'}.${photo.id}`}/><PhotoCostQuote photo={photo} owner={!!account?.gratuit_illimite} balance={account?.solde || 0}/>{noPhotoCredit && <Text style={s.notice}>Votre solde photo est à zéro. Enregistrez votre demande en brouillon ; il faudra 1 crédit pour une nouvelle retouche. Votre photo offerte et les corrections déjà incluses restent accessibles.</Text>}{health?.retouche_disponible === true && <Button title={busy ? 'Traitement en cours…' : photo.reprise_necessaire && account?.gratuit_illimite ? 'Corriger gratuitement' : !photo.versions.length ? 'Créer ma photo retouchée' : generationLabel(photo)} disabled={busy || blocked || request.length > 4000} onPress={() => (noPhotoCredit || (photo.reprise_necessaire && !account?.gratuit_illimite && (account?.solde || 0) < 1)) ? setConfirm('credit') : photo.reprise_necessaire ? setConfirm('correction') : void generate()}/>}<LinkButton title={'Enregistrer le brouillon'} onPress={() => void saveDraft()}/></>}
    {!!version && !original && <Button title={busy ? 'Traitement en cours…' : account?.gratuit_illimite ? 'Télécharger en HD' : downloadLabel(photo)} secondary={adjust} disabled={busy || !availableHd} onPress={() => needsDownloadCredit(photo) && !account?.gratuit_illimite ? setConfirm('download') : void download()}/>}
    {health?.retouche_disponible !== true && <Text style={s.small}>Les nouvelles retouches sont momentanément indisponibles. Les fichiers HD déjà prêts restent récupérables.</Text>}
    {!!notice && <Notice text={notice}/>} {(videoOffer || !!photo.essais || !!photo.credite_le) && <View style={s.videoOffer}><Text style={s.cardTitle}>La suite, à votre rythme.</Text><Text style={s.body}>Retouchez d’autres photos, ou préparez votre vidéo en choisissant ses photos et son mouvement. La navigation ne lance aucune génération.</Text><Button title="Retoucher d’autres photos" onPress={() => router.navigate('/nouvelle')}/><Button secondary title="Préparer ma vidéo" onPress={() => router.push({ pathname: '/visite', params: { photos: photo.id, version: original ? '' : selected || '' } })}/>{videoPending && <View style={s.generationWait}><ActivityIndicator color="#4f6b41"/><Text style={s.body}>La vidéo déjà confirmée est en cours. Retrouvez son suivi dans la préparation vidéo.</Text></View>}{video?.statut === 'prete' && !!video.url && <Button secondary title="Voir ma vidéo précédente" onPress={() => void Linking.openURL(video.url)}/>}{video?.statut === 'echec' && <Notice text={video.erreur || 'La vidéo n’a pas abouti.'}/>}</View>}{!!nextId && <View style={s.selectionBar}><Text style={s.small}>Photo {lotIds.indexOf(id) + 1} sur {lotIds.length} · votre sélection</Text><Button title="Passer à la photo suivante" onPress={() => router.push({ pathname: '/retouche', params: { id: nextId, mode: 'compte', lot } })}/></View>}<LinkButton title="Retour à mes photos" onPress={() => router.navigate('/')}/>
  </View><Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}><View style={s.scrim}><View style={s.dialog}><Text style={s.cardTitle}>{confirm === 'credit' ? 'Ajouter des crédits photo' : confirm === 'correction' ? 'Une correction supplémentaire' : 'Garder cette photo en HD sans filigrane'}</Text><Text style={s.body}>{confirm === 'credit' ? 'Votre solde photo est à zéro. Votre demande reste enregistrée ; consultez les packs pour poursuivre.' : account?.gratuit_illimite ? 'Cette création est offerte sur votre compte administrateur.' : confirm === 'correction' ? '1 crédit permet de générer une correction supplémentaire sur cette photo. Le téléchargement HD sans filigrane est inclus.' : '1 crédit permet de télécharger votre photo nette en HD, sans le filigrane visible sur cet aperçu.'}</Text>{!account?.gratuit_illimite && <Text style={s.small}>Votre solde : {account?.solde || 0} crédit(s).</Text>}{confirm !== 'credit' && <Button title={account?.gratuit_illimite ? 'Confirmer gratuitement' : 'Confirmer · 1 crédit'} onPress={() => confirm === 'correction' ? void generate() : void download()} disabled={busy || (!account?.gratuit_illimite && (account?.solde || 0) < 1)}/>} {confirm === 'credit' && !account?.paiement_photo_disponible && <Text style={s.small}>Le paiement est momentanément indisponible ; les tarifs restent consultables.</Text>}<LinkButton title="Annuler" onPress={() => setConfirm(null)}/>{!account?.gratuit_illimite && (account?.solde || 0) < 1 && <LinkButton title="Voir les packs" onPress={() => { setConfirm(null); router.navigate('/credits'); }}/>}</View></View></Modal></>;
}
export function ConnectedAccount() { return <AccountScreenFrame title="Mon compte" subtitle="Vos informations et vos accès."><Gate><AccountOverview/></Gate></AccountScreenFrame>; }
export function ConnectedCredits() { return <AccountScreenFrame title="Acheter des crédits" subtitle="Choisissez d’abord vos crédits photo ou vidéo."><Gate><AccountContent/></Gate></AccountScreenFrame>; }
export function ConnectedBilling() { return <AccountScreenFrame title="Facturation" subtitle="Vos achats et justificatifs."><Gate><BillingContent/></Gate></AccountScreenFrame>; }
function AccountOverview() {
  const { account, logout } = useAccount();
  if (!account) return null;
  return <><View style={s.card}><Text style={s.cardTitle}>{account.prenom} {account.nom}</Text><Text style={s.body}>{account.email}</Text><Text style={s.small}>{account.solde} crédit(s) photo · {account.solde_video || 0} crédit(s) vidéo</Text></View><Button title="Acheter des crédits" onPress={() => router.navigate('/credits')}/><Button secondary title="Mes achats et factures" onPress={() => router.navigate('/facturation')}/><ProfileForm/>{['proprietaire', 'admin'].includes(account.role) && <><AdminCommerce/><AdminAlerts/></>}<LinkButton title="Me déconnecter" onPress={() => void logout()}/></>;
}
function BillingContent() {
  const { api } = useAccount();
  const [orders, setOrders] = useState<{ id: string; nature: string; credits: number; montant_centimes: number; devise: string; statut: string; cree_le: string; test: boolean }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; api.json<typeof orders>('/compte/achats').then(items => { if (active) setOrders(items); }).catch(e => { if (active) setError(message(e)); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [api]);
  return <><Button title="Acheter des crédits" onPress={() => router.navigate('/credits')}/>{loading ? <ActivityIndicator color={colors.ink}/> : !!error ? <Notice text={error}/> : orders.length ? orders.map(order => <View key={order.id} style={s.card}><Text style={s.cardTitle}>{order.credits} crédit(s) {order.nature === 'video' ? 'vidéo' : 'photo'}</Text><Text style={s.body}>{euro(order.montant_centimes)} · {order.statut === 'paye' ? 'Payé' : order.statut === 'rembourse' ? 'Remboursé' : order.statut === 'conteste' ? 'Contestation bancaire' : order.statut === 'en_attente' ? 'En attente' : 'Paiement non abouti'}{order.test ? ' · Test' : ''}</Text><Text style={s.small}>{new Date(order.cree_le).toLocaleDateString('fr-FR')} · Référence {order.id}</Text><PurchaseDocument id={order.id} status={order.statut}/></View>) : <Text style={s.body}>Aucun achat enregistré pour ce compte.</Text>}<Text style={s.small}>Le bouton ouvre le reçu Stripe, ou la facture PDF si une facture a été émise pour votre commande. Pour toute question, communiquez sa référence au support.</Text></>;
}
function AccountContent() {
  const { account, api, refresh } = useAccount(); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  const [photoCart, setPhotoCart] = useState<Cart>({}); const [videoCart, setVideoCart] = useState<Cart>({});
  const request = useRef<{ signature: string; key: string } | null>(null);
  async function buy(nature: 'photo' | 'video', packs: Pack[], cart: Cart) {
    const available = nature === 'video' ? account?.paiement_video_disponible : (account?.paiement_photo_disponible ?? account?.paiement_disponible);
    const articles = cartArticles(packs, cart);
    if (busy || !articles.length || !available) return; setBusy(true); setNotice('');
    try {
      const signature = `${nature}:${JSON.stringify(articles)}`;
      if (request.current?.signature !== signature) request.current = { signature, key: Crypto.randomUUID() };
      const checkout = await api.json<{ url?: string; statut?: string }>('/paiements/checkout', { method: 'POST', body: JSON.stringify({ articles, cle_demande: request.current.key }) });
      if (checkout.statut === 'paye') { request.current = null; await refresh(); setNotice('Votre achat est confirmé.'); return; }
      if (!checkout.url || new URL(checkout.url).origin !== 'https://checkout.stripe.com') throw new Error('Le paiement sécurisé n’est pas disponible.');
      await Linking.openURL(checkout.url); setNotice('Après le paiement, revenez ici et actualisez votre solde.');
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  function updateCart(nature: 'photo' | 'video', packId: string, delta: number) {
    const change = nature === 'photo' ? setPhotoCart : setVideoCart;
    change(current => {
      const total = Object.values(current).reduce((sum, amount) => sum + amount, 0);
      if (delta > 0 && total >= 20) return current;
      const amount = Math.max(0, Math.min(20, (current[packId] || 0) + delta));
      const next = { ...current, [packId]: amount }; if (!amount) delete next[packId]; request.current = null; return next;
    });
  }
  if (!account) return null;
  const photoAvailable = account.paiement_photo_disponible ?? account.paiement_disponible;
  const videoAvailable = account.paiement_video_disponible ?? false;
  const photoPacks = account.packs_photo || account.packs || [];
  const videoPacks = account.packs_video || [];
  const photoPackCount = Object.values(photoCart).reduce((sum, amount) => sum + amount, 0);
  const videoPackCount = Object.values(videoCart).reduce((sum, amount) => sum + amount, 0);
  const photoCredits = cartCredits(photoPacks, photoCart), videoCredits = cartCredits(videoPacks, videoCart);
  return <><View style={s.group}><Text style={s.section}>Packs photo · sans abonnement</Text><Text style={s.small}>1 photo gardée en HD = 1 crédit. Le filigrane protège seulement l’aperçu : votre photo HD téléchargée est nette et sans filigrane. Vous pouvez cumuler plusieurs packs dans le même panier.</Text>{!photoAvailable && <Text style={s.small}>Le paiement photo est momentanément indisponible. Votre panier reste modifiable.</Text>}{photoPacks.map(pack => <View key={pack.id} style={s.pack}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{pack.libelle}</Text><Text style={s.small}>{euro(pack.prix_centimes)} · {euro(pack.prix_unitaire_centimes)} par photo</Text>{!!pack.avantage && <Text style={s.packAdvantage}>{pack.avantage}</Text>}</View><Quantity label={pack.libelle} value={photoCart[pack.id] || 0} total={photoPackCount} onChange={delta => updateCart('photo', pack.id, delta)}/></View>)}<View style={s.cart}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{photoCredits || 0} crédits photo</Text><Text style={s.small}>Total du panier : {euro(cartTotal(photoPacks, photoCart))}</Text></View><Button title={photoAvailable ? 'Payer' : 'Paiement indisponible'} secondary onPress={() => void buy('photo', photoPacks, photoCart)} disabled={busy || !photoAvailable || !photoCredits}/></View></View>
    <View style={s.group}><Text style={s.section}>Packs vidéo · solde séparé</Text><Text style={s.small}>En HD 720p, 1 crédit vidéo finance 5 secondes ; en Full HD 1080p, il en faut 2 pour 5 secondes. Le débit exact s’affiche avant le lancement. Les crédits restent disponibles pour plusieurs vidéos de 5 à 30 secondes. Un pack de 30 secondes contient 6 crédits : une vidéo de 10 secondes en 720p en utilise 2, ou 4 en 1080p. Les packs vont jusqu’à 120 secondes ; un nouvel essai consomme de nouveaux crédits. Revoir et télécharger une vidéo terminée sont inclus.</Text>{!videoAvailable && <Text style={s.small}>Le paiement vidéo est momentanément indisponible. Votre panier reste modifiable.</Text>}{videoPacks.map(pack => <View key={pack.id} style={s.pack}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{pack.libelle}</Text><Text style={s.small}>{euro(pack.prix_centimes)} · {pack.credits} crédit{pack.credits > 1 ? "s" : ""} vidéo</Text>{!!pack.avantage && <Text style={s.packAdvantage}>{pack.avantage}</Text>}</View><Quantity label={pack.libelle} value={videoCart[pack.id] || 0} total={videoPackCount} onChange={delta => updateCart('video', pack.id, delta)}/></View>)}<View style={s.cart}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{videoCredits * 5} secondes de crédits en 720p</Text><Text style={s.small}>Total du panier : {euro(cartTotal(videoPacks, videoCart))}</Text></View><Button title={videoAvailable ? 'Payer' : 'Paiement indisponible'} secondary onPress={() => void buy('video', videoPacks, videoCart)} disabled={busy || !videoAvailable || !videoCredits}/></View></View>
    <View style={s.balance}><Text style={s.eyebrow}>{account.gratuit_illimite ? 'VOTRE COMPTE' : 'MES SOLDES'}</Text><Text style={s.balanceNumber}>{account.gratuit_illimite ? 'Offert' : account.solde}{!account.gratuit_illimite && <Text style={s.balanceUnit}> crédit{account.solde > 1 ? 's' : ''} photo</Text>}</Text><Text style={s.videoBalance}>{account.gratuit_illimite ? 'Les vidéos sont également offertes sur votre compte.' : `${account.solde_video || 0} crédit${(account.solde_video || 0) > 1 ? 's' : ''} vidéo · jusqu’à ${(account.solde_video || 0) * 5} secondes en HD 720p`}</Text><Text style={s.body}>{account.gratuit_illimite ? 'Même parcours que les clients, sans débit pour vos photos et corrections.' : account.photo_offerte_disponible ? 'Votre première photo est offerte.' : 'Une génération et une correction incluse par photo.'}</Text>{(account.gratuit_illimite || account.photo_offerte_disponible) && <Button title={account.gratuit_illimite ? 'Créer gratuitement' : 'Préparer ma photo offerte'} onPress={() => router.navigate('/nouvelle')} disabled={account.limites?.photo.bloque}/>}<LinkButton title="Actualiser mes soldes" onPress={() => void refresh()}/></View>
    {!account.gratuit_illimite && !account.photo_offerte_telechargee && <View style={s.card}><Text style={s.cardTitle}>Votre photo offerte</Text><Text style={s.body}>{account.photo_offerte_disponible ? 'Votre première photo et son téléchargement HD sont offerts.' : 'Votre photo offerte vous attend dans Mes créations, jusqu’à son premier téléchargement HD.'}</Text><Button secondary title={account.photo_offerte_disponible ? 'Créer ma photo' : 'Terminer ma photo'} onPress={() => router.navigate(account.photo_offerte_disponible ? '/nouvelle' : '/')}/></View>}
    <LimitsCard limits={account.limites} detailed/>
    {!!notice && <Notice text={notice}/>}<LinkButton title="Voir mon compte et mes coordonnées" onPress={() => router.navigate('/compte')}/><LinkButton title="Voir mes achats" onPress={() => router.navigate('/facturation')}/></>;
}

const s = StyleSheet.create({
  costQuote: { gap: 6, padding: 16, borderWidth: 1, borderColor: '#b7c99f', borderRadius: 14, backgroundColor: '#f5f8ef' }, costAmount: { fontSize: 22, lineHeight: 28, fontWeight: '700', color: colors.ink },
  safe: { flex: 1, backgroundColor: colors.cream }, header: { paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#fffefa', borderBottomWidth: 1, borderBottomColor: '#e2e5da' },
  content: { padding: 20, paddingBottom: 36, gap: 18, width: '100%', maxWidth: 820, alignSelf: 'center' }, title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '600', letterSpacing: -.9 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: -10 },
  creditPill: { borderRadius: 24, backgroundColor: colors.sage, paddingHorizontal: 12, paddingVertical: 10 }, pillText: { color: colors.ink, fontWeight: '600', fontSize: 12 },
  card: { backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e1e5d9', borderRadius: 23, padding: 19, gap: 14 }, cardTitle: { fontSize: 20, lineHeight: 26, color: colors.ink, fontWeight: '600', letterSpacing: -.3 }, body: { color: colors.muted, fontSize: 14, lineHeight: 21 }, small: { color: colors.muted, fontSize: 12, lineHeight: 19 }, notice: { padding: 13, borderRadius: 12, color: '#655831', backgroundColor: '#f5efdd', fontSize: 13, lineHeight: 20 },
  field: { gap: 7 }, label: { color: colors.ink, fontSize: 13, fontWeight: '500' }, input: { borderWidth: 1, borderColor: '#dce1d1', backgroundColor: '#f4f5ee', borderRadius: 13, padding: 13, fontSize: 16, color: colors.ink, minHeight: 48 }, multiline: { minHeight: 108, textAlignVertical: 'top' },
  link: { minHeight: 42, justifyContent: 'center', paddingVertical: 7 }, linkText: { color: '#566847', fontSize: 13, fontWeight: '500', lineHeight: 20 }, secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  group: { gap: 13 }, section: { fontSize: 19, fontWeight: '600', color: colors.ink }, photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, photoCard: { width: '47%', flexGrow: 1, maxWidth: 350, borderRadius: 16, padding: 9, gap: 5, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e1e5d9' }, photoCardChosen: { borderColor: '#5a7748', borderWidth: 2 }, selectionBar: { backgroundColor: '#eaf0e1', borderWidth: 1, borderColor: '#d0dfc6', borderRadius: 18, padding: 16, gap: 10 }, thumbnail: { width: '100%', aspectRatio: 1.22, borderRadius: 11, backgroundColor: colors.sage }, photoTitle: { color: colors.ink, fontSize: 15, fontWeight: '500', marginTop: 4 },
  support: { borderTopWidth: 1, borderTopColor: '#dce1d1', marginTop: 6, paddingTop: 8, gap: 10 }, supportToggle: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: { width: '100%', aspectRatio: 1.1, borderRadius: 15, resizeMode: 'contain', backgroundColor: '#eceee4' }, previewFrame: { overflow: 'hidden', borderRadius: 15 }, watermark: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-around', justifyContent: 'space-around', backgroundColor: 'rgba(28,39,28,.06)' }, watermarkText: { color: 'rgba(255,255,255,.68)', textShadowColor: 'rgba(0,0,0,.68)', textShadowRadius: 2, fontWeight: '700', fontSize: 12, letterSpacing: 1, margin: 14, paddingHorizontal: 4, paddingVertical: 2, overflow: 'hidden', transform: [{ rotate: '-24deg' }] },
  watermarkExplainer: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#cbd7bb', backgroundColor: '#f3f7ec', gap: 4 }, watermarkExplainerTitle: { color: '#354730', fontSize: 14, fontWeight: '700', lineHeight: 20 },
  dropzone: { paddingVertical: 30, alignItems: 'center', gap: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#b7c2a6', borderRadius: 18, backgroundColor: '#f2f4ea' }, dropIcon: { fontSize: 37, color: '#697f51' }, warningCard: { backgroundColor: '#f8f0e0', borderColor: '#e9d9b9' },
  versionRow: { gap: 8 }, version: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#dce1d1' }, versionSelected: { backgroundColor: '#e6ebda', borderColor: '#829264' },
  scrim: { flex: 1, backgroundColor: '#20271988', alignItems: 'center', justifyContent: 'center', padding: 22 }, dialog: { width: '100%', maxWidth: 450, backgroundColor: '#fffefa', borderRadius: 25, padding: 23, gap: 18 },
  balance: { backgroundColor: '#e9edde', borderRadius: 24, padding: 23, gap: 10 }, eyebrow: { color: '#66764e', fontSize: 11, letterSpacing: 1.4, fontWeight: '600' }, balanceNumber: { fontSize: 48, color: colors.ink, fontWeight: '600' }, balanceUnit: { fontSize: 21, fontWeight: '400' }, pack: { padding: 17, borderWidth: 1, borderColor: '#dde2d2', borderRadius: 19, backgroundColor: '#fffefa', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, historyLine: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e9ecdf' },
  videoBalance: { borderTopWidth: 1, borderTopColor: '#cfd7c3', paddingTop: 12, color: '#566847', fontSize: 14, fontWeight: '600' }, packAdvantage: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: '#e4ead8', color: '#566847', fontSize: 10, fontWeight: '600' }, videoOffer: { marginTop: 4, padding: 18, gap: 12, borderRadius: 18, backgroundColor: '#eef2e7', borderWidth: 1, borderColor: '#d5ddca' },
  generationWait: { padding: 20, gap: 9, borderRadius: 22, borderWidth: 1, borderColor: '#d6dfc9', backgroundColor: '#f0f4e9' }, generationWaitHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }, generationWaitTitle: { fontSize: 19, fontWeight: '600', color: colors.ink }, generationWaitTip: { color: '#536c42', fontSize: 12, lineHeight: 18, marginTop: 3 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 8 }, quantityButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccd5c0', backgroundColor: '#f4f6ef' }, quantityDisabled: { opacity: .35 }, quantitySymbol: { color: colors.ink, fontSize: 20, lineHeight: 22 }, quantityValue: { minWidth: 22, textAlign: 'center', color: colors.ink, fontWeight: '600', fontSize: 15 }, cart: { padding: 17, borderRadius: 19, backgroundColor: '#e9edde', flexDirection: 'row', alignItems: 'center', gap: 12 },
});

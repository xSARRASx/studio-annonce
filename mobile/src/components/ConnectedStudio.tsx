import { appendPhotoRequest } from '../../../shared/photo-request';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { Logo, Button, colors } from './Studio';
import { useAccount } from './AccountConnection';
import { AdminAlerts } from './AdminAlerts';
import { ConnectedLibraryContent } from './ConnectedLibraryContent';
import { ConnectedListingImport } from './ConnectedListingImport';
import { ConnectedVideoPreparation } from './ConnectedVideoPreparation';
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
    <View style={s.header}><Logo/><Pressable accessibilityRole="button" accessibilityLabel="Mon compte et mes créations" onPress={() => router.navigate('/compte')} style={s.creditPill}><Text style={s.pillText}>{account?.gratuit_illimite ? 'Créations offertes' : account ? `${account.solde} crédit${account.solde > 1 ? 's' : ''}` : 'Mon compte'}</Text></Pressable></View>
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
function LinkButton({ title, onPress }: { title: string; onPress: () => void }) { return <Pressable accessibilityRole="button" onPress={onPress} style={s.link}><Text style={s.linkText}>{title}</Text></Pressable>; }
function Quantity({ label, value, total, onChange }: { label: string; value: number; total: number; onChange: (delta: number) => void }) {
  return <View accessibilityLabel={`Quantité pour ${label}`} style={s.quantity}><Pressable accessibilityRole="button" accessibilityLabel={`Retirer un pack ${label}`} disabled={!value} onPress={() => onChange(-1)} style={[s.quantityButton, !value && s.quantityDisabled]}><Text style={s.quantitySymbol}>−</Text></Pressable><Text style={s.quantityValue}>{value}</Text><Pressable accessibilityRole="button" accessibilityLabel={`Ajouter un pack ${label}`} disabled={total >= 20} onPress={() => onChange(1)} style={[s.quantityButton, total >= 20 && s.quantityDisabled]}><Text style={s.quantitySymbol}>+</Text></Pressable></View>;
}
function Field({ label, value, onChangeText, placeholder, email, code, url, multiline }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; email?: boolean; code?: boolean; url?: boolean; multiline?: boolean }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8a9081" autoCapitalize={email || code || url ? 'none' : 'sentences'} keyboardType={email ? 'email-address' : url ? 'url' : code ? 'number-pad' : 'default'} autoComplete={email ? 'email' : code ? 'one-time-code' : 'off'} maxLength={code ? 6 : multiline ? 4000 : url ? 1000 : 254} multiline={multiline} style={[s.input, multiline && s.multiline]}/></View>;
}
function Gate({ children }: { children: React.ReactNode }) {
  const { ready, account } = useAccount();
  if (!ready) return null;
  if (!account) return <LoginForm/>;
  if (!account.profil_complet) return <ProfileForm/>;
  return children;
}
function LoginForm() {
  const { api, login, health } = useAccount();
  const [email, setEmail] = useState(''); const [code, setCode] = useState(''); const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  async function submit() {
    if (busy) return; setBusy(true); setNotice('');
    try {
      if (sent) await login(email.trim().toLowerCase(), code);
      else { await api.json('/auth/code', { method: 'POST', body: JSON.stringify({ email: email.trim().toLowerCase() }) }); setSent(true); setNotice('Code envoyé. Il est valable pendant dix minutes.'); }
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  return <View style={s.card}><Text style={s.cardTitle}>Votre studio, partout avec vous.</Text><Text style={s.body}>Connectez-vous avec le même email que sur le site. Vos photos, crédits et limites restent communs.</Text>
    {health && !health.connexion_disponible && <Notice text="La connexion par email est momentanément indisponible."/>}
    {!sent ? <Field label="Votre email" value={email} onChangeText={setEmail} placeholder="vous@exemple.fr" email/> : <><Text style={s.body}>{email}</Text><Field label="Code reçu par email" value={code} onChangeText={v => setCode(v.replace(/\D/g, ''))} code/></>}
    {!!notice && <Notice text={notice}/>}<Button title={busy ? 'Un instant…' : sent ? 'Me connecter' : 'Recevoir mon code'} onPress={() => void submit()} disabled={busy || (sent ? code.length !== 6 : !email.includes('@')) || health?.connexion_disponible === false}/>
    {sent && <View style={s.warningCard}><Text style={s.cardTitle}>Vous ne trouvez pas l’email ?</Text><Text style={s.body}>Vérifiez aussi vos Spams / Courriers indésirables. Cherchez no-reply@studioannonce.fr et marquez le message comme « Non indésirable ». Seul le dernier code reçu fonctionne.</Text></View>}
    {sent && <LinkButton title="Changer d’email" onPress={() => { setSent(false); setCode(''); setNotice(''); }}/>}<LinkButton title="Voir les exemples et mes brouillons locaux" onPress={() => router.push('/local')}/>
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
  const blocked = limits.photo.bloque || limits.video.bloque;
  if (!blocked && !detailed) return null;
  return <View style={[s.card, blocked && s.warningCard]}><Text style={s.cardTitle}>{blocked ? 'Limite d’essais atteinte' : 'Vos essais depuis le dernier achat'}</Text>
    {limits.proprietaire && <Text style={s.body}>Sur votre compte propriétaire, les créations sont offertes. La vidéo suit une limite pilote de 5 projets par logement sur 24 heures ; les brouillons ne comptent pas.</Text>}
    {detailed && <Text style={s.body}>Photos : {limits.photo.utilisees} / {limits.photo.limite} · Vidéos : {limits.video.utilisees} / {limits.video.limite}</Text>}
    <Text style={s.body}>{blocked ? 'Contactez le support pour débloquer les nouvelles créations. Vos photos déjà achetées restent accessibles.' : 'Une création est une génération ou correction réalisée par l’IA. Ce plafond est différent du solde de crédits et ne promet pas des téléchargements gratuits. Les imports, brouillons et téléchargements répétés ne consomment pas d’essai. Un achat du pack correspondant ou un déblocage par le support remet le compteur à zéro, sur le site comme sur mobile.'}</Text>
    {blocked && <View style={s.group}><LinkButton title="Contacter le support" onPress={() => { if (limits.support_url) void Linking.openURL(limits.support_url); }}/><Text style={s.small}>{limits.support_telephone}</Text>{!!limits.support_email && <LinkButton title={limits.support_email} onPress={() => { void Linking.openURL(`mailto:${limits.support_email}`); }}/>}</View>}</View>;
}
export function ConnectedLibrary() { return <AccountScreenFrame title="Mes créations" subtitle="Vos photos et leurs versions, sur tous vos appareils."><Gate><ConnectedLibraryContent/></Gate></AccountScreenFrame>; }
export function ConnectedVideoPlanScreen() { return <AccountScreenFrame title="Préparer ma vidéo" subtitle="Choisissez les photos, leur ordre et votre demande avant de confirmer."><Gate><ConnectedVideoPreparation/></Gate></AccountScreenFrame>; }
export function ConnectedUpload() { return <AccountScreenFrame title="Retoucher mes photos" subtitle="Choisissez une ou plusieurs photos, puis préparez vos retouches."><Gate><UploadContent/></Gate></AccountScreenFrame>; }
function UploadContent() {
  const { api, account, refresh } = useAccount(); const params = useLocalSearchParams<{ logement?: string; retour?: string }>();
  const [assets, setAssets] = useState<ImagePicker.ImagePickerAsset[]>([]); const [selectedUris, setSelectedUris] = useState<string[]>([]); const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState(''); const [newName, setNewName] = useState(params.logement || 'Mon logement'); const [showProperties, setShowProperties] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [photoRequest,setPhotoRequest]=useState('');
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
    if (!chosen.length || sending.current || account?.limites?.photo.bloque) return;
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
          const body = JSON.stringify({...JSON.parse(await intent.body),demande:photoRequest});
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
  return <><LimitsCard limits={account?.limites}/><View style={s.card}>{assets.length ? <><View style={s.photoGrid}>{assets.map((asset, index) => <Pressable key={asset.uri} accessibilityRole="button" accessibilityState={{ selected: selectedUris.includes(asset.uri) }} accessibilityLabel={`Photo ${index + 1}`} disabled={busy} onPress={() => setSelectedUris(current => current.includes(asset.uri) ? current.filter(uri => uri !== asset.uri) : [...current, asset.uri])} style={[s.photoCard, selectedUris.includes(asset.uri) && s.photoCardChosen]}><Image source={{ uri: asset.uri }} style={s.thumbnail}/><Text style={s.photoTitle}>{selectedUris.includes(asset.uri) ? '✓ ' : ''}Photo {index + 1}</Text></Pressable>)}</View><View style={s.secondaryRow}><LinkButton title="Ajouter d’autres photos" onPress={() => void pick()}/><LinkButton title="Ranger dans un logement" onPress={() => setShowProperties(v => !v)}/></View></> : <><View style={s.dropzone}><Text style={s.dropIcon}>＋</Text><Text style={s.cardTitle}>Choisissez vos photos</Text><Text style={s.small}>JPG, PNG ou WebP · 30 Mo maximum chacune</Text></View><Button title="Choisir dans mes photos" onPress={() => void pick()} disabled={busy || account?.limites?.photo.bloque}/><LinkButton title="Prendre une photo" onPress={() => void pick(true)}/></>}
    <ConnectedListingImport onImported={ids=>params.retour==='visite'?router.push({pathname:'/visite',params:{photos:ids.slice(0,6).join(',')}}):router.push({pathname:'/retouche',params:{id:ids[0],lot:ids.join(','),mode:'compte'}})}/>
    <Field label="Votre demande de retouche" value={photoRequest} onChangeText={setPhotoRequest} multiline placeholder="Décrivez les changements souhaités…"/><MobileBriefAssistant kind="photo" request={photoRequest} onUse={setPhotoRequest} storageKey={`studio:${account?.id}:upload-assistant`}/>
    {(showProperties || !properties.length) && <View style={s.group}>{properties.map(property => <LinkButton key={property.id} title={`${propertyId === property.id ? '✓ ' : ''}${property.nom}`} onPress={() => { setPropertyId(property.id); setShowProperties(false); }}/>) }{properties.length > 0 && <LinkButton title="+ Nouveau logement" onPress={() => setPropertyId('')}/>} {!propertyId && <><Field label="Nom du logement" value={newName} onChangeText={setNewName}/><Field label="Lien Airbnb ou Booking (facultatif)" value={sourceUrl} onChangeText={setSourceUrl} placeholder="https://www.airbnb.fr/rooms/…" url/>{!!sourceUrl.trim() && <Text style={s.small}>{sourceName ? `Annonce ${sourceName} reconnue. ` : 'Lien enregistré avec ce logement. '}Utilisez « Récupérer les photos » ci-dessus, ou ajoutez vos fichiers originaux.</Text>}{!!sourceUrl.trim() && !assets.length && <LinkButton title={busy ? 'Enregistrement…' : 'Enregistrer l’annonce pour plus tard'} onPress={() => void saveSource()}/>}</>}</View>}
    <Text style={s.small}>Choisissez les photos que vous possédez depuis votre appareil ; l’extraction des plateformes nécessite un accès autorisé.</Text>
    {assets.length > 0 && <><Text style={s.small}>{count} photo{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''} · si vous gardez toutes les retouches HD : {credits} crédit{credits > 1 ? 's' : ''}. Aucun débit à l’ajout.</Text><Button title={busy ? 'Import en cours…' : `Vérifier ma demande · ${count} photo${count > 1 ? 's' : ''}`} onPress={() => void upload()} disabled={busy || !count || account?.limites?.photo.bloque}/><Button secondary title="Enregistrer le brouillon pour plus tard" disabled={busy || !count} onPress={()=>void upload(true)}/><Text style={s.small}>Les photos seront ajoutées à votre compte. La retouche démarre seulement après votre confirmation.</Text></>}{!!notice && <Notice text={notice}/>}</View></>;
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
    try { const result = await api.json<AccountPhoto>(`/photos/${encodeURIComponent(id)}`); setPhoto(result); setSelected(current => result.versions.some(v => v.id === current) ? current : result.versions.at(-1)?.id || ''); if (loadedDraftFor.current !== result.id) { setRequest(result.demande_brouillon || ''); loadedDraftFor.current = result.id; } }
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
      const result = await api.json<AccountPhoto>(`/photos/${photo.id}/essai`, { method: 'POST', body: JSON.stringify({ demande: request.trim(), depuis_version_id: original ? null : version?.id || null }) });
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
    {protect && <Text style={s.small}>Aperçu protégé. Votre fichier téléchargé sera sans filigrane.</Text>}
    {(!version || adjust) && <><Field label={version ? 'Votre correction' : 'Que souhaitez-vous améliorer ?'} value={request} onChangeText={setRequest} placeholder="Par exemple : ranger la pièce, faire le lit et éclaircir la lumière naturelle." multiline/><View style={s.secondaryRow}>{["Plus de lumière", "Retirer le désordre", "Changer toute la décoration"].map(idea=><LinkButton key={idea} title={`+ ${idea}`} onPress={()=>{const next=appendPhotoRequest(request,idea);if(next===request&&request.length+idea.length+2>4000)setNotice("Votre brief est trop long pour ajouter cette précision. Aucun texte n’a été effacé.");else setRequest(next);}}/>)}</View><MobileBriefAssistant kind="photo" request={request} onUse={brief => { if (brief.length <= 4000) setRequest(brief); else setNotice('Ce brief dépasse 4 000 caractères. Raccourcissez-le avant de l’utiliser.'); }} storageKey={`studio-annonce.mobile.assistant.photo.${account?.id || 'session'}.${photo.id}`}/><Text style={s.small}>{photo.reprise_necessaire ? account?.gratuit_illimite ? 'Cette correction supplémentaire est gratuite sur votre compte.' : 'Cette correction supplémentaire coûte 1 crédit. Vous confirmez avant tout débit.' : `${photo.essais_restants} génération${photo.essais_restants > 1 ? 's' : ''} disponible${photo.essais_restants > 1 ? 's' : ''} pour cette photo.`}</Text>{noPhotoCredit && <Text style={s.notice}>Votre solde photo est à zéro. Enregistrez votre demande en brouillon ; il faudra 1 crédit pour une nouvelle retouche. Votre photo offerte et les corrections déjà incluses restent accessibles.</Text>}{health?.retouche_disponible === true && <Button title={busy ? 'Traitement en cours…' : photo.reprise_necessaire && account?.gratuit_illimite ? 'Corriger gratuitement' : !photo.versions.length ? 'Créer ma photo retouchée' : generationLabel(photo)} disabled={busy || blocked || !request.trim() || request.length > 4000} onPress={() => (noPhotoCredit || (photo.reprise_necessaire && !account?.gratuit_illimite && (account?.solde || 0) < 1)) ? setConfirm('credit') : photo.reprise_necessaire ? setConfirm('correction') : void generate()}/>}<LinkButton title={'Enregistrer le brouillon'} onPress={() => void saveDraft()}/></>}
    {!!version && !original && <Button title={busy ? 'Traitement en cours…' : account?.gratuit_illimite ? 'Télécharger en HD' : downloadLabel(photo)} secondary={adjust} disabled={busy || !availableHd} onPress={() => needsDownloadCredit(photo) && !account?.gratuit_illimite ? setConfirm('download') : void download()}/>}
    {health?.retouche_disponible !== true && <Text style={s.small}>Les nouvelles retouches sont momentanément indisponibles. Les fichiers HD déjà prêts restent récupérables.</Text>}
    {!!notice && <Notice text={notice}/>} {(videoOffer || !!photo.essais || !!photo.credite_le) && <View style={s.videoOffer}><Text style={s.cardTitle}>La suite, à votre rythme.</Text><Text style={s.body}>Retouchez d’autres photos, ou préparez votre vidéo en choisissant ses photos et son mouvement. La navigation ne lance aucune génération.</Text><Button title="Retoucher d’autres photos" onPress={() => router.navigate('/nouvelle')}/><Button secondary title="Préparer ma vidéo" onPress={() => router.push({ pathname: '/visite', params: { photos: photo.id, version: original ? '' : selected || '' } })}/>{videoPending && <View style={s.generationWait}><ActivityIndicator color="#4f6b41"/><Text style={s.body}>La vidéo déjà confirmée est en cours. Retrouvez son suivi dans la préparation vidéo.</Text></View>}{video?.statut === 'prete' && !!video.url && <Button secondary title="Voir ma vidéo précédente" onPress={() => void Linking.openURL(video.url)}/>}{video?.statut === 'echec' && <Notice text={video.erreur || 'La vidéo n’a pas abouti.'}/>}</View>}{!!nextId && <View style={s.selectionBar}><Text style={s.small}>Photo {lotIds.indexOf(id) + 1} sur {lotIds.length} · votre sélection</Text><Button title="Passer à la photo suivante" onPress={() => router.push({ pathname: '/retouche', params: { id: nextId, mode: 'compte', lot } })}/></View>}<LinkButton title="Retour à mes photos" onPress={() => router.navigate('/')}/>
  </View><Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}><View style={s.scrim}><View style={s.dialog}><Text style={s.cardTitle}>{confirm === 'credit' ? 'Ajouter des crédits photo' : confirm === 'correction' ? 'Une correction supplémentaire' : 'Garder cette photo en HD'}</Text><Text style={s.body}>{confirm === 'credit' ? 'Votre solde photo est à zéro. Votre demande reste enregistrée ; consultez les packs pour poursuivre.' : account?.gratuit_illimite ? 'Cette création est offerte sur votre compte propriétaire.' : confirm === 'correction' ? '1 crédit permet de générer une correction supplémentaire sur cette photo.' : '1 crédit permet de télécharger votre photo sans filigrane.'}</Text>{!account?.gratuit_illimite && <Text style={s.small}>Votre solde : {account?.solde || 0} crédit(s).</Text>}{confirm !== 'credit' && <Button title={account?.gratuit_illimite ? 'Confirmer gratuitement' : 'Confirmer · 1 crédit'} onPress={() => confirm === 'correction' ? void generate() : void download()} disabled={busy || (!account?.gratuit_illimite && (account?.solde || 0) < 1)}/>} {confirm === 'credit' && !account?.paiement_photo_disponible && <Text style={s.small}>Les achats ne sont pas encore ouverts ; les tarifs restent consultables sans paiement.</Text>}<LinkButton title="Annuler" onPress={() => setConfirm(null)}/>{!account?.gratuit_illimite && (account?.solde || 0) < 1 && <LinkButton title="Voir les packs" onPress={() => { setConfirm(null); router.navigate('/compte'); }}/>}</View></View></Modal></>;
}
export function ConnectedAccount() { return <AccountScreenFrame title="Mon compte" subtitle="Vos crédits et vos photos sont communs au site et à l’application."><Gate><AccountContent/></Gate></AccountScreenFrame>; }
function AccountContent() {
  const { account, api, logout, refresh } = useAccount(); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState(''); const [profileOpen, setProfileOpen] = useState(false); const [historyOpen, setHistoryOpen] = useState(false);
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
  async function disconnect() { if (busy) return; setBusy(true); try { await logout(); } catch (error) { setNotice(message(error)); } finally { setBusy(false); } }
  if (!account) return null;
  const photoAvailable = account.paiement_photo_disponible ?? account.paiement_disponible;
  const videoAvailable = account.paiement_video_disponible ?? false;
  const photoPacks = account.packs_photo || account.packs || [];
  const videoPacks = account.packs_video || [];
  const photoPackCount = Object.values(photoCart).reduce((sum, amount) => sum + amount, 0);
  const videoPackCount = Object.values(videoCart).reduce((sum, amount) => sum + amount, 0);
  const photoCredits = cartCredits(photoPacks, photoCart), videoCredits = cartCredits(videoPacks, videoCart);
  const movements = [...(account.registre || []).map(line => ({ ...line, nature: 'photo' as const })), ...(account.registre_video || []).map(line => ({ ...line, nature: 'vidéo' as const }))]
    .sort((a, b) => Date.parse(b.le) - Date.parse(a.le));
  return <><View style={s.balance}><Text style={s.eyebrow}>{account.gratuit_illimite ? 'VOTRE COMPTE' : 'MES SOLDES'}</Text><Text style={s.balanceNumber}>{account.gratuit_illimite ? 'Offert' : account.solde}{!account.gratuit_illimite && <Text style={s.balanceUnit}> crédit{account.solde > 1 ? 's' : ''} photo</Text>}</Text><Text style={s.videoBalance}>{account.gratuit_illimite ? 'Les vidéos seront aussi offertes dès leur ouverture.' : `${account.solde_video || 0} crédit${(account.solde_video || 0) > 1 ? 's' : ''} vidéo · ${(account.solde_video || 0) * 5} secondes disponibles`}</Text><Text style={s.body}>{account.gratuit_illimite ? 'Même parcours que les clients, sans débit pour vos photos et corrections.' : account.photo_offerte_disponible ? 'Votre première photo est offerte.' : 'Une génération et une correction incluse par photo.'}</Text>{(account.gratuit_illimite || account.photo_offerte_disponible) && <Button title={account.gratuit_illimite ? 'Créer gratuitement' : 'Préparer ma photo offerte'} onPress={() => router.navigate('/nouvelle')} disabled={account.limites?.photo.bloque}/>}<LinkButton title="Actualiser mes soldes" onPress={() => void refresh()}/></View>
    <LimitsCard limits={account.limites} detailed/><View style={s.group}><Text style={s.section}>Packs photo · sans abonnement</Text><Text style={s.small}>1 photo gardée en HD = 1 crédit. Vous pouvez cumuler plusieurs packs dans le même panier.</Text>{!photoAvailable && <Text style={s.small}>Les achats ouvriront après la recette de production photo.</Text>}{photoPacks.map(pack => <View key={pack.id} style={s.pack}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{pack.libelle}</Text><Text style={s.small}>{euro(pack.prix_centimes)} · {euro(pack.prix_unitaire_centimes)} par photo</Text>{!!pack.avantage && <Text style={s.packAdvantage}>{pack.avantage}</Text>}</View><Quantity label={pack.libelle} value={photoCart[pack.id] || 0} total={photoPackCount} onChange={delta => updateCart('photo', pack.id, delta)}/></View>)}<View style={s.cart}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{photoCredits || 0} crédits photo</Text><Text style={s.small}>Total du panier : {euro(cartTotal(photoPacks, photoCart))}</Text></View><Button title={photoAvailable ? 'Payer' : 'Bientôt'} secondary onPress={() => void buy('photo', photoPacks, photoCart)} disabled={busy || !photoAvailable || !photoCredits}/></View></View>
    <View style={s.group}><Text style={s.section}>Packs vidéo · solde séparé</Text><Text style={s.small}>1 crédit vidéo = 1 essai de 5 secondes en 720p. Vos crédits restent disponibles pour plusieurs vidéos de 5 à 30 secondes. Par exemple, après l’achat de 30 secondes, une vidéo de 10 secondes laisse 20 secondes de crédits. Les packs vont jusqu’à 120 secondes ; un nouvel essai consomme de nouveaux crédits. Revoir et télécharger une vidéo terminée sont inclus.</Text>{!videoAvailable && <Text style={s.small}>Les packs sont affichés, mais aucun paiement vidéo ne peut partir pendant la phase pilote.</Text>}{videoPacks.map(pack => <View key={pack.id} style={s.pack}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{pack.libelle}</Text><Text style={s.small}>{euro(pack.prix_centimes)} · {pack.credits} crédit{pack.credits > 1 ? "s" : ""} vidéo</Text>{!!pack.avantage && <Text style={s.packAdvantage}>{pack.avantage}</Text>}</View><Quantity label={pack.libelle} value={videoCart[pack.id] || 0} total={videoPackCount} onChange={delta => updateCart('video', pack.id, delta)}/></View>)}<View style={s.cart}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{videoCredits * 5} secondes de crédits</Text><Text style={s.small}>Total du panier : {euro(cartTotal(videoPacks, videoCart))}</Text></View><Button title={videoAvailable ? 'Payer' : 'Bientôt'} secondary onPress={() => void buy('video', videoPacks, videoCart)} disabled={busy || !videoAvailable || !videoCredits}/></View></View>
    {['proprietaire', 'admin'].includes(account.role) && <AdminAlerts/>}
    {!!notice && <Notice text={notice}/>}<View style={s.card}><Text style={s.cardTitle}>{account.prenom} {account.nom}</Text><Text style={s.body}>{account.email}</Text><View style={s.secondaryRow}><LinkButton title="Mes coordonnées" onPress={() => setProfileOpen(v => !v)}/><LinkButton title="Mes mouvements" onPress={() => setHistoryOpen(v => !v)}/></View>{profileOpen && <ProfileForm/>}{historyOpen && (movements.length ? movements.map((line, index) => <View key={`${line.nature}-${line.le}-${index}`} style={s.historyLine}><Text style={[s.body, { flex: 1 }]}>{line.motif}</Text><Text style={s.label}>{line.delta > 0 ? '+' : ''}{line.delta} {line.nature}</Text></View>) : <Text style={s.small}>Aucun mouvement pour le moment.</Text>)}<LinkButton title="Me déconnecter" onPress={() => void disconnect()}/></View></>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream }, header: { paddingHorizontal: 18, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, backgroundColor: '#fffefa', borderBottomWidth: 1, borderBottomColor: '#e2e5da' },
  content: { padding: 20, paddingBottom: 36, gap: 18, width: '100%', maxWidth: 820, alignSelf: 'center' }, title: { color: colors.ink, fontSize: 30, lineHeight: 36, fontWeight: '600', letterSpacing: -.9 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: -10 },
  creditPill: { borderRadius: 24, backgroundColor: colors.sage, paddingHorizontal: 12, paddingVertical: 10 }, pillText: { color: colors.ink, fontWeight: '600', fontSize: 12 },
  card: { backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e1e5d9', borderRadius: 23, padding: 19, gap: 14 }, cardTitle: { fontSize: 20, lineHeight: 26, color: colors.ink, fontWeight: '600', letterSpacing: -.3 }, body: { color: colors.muted, fontSize: 14, lineHeight: 21 }, small: { color: colors.muted, fontSize: 12, lineHeight: 19 }, notice: { padding: 13, borderRadius: 12, color: '#655831', backgroundColor: '#f5efdd', fontSize: 13, lineHeight: 20 },
  field: { gap: 7 }, label: { color: colors.ink, fontSize: 13, fontWeight: '500' }, input: { borderWidth: 1, borderColor: '#dce1d1', backgroundColor: '#f4f5ee', borderRadius: 13, padding: 13, fontSize: 16, color: colors.ink, minHeight: 48 }, multiline: { minHeight: 108, textAlignVertical: 'top' },
  link: { minHeight: 42, justifyContent: 'center', paddingVertical: 7 }, linkText: { color: '#566847', fontSize: 13, fontWeight: '500', lineHeight: 20 }, secondaryRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  group: { gap: 13 }, section: { fontSize: 19, fontWeight: '600', color: colors.ink }, photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, photoCard: { width: '47%', flexGrow: 1, maxWidth: 350, borderRadius: 16, padding: 9, gap: 5, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e1e5d9' }, photoCardChosen: { borderColor: '#5a7748', borderWidth: 2 }, selectionBar: { backgroundColor: '#eaf0e1', borderWidth: 1, borderColor: '#d0dfc6', borderRadius: 18, padding: 16, gap: 10 }, thumbnail: { width: '100%', aspectRatio: 1.22, borderRadius: 11, backgroundColor: colors.sage }, photoTitle: { color: colors.ink, fontSize: 15, fontWeight: '500', marginTop: 4 },
  support: { borderTopWidth: 1, borderTopColor: '#dce1d1', marginTop: 6, paddingTop: 8, gap: 10 }, supportToggle: { minHeight: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: { width: '100%', aspectRatio: 1.1, borderRadius: 15, resizeMode: 'contain', backgroundColor: '#eceee4' }, previewFrame: { overflow: 'hidden', borderRadius: 15 }, watermark: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', flexDirection: 'row', flexWrap: 'wrap', alignContent: 'space-around', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,.04)' }, watermarkText: { color: 'rgba(255,255,255,.67)', textShadowColor: 'rgba(0,0,0,.45)', textShadowRadius: 2, fontWeight: '600', fontSize: 12, margin: 12, transform: [{ rotate: '-24deg' }] },
  dropzone: { paddingVertical: 30, alignItems: 'center', gap: 10, borderStyle: 'dashed', borderWidth: 1, borderColor: '#b7c2a6', borderRadius: 18, backgroundColor: '#f2f4ea' }, dropIcon: { fontSize: 37, color: '#697f51' }, warningCard: { backgroundColor: '#f8f0e0', borderColor: '#e9d9b9' },
  versionRow: { gap: 8 }, version: { paddingHorizontal: 13, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#dce1d1' }, versionSelected: { backgroundColor: '#e6ebda', borderColor: '#829264' },
  scrim: { flex: 1, backgroundColor: '#20271988', alignItems: 'center', justifyContent: 'center', padding: 22 }, dialog: { width: '100%', maxWidth: 450, backgroundColor: '#fffefa', borderRadius: 25, padding: 23, gap: 18 },
  balance: { backgroundColor: '#e9edde', borderRadius: 24, padding: 23, gap: 10 }, eyebrow: { color: '#66764e', fontSize: 11, letterSpacing: 1.4, fontWeight: '600' }, balanceNumber: { fontSize: 48, color: colors.ink, fontWeight: '600' }, balanceUnit: { fontSize: 21, fontWeight: '400' }, pack: { padding: 17, borderWidth: 1, borderColor: '#dde2d2', borderRadius: 19, backgroundColor: '#fffefa', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, historyLine: { flexDirection: 'row', gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#e9ecdf' },
  videoBalance: { borderTopWidth: 1, borderTopColor: '#cfd7c3', paddingTop: 12, color: '#566847', fontSize: 14, fontWeight: '600' }, packAdvantage: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, overflow: 'hidden', backgroundColor: '#e4ead8', color: '#566847', fontSize: 10, fontWeight: '600' }, videoOffer: { marginTop: 4, padding: 18, gap: 12, borderRadius: 18, backgroundColor: '#eef2e7', borderWidth: 1, borderColor: '#d5ddca' },
  generationWait: { padding: 20, gap: 9, borderRadius: 22, borderWidth: 1, borderColor: '#d6dfc9', backgroundColor: '#f0f4e9' }, generationWaitHead: { flexDirection: 'row', alignItems: 'center', gap: 12 }, generationWaitTitle: { fontSize: 19, fontWeight: '600', color: colors.ink }, generationWaitTip: { color: '#536c42', fontSize: 12, lineHeight: 18, marginTop: 3 },
  quantity: { flexDirection: 'row', alignItems: 'center', gap: 8 }, quantityButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ccd5c0', backgroundColor: '#f4f6ef' }, quantityDisabled: { opacity: .35 }, quantitySymbol: { color: colors.ink, fontSize: 20, lineHeight: 22 }, quantityValue: { minWidth: 22, textAlign: 'center', color: colors.ink, fontWeight: '600', fontSize: 15 }, cart: { padding: 17, borderRadius: 19, backgroundColor: '#e9edde', flexDirection: 'row', alignItems: 'center', gap: 12 },
});

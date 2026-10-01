import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { Logo, Button, colors } from './Studio';
import { useAccount } from './AccountConnection';
import { AdminAlerts } from './AdminAlerts';
import { MobileBriefAssistant } from './MobileBriefAssistant';
import { canRequestGeneration, downloadLabel, generationLabel, needsDownloadCredit, previewIsProtected, type AccountPhoto, type Limits, type Pack, type Property } from '../lib/account-api';
import { canSavePhoto, photoForm, savePhoto } from '../lib/account-files';

const message = (error: unknown) => error instanceof Error ? error.message : 'Cette action n’a pas abouti. Réessayez.';
const euro = (cents: number) => (cents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
type Cart = Record<string, number>;
const cartArticles = (packs: Pack[], cart: Cart) => packs.flatMap(pack => cart[pack.id] ? [{ pack_id: pack.id, quantite: cart[pack.id] }] : []);
const cartTotal = (packs: Pack[], cart: Cart) => packs.reduce((sum, pack) => sum + pack.prix_centimes * (cart[pack.id] || 0), 0);
const cartCredits = (packs: Pack[], cart: Cart) => packs.reduce((sum, pack) => sum + pack.credits * (cart[pack.id] || 0), 0);

export function AccountScreenFrame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const { account, ready, error } = useAccount();
  return <SafeAreaView edges={['top', 'left', 'right']} style={s.safe}>
    <View style={s.header}><Logo/><Pressable accessibilityRole="button" accessibilityLabel="Mon compte et mes crédits" onPress={() => router.navigate('/compte')} style={s.creditPill}><Text style={s.pillText}>{account ? `${account.solde} crédit${account.solde > 1 ? 's' : ''}` : 'Mon compte'}</Text></Pressable></View>
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
function Field({ label, value, onChangeText, placeholder, email, code, multiline }: { label: string; value: string; onChangeText: (v: string) => void; placeholder?: string; email?: boolean; code?: boolean; multiline?: boolean }) {
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8a9081" autoCapitalize={email || code ? 'none' : 'sentences'} keyboardType={email ? 'email-address' : code ? 'number-pad' : 'default'} autoComplete={email ? 'email' : code ? 'one-time-code' : 'off'} maxLength={code ? 6 : multiline ? 4000 : 254} multiline={multiline} style={[s.input, multiline && s.multiline]}/></View>;
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
    {detailed && <Text style={s.body}>Photos : {limits.photo.utilisees} / {limits.photo.limite} · Vidéos : {limits.video.utilisees} / {limits.video.limite}</Text>}
    <Text style={s.body}>{blocked ? 'Contactez le support pour débloquer les nouvelles créations. Vos photos déjà achetées restent accessibles.' : 'Un achat remet à zéro le compteur concerné sur le site et dans l’application.'}</Text>
    {blocked && <View style={s.group}><LinkButton title="Contacter le support" onPress={() => { if (limits.support_url) void Linking.openURL(limits.support_url); }}/><Text style={s.small}>{limits.support_telephone}</Text>{!!limits.support_email && <LinkButton title={limits.support_email} onPress={() => { void Linking.openURL(`mailto:${limits.support_email}`); }}/>}</View>}</View>;
}
export function ConnectedLibrary() { return <AccountScreenFrame title="Mes créations" subtitle="Vos photos et leurs versions, sur tous vos appareils."><Gate><LibraryContent/></Gate></AccountScreenFrame>; }
function LibraryContent() {
  const { api, account, refresh } = useAccount(); const [properties, setProperties] = useState<Property[]>([]); const [busy, setBusy] = useState(true); const [notice, setNotice] = useState('');
  const load = useCallback(async () => { setBusy(true); try { setProperties(await api.json<Property[]>('/logements')); setNotice(''); } catch (error) { setNotice(message(error)); } finally { setBusy(false); } }, [api]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <><LimitsCard limits={account?.limites}/><Button title={account?.photo_offerte_disponible ? 'Préparer ma photo offerte' : '+ Retoucher une photo'} onPress={() => router.navigate('/nouvelle')} disabled={account?.limites?.photo.bloque}/>{!!notice && <Notice text={notice}/>}
    {busy ? <ActivityIndicator color={colors.ink}/> : properties.some(p => p.photos.length) ? properties.map(property => <View key={property.id} style={s.group}><Text style={s.section}>{property.nom}</Text><View style={s.photoGrid}>{property.photos.map((photo, index) => <Pressable key={photo.id} accessibilityRole="button" accessibilityLabel={`${property.nom}, photo ${index + 1}`} onPress={() => router.push({ pathname: '/retouche', params: { id: photo.id, mode: 'compte' } })} style={s.photoCard}><Image source={{ uri: photo.vignette }} style={s.thumbnail}/><Text style={s.photoTitle}>Photo {index + 1}</Text><Text style={s.small}>{photo.gardee ? 'HD disponible' : photo.essais ? 'Aperçu à retrouver' : 'Prête à retoucher'}</Text></Pressable>)}</View></View>) : <View style={s.card}><Text style={s.cardTitle}>Votre première photo vous attend.</Text><Text style={s.body}>Importez une photo, créez son aperçu puis ajustez-la une fois. Votre photo offerte se télécharge sans filigrane.</Text></View>}
    <View style={s.secondaryRow}><LinkButton title="Actualiser" onPress={() => { void load(); void refresh(); }}/><LinkButton title="Brouillons locaux" onPress={() => router.push('/local')}/></View></>;
}
export function ConnectedUpload() { return <AccountScreenFrame title="Retoucher une photo" subtitle="Une première génération et une correction incluse."><Gate><UploadContent/></Gate></AccountScreenFrame>; }
function UploadContent() {
  const { api, account, refresh } = useAccount(); const params = useLocalSearchParams<{ logement?: string }>();
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null); const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState(''); const [newName, setNewName] = useState(params.logement || 'Mon logement'); const [showProperties, setShowProperties] = useState(false);
  const [busy, setBusy] = useState(false); const [notice, setNotice] = useState('');
  useEffect(() => { let active = true; void api.json<Property[]>('/logements').then(items => { if (active) { setProperties(items); if (!params.logement && items[0]) setPropertyId(items[0].id); } }).catch(error => { if (active) setNotice(message(error)); }); return () => { active = false; }; }, [api, params.logement]);
  async function pick(camera = false) {
    if (busy) return; setBusy(true); setNotice('');
    try { if (camera && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Autorisez l’appareil photo pour prendre une photo.');
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: .95, allowsEditing: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (!result.canceled && result.assets[0]) { if ((result.assets[0].fileSize || 0) > 30 * 1024 * 1024) throw new Error('Choisissez une photo de moins de 30 Mo.'); setAsset(result.assets[0]); }
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  async function upload() {
    if (!asset || busy || account?.limites?.photo.bloque) return; setBusy(true); setNotice('');
    try { let id = propertyId;
      if (!id) { const created = await api.json<Property>('/logements', { method: 'POST', body: JSON.stringify({ nom: newName.trim() || 'Mon logement', ville: '', type_annonce: 'location' }) }); id = created.id; setPropertyId(id); setProperties(items => [...items, created]); }
      const photo = await api.json<AccountPhoto>(`/photos/${id}`, { method: 'POST', body: await photoForm(asset) });
      await refresh(); setAsset(null); router.push({ pathname: '/retouche', params: { id: photo.id, mode: 'compte' } });
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  return <><LimitsCard limits={account?.limites}/><View style={s.card}>{asset ? <><Image source={{ uri: asset.uri }} style={s.preview}/><View style={s.secondaryRow}><LinkButton title="Changer de photo" onPress={() => void pick()}/><LinkButton title="Ranger dans un logement" onPress={() => setShowProperties(v => !v)}/></View></> : <><View style={s.dropzone}><Text style={s.dropIcon}>＋</Text><Text style={s.cardTitle}>Choisissez votre photo</Text><Text style={s.small}>JPG, PNG ou WebP · 30 Mo maximum</Text></View><Button title="Choisir dans mes photos" onPress={() => void pick()} disabled={busy || account?.limites?.photo.bloque}/><LinkButton title="Prendre une photo" onPress={() => void pick(true)}/></>}
    {(showProperties || !properties.length) && <View style={s.group}>{properties.map(property => <LinkButton key={property.id} title={`${propertyId === property.id ? '✓ ' : ''}${property.nom}`} onPress={() => { setPropertyId(property.id); setShowProperties(false); }}/>) }{properties.length > 0 && <LinkButton title="+ Nouveau logement" onPress={() => setPropertyId('')}/>} {!propertyId && <Field label="Nom du logement" value={newName} onChangeText={setNewName}/>}</View>}
    {asset && <><Text style={s.small}>{account?.photo_offerte_disponible ? 'Votre photo offerte sera téléchargeable sans filigrane.' : 'Aperçu protégé. Vous choisissez ensuite de garder la HD avec un crédit.'}</Text><Button title={busy ? 'Import en cours…' : 'Continuer avec cette photo'} onPress={() => void upload()} disabled={busy || account?.limites?.photo.bloque}/></>}{!!notice && <Notice text={notice}/>}</View></>;
}
export function ConnectedEditor() { return <AccountScreenFrame title="Votre photo" subtitle="Comparez, ajustez, puis gardez la version qui vous plaît."><Gate><EditorContent/></Gate></AccountScreenFrame>; }
function EditorContent() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { api, account, health, refresh } = useAccount();
  const [photo, setPhoto] = useState<AccountPhoto | null>(null); const [selected, setSelected] = useState('');
  const [original, setOriginal] = useState(false); const [request, setRequest] = useState(''); const [adjust, setAdjust] = useState(false);
  const [busy, setBusy] = useState(false); const [generating, setGenerating] = useState(false); const [notice, setNotice] = useState(''); const [confirm, setConfirm] = useState<'correction' | 'download' | null>(null); const [videoOffer, setVideoOffer] = useState(false);
  const loading = useRef(false);
  const loadedDraftFor = useRef('');
  const load = useCallback(async () => {
    if (!id || loading.current) return; loading.current = true;
    try { const result = await api.json<AccountPhoto>(`/photos/${encodeURIComponent(id)}`); setPhoto(result); setSelected(current => result.versions.some(v => v.id === current) ? current : result.versions.at(-1)?.id || ''); if (loadedDraftFor.current !== result.id) { setRequest(result.demande_brouillon || ''); loadedDraftFor.current = result.id; } }
    catch (error) { setNotice(message(error)); } finally { loading.current = false; }
  }, [api, id]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const version = photo?.versions.find(v => v.id === selected);
  const limits = photo?.limites || account?.limites;
  const blocked = !!limits?.photo.bloque;
  async function saveDraft() {
    if (!photo || busy || !request.trim()) return;
    setBusy(true); setNotice('');
    try {
      await api.json(`/photos/${photo.id}/demande`, { method: 'PATCH', body: JSON.stringify({ demande: request }) });
      setNotice('Votre demande est enregistrée avec cette photo. Retrouvez-la aussi sur le site.');
    } catch (error) { setNotice(message(error)); } finally { setBusy(false); }
  }
  async function generate() {
    if (!photo || busy || !canRequestGeneration(photo, blocked, account?.solde || 0)) return;
    setBusy(true); setGenerating(true); setNotice(''); setConfirm(null);
    try {
      await api.json(`/photos/${photo.id}/demande`, { method: 'PATCH', body: JSON.stringify({ demande: request.trim() }) });
      if (photo.reprise_necessaire) {
        const reopened = await api.json<AccountPhoto>(`/photos/${photo.id}/reprendre`, { method: 'POST', body: JSON.stringify({ cycle_id: photo.cycle_id }) });
        setPhoto(reopened); await refresh();
      }
      const result = await api.json<AccountPhoto>(`/photos/${photo.id}/essai`, { method: 'POST', body: JSON.stringify({ demande: request.trim(), depuis_version_id: original ? null : version?.id || null }) });
      setPhoto(result); setSelected(result.versions.at(-1)?.id || ''); setOriginal(false); setAdjust(false); await refresh();
    } catch (error) { setNotice(message(error)); await load(); await refresh(); } finally { setBusy(false); setGenerating(false); }
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
  return <><LimitsCard limits={limits}/>{generating && <View style={s.generationWait} accessibilityLiveRegion="polite"><View style={s.generationWaitHead}><ActivityIndicator color="#4f6b41"/><Text style={s.generationWaitTitle}>Votre photo prend forme.</Text></View><Text style={s.body}>La retouche peut prendre quelques minutes. Le résultat apparaîtra ici dès qu’il sera prêt.</Text><Text style={s.generationWaitTip}>À la réception, comparez les ouvertures et le mobilier avec l’original, puis ajustez un détail si besoin.</Text></View>}<View style={s.card}>
    <View style={s.previewFrame}><Image accessibilityLabel={original || !version ? 'Photo originale' : `Version ${version.numero}`} source={{ uri: original || !version ? photo.original : version.apercu }} style={s.preview}/>{protect && <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.watermark}>{Array.from({ length: 16 }, (_, i) => <Text key={i} style={s.watermarkText}>STUDIO ANNONCE</Text>)}</View>}</View>
    <View style={s.secondaryRow}><LinkButton title={original ? 'Voir la retouche' : 'Comparer à l’original'} onPress={() => setOriginal(v => !v)}/>{!!version && <LinkButton title={adjust ? 'Fermer les ajustements' : 'Ajuster la photo'} onPress={() => setAdjust(v => !v)}/>}</View>
    {photo.versions.length > 1 && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.versionRow}>{photo.versions.map(v => <Pressable key={v.id} accessibilityRole="button" accessibilityState={{ selected: selected === v.id && !original }} onPress={() => { setSelected(v.id); setOriginal(false); }} style={[s.version, selected === v.id && !original && s.versionSelected]}><Text style={s.label}>Version {v.numero}</Text></Pressable>)}</ScrollView>}
    {protect && <Text style={s.small}>Aperçu protégé. Votre fichier téléchargé sera sans filigrane.</Text>}
    {(!version || adjust) && <><Field label={version ? 'Votre correction' : 'Que souhaitez-vous améliorer ?'} value={request} onChangeText={setRequest} placeholder="Par exemple : ranger la pièce, faire le lit et éclaircir la lumière naturelle." multiline/><MobileBriefAssistant kind="photo" request={request} onUse={brief => { if (brief.length <= 4000) setRequest(brief); else setNotice('Ce brief dépasse 4 000 caractères. Raccourcissez-le avant de l’utiliser.'); }} storageKey={`studio-annonce.mobile.assistant.photo.${account?.id || 'session'}.${photo.id}`}/><Text style={s.small}>{photo.reprise_necessaire ? 'Cette correction supplémentaire coûte 1 crédit. Vous confirmez avant tout débit.' : `${photo.essais_restants} génération${photo.essais_restants > 1 ? 's' : ''} disponible${photo.essais_restants > 1 ? 's' : ''} pour cette photo.`}</Text>{health?.retouche_disponible === true && <Button title={busy ? 'Traitement en cours…' : generationLabel(photo)} disabled={busy || !request.trim() || !canRequestGeneration(photo, blocked, account?.solde || 0)} onPress={() => photo.reprise_necessaire ? setConfirm('correction') : void generate()}/>}<LinkButton title={health?.retouche_disponible === true ? 'Enregistrer pour plus tard' : 'Enregistrer ma demande'} onPress={() => void saveDraft()}/></>}
    {!!version && !original && <Button title={busy ? 'Traitement en cours…' : downloadLabel(photo)} secondary={adjust} disabled={busy || !availableHd} onPress={() => needsDownloadCredit(photo) ? setConfirm('download') : void download()}/>}
    {health?.retouche_disponible !== true && <Text style={s.small}>Les nouvelles retouches sont momentanément indisponibles. Les fichiers HD déjà prêts restent récupérables.</Text>}
    {!!notice && <Notice text={notice}/>} {videoOffer && <View style={s.videoOffer}><Text style={s.cardTitle}>Et si vos photos devenaient une vidéo ?</Text><Text style={s.body}>Préparez une visite immobilière avec vos photos. Vous verrez le prix et la durée avant tout achat.</Text><Button title="Préparer ma vidéo" onPress={() => router.navigate('/visite')}/></View>}<LinkButton title="Retour à mes photos" onPress={() => router.navigate('/')}/>
  </View><Modal visible={!!confirm} transparent animationType="fade" onRequestClose={() => setConfirm(null)}><View style={s.scrim}><View style={s.dialog}><Text style={s.cardTitle}>{confirm === 'correction' ? 'Une correction supplémentaire' : 'Garder cette photo en HD'}</Text><Text style={s.body}>{confirm === 'correction' ? '1 crédit permet de générer une correction supplémentaire sur cette photo.' : '1 crédit permet de télécharger votre photo sans filigrane.'}</Text><Text style={s.small}>Votre solde : {account?.solde || 0} crédit(s).</Text><Button title="Confirmer · 1 crédit" onPress={() => confirm === 'correction' ? void generate() : void download()} disabled={busy || (account?.solde || 0) < 1}/><LinkButton title="Annuler" onPress={() => setConfirm(null)}/>{(account?.solde || 0) < 1 && <LinkButton title="Voir les packs" onPress={() => { setConfirm(null); router.navigate('/compte'); }}/>}</View></View></Modal></>;
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
  return <><View style={s.balance}><Text style={s.eyebrow}>MES SOLDES</Text><Text style={s.balanceNumber}>{account.solde}<Text style={s.balanceUnit}> crédit{account.solde > 1 ? 's' : ''} photo</Text></Text><Text style={s.videoBalance}>{account.solde_video || 0} crédit{(account.solde_video || 0) > 1 ? 's' : ''} vidéo · 1 crédit = 5 secondes</Text><Text style={s.body}>{account.photo_offerte_disponible ? 'Votre première photo est offerte.' : 'Une génération et une correction incluse par photo.'}</Text>{account.photo_offerte_disponible && <Button title="Préparer ma photo offerte" onPress={() => router.navigate('/nouvelle')} disabled={account.limites?.photo.bloque}/>}<LinkButton title="Actualiser mes soldes" onPress={() => void refresh()}/></View>
    <LimitsCard limits={account.limites} detailed/><View style={s.group}><Text style={s.section}>Packs photo · sans abonnement</Text><Text style={s.small}>1 photo gardée en HD = 1 crédit. Vous pouvez cumuler plusieurs packs dans le même panier.</Text>{!photoAvailable && <Text style={s.small}>Les achats ouvriront après la recette de production photo.</Text>}{photoPacks.map(pack => <View key={pack.id} style={s.pack}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{pack.libelle}</Text><Text style={s.small}>{euro(pack.prix_centimes)} · {euro(pack.prix_unitaire_centimes)} par photo</Text>{!!pack.avantage && <Text style={s.packAdvantage}>{pack.avantage}</Text>}</View><Quantity label={pack.libelle} value={photoCart[pack.id] || 0} total={photoPackCount} onChange={delta => updateCart('photo', pack.id, delta)}/></View>)}<View style={s.cart}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{photoCredits || 0} crédits photo</Text><Text style={s.small}>Total du panier : {euro(cartTotal(photoPacks, photoCart))}</Text></View><Button title={photoAvailable ? 'Payer' : 'Bientôt'} secondary onPress={() => void buy('photo', photoPacks, photoCart)} disabled={busy || !photoAvailable || !photoCredits}/></View></View>
    <View style={s.group}><Text style={s.section}>Packs vidéo · solde séparé</Text><Text style={s.small}>1 crédit vidéo = 5 secondes en 720p. Plusieurs packs vidéo peuvent être réunis dans un paiement.</Text>{!videoAvailable && <Text style={s.small}>Les packs sont affichés, mais aucun paiement vidéo ne peut partir avant la validation de Higgsfield.</Text>}{videoPacks.map(pack => <View key={pack.id} style={s.pack}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{pack.libelle}</Text><Text style={s.small}>{euro(pack.prix_centimes)} · {pack.credits} crédits vidéo</Text>{!!pack.avantage && <Text style={s.packAdvantage}>{pack.avantage}</Text>}</View><Quantity label={pack.libelle} value={videoCart[pack.id] || 0} total={videoPackCount} onChange={delta => updateCart('video', pack.id, delta)}/></View>)}<View style={s.cart}><View style={{ flex: 1 }}><Text style={s.cardTitle}>{videoCredits * 5} secondes</Text><Text style={s.small}>Total du panier : {euro(cartTotal(videoPacks, videoCart))}</Text></View><Button title={videoAvailable ? 'Payer' : 'Bientôt'} secondary onPress={() => void buy('video', videoPacks, videoCart)} disabled={busy || !videoAvailable || !videoCredits}/></View></View>
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
  group: { gap: 13 }, section: { fontSize: 19, fontWeight: '600', color: colors.ink }, photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, photoCard: { width: '47%', flexGrow: 1, maxWidth: 350, borderRadius: 16, padding: 9, gap: 5, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e1e5d9' }, thumbnail: { width: '100%', aspectRatio: 1.22, borderRadius: 11, backgroundColor: colors.sage }, photoTitle: { color: colors.ink, fontSize: 15, fontWeight: '500', marginTop: 4 },
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

import { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import { Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { CONSENT_CHANGED, CONSENT_KEY, CONSENT_PREFERENCES, initializeTracking, openPreferences, pageNavigation, readConsent, setConsent } from '../../../shared/tracking';
import { useAccount } from './AccountConnection';

export function TrackingWeb() {
  const pathname = usePathname();
  const { api } = useAccount();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    initializeTracking();
    const update = () => { setVisible(readConsent() === null); if (readConsent()?.accepte === false) void api.json('/compte/publicite/revoquer', { method: 'POST', keepalive: true }).catch(() => {}); };
    const open = () => setVisible(true);
    const storage = (event: StorageEvent) => { if (event.key === CONSENT_KEY) window.location.reload(); };
    update(); window.addEventListener(CONSENT_CHANGED, update); window.addEventListener(CONSENT_PREFERENCES, open); window.addEventListener('storage', storage);
    return () => { window.removeEventListener(CONSENT_CHANGED, update); window.removeEventListener(CONSENT_PREFERENCES, open); window.removeEventListener('storage', storage); };
  }, [api]);
  useEffect(() => { if (Platform.OS === 'web') pageNavigation('/mobile' + (pathname === '/' ? '/' : pathname), 'app'); }, [pathname]);
  if (Platform.OS !== 'web') return null;
  return <>
    <View style={s.preferences}><Pressable accessibilityRole="button" onPress={openPreferences}><Text style={s.link}>Gérer mes cookies</Text></Pressable></View>
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setConsent(false)}><View style={s.scrim}><View style={s.card}>
      <Text style={s.title}>Vos cookies, votre choix.</Text><Text style={s.text}>Avec votre accord, Google Analytics et Google Ads mesurent les visites, inscriptions et achats. Google Ads peut utiliser votre email sous forme hachée pour relier une conversion à une publicité. Vous pouvez refuser et continuer à utiliser le studio.</Text>
      <View style={s.actions}>{[[true, 'Tout accepter'], [false, 'Tout refuser']].map(([value, label]) => <Pressable key={String(value)} style={s.button} accessibilityRole="button" onPress={() => setConsent(value === true)}><Text style={s.text}>{String(label)}</Text></Pressable>)}</View>
      <Pressable accessibilityRole="link" onPress={() => void Linking.openURL('https://studioannonce.fr/cookies/')}><Text style={s.link}>Comprendre les cookies et changer mon choix</Text></Pressable>
    </View></View></Modal>
  </>;
}
const s = StyleSheet.create({ preferences: { position: 'absolute', bottom: 76, right: 12, zIndex: 20, padding: 7, backgroundColor: '#fffefa', borderRadius: 12 }, link: { color: '#566343', fontSize: 12, textDecorationLine: 'underline' }, scrim: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: '#00000033' }, card: { padding: 22, borderRadius: 20, backgroundColor: '#fffefa', gap: 16 }, title: { color: '#2e3526', fontWeight: '600', fontSize: 20 }, text: { color: '#2e3526', fontSize: 14, lineHeight: 22 }, actions: { flexDirection: 'row', gap: 10 }, button: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#566343', minHeight: 46 } });

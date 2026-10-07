import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { StudioProvider, colors } from '../components/Studio';
import { AccountConnection } from '../components/AccountConnection';
import { TrackingWeb } from '../components/TrackingWeb';

const navigationItems = [
  { name: 'index', title: 'Mes créations' },
  { name: 'creer', title: 'Créer' },
  { name: 'credits', title: 'Crédits' },
  { name: 'facturation', title: 'Facturation' },
] as const;
const creationScreens = new Set(['creer', 'nouvelle', 'creer-image', 'visite', 'video-photos']);

function NavigationIcon({ name, color }: { name: string; color: string }) {
  return <Svg width={23} height={23} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
    {name === 'index' ? <Path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/> : name === 'creer' ? <Path d="M12 4v16 M4 12h16"/> : <><Rect x={3} y={5} width={18} height={14} rx={3}/><Path d="M3 10h18 M7 15h3"/></>}
  </Svg>;
}

export default function Layout() {
  return <StudioProvider><AccountConnection><StatusBar style="dark"/><Tabs screenOptions={{ headerShown: false }} tabBar={({ state, navigation, insets }) => {
    const currentScreen = state.routes[state.index].name;
    const activeTab = creationScreens.has(currentScreen) ? 'creer' : currentScreen === 'credits' || currentScreen === 'facturation' ? currentScreen : 'index';
    return <View style={[styles.tabs, { paddingBottom: Math.max(8, insets.bottom) }]}>{navigationItems.map(item => {
      const route = state.routes.find(candidate => candidate.name === item.name);
      if (!route) return null;
      const selected = activeTab === item.name;
      const color = selected ? colors.ink : '#79816f';
      return <Pressable key={item.name} accessibilityRole="tab" accessibilityLabel={item.title} accessibilityState={{ selected }} onPress={() => {
        const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (!event.defaultPrevented) navigation.navigate(route.name);
      }} onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })} style={({ pressed }) => [styles.tab, pressed && { opacity: .65 }]}>
        <View style={[styles.tabIcon, selected && styles.selectedIcon]}><NavigationIcon name={item.name} color={color}/></View><Text style={[styles.tabLabel, { color }, selected && styles.selectedLabel]}>{item.title}</Text>
      </Pressable>;
    })}</View>;
  }}>
    <Tabs.Screen name="index" options={{ title: 'Mes créations' }}/>
    <Tabs.Screen name="creer" options={{ title: 'Créer' }}/>
    <Tabs.Screen name="credits" options={{ title: 'Crédits' }}/>
    <Tabs.Screen name="facturation" options={{ title: 'Facturation' }}/>
    <Tabs.Screen name="compte" options={{ href: null }}/>
    <Tabs.Screen name="exemples" options={{ href: null }}/><Tabs.Screen name="local" options={{ href: null }}/>
    <Tabs.Screen name="nouvelle" options={{ href: null }}/><Tabs.Screen name="atelier" options={{href:null}}/><Tabs.Screen name="versions" options={{href:null}}/><Tabs.Screen name="retouche" options={{href:null}}/><Tabs.Screen name="historique" options={{href:null}}/><Tabs.Screen name="creer-image" options={{href:null}}/><Tabs.Screen name="video-photos" options={{href:null}}/><Tabs.Screen name="visite" options={{href:null}}/></Tabs><TrackingWeb /></AccountConnection></StudioProvider>;
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', paddingTop: 7, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: '#e1e5d9', backgroundColor: '#fffefa' },
  tab: { flex: 1, minHeight: 55, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabIcon: { width: 52, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  selectedIcon: { backgroundColor: '#e9edde' },
  tabLabel: { fontSize: 11, lineHeight: 16 },
  selectedLabel: { fontWeight: '600' },
});

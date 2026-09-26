import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { StudioProvider, colors } from '../components/Studio';
export default function Layout() {
  return <StudioProvider><StatusBar style="dark"/><Tabs screenOptions={{headerShown:false,tabBarActiveTintColor:colors.ink,tabBarInactiveTintColor:'#858c7d',tabBarStyle:{backgroundColor:'#fffefa',borderTopColor:'#e1e5d9'},tabBarLabelStyle:{fontSize:11,paddingBottom:3}}}>
    <Tabs.Screen name="index" options={{title:'Mes photos',tabBarIcon:({color})=><Text style={{color,fontSize:23}}>▧</Text>}}/>
    <Tabs.Screen name="atelier" options={{title:'Atelier',tabBarIcon:({color})=><Text style={{color,fontSize:23}}>✧</Text>}}/>
    <Tabs.Screen name="versions" options={{title:'Versions',tabBarIcon:({color})=><Text style={{color,fontSize:23}}>▤</Text>}}/>
    <Tabs.Screen name="compte" options={{title:'Compte',tabBarIcon:({color})=><Text style={{color,fontSize:23}}>○</Text>}}/>
  <Tabs.Screen name="retouche" options={{href:null}}/><Tabs.Screen name="historique" options={{href:null}}/></Tabs></StudioProvider>;
}

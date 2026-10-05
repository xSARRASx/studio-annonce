import { useCallback, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAccount } from './AccountConnection';
import { Button, colors } from './Studio';
export type AccountDraft = { id: string; nature: string; photo_id?: string; titre?: string; donnees: { selectedIds?: string[]; selectedVersions?: Record<string,string>; idea?: string; brief?: string; duration?: number; movements?: Record<string,string> }; modifie_le: string };
export function ConnectedDrafts() {
  const { api } = useAccount(); const [items, setItems] = useState<AccountDraft[]>([]); const [error,setError]=useState(''); const [loading,setLoading]=useState(true);
  useFocusEffect(useCallback(() => { let active=true; void api.json<AccountDraft[]>('/brouillons').then(v=>{if(active){setItems(v);setError('');}}).catch(e=>{if(active)setError(e.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;}; },[api]));
  return <View style={{gap:16}}><Text style={{color:colors.muted}}>Vos préparations sont enregistrées dans votre compte, avant toute génération. Aucun crédit n’est consommé par un brouillon.</Text>{loading&&<ActivityIndicator/>}{!!error&&<Text>{error}</Text>}{!loading&&!items.length&&<Text>Aucun brouillon pour le moment.</Text>}{items.map(item=><View key={item.id} style={{padding:16,gap:12,backgroundColor:'#fffefa',borderWidth:1,borderColor:'#dce2d1',borderRadius:18}}><Text style={{fontSize:18,color:colors.ink}}>{item.titre||(item.nature==='video'?'Vidéo en préparation':'Photo en préparation')}</Text><Text numberOfLines={3}>{item.donnees.brief||item.donnees.idea||'Demande à compléter'}</Text><Text>{new Date(item.modifie_le).toLocaleString('fr-FR')}</Text><Button title="Reprendre ce brouillon" onPress={()=>item.photo_id?router.push({pathname:'/retouche',params:{id:item.photo_id,mode:'compte'}}):router.push({pathname:'/visite',params:{brouillon:item.id}})}/></View>)}</View>;
}

import { useLocalSearchParams } from 'expo-router';
import { EditorScreen } from '../components/Studio';
import { ConnectedEditor } from '../components/ConnectedStudio';
export default function Retouche() {
  const { id, mode } = useLocalSearchParams<{ id: string; mode?: string }>();
  // Existing local photo identifiers cannot be treated as server photographs.
  return mode !== 'compte' && (id === 'salon-demo' || id?.startsWith('photo-')) ? <EditorScreen/> : <ConnectedEditor/>;
}

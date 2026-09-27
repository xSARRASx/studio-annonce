import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildBrief, buildQuestions, recoverBriefSource, type BriefAnswers, type BriefKind } from '../../../shared/brief-flow';
import { useLocalDraft } from '../lib/use-local-draft';

type Session = { sourceRequest: string; sourceContext: string; answers: BriefAnswers; step: number; lastApplied: string };
const blankSession: Session = { sourceRequest: '', sourceContext: '', answers: {}, step: 0, lastApplied: '' };
function readSession(value: unknown): Session {
  if (!value || typeof value !== 'object') throw new Error('Invalid assistant draft');
  const saved = value as Partial<Session>;
  const answers: BriefAnswers = {};
  if (saved.answers && typeof saved.answers === 'object') for (const [id, answer] of Object.entries(saved.answers).slice(0, 30)) {
    if (answer && typeof answer === 'object') answers[id.slice(0, 100)] = { choice: typeof answer.choice === 'string' ? answer.choice.slice(0, 500) : '', detail: typeof answer.detail === 'string' ? answer.detail.slice(0, 1000) : '' };
  }
  return {
    sourceRequest: typeof saved.sourceRequest === 'string' ? saved.sourceRequest.slice(0, 20000) : '',
    sourceContext: typeof saved.sourceContext === 'string' ? saved.sourceContext.slice(0, 12000) : '',
    lastApplied: typeof saved.lastApplied === 'string' ? saved.lastApplied.slice(0, 20000) : '',
    step: Number.isInteger(saved.step) && saved.step! >= 0 ? Math.min(saved.step!, 20) : 0,
    answers,
  };
}

type AssistantProps = { kind: BriefKind; request: string; context?: string; onUse: (brief: string) => void; storageKey?: string };
export function MobileBriefAssistant(props: AssistantProps) {
  return <AssistantSession key={`${props.kind}:${props.storageKey || 'session'}`} {...props}/>;
}
function AssistantSession({ kind, request, context = '', onUse, storageKey }: AssistantProps) {
  const { draft, setDraft, ready: restored, notice } = useLocalDraft(storageKey, blankSession, readSession);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showText, setShowText] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const sourceRequest = recoverBriefSource(kind, draft.sourceRequest);
  const requestSource = recoverBriefSource(kind, request);
  const questions = buildQuestions(kind, sourceRequest);
  const step = Math.min(draft.step, questions.length);
  const complete = step === questions.length;
  const current = questions[step];
  const answer = current ? draft.answers[current.id] : undefined;
  const answered = !!(answer?.choice.trim() || answer?.detail.trim());
  const sourceChanged = (requestSource !== sourceRequest && request !== draft.lastApplied) || context !== draft.sourceContext;
  const editedPreparedText = kind === 'photo' && !!draft.lastApplied && request !== draft.lastApplied && requestSource !== request;
  const brief = complete ? buildBrief(kind, sourceRequest, questions, draft.answers, draft.sourceContext) : '';
  const tooLong = brief.length > 20000;
  const missing = questions.findIndex(question => !draft.answers[question.id]?.choice.trim() && !draft.answers[question.id]?.detail.trim());
  const name = kind === 'photo' ? 'photo' : kind === 'video' ? 'vidéo' : 'création d’image';

  useEffect(() => { if (open) scroll.current?.scrollTo({ y: 0, animated: false }); }, [open, step]);

  function refreshSource() {
    setDraft(previous => ({ ...previous, sourceRequest: request === previous.lastApplied ? recoverBriefSource(kind, previous.sourceRequest) : requestSource, sourceContext: context, step: 0 }));
    setEditing(false);
  }
  function begin() {
    if (sourceChanged) refreshSource();
    setOpen(true);
  }
  function changeAnswer(values: Partial<{ choice: string; detail: string }>) {
    setDraft(previous => ({ ...previous, answers: { ...previous.answers, [current.id]: { ...(previous.answers[current.id] || { choice: '', detail: '' }), ...values } } }));
  }
  function advance() {
    Keyboard.dismiss();
    setDraft(previous => ({ ...previous, step: editing ? questions.length : step + 1 }));
    setEditing(false);
  }
  function apply() {
    if (tooLong || sourceChanged || missing !== -1) return;
    setDraft(previous => ({ ...previous, lastApplied: brief }));
    onUse(brief);
    setOpen(false);
  }

  return <View>
    <Pressable accessibilityRole="button" aria-disabled={!restored} aria-expanded={open} accessibilityState={{ disabled: !restored, expanded: open }} disabled={!restored} onPress={begin} style={({ pressed }) => [styles.invite, pressed && { opacity: .75 }]}>
      <View style={styles.star}><Text style={styles.starText}>✦</Text></View><View style={{ flex: 1, gap: 5 }}><Text style={styles.eyebrow}>UN COUP DE POUCE</Text><Text style={styles.inviteTitle}>Votre idée, en plus clair.</Text><Text style={styles.inviteCopy}>Des choix, vos mots, vos précisions.</Text><Text style={styles.inviteLink}>{!restored ? 'Chargement…' : Object.keys(draft.answers).length ? 'Reprendre l’aide →' : 'Me guider →'}</Text></View>
    </Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <View style={styles.header}><Text style={styles.headerTitle}>✦ Assistant {name}</Text><Pressable accessibilityRole="button" accessibilityLabel="Fermer l’assistant" onPress={() => setOpen(false)} style={styles.close}><Text style={styles.closeText}>×</Text></Pressable></View>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.progress}>{questions.map((item, index) => <View key={item.id} style={[styles.progressLine, index <= step && styles.progressActive]}/>)}</View>
          {sourceRequest.trim() && <View style={styles.source}><Text style={styles.eyebrow}>VOTRE IDÉE DE DÉPART</Text><Text numberOfLines={3} style={styles.sourceText}>{sourceRequest}</Text></View>}
          {sourceChanged && <View style={styles.changed}><Text style={styles.small}>Votre idée ou vos photos ont changé. Actualisez les questions pour en tenir compte.</Text><Pressable accessibilityRole="button" onPress={refreshSource}><Text style={styles.link}>Actualiser les questions →</Text></Pressable></View>}
          {editedPreparedText && <Text style={styles.notice}>Le texte a été ajusté à la main. Les cartes reprennent les dernières réponses enregistrées ; utiliser cette demande remplacera votre texte actuel.</Text>}
          {!!notice && <Text accessibilityLiveRegion="polite" style={styles.notice}>{notice}</Text>}
          <Text style={styles.counter}>{complete ? 'TOUT EST PRÊT' : `QUESTION ${step + 1} SUR ${questions.length} · ${current.core ? 'LES ESSENTIELS' : 'POUR VOTRE IDÉE'}`}</Text>
          <Text accessibilityRole="header" style={styles.title}>{complete ? 'Voilà votre demande.' : current.label}</Text>
          <Text style={styles.help}>{complete ? 'Vos choix et vos précisions sont réunis. Touchez une réponse pour l’ajuster.' : current.help}</Text>
          {complete ? <>
            <View style={styles.recap}>{questions.map((question, index) => {
              const item = draft.answers[question.id];
              return <Pressable key={question.id} accessibilityRole="button" accessibilityLabel={`Modifier ${question.short}`} onPress={() => { setDraft(previous => ({ ...previous, step: index })); setEditing(true); }} style={styles.recapCard}><View style={{ flex: 1, gap: 5 }}><Text style={styles.eyebrow}>{question.short}</Text>{!!item?.choice && <Text style={styles.optionTitle}>{item.choice}</Text>}{!!item?.detail && <Text style={styles.small}>{item.detail}</Text>}{!item?.choice && !item?.detail && <Text style={styles.small}>À préciser</Text>}</View><Text style={styles.recapEdit}>Modifier</Text></Pressable>;
            })}</View>
            <Pressable accessibilityRole="button" aria-expanded={showText} accessibilityState={{ expanded: showText }} onPress={() => setShowText(value => !value)} style={styles.disclosure}><Text style={styles.link}>{showText ? 'Masquer le texte complet −' : 'Voir le texte complet +'}</Text></Pressable>
            {showText && <Text selectable style={styles.fullBrief}>{brief}</Text>}
            {tooLong && <Text accessibilityLiveRegion="polite" style={styles.notice}>Votre description dépasse 20 000 caractères. Raccourcissez une réponse avant de l’utiliser : vos précisions sont conservées.</Text>}
            {missing !== -1 ? <Pressable accessibilityRole="button" onPress={() => setDraft(previous => ({ ...previous, step: missing }))} style={styles.primary}><Text style={styles.primaryText}>Compléter les réponses →</Text></Pressable> : <Pressable accessibilityRole="button" aria-disabled={tooLong || sourceChanged} accessibilityState={{ disabled: tooLong || sourceChanged }} disabled={tooLong || sourceChanged} onPress={apply} style={[styles.primary, (tooLong || sourceChanged) && { opacity: .4 }]}><Text style={styles.primaryText}>{editedPreparedText ? 'Remplacer par cette demande' : kind === 'photo' ? 'Utiliser cette demande' : 'Utiliser cette description'} ✓</Text></Pressable>}
            <Pressable accessibilityRole="button" onPress={() => { setDraft(previous => ({ ...previous, answers: {}, step: 0 })); setEditing(false); }} style={styles.back}><Text style={styles.link}>Recommencer les réponses</Text></Pressable>
          </> : <>
            <View style={styles.options}>{current.options.map(option => {
              const selected = answer?.choice === option.label;
              return <Pressable key={option.label} accessibilityRole="radio" aria-checked={selected} accessibilityState={{ checked: selected }} onPress={() => changeAnswer({ choice: selected ? '' : option.label })} style={[styles.option, selected && styles.optionSelected]}><View style={styles.optionTop}><Text style={styles.optionSymbol}>{selected ? '✓' : '○'}</Text><Text style={[styles.optionTag, selected && { color: '#607146' }]}>{selected ? 'Choisi' : 'Choisir'}</Text></View><Text style={styles.optionTitle}>{option.label}</Text><Text style={styles.optionDetail}>{option.detail}</Text></Pressable>;
            })}</View>
            <View style={styles.custom}><Text style={styles.customLabel}>Votre réponse ou une précision</Text><TextInput accessibilityLabel={`Votre réponse libre : ${current.short}`} value={answer?.detail || ''} onChangeText={detail => changeAnswer({ detail })} placeholder={current.placeholder} placeholderTextColor="#858ca2" maxLength={1000} multiline style={styles.input}/><Text style={styles.small}>Écrivez seulement, choisissez une carte, ou faites les deux.</Text></View>
            <Pressable accessibilityRole="button" aria-disabled={!answered} accessibilityState={{ disabled: !answered }} disabled={!answered} onPress={advance} style={[styles.primary, !answered && { opacity: .4 }]}><Text style={styles.primaryText}>{editing ? 'Valider ma réponse' : step === questions.length - 1 ? 'Voir ma demande' : 'Continuer'} →</Text></Pressable>
            {(step > 0 || editing) && <Pressable accessibilityRole="button" onPress={() => { Keyboard.dismiss(); setDraft(previous => ({ ...previous, step: editing ? questions.length : step - 1 })); setEditing(false); }} style={styles.back}><Text style={styles.link}>← {editing ? 'Retour au récapitulatif' : 'Question précédente'}</Text></Pressable>}
          </>}
          <Text style={styles.footnote}>Aperçu gratuit. Les questions s’adaptent aux mots de votre idée ; aucune génération IA n’est lancée.</Text>
        </ScrollView></KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  invite: { padding: 18, flexDirection: 'row', gap: 14, borderWidth: 1, borderColor: '#d9dff2', backgroundColor: '#edf1fc', borderRadius: 17 }, star: { width: 43, height: 48, backgroundColor: '#dfe7fa', borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, starText: { fontSize: 28, color: '#697caf' }, eyebrow: { color: '#7b849e', fontSize: 10, fontWeight: '600', letterSpacing: 1.2, lineHeight: 16 }, inviteTitle: { fontSize: 18, fontWeight: '600', color: '#465373', lineHeight: 24 }, inviteCopy: { color: '#78829b', fontSize: 13, lineHeight: 20 }, inviteLink: { color: '#6176ab', fontSize: 14, fontWeight: '600', marginTop: 7 },
  safe: { flex: 1, backgroundColor: '#f5f7fd' }, header: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#edf1fb', borderBottomWidth: 1, borderColor: '#e0e5f3' }, headerTitle: { fontSize: 15, color: '#5c6e9d', fontWeight: '600', flex: 1 }, close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, closeText: { fontSize: 29, color: '#72809e' }, content: { padding: 22, paddingBottom: 35, gap: 15, maxWidth: 590, width: '100%', alignSelf: 'center' }, progress: { flexDirection: 'row', gap: 5, paddingBottom: 3 }, progressLine: { flex: 1, height: 4, backgroundColor: '#e0e6f3', borderRadius: 3 }, progressActive: { backgroundColor: '#9daa82' }, source: { backgroundColor: '#edf1fb', borderRadius: 11, padding: 13, gap: 5 }, sourceText: { fontSize: 13, lineHeight: 21, color: '#6c7793' }, changed: { backgroundColor: '#f4f0e6', padding: 14, borderRadius: 11, gap: 9 }, counter: { fontSize: 10, lineHeight: 17, color: '#7b88a8', fontWeight: '600', letterSpacing: 1.1 }, title: { color: '#3e4b69', fontWeight: '500', fontSize: 27, lineHeight: 34, letterSpacing: -.7 }, help: { color: '#7a849c', fontSize: 14, lineHeight: 22 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, option: { flexBasis: '47%', flexGrow: 1, padding: 14, minWidth: 122, borderWidth: 1, borderColor: '#dfe5f0', borderRadius: 13, backgroundColor: '#fffefa', gap: 9 }, optionSelected: { borderColor: '#a6b28d', backgroundColor: '#f0f5e9' }, optionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 5 }, optionSymbol: { color: '#899d69', fontSize: 20 }, optionTag: { color: '#95a0b5', fontSize: 10 }, optionTitle: { fontSize: 14, lineHeight: 21, fontWeight: '600', color: '#4c5670' }, optionDetail: { color: '#8991a2', fontSize: 12, lineHeight: 19 }, custom: { backgroundColor: '#eaf0fc', borderRadius: 13, padding: 15, gap: 9 }, customLabel: { fontSize: 13, color: '#596b96', fontWeight: '600' }, input: { fontSize: 16, lineHeight: 23, minHeight: 110, padding: 12, textAlignVertical: 'top', color: '#3e4b69', backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#ced8ed', borderRadius: 10 }, small: { fontSize: 12, lineHeight: 20, color: '#7e89a1' }, primary: { backgroundColor: '#687db0', borderRadius: 11, alignItems: 'center', justifyContent: 'center', padding: 15, minHeight: 50 }, primaryText: { fontSize: 15, lineHeight: 22, color: '#fff', fontWeight: '600', textAlign: 'center' }, back: { minHeight: 44, alignItems: 'center', justifyContent: 'center' }, link: { fontSize: 13, lineHeight: 21, color: '#6f80a7', fontWeight: '500' }, recap: { gap: 9 }, recapCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15, backgroundColor: '#fffefa', borderWidth: 1, borderColor: '#e0e5ee', borderRadius: 12 }, recapEdit: { fontSize: 11, color: '#8290ac', paddingTop: 4 }, disclosure: { paddingVertical: 12 }, fullBrief: { fontSize: 13, color: '#697590', lineHeight: 23, backgroundColor: '#edf1f8', borderRadius: 11, padding: 15 }, footnote: { fontSize: 11, color: '#8a93a8', lineHeight: 18, textAlign: 'center', marginTop: 5 }, notice: { fontSize: 12, color: '#85764e', lineHeight: 19, padding: 13, borderRadius: 10, backgroundColor: '#f6eedf' },
});

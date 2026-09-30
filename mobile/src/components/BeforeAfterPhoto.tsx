import { useMemo, useState } from 'react';
import { Image, PanResponder, Platform, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

type Props = { before: ImageSourcePropType; after: ImageSourcePropType; aspectRatio: number; label: string };
const clamp = (value: number) => Math.max(0, Math.min(100, value));

/** Reveal the original without changing the size or alignment of either photo. */
export function BeforeAfterPhoto({ before, after, aspectRatio, label }: Props) {
  const [split, setSplit] = useState(44);
  const [width, setWidth] = useState(0);
  const [focused, setFocused] = useState(false);
  const pan = useMemo(() => {
    return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => width > 0 && Math.abs(gesture.dx) > 6 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderGrant: event => setSplit(clamp(event.nativeEvent.locationX / width * 100)),
    onPanResponderMove: event => setSplit(clamp(event.nativeEvent.locationX / width * 100)),
    onPanResponderTerminationRequest: () => true,
    });
  }, [width]);
  const valueText = `${Math.round(split)} % de la photo originale`;

  return <View style={[s.frame, { aspectRatio }]} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <Image source={after} style={s.image} resizeMode="cover" accessible={false}/>
    <View pointerEvents="none" style={[s.original, { width: `${split}%` }]}>
      {width > 0 && <Image source={before} style={{ width, height: width / aspectRatio }} resizeMode="cover" accessible={false}/>}
    </View>
    <View pointerEvents="none" style={s.labels} accessible={false}><Text style={s.label}>Avant</Text><Text style={s.label}>Après</Text></View>
    <View pointerEvents="none" style={[s.divider, { left: `${split}%` }]}><View style={s.handle}><Text style={s.arrows}>‹  ›</Text></View></View>
    {Platform.OS === 'web' ? <input type="range" min={0} max={100} value={split} aria-label={label} aria-valuetext={valueText}
      onChange={event => setSplit(Number(event.target.value))} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', margin: 0, opacity: 0, cursor: 'ew-resize', touchAction: 'pan-y' }}/>
      : <View {...pan.panHandlers} style={StyleSheet.absoluteFill} accessible accessibilityRole="adjustable" accessibilityLabel={label}
        accessibilityHint="Faites glisser horizontalement pour comparer la photo originale et la proposition."
        accessibilityValue={{ min: 0, max: 100, now: Math.round(split), text: valueText }}
        accessibilityActions={[{ name: 'increment', label: 'Voir davantage l’original' }, { name: 'decrement', label: 'Voir davantage la proposition' }]}
        onAccessibilityAction={event => {
          const action = event.nativeEvent.actionName;
          if (action === 'increment' || action === 'decrement') setSplit(value => clamp(value + (action === 'increment' ? 5 : -5)));
        }}/>
    }
    {focused && <View pointerEvents="none" style={s.focus}/>}
  </View>;
}

const s = StyleSheet.create({
  frame: { width: '100%', position: 'relative', overflow: 'hidden', borderRadius: 16, backgroundColor: '#e1ded3' },
  image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  original: { position: 'absolute', top: 0, bottom: 0, left: 0, overflow: 'hidden' },
  labels: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  label: { backgroundColor: '#fffef5ed', color: '#48543c', paddingVertical: 6, paddingHorizontal: 10, fontSize: 11, borderRadius: 5, overflow: 'hidden' },
  divider: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#fffef6' },
  handle: { position: 'absolute', top: '50%', left: -21, marginTop: -22, width: 44, height: 44, borderRadius: 22, backgroundColor: '#fffef6', justifyContent: 'center', alignItems: 'center' },
  arrows: { fontSize: 24, color: '#69745d', lineHeight: 28 },
  focus: { position: 'absolute', inset: 0, borderRadius: 16, borderWidth: 3, borderColor: '#a18849' },
});

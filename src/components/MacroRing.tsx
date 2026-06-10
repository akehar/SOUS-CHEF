import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors } from '../theme';
import { Macros } from '../types';

// Concentric macro rings — calories number in the center, protein/carbs/fat
// as nested arcs. `targets` (optional) scales each ring as % of daily goal.
export function MacroRing({ macros, targets, size = 132 }: {
  macros: Macros;
  targets?: Macros;
  size?: number;
}) {
  const stroke = 9;
  const gap = 4;
  const center = size / 2;

  const rings = [
    { value: macros.protein, target: targets?.protein ?? macros.protein * 1.6, color: colors.protein },
    { value: macros.carbs, target: targets?.carbs ?? macros.carbs * 1.6, color: colors.carbs },
    { value: macros.fat, target: targets?.fat ?? macros.fat * 1.6, color: colors.fat },
  ];

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {rings.map((ring, i) => {
          const r = center - stroke / 2 - i * (stroke + gap);
          const circumference = 2 * Math.PI * r;
          const fraction = Math.min(ring.value / Math.max(ring.target, 1), 1);
          return (
            <React.Fragment key={i}>
              <Circle
                cx={center} cy={center} r={r}
                stroke={colors.border} strokeWidth={stroke} fill="none" opacity={0.5}
              />
              <Circle
                cx={center} cy={center} r={r}
                stroke={ring.color} strokeWidth={stroke} fill="none"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={circumference * (1 - fraction)}
                transform={`rotate(-90 ${center} ${center})`}
              />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={styles.centerLabel}>
        <Text style={styles.kcal}>{macros.calories}</Text>
        <Text style={styles.kcalUnit}>kcal</Text>
      </View>
    </View>
  );
}

export function MacroLegend({ macros }: { macros: Macros }) {
  const rows = [
    { label: 'Protein', value: `${macros.protein}g`, color: colors.protein },
    { label: 'Carbs', value: `${macros.carbs}g`, color: colors.carbs },
    { label: 'Fat', value: `${macros.fat}g`, color: colors.fat },
  ];
  return (
    <View style={{ gap: 8 }}>
      {rows.map((r) => (
        <View key={r.label} style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: r.color }]} />
          <Text style={styles.legendLabel}>{r.label}</Text>
          <Text style={styles.legendValue}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  centerLabel: { position: 'absolute', alignItems: 'center' },
  kcal: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  kcalUnit: { color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: -2 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: colors.textSecondary, fontSize: 13.5, flex: 1 },
  legendValue: { color: colors.text, fontSize: 13.5, fontWeight: '700' },
});

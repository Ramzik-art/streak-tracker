import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  completed: Record<string, boolean>;
  notes: Record<string, string[]>;
  bestStreak: number;
};

function toKey(y: number, m: number, d: number): string {
  return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
}

function calcStreak(completed: Record<string, boolean>): number {
  let streak = 0;
  const cur = new Date();
  const tKey = toKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
  if (!completed[tKey]) cur.setDate(cur.getDate() - 1);
  while (true) {
    const k = toKey(cur.getFullYear(), cur.getMonth(), cur.getDate());
    if (!completed[k]) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

export default function StatsScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem('habit-grid-v3');
        if (raw) {
          const data = JSON.parse(raw);
          setHabits(data.habits || []);
        }
      } catch (e) {}
    }
  }, []);

  const bg = isDark ? '#0a0a0c' : '#fafafa';
  const card = isDark ? '#16161a' : '#ffffff';
  const text = isDark ? '#f7f7f9' : '#18181b';
  const muted = '#71717a';
  const border = isDark ? '#27272a' : '#e4e4e7';

  let totalMarks = 0;
  let bestStreak = 0;
  let bestName = '—';
  let totalNotes = 0;

  habits.forEach((h) => {
    const marks = Object.keys(h.completed || {}).length;
    totalMarks += marks;
    const notes = Object.values(h.notes || {}).reduce((a, b) => a + b.length, 0);
    totalNotes += notes;
    const st = Math.max(calcStreak(h.completed || {}), h.bestStreak || 0);
    if (st > bestStreak) {
      bestStreak = st;
      bestName = h.emoji + ' ' + h.name;
    }
  });

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={[s.backText, { color: text }]}>‹</Text>
          </Pressable>
          <Text style={[s.title, { color: text }]}>Статистика</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={[s.bigCard, { backgroundColor: card, borderColor: border }]}>
            <Text style={s.bigEmoji}>🏆</Text>
            <Text style={[s.bigTitle, { color: text }]}>Лучший streak: {bestStreak}</Text>
            <Text style={[s.bigText, { color: muted }]}>{bestName}</Text>
          </View>

          <View style={[s.row, { backgroundColor: card, borderColor: border }]}>
            <Text style={[s.rowLabel, { color: muted }]}>Всего привычек</Text>
            <Text style={[s.rowValue, { color: text }]}>{habits.length}</Text>
          </View>

          <View style={[s.row, { backgroundColor: card, borderColor: border }]}>
            <Text style={[s.rowLabel, { color: muted }]}>Всего отметок</Text>
            <Text style={[s.rowValue, { color: text }]}>{totalMarks}</Text>
          </View>

          <View style={[s.row, { backgroundColor: card, borderColor: border }]}>
            <Text style={[s.rowLabel, { color: muted }]}>Записей в дневнике</Text>
            <Text style={[s.rowValue, { color: text }]}>{totalNotes}</Text>
          </View>

          {habits.length > 0 && (
            <View style={s.sectionWrap}>
              <Text style={[s.section, { color: muted }]}>По привычкам</Text>
              {habits.map((h) => {
                const marks = Object.keys(h.completed || {}).length;
                const st = Math.max(calcStreak(h.completed || {}), h.bestStreak || 0);
                return (
                  <View key={h.id} style={[s.row, { backgroundColor: card, borderColor: border }]}>
                    <Text style={[s.rowLabel, { color: text }]}>
                      {h.emoji} {h.name}
                    </Text>
                    <Text style={[s.rowValue, { color: h.color || '#10b981' }]}>
                      🔥 {st} · ✓ {marks}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {habits.length === 0 && (
            <Text style={[s.empty, { color: muted }]}>
              Пока нет данных. Добавь привычку в трекере.
            </Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, fontWeight: '300', lineHeight: 34 },
  title: { fontSize: 20, fontWeight: '700' },
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 10,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  bigCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  bigEmoji: { fontSize: 48 },
  bigTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  bigText: { fontSize: 13, textAlign: 'center' },
  sectionWrap: { marginTop: 12, gap: 10 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { fontSize: 14, fontWeight: '500' },
  rowValue: { fontSize: 16, fontWeight: '700' },
  empty: { fontSize: 14, textAlign: 'center', marginTop: 24 },
});
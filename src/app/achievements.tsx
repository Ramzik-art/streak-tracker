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

type Badge = {
  id: string;
  emoji: string;
  label: string;
  color: string;
  check: (habits: Habit[], totalMarks: number, maxStreak: number) => boolean;
};

function calcStreak(completed: Record<string, boolean>): number {
  let streak = 0;
  const cur = new Date();
  const key = (d: Date) =>
    d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  if (!completed[key(cur)]) cur.setDate(cur.getDate() - 1);
  while (true) {
    const k = key(cur);
    if (!completed[k]) break;
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

const BADGES: Badge[] = [
  {
    id: 'first',
    emoji: '🌱',
    label: 'Первая отметка',
    color: '#22c55e',
    check: (_h, marks) => marks >= 1,
  },
  {
    id: 'streak3',
    emoji: '🔥',
    label: '3 дня подряд',
    color: '#f59e0b',
    check: (_h, _m, streak) => streak >= 3,
  },
  {
    id: 'streak7',
    emoji: '⚡',
    label: '7 дней подряд',
    color: '#eab308',
    check: (_h, _m, streak) => streak >= 7,
  },
  {
    id: 'streak30',
    emoji: '💎',
    label: '30 дней подряд',
    color: '#3b82f6',
    check: (_h, _m, streak) => streak >= 30,
  },
  {
    id: 'streak100',
    emoji: '👑',
    label: '100 дней подряд',
    color: '#a855f7',
    check: (_h, _m, streak) => streak >= 100,
  },
  {
    id: 'marks50',
    emoji: '🚀',
    label: '50 отметок',
    color: '#ec4899',
    check: (_h, marks) => marks >= 50,
  },
  {
    id: 'marks100',
    emoji: '🏅',
    label: '100 отметок',
    color: '#ef4444',
    check: (_h, marks) => marks >= 100,
  },
  {
    id: 'habits3',
    emoji: '🧠',
    label: '3 привычки',
    color: '#06b6d4',
    check: (habits) => habits.length >= 3,
  },
  {
    id: 'notes5',
    emoji: '✍️',
    label: '5 записей',
    color: '#8b5cf6',
    check: (habits) => {
      let total = 0;
      habits.forEach((h) => {
        total += Object.values(h.notes || {}).reduce((a, b) => a + b.length, 0);
      });
      return total >= 5;
    },
  },
];

export default function AchievementsScreen() {
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
  let maxStreak = 0;
  habits.forEach((h) => {
    totalMarks += Object.keys(h.completed || {}).length;
    const st = Math.max(calcStreak(h.completed || {}), h.bestStreak || 0);
    if (st > maxStreak) maxStreak = st;
  });

  const unlocked = BADGES.filter((b) => b.check(habits, totalMarks, maxStreak)).length;
  const progress = Math.round((unlocked / BADGES.length) * 100);

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={[s.backText, { color: text }]}>‹</Text>
          </Pressable>
          <Text style={[s.title, { color: text }]}>Достижения</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={[s.heroCard, { backgroundColor: card, borderColor: border }]}>
            <Text style={s.heroEmoji}>🏆</Text>
            <Text style={[s.heroTitle, { color: text }]}>
              Открыто {unlocked} из {BADGES.length}
            </Text>
            <Text style={[s.heroText, { color: muted }]}>
              Прогресс: {progress}%
            </Text>
            <View style={[s.progressBar, { backgroundColor: border }]}>
              <View style={[s.progressFill, { width: `${progress}%` as any }]} />
            </View>
          </View>

          <Text style={[s.section, { color: muted }]}>Все награды</Text>

          <View style={s.grid}>
            {BADGES.map((b) => {
              const isUnlocked = b.check(habits, totalMarks, maxStreak);
              return (
                <View
                  key={b.id}
                  style={[
                    s.badge,
                    {
                      backgroundColor: card,
                      borderColor: isUnlocked ? b.color : border,
                    },
                  ]}>
                  <View
                    style={[
                      s.badgeCircle,
                      { backgroundColor: isUnlocked ? b.color + '22' : border },
                    ]}>
                    <Text style={[s.badgeEmoji, !isUnlocked && s.lockedEmoji]}>
                      {isUnlocked ? b.emoji : '🔒'}
                    </Text>
                  </View>
                  <Text
                    style={[
                      s.badgeLabel,
                      { color: isUnlocked ? text : muted },
                    ]}
                    numberOfLines={2}>
                    {b.label}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[s.footer, { color: muted }]}>
            Продолжай отмечать дни — открывай новые бейджи
          </Text>
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
    gap: 14,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  heroCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  heroText: { fontSize: 13 },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 999,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  badgeCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: { fontSize: 22 },
  lockedEmoji: { fontSize: 16, opacity: 0.6 },
  badgeLabel: { fontSize: 10, textAlign: 'center', fontWeight: '600' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
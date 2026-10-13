import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  notes: Record<string, string[]>;
};

type Entry = {
  dateKey: string;
  habitId: string;
  habitName: string;
  habitEmoji: string;
  habitColor: string;
  text: string;
  noteIndex: number;
};

const STORAGE_KEY = 'habit-grid-v3';

function formatDate(key: string): string {
  const parts = key.split('-');
  const y = parts[0];
  const m = parts[1];
  const d = parts[2];
  const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
}

export default function DiaryScreen() {
  const router = useRouter();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = () => {
    if (Platform.OS !== 'web') {
      setLoaded(true);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setEntries([]);
        setLoaded(true);
        return;
      }
      const data = JSON.parse(raw);
      const habits: Habit[] = data.habits || [];
      const list: Entry[] = [];

      habits.forEach((h) => {
        const notes = h.notes || {};
        Object.keys(notes).forEach((dateKey) => {
          const arr = notes[dateKey] || [];
          arr.forEach((text, i) => {
            list.push({
              dateKey,
              habitId: h.id,
              habitName: h.name,
              habitEmoji: h.emoji,
              habitColor: h.color,
              text,
              noteIndex: i,
            });
          });
        });
      });

      list.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
      setEntries(list);
    } catch (e) {
      setEntries([]);
    }
    setLoaded(true);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteEntry = (entry: Entry) => {
    if (Platform.OS !== 'web') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      const habits: Habit[] = data.habits || [];
      const updated = habits.map((h) => {
        if (h.id !== entry.habitId) return h;
        const notes = { ...(h.notes || {}) };
        const arr = notes[entry.dateKey] ? [...notes[entry.dateKey]] : [];
        arr.splice(entry.noteIndex, 1);
        if (arr.length === 0) delete notes[entry.dateKey];
        else notes[entry.dateKey] = arr;
        return { ...h, notes };
      });
      data.habits = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      load();
    } catch (e) {}
  };

  const bg = isDark ? '#0a0a0c' : '#fafafa';
  const card = isDark ? '#16161a' : '#ffffff';
  const text = isDark ? '#f7f7f9' : '#18181b';
  const muted = '#71717a';
  const border = isDark ? '#27272a' : '#e4e4e7';

  return (
    <View style={[s.root, { backgroundColor: bg }]}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={[s.backText, { color: text }]}>‹</Text>
          </Pressable>
          <Text style={[s.title, { color: text }]}>Дневник</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          {loaded && entries.length === 0 && (
            <View style={[s.empty, { backgroundColor: card, borderColor: border }]}>
              <Text style={s.emptyEmoji}>📔</Text>
              <Text style={[s.emptyTitle, { color: text }]}>Пока нет записей</Text>
              <Text style={[s.emptyText, { color: muted }]}>
                Записывай мысли в трекере — они появятся здесь
              </Text>
            </View>
          )}

          {entries.map((e, i) => (
            <Pressable
              key={e.habitId + e.dateKey + i}
              onLongPress={() => deleteEntry(e)}
              style={[s.entry, { backgroundColor: card, borderColor: border }]}>
              <View style={s.entryHeader}>
                <View style={[s.emojiBadge, { backgroundColor: e.habitColor + '22' }]}>
                  <Text style={s.emojiText}>{e.habitEmoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.entryHabit, { color: text }]}>{e.habitName}</Text>
                  <Text style={[s.entryDate, { color: muted }]}>{formatDate(e.dateKey)}</Text>
                </View>
              </View>
              <Text style={[s.entryText, { color: text }]}>{e.text}</Text>
            </Pressable>
          ))}

          {entries.length > 0 && (
            <Text style={[s.hint, { color: muted }]}>
              Долгий тап на записи — удалить
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
  empty: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 8,
    marginTop: 40,
  },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  entry: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 18 },
  entryHabit: { fontSize: 14, fontWeight: '700' },
  entryDate: { fontSize: 12, marginTop: 1 },
  entryText: { fontSize: 15, lineHeight: 21 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 8 },
});
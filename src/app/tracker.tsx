import { useTheme } from '@/theme';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const STORAGE_KEY = 'habit-grid-v3';
const SETTINGS_KEY = 'habit-grid-settings';

function toKey(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try { return localStorage.getItem(key); } catch { return null; }
    }
    return null;
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      try { localStorage.setItem(key, value); } catch {}
    }
  },
};

type Habit = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  completed: Record<string, boolean>;
  notes: Record<string, string[]>;
  bestStreak: number;
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7', '#ec4899'];
const EMOJIS = ['🎯', '💪', '📚', '🧘', '💧', '🏃', '🌱', '🎨', '🚭', '🔥'];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultHabit(): Habit {
  return {
    id: makeId(),
    name: 'Новая привычка',
    emoji: '🎯',
    color: COLORS[0],
    completed: {},
    notes: {},
    bestStreak: 0,
  };
}

function calculateStreak(completed: Record<string, boolean>): number {
  let streak = 0;
  const cursor = new Date();
  const todayKey = toKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
  if (!completed[todayKey]) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const k = toKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    if (!completed[k]) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

type GridCellProps = {
  day: number;
  isDone: boolean;
  isToday: boolean;
  isFuture: boolean;
  color: string;
  onPress: () => void;
  onLongPress: () => void;
  hasNote: boolean;
  textColor: string;
  borderColor: string;
  size: number;
};

function GridCell({ day, isDone, isToday, isFuture, color, onPress, onLongPress, hasNote, textColor, borderColor, size }: GridCellProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => Animated.spring(scale, { toValue: 0.9, useNativeDriver: true, speed: 40 }).start();
  const handlePressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 12 }).start();

  return (
    <View style={{ width: size, height: size, padding: 2 }}>
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isFuture}
        style={{ flex: 1 }}>
        <Animated.View
          style={[
            s.cell,
            {
              backgroundColor: isDone ? color : 'transparent',
              borderColor: isToday ? color : borderColor,
              opacity: isFuture ? 0.35 : 1,
              transform: [{ scale }],
            },
          ]}>
          <Text style={[s.cellText, { color: isDone ? '#fff' : textColor }]}>{day}</Text>
          {hasNote && <View style={s.noteDot} />}
        </Animated.View>
      </Pressable>
    </View>
  );
}

export default function TrackerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const today = new Date();

  const [habits, setHabits] = useState<Habit[]>([defaultHabit()]);
  const [activeId, setActiveId] = useState<string>('');
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [loaded, setLoaded] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [noteDate, setNoteDate] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState(EMOJIS[0]);
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const confettiRef = useRef<any>(null);
  const [celebratedStreak, setCelebratedStreak] = useState<number>(0);

  // Крупнее: меньше отступов по краям и между клетками
  const containerWidth = Math.min(width, 520) - 20;
  const cellSize = (containerWidth - 6 * 4) / 7;

  useEffect(() => {
    (async () => {
      const raw = await storage.get(STORAGE_KEY);
      if (raw) {
        try {
          const data = JSON.parse(raw);
          if (Array.isArray(data.habits) && data.habits.length > 0) {
            const migrated = data.habits.map((h: any) => ({
              ...h,
              notes: h.notes ?? {},
              bestStreak: h.bestStreak ?? 0,
            }));
            setHabits(migrated);
            setActiveId(data.activeId || migrated[0].id);
          } else {
            const h = defaultHabit();
            setHabits([h]);
            setActiveId(h.id);
          }
        } catch {
          const h = defaultHabit();
          setHabits([h]);
          setActiveId(h.id);
        }
      } else {
        const h = defaultHabit();
        setHabits([h]);
        setActiveId(h.id);
      }

      const sRaw = await storage.get(SETTINGS_KEY);
      if (sRaw) {
        try {
          const sData = JSON.parse(sRaw);
          if (typeof sData.haptics === 'boolean') setHapticsEnabled(sData.haptics);
        } catch {}
      }

      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    storage.set(STORAGE_KEY, JSON.stringify({ habits, activeId }));
  }, [habits, activeId, loaded]);

  const activeHabit = habits.find((h) => h.id === activeId) ?? habits[0];

  const days = useMemo(() => {
    const { year, month } = cursor;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const weekday = (date.getDay() + 6) % 7;
      const isCurrentMonth = month === today.getMonth() && year === today.getFullYear();
      result.push({
        day: d,
        key: toKey(year, month, d),
        weekday,
        isToday: isCurrentMonth && d === today.getDate(),
        isFuture: date > today,
      });
    }
    return result;
  }, [cursor]);

  const firstWeekday = days[0]?.weekday ?? 0;

  const stats = useMemo(() => {
    if (!activeHabit) return { done: 0, total: 0, percent: 0, streak: 0 };
    const past = days.filter((d) => !d.isFuture);
    const done = past.filter((d) => activeHabit.completed[d.key]).length;
    const total = past.length;
    const percent = total === 0 ? 0 : Math.round((done / total) * 100);
    const streak = calculateStreak(activeHabit.completed);
    return { done, total, percent, streak };
  }, [days, activeHabit]);

  useEffect(() => {
    if (!activeHabit) return;
    if (stats.streak > (activeHabit.bestStreak ?? 0)) {
      setHabits((prev) => prev.map((h) => h.id === activeHabit.id ? { ...h, bestStreak: stats.streak } : h));
    }
  }, [stats.streak, activeHabit]);

  useEffect(() => {
    const milestones = [7, 30, 100];
    if (milestones.includes(stats.streak) && stats.streak !== celebratedStreak) {
      setCelebratedStreak(stats.streak);
      confettiRef.current?.start();
    }
  }, [stats.streak, celebratedStreak]);

  const tapFeedback = () => {
    if (!hapticsEnabled) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {}
  };

  const toggleDay = (key: string, isFuture: boolean) => {
    if (isFuture || !activeHabit) return;
    tapFeedback();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== activeHabit.id) return h;
        const next = { ...h.completed };
        if (next[key]) delete next[key];
        else next[key] = true;
        return { ...h, completed: next };
      })
    );
  };

  const todayKey = toKey(today.getFullYear(), today.getMonth(), today.getDate());
  const todayDone = !!activeHabit?.completed[todayKey];

  const markToday = () => {
    if (!activeHabit) return;
    toggleDay(todayKey, false);
  };

  const changeMonth = (delta: number) => {
    tapFeedback();
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const addHabit = () => {
    const h: Habit = {
      id: makeId(),
      name: newName.trim() || 'Новая привычка',
      emoji: newEmoji,
      color: newColor,
      completed: {},
      notes: {},
      bestStreak: 0,
    };
    setHabits((prev) => [...prev, h]);
    setActiveId(h.id);
    setNewName('');
    setNewEmoji(EMOJIS[0]);
    setNewColor(COLORS[0]);
    setShowAdd(false);
  };

  const removeHabit = (id: string) => {
    setHabits((prev) => {
      const next = prev.filter((h) => h.id !== id);
      if (next.length === 0) {
        const h = defaultHabit();
        setActiveId(h.id);
        return [h];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  };

  const saveNote = () => {
    if (!noteDate || !activeHabit) return;
    const trimmed = noteText.trim();
    if (!trimmed) {
      setNoteDate(null);
      setNoteText('');
      return;
    }
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== activeHabit.id) return h;
        const notes = { ...h.notes };
        const list = notes[noteDate] ? [...notes[noteDate]] : [];
        list.push(trimmed);
        notes[noteDate] = list;
        return { ...h, notes };
      })
    );
    setNoteDate(null);
    setNoteText('');
  };

  const openNoteModal = (key: string, isFuture: boolean) => {
    if (isFuture) return;
    tapFeedback();
    setNoteDate(key);
    setNoteText('');
  };

  const deleteNote = (dateKey: string, index: number) => {
    if (!activeHabit) return;
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== activeHabit.id) return h;
        const notes = { ...h.notes };
        const list = notes[dateKey] ? [...notes[dateKey]] : [];
        list.splice(index, 1);
        if (list.length === 0) delete notes[dateKey];
        else notes[dateKey] = list;
        return { ...h, notes };
      })
    );
  };

  if (!loaded || !activeHabit) {
    return <View style={[s.root, { backgroundColor: colors.bg }]} />;
  }

  const currentNotes = noteDate ? (activeHabit.notes[noteDate] ?? []) : [];

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={[s.backArrow, { color: colors.text }]}>‹</Text>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.habitBar}>
            {habits.map((h) => {
              const active = h.id === activeHabit.id;
              return (
                <View
                  key={h.id}
                  style={[s.habitChip, {
                    backgroundColor: active ? h.color : colors.card,
                    borderColor: active ? h.color : colors.border,
                  }]}>
                  <Pressable onPress={() => setActiveId(h.id)} style={s.habitChipMain}>
                    <Text style={s.habitEmoji}>{h.emoji}</Text>
                    <Text style={[s.habitChipText, { color: active ? '#fff' : colors.text }]} numberOfLines={1}>
                      {h.name}
                    </Text>
                  </Pressable>
                  {active && habits.length > 1 && (
                    <Pressable onPress={() => setConfirmDelete(h.id)} hitSlop={8} style={s.deleteBtn}>
                      <Text style={s.deleteBtnText}>×</Text>
                    </Pressable>
                  )}
                </View>
              );
            })}
            <Pressable onPress={() => setShowAdd(true)} style={[s.habitChip, s.addChip, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[s.addChipText, { color: colors.text }]}>+</Text>
            </Pressable>
          </ScrollView>

          <View style={s.monthRow}>
            <Pressable onPress={() => changeMonth(-1)} style={s.arrowBtn}>
              <Text style={[s.arrowText, { color: colors.text }]}>‹</Text>
            </Pressable>
            <View style={{ alignItems: 'center' }}>
              <Text style={[s.title, { color: colors.text }]}>{MONTHS[cursor.month]} {cursor.year}</Text>
              <Text style={[s.subtitle, { color: colors.muted }]}>{activeHabit.emoji} {activeHabit.name}</Text>
            </View>
            <Pressable onPress={() => changeMonth(1)} style={s.arrowBtn}>
              <Text style={[s.arrowText, { color: colors.text }]}>›</Text>
            </Pressable>
          </View>

          <View style={[s.streakCard, { backgroundColor: activeHabit.color + '15', borderColor: activeHabit.color + '40' }]}>
            <View style={[s.ringOuter, { borderColor: colors.border }]}>
              <View style={[s.ringInner, { borderTopColor: activeHabit.color, borderRightColor: stats.percent > 25 ? activeHabit.color : 'transparent', borderBottomColor: stats.percent > 50 ? activeHabit.color : 'transparent', borderLeftColor: stats.percent > 75 ? activeHabit.color : 'transparent' }]} />
              <Text style={[s.ringText, { color: activeHabit.color }]}>{stats.percent}%</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                <Text style={[s.streakNumber, { color: colors.text }]}>{stats.streak}</Text>
                <Text style={[s.streakLabel, { color: colors.muted }]}>
                  {stats.streak === 1 ? 'день' : stats.streak >= 2 && stats.streak <= 4 ? 'дня' : 'дней'} подряд
                </Text>
              </View>
              <Text style={[s.recordText, { color: colors.muted }]}>🏆 Рекорд: {activeHabit.bestStreak ?? 0}</Text>
            </View>
          </View>

          <View style={[s.progressCard, { backgroundColor: colors.card }]}>
            <View style={s.progressRow}>
              <Text style={[s.progressText, { color: colors.text }]}>{stats.done} / {stats.total} дней</Text>
              <Text style={[s.progressPercent, { color: activeHabit.color }]}>{stats.percent}%</Text>
            </View>
            <View style={[s.progressBar, { backgroundColor: colors.border }]}>
              <View style={[s.progressFill, { backgroundColor: activeHabit.color, width: `${stats.percent}%` as any }]} />
            </View>
          </View>

          <View style={s.grid}>
            {WEEKDAYS.map((d) => (
              <View key={d} style={{ width: cellSize, alignItems: 'center', paddingVertical: 6 }}>
                <Text style={[s.weekdayText, { color: colors.muted }]}>{d}</Text>
              </View>
            ))}
            {Array.from({ length: firstWeekday }).map((_, i) => (
              <View key={`e-${i}`} style={{ width: cellSize, height: cellSize }} />
            ))}
            {days.map((d) => (
              <GridCell
                key={d.key}
                day={d.day}
                isDone={!!activeHabit.completed[d.key]}
                isToday={d.isToday}
                isFuture={d.isFuture}
                color={activeHabit.color}
                hasNote={(activeHabit.notes[d.key]?.length ?? 0) > 0}
                onPress={() => toggleDay(d.key, d.isFuture)}
                onLongPress={() => openNoteModal(d.key, d.isFuture)}
                textColor={colors.text}
                borderColor={colors.border}
                size={cellSize}
              />
            ))}
          </View>

          <Pressable
            onPress={markToday}
            style={({ pressed }) => [
              s.markBtn,
              { backgroundColor: todayDone ? 'transparent' : activeHabit.color, borderColor: activeHabit.color },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}>
            <Text style={[s.markBtnText, { color: todayDone ? activeHabit.color : '#fff' }]}>
              {todayDone ? '↩ Снять отметку сегодня' : '✓ Отметить сегодня'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => openNoteModal(todayKey, false)}
            style={[s.actionBtn, { borderColor: colors.border, backgroundColor: colors.card }]}>
            <Text style={[s.actionBtnText, { color: colors.text }]}>💭 Записать мысль за сегодня</Text>
          </Pressable>

          <Text style={[s.hint, { color: colors.muted }]}>
            Клик — отметить · Долгий тап на дне — заметки
          </Text>
        </ScrollView>

        <Modal visible={showAdd} transparent animationType="fade" onRequestClose={() => setShowAdd(false)}>
          <Pressable style={[s.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setShowAdd(false)}>
            <Pressable style={[s.modal, { backgroundColor: colors.bg }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Новая привычка</Text>
              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Название"
                placeholderTextColor={colors.muted}
                style={[s.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                autoFocus
              />
              <Text style={[s.label, { color: colors.muted }]}>Иконка</Text>
              <View style={s.row}>
                {EMOJIS.map((e) => (
                  <Pressable key={e} onPress={() => setNewEmoji(e)} style={[
                    s.emojiBtn,
                    { backgroundColor: newEmoji === e ? colors.card : 'transparent', borderColor: newEmoji === e ? colors.text : colors.border },
                  ]}>
                    <Text style={s.emojiText}>{e}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[s.label, { color: colors.muted }]}>Цвет</Text>
              <View style={s.row}>
                {COLORS.map((c) => (
                  <Pressable key={c} onPress={() => setNewColor(c)} style={[
                    s.colorBtn,
                    { backgroundColor: c, borderWidth: newColor === c ? 3 : 0, borderColor: colors.text },
                  ]} />
                ))}
              </View>
              <View style={s.modalActions}>
                <Pressable onPress={() => setShowAdd(false)} style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[s.btnText, { color: colors.text }]}>Отмена</Text>
                </Pressable>
                <Pressable onPress={addHabit} style={[s.btn, { backgroundColor: newColor }]}>
                  <Text style={[s.btnText, { color: '#fff' }]}>Добавить</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={confirmDelete !== null} transparent animationType="fade" onRequestClose={() => setConfirmDelete(null)}>
          <Pressable style={[s.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setConfirmDelete(null)}>
            <Pressable style={[s.modal, { backgroundColor: colors.bg }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Удалить привычку?</Text>
              <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
                Вся история и заметки будут удалены. Это нельзя отменить.
              </Text>
              <View style={s.modalActions}>
                <Pressable onPress={() => setConfirmDelete(null)} style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[s.btnText, { color: colors.text }]}>Отмена</Text>
                </Pressable>
                <Pressable
                  onPress={() => { if (confirmDelete) removeHabit(confirmDelete); setConfirmDelete(null); }}
                  style={[s.btn, { backgroundColor: '#ef4444' }]}>
                  <Text style={[s.btnText, { color: '#fff' }]}>Удалить</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <Modal visible={noteDate !== null} transparent animationType="fade" onRequestClose={() => setNoteDate(null)}>
          <Pressable style={[s.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setNoteDate(null)}>
            <Pressable style={[s.modal, { backgroundColor: colors.bg }]} onPress={(e) => e.stopPropagation()}>
              <Text style={[s.modalTitle, { color: colors.text }]}>Заметки · {noteDate}</Text>

              {currentNotes.length > 0 && (
                <View style={{ gap: 8 }}>
                  {currentNotes.map((n, i) => (
                    <Pressable
                      key={i}
                      onLongPress={() => deleteNote(noteDate!, i)}
                      style={[s.noteItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontSize: 14 }}>{n}</Text>
                    </Pressable>
                  ))}
                </View>
              )}

              <TextInput
                value={noteText}
                onChangeText={setNoteText}
                placeholder="Что было сегодня?"
                placeholderTextColor={colors.muted}
                multiline
                style={[s.input, s.textarea, { color: colors.text, borderColor: colors.border, backgroundColor: colors.card }]}
                autoFocus
              />

              <View style={s.modalActions}>
                <Pressable onPress={() => setNoteDate(null)} style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[s.btnText, { color: colors.text }]}>Закрыть</Text>
                </Pressable>
                <Pressable onPress={saveNote} style={[s.btn, { backgroundColor: activeHabit.color }]}>
                  <Text style={[s.btnText, { color: '#fff' }]}>Сохранить</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        <ConfettiCannon
          ref={confettiRef}
          count={120}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut
          colors={[activeHabit.color, '#f59e0b', '#3b82f6', '#ec4899']}
        />
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 40,
    gap: 16,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 4, marginLeft: 8 },
  backArrow: { fontSize: 32, fontWeight: '300', lineHeight: 34 },
  habitBar: { gap: 8, paddingVertical: 4, paddingHorizontal: 8 },
  habitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 200,
    gap: 6,
  },
  habitChipMain: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  habitEmoji: { fontSize: 16 },
  habitChipText: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  addChip: { paddingHorizontal: 16 },
  addChipText: { fontSize: 20, fontWeight: '600' },
  deleteBtn: { paddingHorizontal: 4, marginLeft: 2 },
  deleteBtnText: { color: '#fff', fontSize: 20, fontWeight: '600', lineHeight: 20 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  arrowBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 32, fontWeight: '300', lineHeight: 34 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 2 },
  streakCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
  ringOuter: { width: 80, height: 80, borderRadius: 40, borderWidth: 6, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  ringInner: { position: 'absolute', width: 68, height: 68, borderRadius: 34, borderWidth: 6, borderColor: 'transparent', transform: [{ rotate: '-45deg' }] },
  ringText: { fontSize: 16, fontWeight: '800' },
  streakNumber: { fontSize: 26, fontWeight: '800' },
  streakLabel: { fontSize: 13 },
  recordText: { fontSize: 12 },
  progressCard: { borderRadius: 16, padding: 16, gap: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progressText: { fontSize: 15, fontWeight: '500' },
  progressPercent: { fontSize: 15, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 999, overflow: 'hidden' },
  progressFill: { height: '100%' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  weekdayText: { fontSize: 12, fontWeight: '600' },
  cell: { flex: 1, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  cellText: { fontSize: 15, fontWeight: '600' },
  noteDot: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#fbbf24' },
  markBtn: { borderRadius: 16, borderWidth: 2, paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  markBtnText: { fontSize: 16, fontWeight: '700' },
  actionBtn: { borderRadius: 14, borderWidth: 1, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 420, borderRadius: 20, padding: 20, gap: 12 },
  modalTitle: { fontSize: 20, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },
  colorBtn: { width: 36, height: 36, borderRadius: 18 },
  noteItem: { borderWidth: 1, borderRadius: 10, padding: 10 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  btnText: { fontSize: 15, fontWeight: '600' },
});
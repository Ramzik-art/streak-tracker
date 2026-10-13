import { useTheme } from '@/theme';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SETTINGS_KEY = 'habit-grid-settings';

type Settings = {
  notifications: boolean;
  haptics: boolean;
  sound: boolean;
};

const DEFAULTS: Settings = {
  notifications: false,
  haptics: true,
  sound: false,
};

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, mode, setMode } = useTheme();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch (e) {}
    }
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch (e) {}
    }
  };

  const resetAll = () => {
    if (Platform.OS === 'web') {
      try {
        localStorage.removeItem('habit-grid-v3');
        localStorage.removeItem(SETTINGS_KEY);
      } catch (e) {}
    }
    setConfirmReset(false);
    router.back();
  };

  const themeOptions: { key: 'system' | 'light' | 'dark'; label: string; emoji: string }[] = [
    { key: 'system', label: 'Системная', emoji: '📱' },
    { key: 'light', label: 'Светлая', emoji: '☀️' },
    { key: 'dark', label: 'Тёмная', emoji: '🌙' },
  ];

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={[s.backText, { color: colors.text }]}>‹</Text>
          </Pressable>
          <Text style={[s.title, { color: colors.text }]}>Настройки</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <Text style={[s.section, { color: colors.muted }]}>Внешний вид</Text>

          <View style={s.themeRow}>
            {themeOptions.map((opt) => {
              const active = mode === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setMode(opt.key)}
                  style={[
                    s.themeBtn,
                    {
                      backgroundColor: active ? colors.card : 'transparent',
                      borderColor: active ? colors.text : colors.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}>
                  <Text style={s.themeEmoji}>{opt.emoji}</Text>
                  <Text style={[s.themeLabel, { color: active ? colors.text : colors.muted }]}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[s.section, { color: colors.muted }]}>Поведение</Text>

          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <Text style={[s.rowLabel, { color: colors.text }]}>Напоминания</Text>
                <Text style={[s.rowHint, { color: colors.muted }]}>Пуш-уведомления вечером</Text>
              </View>
              <Switch
                value={settings.notifications}
                onValueChange={(v) => update({ notifications: v })}
                trackColor={{ false: colors.border, true: '#10b981' }}
                thumbColor="#fff"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.row}>
              <View style={s.rowLeft}>
                <Text style={[s.rowLabel, { color: colors.text }]}>Вибрация</Text>
                <Text style={[s.rowHint, { color: colors.muted }]}>Отклик при отметке</Text>
              </View>
              <Switch
                value={settings.haptics}
                onValueChange={(v) => update({ haptics: v })}
                trackColor={{ false: colors.border, true: '#10b981' }}
                thumbColor="#fff"
              />
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.row}>
              <View style={s.rowLeft}>
                <Text style={[s.rowLabel, { color: colors.text }]}>Звук</Text>
                <Text style={[s.rowHint, { color: colors.muted }]}>При streak-милстоуне</Text>
              </View>
              <Switch
                value={settings.sound}
                onValueChange={(v) => update({ sound: v })}
                trackColor={{ false: colors.border, true: '#10b981' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Text style={[s.section, { color: colors.muted }]}>Данные</Text>

          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <Text style={[s.rowLabel, { color: colors.text }]}>Всего привычек</Text>
                <Text style={[s.rowHint, { color: colors.muted }]}>В текущем хранилище</Text>
              </View>
              <Text style={[s.rowValue, { color: colors.text }]}>{countHabits()}</Text>
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <Pressable style={s.row} onPress={() => setConfirmReset(true)}>
              <View style={s.rowLeft}>
                <Text style={[s.rowLabel, { color: '#ef4444' }]}>Сбросить всё</Text>
                <Text style={[s.rowHint, { color: colors.muted }]}>Удалить все данные безвозвратно</Text>
              </View>
              <Text style={[s.rowValue, { color: colors.muted }]}>›</Text>
            </Pressable>
          </View>

          <Text style={[s.section, { color: colors.muted }]}>О приложении</Text>

          <View style={[s.group, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.row}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Версия</Text>
              <Text style={[s.rowValue, { color: colors.muted }]}>0.3</Text>
            </View>
            <View style={[s.divider, { backgroundColor: colors.border }]} />
            <View style={s.row}>
              <Text style={[s.rowLabel, { color: colors.text }]}>Сделано с</Text>
              <Text style={[s.rowValue, { color: colors.muted }]}>♥ на Expo</Text>
            </View>
          </View>

          {confirmReset && (
            <View style={[s.confirmCard, { backgroundColor: '#ef444415', borderColor: '#ef4444' }]}>
              <Text style={[s.confirmTitle, { color: colors.text }]}>Удалить все данные?</Text>
              <Text style={[s.confirmText, { color: colors.muted }]}>
                Все привычки, отметки и заметки будут удалены. Это нельзя отменить.
              </Text>
              <View style={s.confirmActions}>
                <Pressable
                  onPress={() => setConfirmReset(false)}
                  style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[s.btnText, { color: colors.text }]}>Отмена</Text>
                </Pressable>
                <Pressable
                  onPress={resetAll}
                  style={[s.btn, { backgroundColor: '#ef4444' }]}>
                  <Text style={[s.btnText, { color: '#fff' }]}>Удалить</Text>
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function countHabits(): number {
  if (Platform.OS !== 'web') return 0;
  try {
    const raw = localStorage.getItem('habit-grid-v3');
    if (!raw) return 0;
    const data = JSON.parse(raw);
    return (data.habits || []).length;
  } catch (e) {
    return 0;
  }
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
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  themeRow: { flexDirection: 'row', gap: 8 },
  themeBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
  },
  themeEmoji: { fontSize: 22 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  group: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  rowLeft: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600' },
  rowHint: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 15, fontWeight: '600' },
  divider: { height: 1, marginLeft: 16 },
  confirmCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
    marginTop: 8,
  },
  confirmTitle: { fontSize: 16, fontWeight: '700' },
  confirmText: { fontSize: 13, lineHeight: 18 },
  confirmActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  btnText: { fontSize: 14, fontWeight: '600' },
});
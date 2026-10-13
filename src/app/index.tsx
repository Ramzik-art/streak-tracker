import { useTheme } from '@/theme';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SUPPORT_URL = 'https://pay.cloudtips.ru/p/ef65e1a0';

const MENU = [
  { key: 'tracker', emoji: '🎯', title: 'Трекер', subtitle: 'Отмечай дни', color: '#10b981', route: '/tracker' },
  { key: 'diary', emoji: '📔', title: 'Дневник', subtitle: 'Записи', color: '#8b5cf6', route: '/diary' },
  { key: 'stats', emoji: '📊', title: 'Статистика', subtitle: 'Графики', color: '#3b82f6', route: '/stats' },
  { key: 'achievements', emoji: '🏆', title: 'Достижения', subtitle: 'Награды', color: '#f59e0b', route: '/achievements' },
  { key: 'settings', emoji: '⚙️', title: 'Настройки', subtitle: 'Тема, звук', color: '#a855f7', route: '/settings' },
  { key: 'help', emoji: '💬', title: 'Помощь', subtitle: 'Гайд', color: '#ec4899', route: '/help' },
];

const TIPS = [
  'Не сдавайся в первый час после пробуждения — он формирует весь день.',
  'Прогресс не всегда виден сразу. Продолжай.',
  'Срыв — это не конец. Это данные. Что тебя сорвало?',
  'Маленькое действие сегодня лучше большого плана на завтра.',
  'Дисциплина — это выбор между тем, что хочешь сейчас, и тем, что хочешь больше всего.',
  'Один день — не результат. Сто дней — судьба.',
  'Ты не обязан быть идеальным. Ты обязан не сдаваться.',
  'Твоя энергия — твой ресурс. Куда ты его тратишь?',
  'Держись не ради других. Держись ради себя настоящего.',
  'Лучший день, чтобы начать — сегодня. Второй лучший — завтра.',
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Доброй ночи';
  if (h < 12) return 'Доброе утро';
  if (h < 18) return 'Добрый день';
  return 'Добрый вечер';
}

export default function LobbyScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [tipIndex, setTipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const fadeAnim = useMemo(() => new Animated.Value(0), []);

  // === Пасхалка: 7 тапов по «Streak» ===
  const [tapCount, setTapCount] = useState(0);
  const [showEaster, setShowEaster] = useState(false);
  const tapTimer = useRef<any>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSecretTap = () => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    const next = tapCount + 1;
    if (next >= 7) {
      setTapCount(0);
      setShowEaster(true);
      return;
    }
    setTapCount(next);
    tapTimer.current = setTimeout(() => setTapCount(0), 2000);
  };

  const GAP = 12;
  const containerWidth = Math.min(width, 520) - 40;
  const tileWidth = (containerWidth - GAP) / 2;

  const nextTip = () => setTipIndex((i) => (i + 1) % TIPS.length);

  const openSupport = async () => {
    try {
      await Linking.openURL(SUPPORT_URL);
    } catch {}
  };

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Animated.View style={[s.hero, { opacity: fadeAnim }]}>
            <Text style={[s.greeting, { color: colors.muted }]}>{getGreeting()}</Text>
            <Pressable onPress={handleSecretTap} hitSlop={8}>
              <Text style={[s.heroTitle, { color: colors.text }]}>Streak</Text>
            </Pressable>
            <Text style={[s.heroSubtitle, { color: colors.muted }]}>Маленькие шаги — большие перемены</Text>
          </Animated.View>

          <Pressable onPress={nextTip} style={[s.tipCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={s.tipHeader}>
              <Text style={[s.tipLabel, { color: colors.muted }]}>💡 Совет</Text>
              <Text style={[s.tipHint, { color: colors.muted }]}>нажми для нового</Text>
            </View>
            <Text style={[s.tipText, { color: colors.text }]}>{TIPS[tipIndex]}</Text>
          </Pressable>

          <View style={[s.grid, { gap: GAP }]}>
            {MENU.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route as any)}
                style={({ pressed }) => [
                  s.tile,
                  {
                    width: tileWidth,
                    height: tileWidth * 0.85,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                  pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                ]}>
                <View style={[s.tileIcon, { backgroundColor: item.color + '1f' }]}>
                  <Text style={s.tileEmoji}>{item.emoji}</Text>
                </View>
                <View>
                  <Text style={[s.tileTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[s.tileSubtitle, { color: colors.muted }]} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={openSupport}
            style={({ pressed }) => [
              s.support,
              { borderColor: colors.border },
              pressed && { opacity: 0.7 },
            ]}>
            <Text style={[s.supportText, { color: colors.muted }]}>
              💚 Поддержать разработчика — он школьник
            </Text>
          </Pressable>
        </ScrollView>

        {/* Пасхалка для Миланы */}
        <Modal
          visible={showEaster}
          transparent
          animationType="fade"
          onRequestClose={() => setShowEaster(false)}>
          <Pressable
            style={[s.modalOverlay, { backgroundColor: colors.overlay }]}
            onPress={() => setShowEaster(false)}>
            <Pressable
              style={[s.modalCard, { backgroundColor: colors.bg }]}
              onPress={(e) => e.stopPropagation()}>
              <Text style={s.easterEmoji}>❤️</Text>
              <Text style={[s.easterTitle, { color: colors.text }]}>
                Милана самая лучшая
              </Text>

              <Pressable
                onPress={openSupport}
                style={({ pressed }) => [
                  s.easterSupport,
                  { backgroundColor: '#10b981' },
                  pressed && { opacity: 0.85 },
                ]}>
                <Text style={s.easterSupportText}>💚 Поддержать разработчика</Text>
              </Pressable>

              <Pressable
                onPress={() => setShowEaster(false)}
                style={[s.easterClose, { borderColor: colors.border }]}>
                <Text style={[s.easterCloseText, { color: colors.text }]}>
                  Закрыть
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 24,
    gap: 20,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { gap: 6, alignItems: 'center', paddingVertical: 16 },
  greeting: { fontSize: 13, fontWeight: '500', letterSpacing: 0.3 },
  heroTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6, textAlign: 'center' },
  heroSubtitle: { fontSize: 14, textAlign: 'center', marginTop: 2 },

  tipCard: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  tipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tipLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  tipHint: { fontSize: 11 },
  tipText: { fontSize: 15, lineHeight: 22, fontWeight: '500' },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  tileIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tileEmoji: { fontSize: 26 },
  tileTitle: { fontSize: 17, fontWeight: '700', marginTop: 10 },
  tileSubtitle: { fontSize: 12, marginTop: 2 },

  support: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  supportText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 14,
  },
  easterEmoji: { fontSize: 64 },
  easterTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  easterSupport: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  easterSupportText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  easterClose: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 4,
  },
  easterCloseText: { fontSize: 14, fontWeight: '600' },
});
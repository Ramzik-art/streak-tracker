import { useTheme } from '@/theme';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TG_URL = 'https://t.me/mdmalsdd';
const TG_HANDLE = '@mdmalsdd';

export default function HelpScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const steps = [
    { emoji: '🎯', title: 'Создай привычку', text: 'В трекере нажми «+» и выбери название, иконку и цвет.' },
    { emoji: '✅', title: 'Отмечай дни', text: 'Клик по квадратику — отметить. Повторный — снять.' },
    { emoji: '💭', title: 'Записывай мысли', text: 'Долгий тап на дне — откроются заметки. Пиши, что было.' },
    { emoji: '📔', title: 'Смотри дневник', text: 'Все записи собраны в разделе «Дневник».' },
    { emoji: '🔥', title: 'Держи серию', text: 'Чем больше дней подряд — тем выше streak и награды.' },
    { emoji: '🏆', title: 'Открывай бейджи', text: 'За серии и упорство дают достижения. Проверь раздел.' },
  ];

  const faq = [
    { q: 'Куда сохраняются данные?', a: 'Пока на твоём устройстве. Никакие сервера не используются — всё приватно.' },
    { q: 'Почему streak сбросился?', a: 'Если пропустил день — серия начинается заново. Рекорд при этом сохраняется.' },
    { q: 'Как удалить привычку?', a: 'Выбери её в трекере и нажми «×» справа от названия. Вся история удалится.' },
    { q: 'Как поменять тему?', a: 'Настройки → Внешний вид → Системная / Светлая / Тёмная.' },
  ];

  const openTg = async () => {
    try {
      await Linking.openURL(TG_URL);
    } catch {}
  };

  return (
    <View style={[s.root, { backgroundColor: colors.bg }]}>
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
            <Text style={[s.backText, { color: colors.text }]}>‹</Text>
          </Pressable>
          <Text style={[s.title, { color: colors.text }]}>Помощь</Text>
          <View style={s.backBtn} />
        </View>

        <ScrollView contentContainerStyle={s.scroll}>
          <View style={[s.hero, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={s.heroEmoji}>💬</Text>
            <Text style={[s.heroTitle, { color: colors.text }]}>Как пользоваться Streak</Text>
            <Text style={[s.heroText, { color: colors.muted }]}>
              Короткий гайд. Займёт минуту.
            </Text>
          </View>

          {steps.map((step, i) => (
            <View key={i} style={[s.step, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[s.stepNum, { backgroundColor: colors.cardAlt }]}>
                <Text style={[s.stepNumText, { color: colors.muted }]}>{i + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.stepTitle, { color: colors.text }]}>
                  {step.emoji} {step.title}
                </Text>
                <Text style={[s.stepText, { color: colors.muted }]}>{step.text}</Text>
              </View>
            </View>
          ))}

          <Text style={[s.section, { color: colors.muted }]}>Частые вопросы</Text>

          {faq.map((item, i) => (
            <View key={i} style={[s.faq, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[s.faqQ, { color: colors.text }]}>{item.q}</Text>
              <Text style={[s.faqA, { color: colors.muted }]}>{item.a}</Text>
            </View>
          ))}

          <Text style={[s.section, { color: colors.muted }]}>Связь с разработчиком</Text>

          <Pressable
            onPress={openTg}
            style={({ pressed }) => [
              s.tgCard,
              { backgroundColor: colors.card, borderColor: '#229ED9' },
              pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
            ]}>
            <View style={s.tgIconWrap}>
              <Text style={s.tgIcon}>✈️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.tgTitle, { color: colors.text }]}>Написать в Telegram</Text>
              <Text style={[s.tgHandle, { color: colors.muted }]}>{TG_HANDLE}</Text>
            </View>
            <Text style={[s.tgArrow, { color: colors.muted }]}>›</Text>
          </Pressable>

          <Text style={[s.footer, { color: colors.muted }]}>
            Остальное — интуитивно. Пробуй и не бойся экспериментировать 💪
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
    gap: 10,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  heroText: { fontSize: 14, textAlign: 'center' },
  step: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 14, fontWeight: '700' },
  stepTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  stepText: { fontSize: 13, lineHeight: 18 },
  section: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 14,
  },
  faq: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  faqQ: { fontSize: 14, fontWeight: '700' },
  faqA: { fontSize: 13, lineHeight: 18 },
  tgCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tgIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#229ED922',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tgIcon: { fontSize: 22 },
  tgTitle: { fontSize: 15, fontWeight: '700' },
  tgHandle: { fontSize: 13, marginTop: 2 },
  tgArrow: { fontSize: 26, fontWeight: '300' },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 12 },
});
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import { getRecipe } from '../../src/data/recipes';
import { checkCookingFrame } from '../../src/services/chef';
import { speak, stopSpeaking } from '../../src/services/voice';
import { useChat, useCookSession, usePreferences } from '../../src/store';
import { colors, fonts, radius, shadow, spacing, type } from '../../src/theme';
import { GradientButton, Pill, tap } from '../../src/components/ui';
import { ProgressBar, Pulse } from '../../src/components/motion';
import { VisionVerdict } from '../../src/types';

const AUTO_CHECK_INTERVAL_MS = 30000;

export default function CookMode() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const aiRecipes = useChat((s) => s.aiRecipes);
  const recipe = getRecipe(id) ?? aiRecipes.find((r) => r.id === id);
  const { prefs } = usePreferences();
  const cook = useCookSession();
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraOn, setCameraOn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState<VisionVerdict | null>(null);
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const session = cook.session;
  const stepIndex = session?.recipeId === id ? session.stepIndex : 0;
  const step = recipe?.steps[stepIndex];
  const isLast = recipe ? stepIndex === recipe.steps.length - 1 : false;
  const autoCheck = session?.visionAutoCheck ?? false;

  // Announce each step aloud, reset its timer.
  useEffect(() => {
    if (!step) return;
    setVerdict(null);
    setTimerLeft(step.timerSec ?? null);
    setTimerRunning(false);
    if (prefs.voiceEnabled) {
      speak(`Step ${stepIndex + 1}. ${step.title}. ${step.instruction}`);
    }
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex, step?.id]);

  // Step countdown timer.
  useEffect(() => {
    if (!timerRunning || timerLeft === null) return;
    if (timerLeft <= 0) {
      setTimerRunning(false);
      if (prefs.voiceEnabled) speak('Time! Check your pan.');
      return;
    }
    const t = setTimeout(() => setTimerLeft((v) => (v === null ? null : v - 1)), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timerLeft, prefs.voiceEnabled]);

  const runVisionCheck = useCallback(async () => {
    if (!cameraRef.current || !step || !recipe || checking) return;
    setChecking(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.4 });
      if (photo?.base64) {
        const result = await checkCookingFrame(photo.base64, step, recipe.title);
        setVerdict(result);
        if (prefs.voiceEnabled) speak(result.speak);
      }
    } catch {
      // camera hiccup — keep cooking
    } finally {
      setChecking(false);
    }
  }, [step, recipe, checking, prefs.voiceEnabled]);

  // Hands-free mode: re-check the pan every 30 seconds.
  useEffect(() => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    if (autoCheck && cameraOn) {
      autoTimer.current = setInterval(runVisionCheck, AUTO_CHECK_INTERVAL_MS);
    }
    return () => {
      if (autoTimer.current) clearInterval(autoTimer.current);
    };
  }, [autoCheck, cameraOn, runVisionCheck]);

  if (!recipe || !step || !session) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={[type.body, { padding: spacing.lg }]}>No active cook session.</Text>
        <GradientButton title="Back" onPress={() => router.back()} variant="ghost" />
      </SafeAreaView>
    );
  }

  const toggleCamera = async () => {
    if (!cameraOn && !permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return;
    }
    setCameraOn((v) => !v);
  };

  const goTo = (index: number) => {
    tap();
    cook.completeStep(step.id);
    cook.setStep(index);
  };

  const pauseAndExit = () => {
    cook.pause();
    stopSpeaking();
    router.back();
  };

  const finish = () => {
    stopSpeaking();
    if (prefs.voiceEnabled) speak(`Beautiful work. ${recipe.title} is done. Pour the ${recipe.winePairing.wine} and enjoy.`);
    cook.end();
    router.back();
  };

  const verdictTone =
    verdict?.status === 'perfect' ? colors.herb
    : verdict?.status === 'adjust' ? colors.danger
    : verdict?.status === 'keep_going' ? colors.butter
    : colors.textMuted;

  const mins = timerLeft !== null ? Math.floor(timerLeft / 60) : 0;
  const secs = timerLeft !== null ? timerLeft % 60 : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={pauseAndExit} hitSlop={10}>
          <Text style={{ color: colors.textSecondary, fontSize: 14, fontFamily: fonts.sansSemiBold }}>⏸ Pause & exit</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Pulse><View style={styles.liveDot} /></Pulse>
          <Text style={{ color: colors.live, fontSize: 12, fontFamily: fonts.sansExtraBold, letterSpacing: 1.4 }}>LIVE</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={{ paddingHorizontal: spacing.md }}>
        <ProgressBar
          progress={(stepIndex + 1) / recipe.steps.length}
          color={colors.terracotta}
          trackColor={colors.border}
        />
      </View>
      <Text style={[type.caption, { paddingHorizontal: spacing.md, marginTop: 8 }]}>
        {recipe.emoji} {recipe.title} · step {stepIndex + 1} of {recipe.steps.length}
      </Text>

      <ScrollView contentContainerStyle={{ padding: spacing.md }} showsVerticalScrollIndicator={false}>
        {/* Step card — slides like the web app's GSAP step carousel */}
        <Animated.View
          key={step.id}
          entering={SlideInRight.duration(420).springify().damping(22).stiffness(220)}
          exiting={SlideOutLeft.duration(260)}
          style={styles.stepCard}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            {step.heat && step.heat !== 'off' && <Pill tone="flame">🔥 {step.heat} heat</Pill>}
            {step.durationMin ? <Pill tone="gold">~{step.durationMin} min</Pill> : null}
          </View>
          <Text style={[type.title, { marginTop: spacing.sm }]}>{step.title}</Text>
          <Text style={[type.body, { marginTop: spacing.sm, fontSize: 16.5, lineHeight: 26 }]}>
            {step.instruction}
          </Text>
          {step.visualCue && (
            <View style={styles.cueBox}>
              <Text style={{ color: colors.butter, fontSize: 11, fontFamily: fonts.sansExtraBold, letterSpacing: 1.6 }}>
                👁 WHAT DONE LOOKS LIKE
              </Text>
              <Text style={[type.bodySecondary, { marginTop: 4, fontSize: 14 }]}>{step.visualCue}</Text>
            </View>
          )}
          {step.chefTip && (
            <Text style={[type.caption, { marginTop: spacing.sm, fontFamily: fonts.serifItalic, fontSize: 13.5, color: colors.textSecondary }]}>
              💡 {step.chefTip}
            </Text>
          )}
        </Animated.View>

        {/* Timer */}
        {step.timerSec ? (
          <Pressable style={styles.timer} onPress={() => { tap(); setTimerRunning((v) => !v); }}>
            <Text style={styles.timerText}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </Text>
            <Text style={[type.caption, { color: timerRunning ? colors.herb : colors.textMuted }]}>
              {timerRunning ? '⏱ running — tap to pause' : '▶ tap to start timer'}
            </Text>
          </Pressable>
        ) : null}

        {/* Chef's Eye */}
        <View style={styles.eyeCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[type.heading, { fontSize: 17 }]}>👁 Chef's Eye</Text>
            <Pressable onPress={toggleCamera}>
              <Text style={{ color: colors.terracotta, fontFamily: fonts.sansBold, fontSize: 13 }}>
                {cameraOn ? 'Hide camera' : 'Open camera'}
              </Text>
            </Pressable>
          </View>
          <Text style={[type.caption, { marginTop: 2 }]}>
            Show me the pan — I'll tell you if it's ready.
          </Text>

          {cameraOn && (
            <>
              <View style={styles.cameraWrap}>
                <CameraView ref={cameraRef} style={styles.camera} facing="back" />
                {checking && (
                  <View style={styles.checkingOverlay}>
                    <Text style={{ color: '#FFF', fontFamily: fonts.sansBold }}>👨‍🍳 Looking…</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <GradientButton
                    title={checking ? 'Checking…' : 'Check my food'}
                    icon="📸"
                    variant="herb"
                    disabled={checking}
                    onPress={runVisionCheck}
                  />
                </View>
                <Pressable
                  style={[styles.autoBtn, autoCheck && { backgroundColor: colors.herbSoft, borderColor: colors.herb }]}
                  onPress={() => { tap(); cook.setVisionAutoCheck(!autoCheck); }}
                >
                  <Text style={{ color: autoCheck ? colors.herb : colors.textMuted, fontFamily: fonts.sansExtraBold, fontSize: 11, textAlign: 'center' }}>
                    AUTO{'\n'}30s
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {verdict && (
            <Animated.View
              entering={FadeInDown.springify().damping(20).stiffness(300)}
              style={[styles.verdict, { borderLeftColor: verdictTone }]}
            >
              <Text style={{ color: verdictTone, fontFamily: fonts.sansExtraBold, fontSize: 14 }}>
                {verdict.status === 'perfect' ? '✓ ' : verdict.status === 'adjust' ? '⚠ ' : '… '}
                {verdict.headline}
              </Text>
              <Text style={[type.bodySecondary, { marginTop: 4, fontSize: 13.5 }]}>{verdict.feedback}</Text>
            </Animated.View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Step navigation */}
      <View style={styles.footer}>
        <Pressable
          style={[styles.navBtn, stepIndex === 0 && { opacity: 0.3 }]}
          disabled={stepIndex === 0}
          onPress={() => goTo(stepIndex - 1)}
        >
          <Text style={styles.navBtnText}>‹ Back</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <GradientButton
            title={isLast ? '🎉 Finish & plate' : 'Next step ›'}
            variant={isLast ? 'herb' : 'flame'}
            onPress={() => (isLast ? finish() : goTo(stepIndex + 1))}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.live },
  stepCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.card,
  },
  cueBox: {
    backgroundColor: colors.goldSoft,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    padding: 12,
    marginTop: spacing.md,
  },
  timer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  timerText: { color: colors.text, fontSize: 46, fontFamily: fonts.serifBlack, fontVariant: ['tabular-nums'] },
  eyeCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginTop: spacing.md,
    ...shadow.card,
  },
  cameraWrap: {
    height: 220,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.md,
    backgroundColor: '#16110B',
  },
  camera: { flex: 1 },
  checkingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20,12,6,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autoBtn: {
    width: 64,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdict: {
    borderLeftWidth: 3,
    borderRadius: radius.sm,
    padding: 12,
    marginTop: spacing.md,
    backgroundColor: colors.bgElevated,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  navBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  navBtnText: { color: colors.textSecondary, fontFamily: fonts.sansBold },
});

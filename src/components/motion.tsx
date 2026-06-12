import React, { useEffect } from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// Motion vocabulary ported from Culinary-Lens (GSAP/framer-motion → Reanimated
// so the same physics run natively on iOS/Android and on the web build).

// Culinary-Lens reveal curve: cubic-bezier(0.16, 1, 0.3, 1), 600ms, y 20→0.
const REVEAL_EASING = Easing.bezier(0.16, 1, 0.3, 1);

export function reveal(delayMs = 0) {
  return FadeInDown.duration(600).delay(delayMs).easing(REVEAL_EASING);
}

export function fadeIn(delayMs = 0) {
  return FadeIn.duration(450).delay(delayMs).easing(REVEAL_EASING);
}

/** Staggered entrance wrapper: <Reveal index={i}>…</Reveal> */
export function Reveal({
  children,
  index = 0,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  return (
    <Animated.View entering={reveal(index * 80)} style={style}>
      {children}
    </Animated.View>
  );
}

/** Spring-scale press feedback (the hover-grow of the web app, for touch). */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  ...props
}: PressableProps & { children: React.ReactNode; style?: ViewStyle | ViewStyle[]; scaleTo?: number }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 260 });
      }}
      {...props}
    >
      <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Mascot idle sway — Culinary-Lens "peppy-sway": ±1.5deg / 4px, 4.5s loop. */
export function Sway({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2250, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2250, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [t]);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -4 * t.value },
      { rotate: `${-1.5 + 3 * t.value}deg` },
    ],
  }));
  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

/** Soft looping pulse for live indicators. */
export function Pulse({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );
  }, [t]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * t.value }));
  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}

/** Animated width progress bar (0–1), spring-eased like the web app's. */
export function ProgressBar({
  progress,
  height = 4,
  color,
  trackColor,
}: {
  progress: number;
  height?: number;
  color: string;
  trackColor: string;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(progress, { duration: 600, easing: REVEAL_EASING });
  }, [progress, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <Animated.View style={{ height, backgroundColor: trackColor, borderRadius: height / 2, overflow: 'hidden' }}>
      <Animated.View style={[{ height, backgroundColor: color, borderRadius: height / 2 }, fill]} />
    </Animated.View>
  );
}

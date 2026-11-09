import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { RADIUS, SPACING, STUDENT_THEMES, ThemeMode } from '@mastera/ui-tokens';
import { MasteraIcon } from '../shared/components/MasteraIcon';

// Safely register .png loader if running in headless Node.js test environment
if (typeof require !== 'undefined' && (require as any).extensions && !(require as any).extensions['.png']) {
  (require as any).extensions['.png'] = (m: any, f: string) => {
    m.exports = { uri: f };
  };
}

const windowDims =
  typeof Dimensions !== 'undefined' && typeof Dimensions.get === 'function'
    ? Dimensions.get('window')
    : { width: 390, height: 844 };
const SCREEN_WIDTH = windowDims?.width ?? 390;
const SCREEN_HEIGHT = windowDims?.height ?? 844;

const SPLASH_SLIDES = [
  {
    id: 'slide-1',
    image: require('../../assets/images/splash-mastara.png'),
  },
  {
    id: 'slide-2',
    image: require('../../assets/images/splash-campus.png'),
  },
  {
    id: 'slide-3',
    image: require('../../assets/images/splash-students.png'),
  },
];

export interface SplashScreenProps {
  onFinish: () => void;
  themeMode?: ThemeMode;
}

export function SplashScreen({
  onFinish,
  themeMode = 'light',
}: SplashScreenProps): React.ReactElement {
  const tokens = STUDENT_THEMES[themeMode];
  const scrollRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-advance slides every 3.8 seconds if user hasn't tapped Get Started
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % SPLASH_SLIDES.length;
        scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const handleScrollEnd = (e: any) => {
    const offset = e?.nativeEvent?.contentOffset?.x ?? 0;
    const index = Math.round(offset / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const topInset = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) + 10 : 50;

  return (
    <View style={[styles.container, { backgroundColor: tokens.primary }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Sliding Image Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.carouselScrollView}
      >
        {SPLASH_SLIDES.map((slide) => (
          <View key={slide.id} style={styles.slideContainer}>
            <Image
              source={slide.image}
              style={styles.slideImage}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {/* Top Skip Button */}
      <TouchableOpacity
        onPress={onFinish}
        style={[styles.skipBtn, { top: topInset, backgroundColor: tokens.surface }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.skipBtnText, { color: tokens.primary }]}>Skip</Text>
      </TouchableOpacity>

      {/* Bottom Floating Card: Pagination Dots & Get Started Button */}
      <View style={styles.bottomOverlay}>
        {/* Pagination Dots */}
        <View style={styles.dotsRow}>
          {SPLASH_SLIDES.map((slide, idx) => {
            const isActive = idx === activeIndex;
            return (
              <View
                key={slide.id}
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: tokens.surface }]
                    : [styles.inactiveDot, { backgroundColor: tokens.border }],
                ]}
              />
            );
          })}
        </View>

        {/* Get Started Button at the bottom */}
        <TouchableOpacity
          onPress={onFinish}
          style={[styles.getStartedBtn, { backgroundColor: tokens.primary }]}
          activeOpacity={0.85}
        >
          <Text style={[styles.getStartedBtnText, { color: tokens.surface }]}>
            Get started
          </Text>
          <MasteraIcon name="chevron-right" size={20} color={tokens.surface} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  carouselScrollView: {
    flex: 1,
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  skipBtn: {
    position: 'absolute',
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    zIndex: 10,
    elevation: 3,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.pill,
  },
  activeDot: {
    width: 24,
  },
  inactiveDot: {
    width: 8,
  },
  getStartedBtn: {
    width: '100%',
    height: 52,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 4,
  },
  getStartedBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
});

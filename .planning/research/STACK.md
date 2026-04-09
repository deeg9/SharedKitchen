# Technology Stack: v7.0 Stitch UI Redesign

**Project:** SharedKitchen
**Researched:** 2026-04-07
**Scope:** Stack additions for new UI patterns only. Existing stack (Expo SDK 55, React Native 0.83.2, Reanimated 4.2.1, Zustand, gorhom/bottom-sheet, FlashList, expo-image, etc.) is validated and unchanged.

## Recommended Additions

### SVG Primitives for Charts and Rings

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| react-native-svg | ~15.11 (via `npx expo install`) | Donut rings, progress bars, stacked bars, percentage rings | Part of the Expo ecosystem (bundled in Expo Go), lightweight (~200KB JS), pairs with existing Reanimated for animations. Only library needed for ALL chart patterns in the redesign. |

**What it enables:**
- Budget donut/ring chart: `<Circle>` with `strokeDasharray` + `strokeDashoffset` animated via Reanimated
- Category progress bars: `<Rect>` with animated width (or plain `View` with Reanimated -- SVG optional here)
- Cooking insights percentage ring: Same `<Circle>` ring pattern as budget donut
- Household distribution stacked bar: Multiple `<Rect>` elements with proportional widths
- Shopping progress bar: Animated `<Rect>` fill or plain `View` (SVG optional)

**Confidence:** HIGH -- react-native-svg is an Expo SDK package, installed via `npx expo install react-native-svg`. Verified in Expo SDK 55 docs. Pairs with Reanimated via `Animated.createAnimatedComponent(Circle)` for smooth 60fps ring animations (well-documented pattern).

### Gradient Overlays for Hero Cards

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| expo-linear-gradient | ~55.0.12 (via `npx expo install`) | Gradient overlays on hero cards, image overlays with text | Expo SDK package, production-stable. Used for hero card text-over-image patterns with bottom-to-top dark gradient for readability. |

**What it enables:**
- Hero cards with overlaid text: `<LinearGradient>` positioned absolutely over `<Image>` with `colors={['transparent', 'rgba(0,0,0,0.7)']}`
- Onboarding screen backgrounds: Subtle gradient washes behind content
- Premium upgrade screen: Gradient accent sections

**Why not `experimental_backgroundImage`:** React Native 0.83.2 supports `experimental_backgroundImage` with `linear-gradient()` natively, which would avoid adding a dependency. However, it remains an experimental API with potential edge cases. `expo-linear-gradient` is production-proven, part of the Expo SDK, and adds negligible bundle size. Use the stable path for a production app.

**Confidence:** HIGH -- expo-linear-gradient is a first-party Expo SDK package.

## What NOT to Add

### Do NOT add: @shopify/react-native-skia

**Why tempting:** Victory Native XL (the modern charting library) requires Skia as a rendering backend, and Skia enables GPU-accelerated chart rendering.

**Why not:**
- Adds ~6MB to iOS binary and ~41MB to Android APK
- SharedKitchen's charts are simple (1 donut, a few progress bars, 1 stacked bar) -- not real-time data visualization with thousands of points
- react-native-svg + Reanimated handles all these patterns at 60fps with zero additional native dependencies beyond what Expo already bundles
- Skia Canvas objects are heavy; rendering multiple small charts in different Canvases can degrade performance -- opposite of what we want in scrollable screens

### Do NOT add: victory-native or victory-native-xl

**Why tempting:** Declarative charting API with built-in animations.

**Why not:**
- victory-native-xl requires @shopify/react-native-skia (see above)
- Classic victory-native adds ~500KB JS bundle for chart types we don't need (line charts, scatter plots, area charts)
- The 5 chart-like elements in the redesign are simple enough to build as custom components with react-native-svg primitives
- Custom components match the existing SharedKitchen design system exactly, without fighting a charting library's opinionated styling

### Do NOT add: react-native-circular-progress or react-native-progress-ring

**Why tempting:** Purpose-built for ring/donut progress indicators.

**Why not:**
- Both depend on react-native-svg anyway (so you still need it)
- They add an abstraction layer over ~30 lines of SVG code
- Custom implementation with Circle + Reanimated gives full control over animation curves, colors, and the inner content (text, icons) that the Stitch designs require
- Fewer dependencies = fewer upgrade headaches with future Expo SDK versions

### Do NOT add: react-native-chart-kit

**Why tempting:** Has progress rings and bar charts out of the box.

**Why not:**
- Last meaningful update was 2021, effectively unmaintained
- Opinionated styling that conflicts with the Culinary Curator design system
- Built on react-native-svg anyway (still need it as a dep)
- Known issues with React Native 0.7x+ and New Architecture

## Pattern-by-Pattern Stack Mapping

| UI Pattern | Library Needed | Approach |
|------------|---------------|----------|
| 1. Horizontal date strip | NONE (existing) | `ScrollView horizontal` + `Pressable` day pills. Reanimated for selected-state animation. |
| 2. Donut/ring chart (budget) | react-native-svg | `<Svg><Circle>` with strokeDasharray, animated via `Animated.createAnimatedComponent(Circle)` + useSharedValue |
| 3. Category progress bars | NONE or react-native-svg | Plain `View` with Reanimated `useAnimatedStyle` for width interpolation. SVG `<Rect>` optional but overkill. |
| 4. Cooking insights ring | react-native-svg | Same ring pattern as budget donut, smaller radius |
| 5. Household stacked bar | react-native-svg | Multiple `<Rect>` in a row with proportional widths, or plain flex `View` children with Reanimated |
| 6. Chef's Tip callout cards | NONE (existing) | Styled `View` with icon + text. Border-left accent via `borderLeftWidth` + `borderLeftColor`. |
| 7. Feature comparison table | NONE (existing) | `View` rows with flex columns. Checkmark/X icons from Material Community Icons. |
| 8. Hero cards with gradient | expo-linear-gradient | `expo-image` for background + `<LinearGradient>` overlay + absolute-positioned text |
| 9. Following avatar strip | NONE (existing) | `ScrollView horizontal` + `expo-image` circular avatars. Already have presence avatar patterns from v2.0. |
| 10. Shopping progress bar | NONE (existing) | Plain `View` with Reanimated animated width. Identical pattern to existing Skeleton shimmer. |

**Summary:** 8 of 10 patterns need ZERO new dependencies. Only the ring/donut charts and hero card gradients need new packages.

## Installation

```bash
# Two new dependencies -- both Expo SDK packages
npx expo install react-native-svg expo-linear-gradient
```

No native rebuild required -- both packages are included in Expo Go and standard EAS builds.

## Integration Notes

### react-native-svg + Reanimated Pattern

The app already uses Reanimated 4.2.1 extensively (Skeleton shimmer, ActivityToast, MealGeneratorSheet, AllSetStep, IngredientSidebar, FeedCard, etc.). The animated SVG pattern is:

```typescript
import Animated, { useSharedValue, useAnimatedProps, withTiming } from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// In component:
const progress = useSharedValue(0);
const animatedProps = useAnimatedProps(() => ({
  strokeDashoffset: circumference * (1 - progress.value),
}));

// Animate on mount or data change:
progress.value = withTiming(targetValue, { duration: 800 });
```

This pattern is well-documented and battle-tested with Reanimated 3+ / 4+.

### expo-linear-gradient Pattern

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

// Hero card overlay:
<View style={{ borderRadius: 16, overflow: 'hidden' }}>
  <Image source={recipe.imageUrl} style={{ width: '100%', height: 200 }} />
  <LinearGradient
    colors={['transparent', 'rgba(0,0,0,0.7)']}
    style={StyleSheet.absoluteFill}
  />
  <Text style={[styles.heroTitle, { position: 'absolute', bottom: 16 }]}>
    {recipe.title}
  </Text>
</View>
```

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Charts/rings | react-native-svg (custom) | Victory Native XL | Skia dependency adds 6MB iOS / 41MB Android; overkill for 3 simple charts |
| Charts/rings | react-native-svg (custom) | react-native-gifted-charts | Extra abstraction over SVG; opinionated styling fights design system |
| Charts/rings | react-native-svg (custom) | react-native-circular-progress | Wraps same SVG Circle in ~30 lines; adds dep for no real gain |
| Gradients | expo-linear-gradient | experimental_backgroundImage | Experimental API; production app should use stable Expo SDK package |
| Gradients | expo-linear-gradient | react-native-linear-gradient | expo-linear-gradient IS the Expo-compatible wrapper; same thing, Expo-managed version |
| Progress bars | Plain View + Reanimated | react-native-progress | Adds dependency for a `View` with animated width -- trivial to build |
| Stacked bars | Plain View + flex | D3.js | Massive overkill; flex layout handles proportional widths natively |

## Sources

- [Expo SDK SVG docs](https://docs.expo.dev/versions/latest/sdk/svg/) -- confirms react-native-svg is Expo SDK package
- [Expo LinearGradient docs](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) -- confirms expo-linear-gradient ~55.0.12 for SDK 55
- [React Native Skia bundle size](https://shopify.github.io/react-native-skia/docs/getting-started/bundle-size/) -- 6MB iOS, 41MB Android
- [Animated donut chart with SVG + Reanimated](https://dev.to/dimaportenko/react-native-animated-donut-pie-chart-reanimated-svg-32od) -- proven pattern
- [Animated progress ring tutorial](https://www.notjust.dev/projects/step-counter/animated-progress-ring) -- Circle + Reanimated pattern
- [Software Mansion: You Might Not Need react-native-svg](https://blog.swmansion.com/you-might-not-need-react-native-svg-b5c65646d01f) -- confirms SVG is lightweight for simple use cases

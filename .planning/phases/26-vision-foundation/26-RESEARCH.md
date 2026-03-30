# Phase 26: Vision Foundation - Research

**Researched:** 2026-03-30
**Domain:** Camera capture, image compression, Gemini Vision API, Supabase Edge Functions
**Confidence:** HIGH

## Summary

Phase 26 builds shared infrastructure for all AI vision features (Phases 27-29). The three pillars are: (1) a reusable CameraSheet component using `expo-image-picker` for camera/gallery capture with permission pre-prompting, (2) a client-side `compressForVision()` utility using `expo-image-manipulator` to resize and compress images to ~200KB before upload, and (3) an `analyze-food-photo` Supabase Edge Function that accepts base64 images, routes to Gemini 2.5 Flash vision by intent, and enforces per-user rate limits via `ai_usage_log`.

The project already has strong foundations: `expo-image-picker` is installed and used for gallery picking, `@gorhom/bottom-sheet` is used in 9+ components, the `parse-recipe-url` Edge Function provides a proven pattern for Gemini API calls with auth/rate-limiting/caching, and `ai_usage_log` already tracks usage with monthly windows. The primary new dependency is `expo-image-manipulator` (part of Expo SDK, no native rebuild needed).

**Primary recommendation:** Follow the existing Edge Function pattern from `parse-recipe-url` almost exactly -- same auth, admin client, premium check, rate limiting, non-blocking logging, and CORS structure. The vision function differs only in accepting base64 image data instead of URLs, and routing by `intent` parameter instead of `type`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- FAB button on Kitchen tab as primary camera entry point
- Camera opens first with gallery toggle (primary use case is live photos)
- Bottom sheet pre-prompt explaining camera usage before system permission
- When permission denied: inline card with "Camera access needed" + Settings button
- Single `analyze-food-photo` Edge Function with `intent` parameter (scan/identify)
- Base64 image in JSON body (no Storage, images are transient)
- Use `gemini-2.5-flash` via existing GEMINI_API_KEY
- Rate limit: 5 vision calls/month free, unlimited premium, tracked as `analyze-food-photo` in ai_usage_log
- Use `expo-image-manipulator` for compression
- Target: resize to 1024px max dimension, JPEG quality 0.6, ~150-250KB output

### Claude's Discretion
- Exact Gemini system prompt structure for scan vs identify intents
- Error message copy and recovery UX details
- Whether to show a loading animation or skeleton during vision processing
- Exact FAB icon and positioning on Kitchen tab

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | User can capture a photo from camera within the app via a reusable camera sheet | `expo-image-picker` launchCameraAsync + launchImageLibraryAsync, wrapped in CameraSheet bottom sheet component |
| VIS-02 | Captured images are compressed client-side to ~200KB before upload | `expo-image-manipulator` manipulateAsync with resize to 1024px max + JPEG 0.6 compress + base64 output |
| VIS-03 | Camera permission is requested with contextual pre-prompt before first use | Follow usePermissionPrompt pattern from notifications: AsyncStorage flag + BottomSheet pre-prompt + requestCameraPermissionsAsync |
| VIS-04 | Edge Function accepts base64 images and routes to Gemini 2.5 Flash vision by intent | Follow parse-recipe-url pattern with inline_data parts for Gemini, intent-based prompt routing |
| VIS-05 | Vision API calls are rate-limited per intent with free-tier caps tracked in ai_usage_log | Monthly window count on ai_usage_log where function_name='analyze-food-photo', 5/month free, unlimited premium |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| expo-image-picker | ~55.0.13 | Camera + gallery capture | Already installed; provides launchCameraAsync without needing expo-camera |
| expo-image-manipulator | ~55.0.11 | Resize + compress images | Part of Expo SDK 55; no native rebuild needed; manipulateAsync with base64 output |
| @gorhom/bottom-sheet | ^5.2.8 | CameraSheet and pre-prompt UI | Already installed; used in 9+ components across the app |
| Gemini 2.5 Flash | REST API | Vision analysis | Already integrated via GEMINI_API_KEY; cheapest vision option |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-native-async-storage/async-storage | (installed) | Camera permission prompt dismissal flag | Track whether pre-prompt has been shown |
| expo-linking | (installed) | Open Settings when camera denied | Linking.openSettings() for permission recovery |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| expo-image-picker camera | expo-camera | Full camera UI control, but requires native rebuild and adds complexity; image-picker camera is sufficient |
| expo-image-manipulator | sharp (server-side) | Would avoid client RAM usage, but adds server cost and latency; client-side is simpler for single images |
| Base64 in JSON body | Supabase Storage upload | Would handle larger files, but adds storage management; images are transient, ~200KB fits in 20MB Gemini limit |

**Installation:**
```bash
npx expo install expo-image-manipulator
```

**Version verification:** expo-image-manipulator latest is 55.0.11 (verified via npm registry). expo-image-picker ~55.0.13 already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   └── camera/
│       ├── CameraSheet.tsx           # Reusable bottom sheet: pre-prompt → camera/gallery → preview
│       ├── CameraPermissionCard.tsx   # Inline "permission denied" recovery card
│       └── VisionLoadingOverlay.tsx   # Loading state during AI processing
├── hooks/
│   └── useCameraPermission.ts        # Permission check + pre-prompt state management
├── lib/
│   └── vision.ts                     # compressForVision(), analyzePhoto(), VisionRateLimitError
supabase/
└── functions/
    └── analyze-food-photo/
        └── index.ts                  # Edge Function: auth, rate limit, Gemini vision call
```

### Pattern 1: Permission Pre-Prompt (matches notifications)
**What:** Show a custom bottom sheet explaining why camera access is needed before triggering the system permission dialog.
**When to use:** First time user taps the camera FAB.
**Example:**
```typescript
// Source: Existing usePermissionPrompt in src/hooks/useNotifications.ts
export function useCameraPermission() {
  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const [status, setStatus] = useState<PermissionStatus | null>(null);

  const checkAndPrompt = async () => {
    const { status } = await ImagePicker.getCameraPermissionsAsync();
    if (status === 'granted') return true;
    if (status === 'undetermined') {
      const dismissed = await AsyncStorage.getItem('camera_preprompt_shown');
      if (!dismissed) {
        setShowPrePrompt(true); // Show custom bottom sheet first
        return false;
      }
      // Pre-prompt already shown, go straight to system dialog
      const result = await ImagePicker.requestCameraPermissionsAsync();
      setStatus(result.status);
      return result.granted;
    }
    // 'denied' — show recovery card
    setStatus('denied');
    return false;
  };

  const requestAfterPrePrompt = async () => {
    await AsyncStorage.setItem('camera_preprompt_shown', 'true');
    setShowPrePrompt(false);
    const result = await ImagePicker.requestCameraPermissionsAsync();
    setStatus(result.status);
    return result.granted;
  };

  return { showPrePrompt, status, checkAndPrompt, requestAfterPrePrompt };
}
```

### Pattern 2: Image Compression Utility
**What:** Resize + compress before sending to Edge Function.
**When to use:** After every photo capture, before API call.
**Example:**
```typescript
// Source: expo-image-manipulator docs
import * as ImageManipulator from 'expo-image-manipulator';
import { SaveFormat } from 'expo-image-manipulator';

export async function compressForVision(uri: string): Promise<{ base64: string; width: number; height: number }> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: 1024 } }],  // Height auto-calculated to preserve ratio
    { format: SaveFormat.JPEG, compress: 0.6, base64: true }
  );
  return {
    base64: result.base64!,
    width: result.width,
    height: result.height,
  };
}
```

### Pattern 3: Edge Function with Vision (follows parse-recipe-url)
**What:** Deno Edge Function that authenticates, rate-limits, calls Gemini with inline image data, and logs usage.
**When to use:** All vision API calls.
**Example:**
```typescript
// Source: Existing parse-recipe-url/index.ts pattern + Gemini docs
// Key difference from text-based Gemini calls: use inline_data part
const geminiBody = {
  contents: [{
    parts: [
      {
        inline_data: {
          mime_type: 'image/jpeg',
          data: base64Image,  // Raw base64, no data: prefix
        },
      },
      { text: systemPrompt + '\n\n' + intentPrompt },
    ],
  }],
  generationConfig: {
    temperature: 0.1,
    maxOutputTokens: 4000,
    responseMimeType: 'application/json',
  },
};
```

### Pattern 4: Client-Side Vision Call (follows callEdgeFunctionForVideo)
**What:** Client function that compresses image, calls Edge Function, handles rate limit errors.
**When to use:** From any screen that triggers vision analysis.
**Example:**
```typescript
// Source: Existing callEdgeFunctionForVideo in src/lib/ai.ts
export async function analyzePhoto(
  imageUri: string,
  intent: 'scan' | 'identify'
): Promise<VisionResult> {
  const { base64 } = await compressForVision(imageUri);

  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/analyze-food-photo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'apikey': anonKey ?? '',
    },
    body: JSON.stringify({ image: base64, intent }),
  });
  // ... handle 429 VisionRateLimitError, validate response shape
}
```

### Anti-Patterns to Avoid
- **Uploading to Supabase Storage then passing URL:** Images are transient analysis inputs, not persistent assets. Base64-in-JSON avoids storage cleanup and is simpler.
- **Using expo-camera for basic capture:** expo-image-picker's launchCameraAsync is sufficient and avoids a native rebuild. expo-camera is for custom camera UIs with overlays.
- **Caching vision results by image hash:** Unlike URL-based recipe parsing, photo content is unique each time. No caching benefit. Log usage only.
- **Sending full-resolution iPhone photos:** A 48MP iPhone photo is ~15MB as JPEG. Must compress client-side first or Gemini's 20MB request limit will be hit.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera capture | Custom camera view | `expo-image-picker.launchCameraAsync()` | Handles all platform quirks, permissions, and returns URI |
| Image compression | Manual canvas/bitmap manipulation | `expo-image-manipulator.manipulateAsync()` | Native-optimized resize + JPEG encode in one call |
| Permission pre-prompt state | Custom flag management | AsyncStorage key + pattern from usePermissionPrompt | Proven pattern already in codebase |
| Rate limiting | Custom middleware | ai_usage_log count query (existing pattern) | Already proven with video import and recipe parsing |
| Bottom sheet UI | Custom modal | `@gorhom/bottom-sheet` via existing BottomSheet wrapper | 9+ components already use this pattern |

**Key insight:** 90% of this phase is wiring together existing patterns (bottom sheets, Edge Function auth/rate-limiting, Gemini API calls) with two new inputs: camera capture and image compression.

## Common Pitfalls

### Pitfall 1: iOS Camera Permission on Simulator
**What goes wrong:** `launchCameraAsync` crashes or returns canceled on iOS Simulator because there is no camera hardware.
**Why it happens:** Simulator has no camera. expo-image-picker returns `{ canceled: true }`.
**How to avoid:** Always test camera flow on a physical device. For development, add a fallback to `launchImageLibraryAsync` when camera is unavailable. Check `result.canceled` before accessing `result.assets`.
**Warning signs:** Tests pass but camera flow never works in dev.

### Pitfall 2: Base64 String Prefix in Gemini Request
**What goes wrong:** Gemini rejects the image with "invalid base64" or returns garbled analysis.
**Why it happens:** `expo-image-manipulator` returns raw base64 (no prefix). If you accidentally prepend `data:image/jpeg;base64,` in the Gemini `inline_data.data` field, it fails. Conversely, if you display it in an Image component, you need the prefix.
**How to avoid:** Send raw base64 to Gemini `inline_data.data`. Only add `data:image/jpeg;base64,` prefix for React Native `<Image source={{ uri }}` display.
**Warning signs:** Gemini returns "I cannot analyze this image" or 400 errors.

### Pitfall 3: Memory Pressure from Large Images on iOS
**What goes wrong:** App crashes or becomes unresponsive when compressing a 48MP iPhone photo.
**Why it happens:** `expo-image-manipulator` loads the full image into memory before resizing. Known issue (expo/expo#36861) with high-resolution images on iOS.
**How to avoid:** Set `quality: 0` on `launchCameraAsync` options if available, or ensure resize happens immediately after capture. The 1024px target is aggressive enough that the output is small.
**Warning signs:** Memory warnings in Xcode console, app background kills during compression.

### Pitfall 4: Edge Function Timeout with Large Base64 Payloads
**What goes wrong:** Edge Function times out or returns 413.
**Why it happens:** Supabase Edge Functions have a default request body limit. A 200KB image as base64 becomes ~270KB (33% expansion). This is well within limits, but uncompressed images could be 5-15MB as base64.
**How to avoid:** Always compress client-side before sending. The compressForVision utility must be called before every Edge Function invocation. Never send raw camera output directly.
**Warning signs:** 413 or 504 errors from Edge Function.

### Pitfall 5: Rate Limit Check Race Condition
**What goes wrong:** User makes 2 rapid taps and exceeds the 5/month limit because both requests pass the count check before either logs usage.
**Why it happens:** Non-blocking usage logging means the count query may not see the in-flight request.
**How to avoid:** Optimistic client-side count tracking (increment immediately, decrement on failure). Also add a simple client-side debounce on the analyze button. Server-side is eventually consistent, which is acceptable for a monthly limit.
**Warning signs:** User sees 6/5 used in rare cases.

### Pitfall 6: app.json Missing Camera Permission Strings
**What goes wrong:** iOS app store rejection or runtime crash requesting camera.
**Why it happens:** iOS requires `NSCameraUsageDescription` in Info.plist. Expo auto-adds it if `expo-image-picker` plugin is configured, but custom strings need explicit config.
**How to avoid:** Add `expo-image-picker` plugin config to app.json with `cameraPermission` string: "SharedKitchen uses your camera to scan food and identify dishes."
**Warning signs:** Permission dialog shows generic text or app crashes on permission request.

## Code Examples

### CameraSheet Component (reusable across Phases 27-29)
```typescript
// Source: Existing BottomSheet pattern + expo-image-picker docs
import { BottomSheet } from '../ui/BottomSheet';
import * as ImagePicker from 'expo-image-picker';

interface CameraSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCaptured: (uri: string) => void;
}

export function CameraSheet({ isOpen, onClose, onImageCaptured }: CameraSheetProps) {
  const handleCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      onImageCaptured(result.assets[0].uri);
      onClose();
    }
  };

  const handleGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      onImageCaptured(result.assets[0].uri);
      onClose();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} snapPoints={['35%']}>
      {/* Two buttons: Take Photo (primary), Choose from Gallery (secondary) */}
    </BottomSheet>
  );
}
```

### Edge Function Rate Limiting (follows existing video pattern)
```typescript
// Source: parse-recipe-url/index.ts lines 335-350
const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);

const { count: visionCount } = await supabaseAdmin
  .from('ai_usage_log')
  .select('id', { count: 'exact', head: true })
  .eq('user_id', user.id)
  .eq('function_name', 'analyze-food-photo')
  .gte('created_at', monthStart.toISOString());

const visionLimit = isPremium ? Infinity : 5;
if ((visionCount ?? 0) >= visionLimit) {
  return new Response(
    JSON.stringify({
      error: 'Monthly vision limit reached',
      limit: 5,
      remaining: 0,
      used: visionCount ?? 0,
      type: 'vision_limit_exceeded',
    }),
    { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
```

### VisionRateLimitError Class (follows VideoRateLimitError)
```typescript
// Source: src/lib/ai.ts lines 201-213
export class VisionRateLimitError extends Error {
  limit: number;
  used: number;
  remaining: number;

  constructor(message: string, limit: number, used: number) {
    super(message);
    this.name = 'VisionRateLimitError';
    this.limit = limit;
    this.used = used;
    this.remaining = Math.max(0, limit - used);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| expo-camera for all capture | expo-image-picker launchCameraAsync | Expo SDK 48+ | No need for custom camera UI for basic capture |
| ImageManipulator.manipulate() (legacy) | ImageManipulator.manipulateAsync() | SDK 50+ | Async API is current standard |
| Gemini 1.5 Flash vision | Gemini 2.5 Flash vision | 2025 | Better accuracy, same pricing tier, already integrated in project |
| Upload to Storage, pass URL to vision | Inline base64 in request | Current best practice for <20MB | Simpler, no cleanup, lower latency |

**Deprecated/outdated:**
- `ImageManipulator.manipulate()` (synchronous): Use `manipulateAsync()` instead
- `MediaTypeOptions.All`: Deprecated in newer SDK; use specific `Images` or `Videos`

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7 + jest-expo 55.0.11 |
| Config file | `jest.config.js` |
| Quick run command | `npx jest --testPathPattern=tests/lib/vision` |
| Full suite command | `npx jest` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | CameraSheet calls launchCameraAsync/launchImageLibraryAsync and returns URI | unit | `npx jest tests/components/CameraSheet.test.tsx -x` | Wave 0 |
| VIS-02 | compressForVision resizes to 1024px and returns base64 | unit | `npx jest tests/lib/vision.test.ts -x` | Wave 0 |
| VIS-03 | useCameraPermission shows pre-prompt on first use, recovery on denied | unit | `npx jest tests/hooks/useCameraPermission.test.ts -x` | Wave 0 |
| VIS-04 | analyzePhoto sends correct payload and parses Gemini response | unit | `npx jest tests/lib/vision.test.ts -x` | Wave 0 |
| VIS-05 | analyzePhoto throws VisionRateLimitError on 429 | unit | `npx jest tests/lib/vision.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest tests/lib/vision.test.ts tests/components/CameraSheet.test.tsx tests/hooks/useCameraPermission.test.ts --verbose`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/lib/vision.test.ts` -- covers VIS-02, VIS-04, VIS-05 (compressForVision, analyzePhoto, rate limit error handling)
- [ ] `tests/components/CameraSheet.test.tsx` -- covers VIS-01 (camera/gallery launch, result handling)
- [ ] `tests/hooks/useCameraPermission.test.ts` -- covers VIS-03 (pre-prompt flow, permission states)

## Sources

### Primary (HIGH confidence)
- Existing codebase: `supabase/functions/parse-recipe-url/index.ts` -- proven Edge Function pattern with auth, rate limiting, Gemini, caching
- Existing codebase: `src/lib/ai.ts` -- client-side Edge Function invocation, rate limit error handling
- Existing codebase: `src/hooks/useNotifications.ts` -- permission pre-prompt pattern with AsyncStorage
- Existing codebase: `src/components/ui/BottomSheet.tsx` -- reusable bottom sheet wrapper
- [Expo ImageManipulator docs](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/) -- manipulateAsync API, SaveFormat, base64 output
- [Expo ImagePicker docs](https://docs.expo.dev/versions/latest/sdk/imagepicker/) -- launchCameraAsync, permission APIs
- [Gemini Image Understanding docs](https://ai.google.dev/gemini-api/docs/image-understanding) -- inline_data format, 20MB limit, supported MIME types

### Secondary (MEDIUM confidence)
- [expo/expo#36861](https://github.com/expo/expo/issues/36861) -- performance degradation with high-res images on iOS

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries either already installed or part of Expo SDK; APIs verified against official docs
- Architecture: HIGH -- follows proven patterns already in codebase (parse-recipe-url, usePermissionPrompt, BottomSheet)
- Pitfalls: HIGH -- based on documented issues and codebase analysis; base64 handling and compression are well-understood

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- Expo SDK 55 is current, Gemini API is stable)

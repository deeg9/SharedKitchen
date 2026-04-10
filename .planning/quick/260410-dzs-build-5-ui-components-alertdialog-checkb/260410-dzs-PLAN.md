---
phase: quick
plan: 260410-dzs
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/ui/AlertDialog.tsx
  - src/components/ui/Checkbox.tsx
  - src/components/ui/Collapsible.tsx
  - src/components/ui/Select.tsx
  - src/components/ui/ActionMenu.tsx
  - src/components/grocery/GroceryItem.tsx
  - src/components/grocery/GrocerySection.tsx
  - src/components/pantry/OnHandList.tsx
  - src/components/social/FeedList.tsx
  - src/components/scan/ScanReviewScreen.tsx
  - src/components/scan/ListExtractReviewScreen.tsx
  - src/components/pantry/AddPantryItemSheet.tsx
  - src/components/recipes/RecipeForm.tsx
  - src/components/recipes/IngredientRow.tsx
  - src/components/premium/UpgradePrompt.tsx
  - src/components/premium/SubscriptionSheet.tsx
  - src/components/barcode/BarcodeResultCard.tsx
  - src/components/plan/SurpriseMe.tsx
  - src/components/notifications/PermissionPrompt.tsx
  - src/components/food/FoodResultRow.tsx
autonomous: true
must_haves:
  truths:
    - "All 5 UI components exist as named exports in src/components/ui/"
    - "No inline checkbox hacks remain (no ad-hoc circular Pressable+check icon patterns)"
    - "No inline collapsible patterns remain (no [collapsed, setCollapsed] + chevron toggle)"
    - "No inline category dropdown patterns remain (no manual toggle + option list)"
    - "Alert.alert/Alert.prompt calls replaced with AlertDialog where contextual"
    - "ActionSheetIOS/Alert fallback pattern replaced with cross-platform ActionMenu"
    - "Raw Modal usage in SurpriseMe and PermissionPrompt replaced with AlertDialog"
  artifacts:
    - path: "src/components/ui/AlertDialog.tsx"
      provides: "Modal dialog with title, message, optional TextInput, configurable buttons"
    - path: "src/components/ui/Checkbox.tsx"
      provides: "Circular checkbox with checked/unchecked states, animation, onToggle callback"
    - path: "src/components/ui/Collapsible.tsx"
      provides: "Collapsible section with header, chevron icon, animated expand/collapse"
    - path: "src/components/ui/Select.tsx"
      provides: "Single-value dropdown select with options list, replaces inline category dropdowns"
    - path: "src/components/ui/ActionMenu.tsx"
      provides: "Cross-platform action menu (replaces ActionSheetIOS + Alert.alert fallback)"
  key_links:
    - from: "src/components/grocery/GroceryItem.tsx"
      to: "src/components/ui/Checkbox.tsx"
      via: "import { Checkbox }"
    - from: "src/components/grocery/GrocerySection.tsx"
      to: "src/components/ui/Collapsible.tsx"
      via: "import { Collapsible }"
    - from: "src/components/social/FeedList.tsx"
      to: "src/components/ui/ActionMenu.tsx"
      via: "import { ActionMenu }"
---

<objective>
Build 5 reusable UI components (AlertDialog, Checkbox, Collapsible, Select, ActionMenu) in the Culinary Curator design system, then migrate all screens that use inline hacks or platform-specific fallbacks to use the new components.

Purpose: Eliminate ~29 Alert.alert calls, ~6 inline checkbox hacks, ~3 manual collapsible patterns, ~4 duplicate dropdown implementations, and platform-divergent action sheets with consistent, themed, reusable primitives.

Output: 5 new files in src/components/ui/, 15+ updated screen files with reduced LOC and consistent UX.
</objective>

<execution_context>
@/Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen/.claude/get-shit-done/workflows/execute-plan.md
@/Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/ui/Button.tsx (pattern reference: variant/size records, StyleSheet, theme imports, named export)
@src/components/ui/Card.tsx (pattern reference: simple component structure)
@src/components/ui/BottomSheet.tsx (pattern reference: uses @gorhom/bottom-sheet, backdrop, safe area)
@src/theme/colors.ts (all color tokens)
@src/theme/typography.ts (all typography tokens)
@src/theme/spacing.ts (spacing + borderRadius tokens)
@src/theme/shadows.ts (shadow presets)

<interfaces>
<!-- Existing design system patterns the executor MUST follow -->

Theme imports (every UI component uses this exact pattern):
```typescript
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing, borderRadius } from '../../theme/spacing';
import { shadows } from '../../theme/shadows';
```

Icon pattern:
```typescript
import { MaterialCommunityIcons } from '@expo/vector-icons';
```

Animation pattern:
```typescript
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
```

Component export pattern: `export function ComponentName({ ...props }: ComponentNameProps) {}`
Style pattern: `const styles = StyleSheet.create({ ... });` at bottom of file
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build 5 UI components</name>
  <files>
    src/components/ui/AlertDialog.tsx
    src/components/ui/Checkbox.tsx
    src/components/ui/Collapsible.tsx
    src/components/ui/Select.tsx
    src/components/ui/ActionMenu.tsx
  </files>
  <action>
Create all 5 components following the exact patterns from Button.tsx/Card.tsx (theme imports, interface definition, named export, StyleSheet.create at bottom).

**AlertDialog.tsx** — Modal-based dialog replacing Alert.alert, Alert.prompt, and raw Modal usage:
```typescript
interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  // Optional text input (replaces Alert.prompt)
  input?: {
    placeholder?: string;
    defaultValue?: string;
    keyboardType?: KeyboardType;
    onChangeText?: (text: string) => void;
  };
  actions: AlertDialogAction[];
}
interface AlertDialogAction {
  label: string;
  onPress: (inputValue?: string) => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}
```
- Use React Native Modal with transparent background + centered card
- Scrim: rgba(0,0,0,0.4) backdrop with Pressable to dismiss (if no required action)
- Card: surfaceContainerLowest bg, borderRadius.xl, padding spacing.lg
- Title: typography.titleMd, color onSurface
- Message: typography.bodyMd, color onSurfaceVariant, marginTop spacing.sm
- Input (when provided): surfaceContainerHigh bg, borderRadius.md, padding spacing.md, typography.bodyMd, marginTop spacing.md
- Actions row: flexDirection row, justifyContent flex-end, gap spacing.sm, marginTop spacing.lg
- Action buttons: use Pressable (not Button component — dialogs use text buttons). Destructive variant uses colors.error text. Primary uses colors.primary text. Secondary uses colors.onSurfaceVariant text.
- Track input value with useState, pass to onPress callback

**Checkbox.tsx** — Circular checkbox matching the GroceryItem inline pattern:
```typescript
interface CheckboxProps {
  checked: boolean;
  onToggle: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  testID?: string;
}
```
- Size sm=20, md=24 (md is default, matches current GroceryItem 24px)
- Unchecked: borderWidth 2, borderColor colors.outline, transparent bg
- Checked: backgroundColor colors.primary, borderColor colors.primary, white check icon inside
- Use react-native-reanimated: withTiming scale animation (0.8 -> 1.0) on check, 200ms
- borderRadius: borderRadius.full
- Pressable wrapper with hitSlop 8

**Collapsible.tsx** — Animated section with header and collapsible content:
```typescript
interface CollapsibleProps {
  header: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  collapsed?: boolean; // controlled mode
  onToggle?: (collapsed: boolean) => void;
  testID?: string;
}
```
- Support both controlled (collapsed + onToggle) and uncontrolled (defaultCollapsed) modes
- Chevron icon: chevron-down when collapsed, chevron-up when expanded, colors.onSurfaceVariant, size 20
- Header row: Pressable, flexDirection row, alignItems center, justifyContent space-between
- Use react-native-reanimated for height animation: measure content height with onLayout, animate maxHeight with withTiming 250ms
- Overflow hidden on content container during animation
- Do NOT include any section-specific styling (icon circles, badges) — the header prop handles that

**Select.tsx** — Single-value dropdown replacing inline category dropdowns:
```typescript
interface SelectOption {
  label: string;
  value: string;
}
interface SelectProps {
  options: SelectOption[];
  value: string | null;
  onValueChange: (value: string) => void;
  placeholder?: string;
  testID?: string;
}
```
- Trigger: Pressable with surfaceContainerHigh bg, borderRadius.md, padding spacing.md, flexDirection row, justifyContent space-between
- Trigger text: typography.bodyMd, color onSurface (or onSurfaceVariant for placeholder)
- Chevron icon: chevron-down/chevron-up, size 16, colors.onSurfaceVariant
- Dropdown: position absolute, top '100%', left 0, right 0, surfaceContainerLowest bg, borderRadius.md, shadows.float, zIndex 10, maxHeight 200
- Options: Pressable items, paddingHorizontal spacing.md, paddingVertical spacing.sm
- Active option: backgroundColor primaryFixed, text color primary
- Inactive option: typography.bodyMd, color onSurface
- Close dropdown on selection or outside press (use a Pressable backdrop when open)

**ActionMenu.tsx** — Cross-platform action menu replacing ActionSheetIOS + Alert fallback:
```typescript
interface ActionMenuItem {
  label: string;
  icon?: string; // MaterialCommunityIcons name
  onPress: () => void;
  destructive?: boolean;
}
interface ActionMenuProps {
  visible: boolean;
  onClose: () => void;
  items: ActionMenuItem[];
  title?: string;
}
```
- Use React Native Modal with transparent bg, justifyContent flex-end (slides up from bottom)
- Scrim: rgba(0,0,0,0.4) backdrop Pressable
- Menu card: surfaceContainerLowest bg, borderTopLeftRadius/borderTopRightRadius borderRadius.xl, paddingTop spacing.md, paddingBottom spacing.lg (+ safe area bottom via useSafeAreaInsets)
- Optional title: typography.labelMd, color onSurfaceVariant, textAlign center, marginBottom spacing.sm
- Handle bar: centered View, width 36, height 4, borderRadius 2, backgroundColor outlineVariant, marginBottom spacing.md
- Items: Pressable, flexDirection row, alignItems center, paddingVertical spacing.md, paddingHorizontal spacing.lg, gap spacing.md
- Item text: typography.bodyLg, color onSurface (or colors.error if destructive)
- Item icon: size 22, color matching text
- Cancel item: always last, separated by 1px outlineVariant border, text "Cancel", color onSurfaceVariant
  </action>
  <verify>
    <automated>cd /Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen && npx tsc --noEmit --pretty 2>&1 | head -50</automated>
  </verify>
  <done>All 5 components compile without errors, follow design system patterns (theme imports, StyleSheet.create, named exports, typed interfaces), and use react-native-reanimated for animations where specified.</done>
</task>

<task type="auto">
  <name>Task 2: Migrate screens to use new UI components</name>
  <files>
    src/components/grocery/GroceryItem.tsx
    src/components/grocery/GrocerySection.tsx
    src/components/pantry/OnHandList.tsx
    src/components/social/FeedList.tsx
    src/components/scan/ScanReviewScreen.tsx
    src/components/scan/ListExtractReviewScreen.tsx
    src/components/pantry/AddPantryItemSheet.tsx
    src/components/recipes/RecipeForm.tsx
    src/components/recipes/IngredientRow.tsx
    src/components/premium/UpgradePrompt.tsx
    src/components/premium/SubscriptionSheet.tsx
    src/components/barcode/BarcodeResultCard.tsx
    src/components/plan/SurpriseMe.tsx
    src/components/notifications/PermissionPrompt.tsx
    src/components/food/FoodResultRow.tsx
  </files>
  <action>
Migrate each file to use the new components. Read each file first, then apply targeted replacements. Preserve ALL existing business logic — only change the UI primitives.

**Checkbox migrations:**
- `GroceryItem.tsx`: Replace lines 94-104 (the inline `<View style={[styles.checkbox, ...]}>` + MaterialCommunityIcons check) with `<Checkbox checked={item.is_checked} onToggle={() => handleToggle()} />`. Remove the checkbox/checkboxChecked styles. Keep the rest of the component identical.
- `GrocerySection.tsx`: The "Completed" section uses check-circle-outline icon in SECTION_ICONS — this is a section icon, NOT a checkbox. Leave as-is.
- `IngredientRow.tsx`: Replace any inline check pattern with `<Checkbox checked={...} onToggle={...} size="sm" />`
- `UpgradePrompt.tsx` and `SubscriptionSheet.tsx`: Replace feature checkmark patterns with `<Checkbox checked={true} disabled size="sm" />` (static display checkmarks)

**Collapsible migrations:**
- `GrocerySection.tsx`: Replace the manual [collapsed, setCollapsed] + Pressable header + chevron + conditional render with:
  ```tsx
  <Collapsible
    defaultCollapsed={defaultCollapsed}
    header={
      <View style={styles.headerLeft}>
        <View style={styles.iconCircle}>...</View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.badge}>...</View>
      </View>
    }
  >
    {items.map(...)}
  </Collapsible>
  ```
  Remove the collapsed state, the Pressable header wrapper, and the chevron icon (Collapsible provides its own). Keep headerLeft, iconCircle, badge styles.
- `OnHandList.tsx (PantrySection)`: Same pattern — replace the internal PantrySection's collapsed state + Pressable + chevron with `<Collapsible header={...}>`. Keep the headerLeft/title/badge styles.
- `FoodResultRow.tsx`: Replace expandable detail section with Collapsible.

**Select migrations:**
- `ScanReviewScreen.tsx`: Replace lines 205-242 (the categorySelect Pressable + categoryDropdown View + CATEGORY_OPTIONS.map) with `<Select options={CATEGORY_OPTIONS.map(c => ({label: c, value: c}))} value={item.category} onValueChange={(v) => handleEditField(item.id, 'category', v)} />`. Remove categoryDropdownId state and all related styles.
- `ListExtractReviewScreen.tsx`: Identical migration as ScanReviewScreen (same pattern). Remove categoryDropdownId state and related styles.
- `AddPantryItemSheet.tsx`: Replace inline category dropdown with Select component.
- `SearchableSelect.tsx`: Leave as-is — this is a multi-select with search, different from single-value Select. It serves a different purpose (dietary preferences).

**AlertDialog migrations:**
- `GroceryItem.tsx`: Replace `Alert.prompt('Item Cost', ...)` (lines 52-85) with AlertDialog state:
  ```tsx
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [costInput, setCostInput] = useState('');
  ```
  Add `<AlertDialog visible={costDialogOpen} onClose={() => setCostDialogOpen(false)} title="Item Cost" message={`How much was ${item.name}?`} input={{ placeholder: '0.00', defaultValue: item.estimated_price?.toFixed(2) || '', keyboardType: 'decimal-pad', onChangeText: setCostInput }} actions={[{ label: 'Skip', variant: 'secondary', onPress: () => { toggleItem(item.id, true, userId); setCostDialogOpen(false); }}, { label: 'Save', variant: 'primary', onPress: () => { /* existing save logic */ setCostDialogOpen(false); }}]} />`
  In handleToggle, instead of Alert.prompt, set setCostDialogOpen(true).
- `SurpriseMe.tsx`: Replace the raw `<Modal>` wrapper with AlertDialog. The SurpriseMe has complex content (recipe card, alternatives), so instead keep Modal but restyle it to use AlertDialog's visual patterns (scrim, centered card, borderRadius.xl). Actually — SurpriseMe is too complex for AlertDialog. Leave it using Modal but ensure it imports from react-native consistently.
- `PermissionPrompt.tsx`: Replace raw Modal with AlertDialog. Read the file first to determine the title/message/actions. The permission prompt is a simple "enable notifications" dialog — perfect AlertDialog candidate.
- `RecipeForm.tsx`: Replace Alert.alert for permission prompt with AlertDialog.
- `BarcodeResultCard.tsx`: Replace Alert.alert confirmations with AlertDialog.
- `FeedList.tsx` Alert.alert calls (lines 152-164 "Reported" confirmation, line 154-165 "Block Kitchen" confirmation, line 197 error alert): Replace with AlertDialog. Add state: `const [alertConfig, setAlertConfig] = useState<{visible, title, message, actions} | null>(null)`. Use a single AlertDialog instance controlled by alertConfig.

**ActionMenu migration:**
- `FeedList.tsx`: Replace the entire handleLongPress function (lines 140-182) which uses Platform.OS branching between ActionSheetIOS and Alert.alert. Replace with ActionMenu state:
  ```tsx
  const [menuPost, setMenuPost] = useState<FeedPost | null>(null);
  ```
  On long press: `setMenuPost(post)`. Render:
  ```tsx
  <ActionMenu
    visible={!!menuPost}
    onClose={() => setMenuPost(null)}
    title="Options"
    items={[
      { label: 'Report Post', icon: 'flag-outline', onPress: () => { reportContent(...); setMenuPost(null); setAlertConfig({visible: true, title: 'Reported', message: 'Thank you for reporting.', actions: [{label: 'OK', onPress: () => setAlertConfig(null), variant: 'primary'}]}); }},
      { label: 'Block Kitchen', icon: 'block-helper', destructive: true, onPress: () => { setMenuPost(null); setAlertConfig({visible: true, title: 'Block Kitchen', message: 'You will no longer see posts from this kitchen.', actions: [{label: 'Cancel', variant: 'secondary', onPress: () => setAlertConfig(null)}, {label: 'Block', variant: 'destructive', onPress: () => { blockKitchen(...); setAlertConfig(null); }}]}); }},
    ]}
  />
  ```
  Remove ActionSheetIOS import and Platform import (if no longer needed elsewhere in the file).

**Important:** For every file, remove now-unused imports (Alert from react-native, ActionSheetIOS, Platform if no longer needed). Remove now-unused StyleSheet entries that were replaced by component internals.
  </action>
  <verify>
    <automated>cd /Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen && npx tsc --noEmit --pretty 2>&1 | head -80</automated>
  </verify>
  <done>All 15 files compile. No inline checkbox patterns remain (grep for "borderRadius.*full.*borderWidth.*2.*borderColor.*outline" returns 0 matches in non-ui files). No inline collapsible [collapsed, setCollapsed] patterns remain in GrocerySection or OnHandList. No categoryDropdownId state in ScanReviewScreen or ListExtractReviewScreen. No ActionSheetIOS import in FeedList. No Alert.prompt calls in GroceryItem. No raw Modal in PermissionPrompt.</done>
</task>

<task type="auto">
  <name>Task 3: Verify removals and run full type check</name>
  <files>
    src/components/ui/AlertDialog.tsx
    src/components/ui/Checkbox.tsx
    src/components/ui/Collapsible.tsx
    src/components/ui/Select.tsx
    src/components/ui/ActionMenu.tsx
  </files>
  <action>
Run verification commands to confirm the migration is complete:

1. TypeScript compilation: `npx tsc --noEmit` — must pass with 0 errors
2. Verify no remaining inline checkbox hacks outside ui/: `grep -rn "borderWidth.*2.*borderColor.*outline" src/components/ --include="*.tsx" | grep -v "ui/"` — should return nothing (or only unrelated patterns)
3. Verify no remaining Alert.prompt: `grep -rn "Alert\.prompt" src/ --include="*.tsx"` — should return 0 matches
4. Verify no remaining ActionSheetIOS: `grep -rn "ActionSheetIOS" src/ --include="*.tsx"` — should return 0 matches
5. Verify no inline collapsible in migrated files: `grep -n "setCollapsed" src/components/grocery/GrocerySection.tsx src/components/pantry/OnHandList.tsx` — should return 0 matches
6. Verify all 5 new components export correctly: `grep -rn "export function" src/components/ui/AlertDialog.tsx src/components/ui/Checkbox.tsx src/components/ui/Collapsible.tsx src/components/ui/Select.tsx src/components/ui/ActionMenu.tsx` — should return 5 lines

If any verification fails, fix the issue. Common fixes:
- Missing import: add the import
- Type error: check interface matches usage
- Leftover unused import: remove it
  </action>
  <verify>
    <automated>cd /Users/deeg/Downloads/b_PtJ6SJaZFpQ-1773178607401/SharedKitchen && npx tsc --noEmit 2>&1 | tail -5 && echo "---" && grep -rn "Alert\.prompt\|ActionSheetIOS" src/ --include="*.tsx" | wc -l</automated>
  </verify>
  <done>TypeScript compiles with 0 errors. Zero remaining Alert.prompt calls. Zero remaining ActionSheetIOS imports. All 5 UI components export named functions. Inline checkbox/collapsible/dropdown patterns eliminated from migrated files.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

No new trust boundaries introduced. These are purely UI presentation components with no network calls, authentication, or data persistence. All business logic (toggleItem, blockKitchen, reportContent, etc.) remains unchanged in existing store methods.

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-quick-01 | T (Tampering) | AlertDialog input | accept | Input is used for cost entry (decimal), already validated by parseFloat in existing GroceryItem logic. No new validation surface. |
| T-quick-02 | D (Denial of Service) | Collapsible animation | accept | Reanimated withTiming is bounded (250ms). No recursive or unbounded computation. |
</threat_model>

<verification>
1. `npx tsc --noEmit` passes with 0 errors
2. `grep -rn "Alert\.prompt" src/ --include="*.tsx"` returns 0 matches
3. `grep -rn "ActionSheetIOS" src/ --include="*.tsx"` returns 0 matches
4. All 5 files exist in src/components/ui/ with named exports
5. Migrated files import from ../ui/ instead of implementing inline
</verification>

<success_criteria>
- 5 new UI components in src/components/ui/ following design system conventions
- GroceryItem uses Checkbox + AlertDialog (no inline checkbox, no Alert.prompt)
- GrocerySection and OnHandList PantrySection use Collapsible (no manual collapsed state)
- ScanReviewScreen and ListExtractReviewScreen use Select (no inline dropdown)
- FeedList uses ActionMenu + AlertDialog (no ActionSheetIOS, no platform branching)
- All files compile, no regressions in existing business logic
</success_criteria>

<output>
After completion, create `.planning/quick/260410-dzs-build-5-ui-components-alertdialog-checkb/260410-dzs-SUMMARY.md`
</output>

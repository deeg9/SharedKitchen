import { getShareExtensionKey } from "expo-share-intent";

export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: string;
}) {
  try {
    if (path.includes(`dataUrl=${getShareExtensionKey()}`)) {
      // Share intent received -- route to add recipe screen
      // The ShareIntentProvider + useShareIntentContext in add.tsx
      // will pick up the actual URL data
      return "/(app)/recipe/add?fromShare=1";
    }
    return path;
  } catch {
    return "/";
  }
}

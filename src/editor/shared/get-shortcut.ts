import { IS_APPLE } from "./environment";
type ModifierKey = "ctrl";


export function getShortcut(modifierKey: ModifierKey, suffix: string) {
  const prefixesWindows = {
    ctrl: "Ctrl+"
  };
  const prefixesMac = {
    ctrl: "⌘"
  };
  const prefixes = IS_APPLE ? prefixesMac : prefixesWindows;
  const prefix = prefixes[modifierKey] || "error";
  return prefix + suffix;
}

export function getShortcutOptions(modifierKey: ModifierKey, suffix: string) {
  return { shortcut: getShortcut(modifierKey, suffix)};
}
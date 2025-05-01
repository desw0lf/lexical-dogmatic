import { createCommand } from "lexical";
// ? TYPES:
import type { LexicalCommand } from "lexical";

export const INSERT_INLINE_COMMAND: LexicalCommand<void> = createCommand(
  "INSERT_INLINE_COMMAND",
);
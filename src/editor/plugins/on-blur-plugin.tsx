import React, { useLayoutEffect } from "react";
import { $getRoot } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { BLUR_COMMAND, COMMAND_PRIORITY_EDITOR } from "lexical";
// ? TYPES:
import type { EditorState, LexicalEditor } from "lexical";

interface OnBlurPluginProps {
  onBlur: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>, editorTextState: string) => void;
}


export const OnBlurPlugin: React.FC<OnBlurPluginProps> = ({ onBlur }) => {
  const [editor] = useLexicalComposerContext();
  useLayoutEffect(() => {
    return editor.registerCommand(BLUR_COMMAND, (_payload, editor) => {
      const tags: Set<string> = new Set([]); // TODO
      const editorState = editor.getEditorState();
      const editorTextState = editorState.read(() => $getRoot().getTextContent());
      onBlur(editorState, editor, tags, editorTextState);
      return true;
    }, COMMAND_PRIORITY_EDITOR);
  }, [onBlur]);
  return null;
}
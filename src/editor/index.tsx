import React, { useState } from "react";
// import { $getRoot } from "lexical";
import ToolbarPlugin from "./plugins/toolbar-plugin";
// import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
// import { TRANSFORMERS, $convertToMarkdownString } from "@lexical/markdown";
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin";
import { InitialConfigType, LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ClickableLinkPlugin } from "@lexical/react/LexicalClickableLinkPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
// import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import ListMaxIndentLevelPlugin from "./plugins/list-max-indent-level-plugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
// import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import LinkPlugin from "./plugins/link-plugin";
import AutoLinkPlugin from "./plugins/auto-link-plugin";
import TabFocusPlugin from "./plugins/tab-focus-plugin";
import FloatingTextFormatToolbarPlugin from "./plugins/floating-text-format-toolbar-plugin";
import FloatingLinkEditorPlugin from "./plugins/floating-link-editor-plugin";
import { MaxLengthPlugin } from "./plugins/max-length-plugin";
import { OnBlurPlugin } from "./plugins/on-blur-plugin";
//
import { DEFAULT_NODES } from "./nodes";
//
import defaultTheme from "./themes/default";
// ? Types:
import type { EditorState, LexicalEditor } from "lexical";
// import { AddParameters } from "../../types/utility";
// import type { EditorState } from "lexical";

// When the editor changes, you can get notified via the
// LexicalOnChangePlugin!
// function onChange2(editorState: EditorState) {
//   editorState.read(() => {
//     // Read the contents of the EditorState here.
//     const root = $getRoot();
//     const markdown = $convertToMarkdownString(TRANSFORMERS);
//     console.log({ markdown });

//     console.log({ root });
//   });
//   console.log(editorState);
// }

// Lexical React plugins are React components, which makes them
// highly composable. Furthermore, you can lazy load plugins if
// desired, so you don't pay the cost for plugins until you
// actually use them.
// function MyCustomAutoFocusPlugin() {
//   const [editor] = useLexicalComposerContext();

//   useEffect(() => {
//     // Focus the editor when the effect fires!
//     editor.focus();
//   }, [editor]);

//   return null;
// }

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
// function onError(error: any) {
//   console.error(error);
// }

// TODO inputStyles

export interface LexicalRichEditorProps extends Partial<Omit<InitialConfigType, "nodes" | "editable">> {
  type?: "editable" | "readonly" | "preview";
  placeholder?: string;
  // config?: Partial<InitialConfigType>;
  // initialState?: InitialConfigType["editorState"];
  onChange?: Parameters<typeof OnChangePlugin>[0]["onChange"];
  onBlur?: (editorState: EditorState, editor: LexicalEditor, tags: Set<string>, editorTextState: string) => void;
  maxLength?: number;
  displayUndoRedo?: boolean;
  displayFloatingText?: boolean;
  displayFontFamily?: boolean;
  displayFontSize?: boolean;
  displayBackgroundColour?: boolean;
}

export const LexicalRichEditor: React.FC<LexicalRichEditorProps> = ({
  type = "editable",
  placeholder = "",
  editorState,
  namespace = "MyEditor",
  theme = defaultTheme,
  onError = (error: any) => console.error(error),
  onChange,
  onBlur,
  maxLength = 10000,
  displayUndoRedo = false,
  displayFloatingText = false,
  displayFontFamily = false,
  displayFontSize = false,
  displayBackgroundColour = false
}) => {
  const [floatingAnchorElem, setFloatingAnchorElem] = useState<HTMLDivElement | null>(null);
  const defaultConfig = {
    namespace,
    theme,
    onError,
    nodes: DEFAULT_NODES,
    editable: type === "editable" ? true : false,
    editorState
  };

  const onRef = (_floatingAnchorElem: HTMLDivElement) => {
    if (_floatingAnchorElem !== null) {
      setFloatingAnchorElem(_floatingAnchorElem);
    }
  };

  return (
    <LexicalComposer initialConfig={defaultConfig}>
      <div className="lexical__container" data-type={type}>
        {type !== "preview" && <ToolbarPlugin displayUndoRedo={displayUndoRedo} displayFontFamily={displayFontFamily} displayFontSize={displayFontSize} displayBackgroundColour={displayBackgroundColour} />}
        <div className="lexical__inner" data-name={defaultConfig.namespace}>
          <RichTextPlugin
            contentEditable={<div ref={onRef} className="lexical__input"><ContentEditable /></div>}
            placeholder={<div className="lexical__placeholder"><p>{placeholder}</p></div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          {type !== "preview" && (
            <>
              {!!onChange && <OnChangePlugin onChange={onChange} />}
              {!!onBlur && <OnBlurPlugin onBlur={onBlur} />}
            </>
          )}
          <HistoryPlugin />
          <ListPlugin />
          <LinkPlugin />
          {type !== "editable" && <ClickableLinkPlugin />}
          <AutoLinkPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          {/* <MyCustomAutoFocusPlugin /> */}
          <TabFocusPlugin />
          <TabIndentationPlugin />
          {type !== "preview" && floatingAnchorElem && (
            <>
              <FloatingLinkEditorPlugin anchorElem={floatingAnchorElem} />
              {displayFloatingText && <FloatingTextFormatToolbarPlugin anchorElem={floatingAnchorElem} />}
            </>
          )}
          <HorizontalRulePlugin />
          <MaxLengthPlugin maxLength={maxLength} />
          {/* <MarkdownShortcutPlugin transformers={TRANSFORMERS} /> */}
        </div>
      </div>
    </LexicalComposer>
  );
};

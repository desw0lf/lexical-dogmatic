/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalEditor } from 'lexical';

import {
  $createCodeNode,
  // $isCodeNode,
  // CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  // CODE_LANGUAGE_MAP,
  // getLanguageFriendlyName,
} from '@lexical/code';
import {$isLinkNode, TOGGLE_LINK_COMMAND} from '@lexical/link';
import {
  $isListNode,
  // INSERT_CHECK_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
// import {INSERT_EMBED_COMMAND} from '@lexical/react/LexicalAutoEmbedPlugin';
import {useLexicalComposerContext} from '@lexical/react/LexicalComposerContext';
import {$isDecoratorBlockNode} from '@lexical/react/LexicalDecoratorBlockNode';
import {INSERT_HORIZONTAL_RULE_COMMAND} from '@lexical/react/LexicalHorizontalRuleNode';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  $isQuoteNode,
} from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
  $setBlocksType,
} from '@lexical/selection';
import {$isTableNode, $isTableSelection} from '@lexical/table';
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister,
} from '@lexical/utils';
import {
  $createParagraphNode,
  // $getNodeByKey,
  // $getRoot,
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_NORMAL,
  // DEPRECATED_$isGridSelection,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  KEY_MODIFIER_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from 'lexical';
import React, {useCallback, useEffect, useState} from 'react';

// import {IS_APPLE} from '../shared/environment';
import { getShortcutOptions } from '../shared/get-shortcut';

// import useModal from '../../hooks/useModal';
// import catTypingGif from '../../images/cat-typing.gif';
// import {$createStickyNode} from '../../nodes/StickyNode';
import DropDown, {DropDownItem} from '../ui/DropDown';
import DropdownColorPicker from '../ui/DropdownColorPicker';
import {getSelectedNode} from '../utils/getSelectedNode';
import {sanitizeUrl} from '../utils/url';
import { withTranslation } from "../../locale/temp";
// ? TYPES:
import { ListType } from "@lexical/list";
import { HeadingTagType } from "@lexical/rich-text";
import { WithTranslation } from "../../locale/temp";
// import {EmbedConfigs} from '../AutoEmbedPlugin';
// import {INSERT_COLLAPSIBLE_COMMAND} from '../CollapsiblePlugin';
// import {InsertEquationDialog} from '../EquationsPlugin';
// import {INSERT_EXCALIDRAW_COMMAND} from '../ExcalidrawPlugin';
// import {
//   INSERT_IMAGE_COMMAND,
//   InsertImageDialog,
//   InsertImagePayload,
// } from '../ImagesPlugin';
// import {InsertInlineImageDialog} from '../InlineImagePlugin';
// import {INSERT_PAGE_BREAK} from '../PageBreakPlugin';
// import {InsertPollDialog} from '../PollPlugin';
// import {InsertNewTableDialog, InsertTableDialog} from '../TablePlugin';

type BlockType = ListType | HeadingTagType | "code" | "paragraph" | "quote";

const blockTypeToBlockName = { // fake enum
  bullet: "bullet",
  check: "check",
  code: "code",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  number: "number",
  paragraph: "paragraph",
  quote: "quote",
} as const;


const rootTypeToRootName = {
  root: 'Root',
  table: 'Table',
};

// function getCodeLanguageOptions(): [string, string][] {
//   const options: [string, string][] = [];

//   for (const [lang, friendlyName] of Object.entries(
//     CODE_LANGUAGE_FRIENDLY_NAME_MAP,
//   )) {
//     options.push([lang, friendlyName]);
//   }

//   return options;
// }

// const CODE_LANGUAGE_OPTIONS = getCodeLanguageOptions();

const DEFAULTS = {
  FONT_FAMILY: "Open Sans",
  FONT_SIZE: "13px",
  FONT_COLOUR: "#00112b",
  BACKGROUND_COLOUR: "#ffffff"
} as const;

const FONT_FAMILY_OPTIONS: [string, string][] = [
  [DEFAULTS.FONT_FAMILY, DEFAULTS.FONT_FAMILY],
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New'],
  ['Georgia', 'Georgia'],
  ['Times New Roman', 'Times New Roman'],
  ['Trebuchet MS', 'Trebuchet MS'],
  ['Verdana', 'Verdana'],
];

const FONT_SIZE_OPTIONS: [string, string][] = [
  ['10px', '10px'],
  ['11px', '11px'],
  ['12px', '12px'],
  ['13px', '13px'],
  ['14px', '14px'],
  ['15px', '15px'],
  ['16px', '16px'],
  ['17px', '17px'],
  ['18px', '18px'],
  ['19px', '19px'],
  ['20px', '20px'],
];

function dropDownActiveClass(active: boolean) {
  if (active) return 'active dropdown-item-active';
  else return '';
}

interface BlockFormatDropDownPropsBase {
  blockType: BlockType;
  rootType: keyof typeof rootTypeToRootName;
  editor: LexicalEditor;
  disabled?: boolean;
}

type BlockFormatDropDownProps = BlockFormatDropDownPropsBase & WithTranslation;

const BlockFormatDropDown = withTranslation()(BlockFormatDropDownWoT) as React.FC<BlockFormatDropDownPropsBase>;

function BlockFormatDropDownWoT({
  editor,
  blockType,
  // rootType,
  disabled = false,
  t,
}: BlockFormatDropDownProps) {
  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if (
        $isRangeSelection(selection) ||
        $isTableSelection(selection)
      ) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          $isTableSelection(selection)
        ) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  // const formatCheckList = () => {
  //   if (blockType !== 'check') {
  //     editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined);
  //   } else {
  //     editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
  //   }
  // };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) ||
          $isTableSelection(selection)
        ) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        let selection = $getSelection();

        if (
          $isRangeSelection(selection) ||
          $isTableSelection(selection)
        ) {
          if (selection.isCollapsed()) {
            $setBlocksType(selection, () => $createCodeNode());
          } else {
            const textContent = selection.getTextContent();
            const codeNode = $createCodeNode();
            selection.insertNodes([codeNode]);
            selection = $getSelection();
            if ($isRangeSelection(selection))
              selection.insertRawText(textContent);
          }
        }
      });
    }
  };

  return (
    <DropDown
      disabled={disabled}
      buttonClassName="toolbar-item block-controls"
      buttonIconClassName={'icon block-type ' + blockType}
      buttonLabel={t("lexical.blockName." + blockType)}
      buttonAriaLabel="Formatting options for text style">
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'paragraph')}
        onClick={formatParagraph}>
        <i className="icon paragraph" />
        <span className="text">{t("lexical.blockName.paragraph")}</span>
      </DropDownItem>
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'h1')}
        onClick={() => formatHeading('h1')}>
        <i className="icon h1" />
        <span className="text">{t("lexical.blockName.h1")}</span>
      </DropDownItem>
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'h2')}
        onClick={() => formatHeading('h2')}>
        <i className="icon h2" />
        <span className="text">{t("lexical.blockName.h2")}</span>
      </DropDownItem>
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'h3')}
        onClick={() => formatHeading('h3')}>
        <i className="icon h3" />
        <span className="text">{t("lexical.blockName.h3")}</span>
      </DropDownItem>
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'bullet')}
        onClick={formatBulletList}>
        <i className="icon bullet-list" />
        <span className="text">{t("lexical.blockName.bullet")}</span>
      </DropDownItem>
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'number')}
        onClick={formatNumberedList}>
        <i className="icon numbered-list" />
        <span className="text">{t("lexical.blockName.number")}</span>
      </DropDownItem>
      {/* <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'check')}
        onClick={formatCheckList}>
        <i className="icon check-list" />
        <span className="text">Check List</span>
      </DropDownItem> */}
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'quote')}
        onClick={formatQuote}>
        <i className="icon quote" />
        <span className="text">{t("lexical.blockName.quote")}</span>
      </DropDownItem>
      <DropDownItem
        className={'item ' + dropDownActiveClass(blockType === 'code')}
        onClick={formatCode}>
        <i className="icon code" />
        <span className="text">{t("lexical.blockName.code")}</span>
      </DropDownItem>
    </DropDown>
  );
}

function Divider() {
  return <div className="divider" />;
}

interface FontDropDownPropsBase {
  editor: LexicalEditor;
  value: string;
  style: "font-family" | "font-size";
  disabled?: boolean;
}

type FontDropDownProps = FontDropDownPropsBase & WithTranslation;

const FontDropDown = withTranslation()(FontDropDownWoT) as React.FC<FontDropDownPropsBase>;

function FontDropDownWoT({
  editor,
  value,
  style,
  disabled = false,
  t,
}: FontDropDownProps) {
  const handleClick = useCallback(
    (option: string) => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, {
            [style]: option,
          });
        }
      });
    },
    [editor, style],
  );

  return (
    <DropDown
      disabled={disabled}
      buttonClassName={'toolbar-item ' + style}
      buttonLabel={value}
      buttonIconClassName={
        style === 'font-family' ? 'icon block-type font-family' : ''
      }
      buttonAriaLabel={t("lexical.FormattingOptions", { context: style })}>
      {(style === 'font-family' ? FONT_FAMILY_OPTIONS : FONT_SIZE_OPTIONS).map(
        ([option, text]) => (
          <DropDownItem
            className={`item ${dropDownActiveClass(value === option)} ${
              style === 'font-size' ? 'fontsize-item' : ''
            }`}
            onClick={() => handleClick(option)}
            key={option}>
            <span className="text" style={{
              fontSize: style === 'font-size' ? text : undefined,
              fontFamily: style === 'font-family' ? text : undefined,
            }}>{text}</span>
          </DropDownItem>
        ),
      )}
    </DropDown>
  );
}

interface ToolbarPluginPropsBase {
  displayUndoRedo: boolean;
  displayFontFamily: boolean;
  displayFontSize: boolean;
  displayBackgroundColour: boolean;
}

type ToolbarPluginProps = ToolbarPluginPropsBase & WithTranslation;

const ToolbarPlugin: React.FC<ToolbarPluginProps> = ({ displayUndoRedo, displayFontFamily, displayFontSize, displayBackgroundColour, t }) => {
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);
  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const [rootType, setRootType] =
    useState<keyof typeof rootTypeToRootName>("root");
  // const [selectedElementKey, setSelectedElementKey] = useState<NodeKey | null>(
  //   null,
  // );
  const [fontSize, setFontSize] = useState<string>(DEFAULTS.FONT_SIZE);
  const [fontColor, setFontColor] = useState<string>(DEFAULTS.FONT_COLOUR);
  const [bgColor, setBgColor] = useState<string>(DEFAULTS.BACKGROUND_COLOUR);
  const [fontFamily, setFontFamily] = useState<string>(DEFAULTS.FONT_FAMILY);
  const [isLink, setIsLink] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSubscript, setIsSubscript] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // const [modal, showModal] = useModal();
  const [isRTL, setIsRTL] = useState(false);
  // const [codeLanguage, setCodeLanguage] = useState<string>('');
  const [isEditable, setIsEditable] = useState(() => editor.isEditable());

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      let element =
        anchorNode.getKey() === "root"
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent();
              return parent !== null && $isRootOrShadowRoot(parent);
            });

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow();
      }

      const elementKey = element.getKey();
      const elementDOM = activeEditor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsSubscript(selection.hasFormat('subscript'));
      setIsSuperscript(selection.hasFormat('superscript'));
      setIsCode(selection.hasFormat('code'));
      setIsRTL($isParentElementRTL(selection));

      // Update links
      const node = getSelectedNode(selection);
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }

      const tableNode = $findMatchingParent(node, $isTableNode);
      if ($isTableNode(tableNode)) {
        setRootType('table');
      } else {
        setRootType('root');
      }

      if (elementDOM !== null) {
        // setSelectedElementKey(elementKey);
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType<ListNode>(
            anchorNode,
            ListNode,
          );
          const type = parentList
            ? parentList.getListType()
            : element.getListType();
          setBlockType(type);
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          if (type in blockTypeToBlockName) {
            setBlockType(type as BlockType);
          }
          // if ($isCodeNode(element)) {
          //   const language =
          //     element.getLanguage() as keyof typeof CODE_LANGUAGE_MAP;
          //   setCodeLanguage(
          //     language ? CODE_LANGUAGE_MAP[language] || language : '',
          //   );
          //   return;
          // }
        }
      }
      // Handle buttons
      setFontSize(
        $getSelectionStyleValueForProperty(selection, "font-size", DEFAULTS.FONT_SIZE),
      );
      setFontColor(
        $getSelectionStyleValueForProperty(selection, "color", DEFAULTS.FONT_COLOUR),
      );
      setBgColor(
        $getSelectionStyleValueForProperty(
          selection,
          "background-color",
          DEFAULTS.BACKGROUND_COLOUR,
        ),
      );
      setFontFamily(
        $getSelectionStyleValueForProperty(selection, "font-family", DEFAULTS.FONT_FAMILY),
      );
    }
  }, [activeEditor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        $updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL,
    );
  }, [editor, $updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      editor.registerEditableListener((editable) => {
        setIsEditable(editable);
      }),
      activeEditor.registerUpdateListener(({editorState}) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      activeEditor.registerCommand<boolean>(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
      activeEditor.registerCommand<boolean>(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    );
  }, [$updateToolbar, activeEditor, editor]);

  useEffect(() => {
    return activeEditor.registerCommand(
      KEY_MODIFIER_COMMAND,
      (payload) => {
        const event: KeyboardEvent = payload;
        const {code, ctrlKey, metaKey} = event;

        if (code === 'KeyK' && (ctrlKey || metaKey)) {
          event.preventDefault();
          return activeEditor.dispatchCommand(
            TOGGLE_LINK_COMMAND,
            sanitizeUrl("https://"),
          );
        }
        return false;
      },
      COMMAND_PRIORITY_NORMAL,
    );
  }, [activeEditor, isLink]);

  const applyStyleText = useCallback(
    (styles: Record<string, string | null>) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [activeEditor],
  );

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const anchor = selection.anchor;
        const focus = selection.focus;
        const nodes = selection.getNodes();

        if (anchor.key === focus.key && anchor.offset === focus.offset) {
          return;
        }

        nodes.forEach((node: any, idx) => { // ! maybe issues here
          // We split the first and last node by the selection
          // So that we don't format unselected text inside those nodes
          if ($isTextNode(node)) {
            if (idx === 0 && anchor.offset !== 0) {
              node = node.splitText(anchor.offset)[1] || node;
            }
            if (idx === nodes.length - 1) {
              node = node.splitText(focus.offset)[0] || node;
            }

            if (node.__style !== '') {
              node.setStyle('');
            }
            if (node.__format !== 0) {
              node.setFormat(0);
              $getNearestBlockElementAncestorOrThrow(node).setFormat('');
            }
          } else if ($isHeadingNode(node) || $isQuoteNode(node)) {
            node.replace($createParagraphNode(), true);
          } else if ($isDecoratorBlockNode(node)) {
            node.setFormat('');
          }
        });
      }
    });
  }, [activeEditor]);

  const onFontColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ color: DEFAULTS.FONT_COLOUR === value ? null : value });
    },
    [applyStyleText],
  );

  const onBgColorSelect = useCallback(
    (value: string) => {
      applyStyleText({ "background-color": DEFAULTS.BACKGROUND_COLOUR === value ? null : value });
    },
    [applyStyleText],
  );

  const insertLink = useCallback(() => {
    if (!isLink) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, sanitizeUrl("https://"));
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
    }
  }, [editor, isLink]);

  // const onCodeLanguageSelect = useCallback(
  //   (value: string) => {
  //     activeEditor.update(() => {
  //       if (selectedElementKey !== null) {
  //         const node = $getNodeByKey(selectedElementKey);
  //         if ($isCodeNode(node)) {
  //           node.setLanguage(value);
  //         }
  //       }
  //     });
  //   },
  //   [activeEditor, selectedElementKey],
  // );
  // const insertGifOnClick = (payload: InsertImagePayload) => {
  //   activeEditor.dispatchCommand(INSERT_IMAGE_COMMAND, payload);
  // };

  return (
    <div className="lexical__toolbar">
      {blockType in blockTypeToBlockName && activeEditor === editor && (
        <>
          <BlockFormatDropDown
            disabled={!isEditable}
            blockType={blockType}
            rootType={rootType}
            editor={editor}
          />
        </>
      )}
      {blockType === 'code' ? ( 
        null
        // <DropDown
        //   disabled={!isEditable}
        //   buttonClassName="toolbar-item code-language"
        //   buttonLabel={getLanguageFriendlyName(codeLanguage)}
        //   buttonAriaLabel="Select language">
        //   {CODE_LANGUAGE_OPTIONS.map(([value, name]) => {
        //     return (
        //       <DropDownItem
        //         className={`item ${dropDownActiveClass(
        //           value === codeLanguage,
        //         )}`}
        //         onClick={() => onCodeLanguageSelect(value)}
        //         key={value}>
        //         <span className="text">{name}</span>
        //       </DropDownItem>
        //     );
        //   })}
        // </DropDown>
      ) : (
        <>
          {(displayFontFamily || displayFontSize) && <Divider />}
          {displayFontFamily && <FontDropDown
            disabled={!isEditable}
            style={'font-family'}
            value={fontFamily}
            editor={editor}
          />}
          {displayFontSize && <FontDropDown
            disabled={!isEditable}
            style={'font-size'}
            value={fontSize}
            editor={editor}
          />}
          <Divider />
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
            }}
            className={'toolbar-item spaced ' + (isBold ? 'active' : '')}
            title={t("lexical.BoldTitle", getShortcutOptions("ctrl", "B"))}
            type="button"
            aria-label={t("lexical.BoldAria", getShortcutOptions("ctrl", "B"))}>
            <i className="format bold" />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
            }}
            className={'toolbar-item spaced ' + (isItalic ? 'active' : '')}
            title={t("lexical.ItalicTitle", getShortcutOptions("ctrl", "I"))}
            type="button"
            aria-label={t("lexical.ItalicAria", getShortcutOptions("ctrl", "I"))}>
            <i className="format italic" />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
            }}
            className={'toolbar-item spaced ' + (isUnderline ? 'active' : '')}
            title={t("lexical.UnderlineTitle", getShortcutOptions("ctrl", "U"))}
            type="button"
            aria-label={t("lexical.UnderlineAria", getShortcutOptions("ctrl", "U"))}>
            <i className="format underline" />
          </button>
          <button
            disabled={!isEditable}
            onClick={() => {
              activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code');
            }}
            className={'toolbar-item spaced ' + (isCode ? 'active' : '')}
            title={t("lexical.CodeTitle")}
            type="button"
            aria-label={t("lexical.CodeAria")}>
            <i className="format code" />
          </button>
          <button
            disabled={!isEditable}
            onClick={insertLink}
            className={'toolbar-item spaced ' + (isLink ? 'active' : '')}
            aria-label={t("lexical.LinkAria")}
            title={t("lexical.LinkTitle")}
            type="button">
            <i className="format link" />
          </button>
          <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={t("lexical.TextColourAria")}
            buttonIconClassName="icon font-color"
            color={fontColor}
            defaultColor={DEFAULTS.FONT_COLOUR}
            onChange={onFontColorSelect}
            title={t("lexical.TextColourTitle")}
          />
          {displayBackgroundColour && <DropdownColorPicker
            disabled={!isEditable}
            buttonClassName="toolbar-item color-picker"
            buttonAriaLabel={t("lexical.BackgroundColourAria")}
            buttonIconClassName="icon bg-color"
            color={bgColor}
            defaultColor={DEFAULTS.BACKGROUND_COLOUR}
            onChange={onBgColorSelect}
            title={t("lexical.BackgroundColourTitle")}
          />}
          <DropDown
            disabled={!isEditable}
            buttonClassName="toolbar-item spaced"
            buttonLabel=""
            title={t("lexical.AdditionalTextStylesTitle")}
            buttonAriaLabel={t("lexical.AdditionalTextStylesAria")}
            buttonIconClassName="icon dropdown-more">
            <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(
                  FORMAT_TEXT_COMMAND,
                  'strikethrough',
                );
              }}
              className={'item ' + dropDownActiveClass(isStrikethrough)}
              // title="Strikethrough"
              aria-label={t("lexical.StrikethroughAria")}>
              <i className="icon strikethrough" />
              <span className="text">{t("lexical.Strikethrough")}</span>
            </DropDownItem>
            <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(FORMAT_TEXT_COMMAND, 'subscript');
              }}
              className={'item ' + dropDownActiveClass(isSubscript)}
              // title="Subscript"
              aria-label={t("lexical.SubscriptAria")}>
              <i className="icon subscript" />
              <span className="text">{t("lexical.Subscript")}</span>
            </DropDownItem>
            <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(
                  FORMAT_TEXT_COMMAND,
                  'superscript',
                );
              }}
              className={'item ' + dropDownActiveClass(isSuperscript)}
              // title="Superscript"
              aria-label={t("lexical.SuperscriptAria")}>
              <i className="icon superscript" />
              <span className="text">{t("lexical.Superscript")}</span>
            </DropDownItem>
            <DropDownItem
              onClick={clearFormatting}
              className="item"
              // title="Clear text formatting"
              aria-label={t("lexical.ClearFormattingAria")}>
              <i className="icon clear" />
              <span className="text">{t("lexical.ClearFormatting")}</span>
            </DropDownItem>
          </DropDown>
          <Divider />
          {/* {rootType === 'table' && (
            <>
              <DropDown
                disabled={!isEditable}
                buttonClassName="toolbar-item spaced"
                buttonLabel="Table"
                buttonAriaLabel="Open table toolkit"
                buttonIconClassName="icon table secondary">
                <DropDownItem
                  onClick={() => {
                    
                  }}
                  className="item">
                  <span className="text">TODO</span>
                </DropDownItem>
              </DropDown>
              <Divider />
            </>
          )} */}
          <DropDown
            disabled={!isEditable}
            buttonClassName="toolbar-item spaced"
            buttonLabel={t("lexical.Insert")}
            buttonAriaLabel={t("lexical.InsertAria")}
            buttonIconClassName="icon plus">
            <DropDownItem
              aria-label={t("lexical.HorizontalRuleAria")}
              onClick={() => {
                activeEditor.dispatchCommand(
                  INSERT_HORIZONTAL_RULE_COMMAND,
                  undefined,
                );
              }}
              className="item">
              <i className="icon horizontal-rule" />
              <span className="text">{t("lexical.HorizontalRule")}</span>
            </DropDownItem>
            {/* <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(INSERT_PAGE_BREAK, undefined);
              }}
              className="item">
              <i className="icon page-break" />
              <span className="text">Page Break</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                showModal('Insert Image', (onClose) => (
                  <InsertImageDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
              className="item">
              <i className="icon image" />
              <span className="text">Image</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                showModal('Insert Inline Image', (onClose) => (
                  <InsertInlineImageDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
              className="item">
              <i className="icon image" />
              <span className="text">Inline Image</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() =>
                insertGifOnClick({
                  altText: 'Cat typing on a laptop',
                  src: catTypingGif,
                })
              }
              className="item">
              <i className="icon gif" />
              <span className="text">GIF</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                activeEditor.dispatchCommand(
                  INSERT_EXCALIDRAW_COMMAND,
                  undefined,
                );
              }}
              className="item">
              <i className="icon diagram-2" />
              <span className="text">Excalidraw</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                showModal('Insert Table', (onClose) => (
                  <InsertTableDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
              className="item">
              <i className="icon table" />
              <span className="text">Table</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                showModal('Insert Table', (onClose) => (
                  <InsertNewTableDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
              className="item">
              <i className="icon table" />
              <span className="text">Table (Experimental)</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                showModal('Insert Poll', (onClose) => (
                  <InsertPollDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
              className="item">
              <i className="icon poll" />
              <span className="text">Poll</span>
            </DropDownItem> */}

            {/* <DropDownItem
              onClick={() => {
                showModal('Insert Equation', (onClose) => (
                  <InsertEquationDialog
                    activeEditor={activeEditor}
                    onClose={onClose}
                  />
                ));
              }}
              className="item">
              <i className="icon equation" />
              <span className="text">Equation</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                editor.update(() => {
                  const root = $getRoot();
                  const stickyNode = $createStickyNode(0, 0);
                  root.append(stickyNode);
                });
              }}
              className="item">
              <i className="icon sticky" />
              <span className="text">Sticky Note</span>
            </DropDownItem> */}
            {/* <DropDownItem
              onClick={() => {
                editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined);
              }}
              className="item">
              <i className="icon caret-right" />
              <span className="text">Collapsible container</span>
            </DropDownItem> */}
            {/* {EmbedConfigs.map((embedConfig) => (
              <DropDownItem
                key={embedConfig.type}
                onClick={() => {
                  activeEditor.dispatchCommand(
                    INSERT_EMBED_COMMAND,
                    embedConfig.type,
                  );
                }}
                className="item">
                {embedConfig.icon}
                <span className="text">{embedConfig.contentName}</span>
              </DropDownItem>
            ))} */}
          </DropDown>
        </>
      )}
      <Divider />
      <DropDown
        disabled={!isEditable}
        // buttonLabel="Align"
        buttonLabel=""
        title={t("lexical.AlignTitle")}
        buttonIconClassName="icon left-align"
        buttonClassName="toolbar-item spaced alignment"
        buttonAriaLabel={t("lexical.AlignAria")}>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
          }}
          className="item">
          <i className="icon left-align" />
          <span className="text">{t("lexical.Left Align")}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
          }}
          className="item">
          <i className="icon center-align" />
          <span className="text">{t("lexical.Center Align")}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
          }}
          className="item">
          <i className="icon right-align" />
          <span className="text">{t("lexical.Right Align")}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
          }}
          className="item">
          <i className="icon justify-align" />
          <span className="text">{t("lexical.Justify Align")}</span>
        </DropDownItem>
        <Divider />
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
          }}
          className="item">
          <i className={'icon ' + (isRTL ? 'indent' : 'outdent')} />
          <span className="text">{t("lexical.Outdent")}</span>
        </DropDownItem>
        <DropDownItem
          onClick={() => {
            activeEditor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
          }}
          className="item">
          <i className={'icon ' + (isRTL ? 'outdent' : 'indent')} />
          <span className="text">{t("lexical.Indent")}</span>
        </DropDownItem>
      </DropDown>

      {/* {modal} */}
      {displayUndoRedo && <>
        <Divider />
        <button
          disabled={!canUndo || !isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(UNDO_COMMAND, undefined);
          }}
          title={t("lexical.UndoTitle", getShortcutOptions("ctrl", "Z"))}
          type="button"
          className="toolbar-item spaced"
          aria-label={t("lexical.UndoAria", getShortcutOptions("ctrl", "Z"))}>
          <i className="format undo" />
        </button>
        <button
          disabled={!canRedo || !isEditable}
          onClick={() => {
            activeEditor.dispatchCommand(REDO_COMMAND, undefined);
          }}
          title={t("lexical.RedoTitle", getShortcutOptions("ctrl", "Y"))}
          type="button"
          className="toolbar-item"
          aria-label={t("lexical.RedoAria", getShortcutOptions("ctrl", "Y"))}>
          <i className="format redo" />
        </button>
      </>}
    </div>
  );
}

export default withTranslation()(ToolbarPlugin) as React.FC<ToolbarPluginPropsBase>;
import type { Options } from "easymde";

const MARKDOWN_TABLE_TEMPLATE = [
  "",
  "| Feature | Details |",
  "| --- | --- |",
  "|  |  |",
  "|  |  |",
  "",
].join("\n");

/** Shared SimpleMDE / EasyMDE config for product descriptions (add + edit). */
export function getProductDescriptionMdeOptions(
  overrides: Partial<Options> = {}
): Options {
  return {
    spellChecker: false,
    status: false,
    sideBySide: true,
    autosave: { enabled: false },
    autoDownloadFontAwesome: true,
    placeholder:
      "Use headings (##), lists (-), or the table button. Markdown tables use | Column | syntax.",
    toolbar: [
      "bold",
      "italic",
      "strikethrough",
      "heading",
      "|",
      "unordered-list",
      "ordered-list",
      "|",
      "link",
      "image",
      "|",
      {
        name: "insert-table",
        action(editor) {
          editor.codemirror.replaceSelection(MARKDOWN_TABLE_TEMPLATE);
        },
        className: "fa fa-table",
        title: "Insert table",
      },
      "|",
      "preview",
      "side-by-side",
      "fullscreen",
      "guide",
    ],
    ...overrides,
  };
}

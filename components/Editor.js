"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";

// TipTap rich-text editor with a formatting toolbar.
// StarterKit provides bold, italic, headings, and bullet/ordered lists;
// underline is a separate extension.
export default function Editor({ initialContent, editable = true, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
    ],
    content: initialContent || "",
    editable,
    // Required in Next.js App Router to avoid SSR hydration mismatches.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text px-4 py-3 min-h-[60vh] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) {
    return <div className="px-4 py-3 text-gray-400">Loading editor…</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 p-2">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold">
        <span className="font-bold">B</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic">
        <span className="italic">I</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} label="Underline">
        <span className="underline">U</span>
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} label="Heading 1">
        H1
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} label="Heading 2">
        H2
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} label="Heading 3">
        H3
      </Btn>
      <Btn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} label="Paragraph">
        ¶
      </Btn>

      <Divider />

      <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} label="Bullet list">
        • List
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} label="Numbered list">
        1. List
      </Btn>
    </div>
  );
}

function Btn({ onClick, active, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`min-w-[2rem] rounded px-2 py-1 text-sm ${
        active ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-gray-200" />;
}

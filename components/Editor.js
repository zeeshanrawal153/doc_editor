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
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
    ],
    content: initialContent || "",
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text px-6 py-5 min-h-[60vh] focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getHTML()),
  });

  if (!editor) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 text-slate-400">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }) {
  return (
    <div className="sticky top-[57px] z-30 flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50/80 px-3 py-2 backdrop-blur">
      <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} label="Bold">
        <span className="font-bold">B</span>
      </Btn>
      <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} label="Italic">
        <span className="italic font-serif">I</span>
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
      className={`min-w-[2.1rem] rounded-md px-2 py-1 text-sm transition ${
        active
          ? "bg-indigo-600 text-white shadow-sm"
          : "text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px bg-slate-300" />;
}

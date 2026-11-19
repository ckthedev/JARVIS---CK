"use client";

import React, { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string, plainText: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Write your note here... Use markdown or formatting toolbar.",
  editable = true,
  className,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer",
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || "",
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-invert max-w-none focus:outline-none min-h-[350px] p-4 text-foreground/90 font-sans leading-relaxed selection:bg-primary/20",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(html, text);
    },
  });

  // Sync content when external content changes (e.g. note selected)
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentHtml = editor.getHTML();
      if (content !== currentHtml && editor.getText() !== content) {
        editor.commands.setContent(content || "", { emitUpdate: false });
      }
    }
  }, [content, editor]);

  // Sync editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter hyperlink URL:", previousUrl);

    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Add protocol if missing
    const formattedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: formattedUrl })
      .run();
  }, [editor]);

  if (!editor) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-secondary-text">
        Initializing editor...
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col border border-[#292929] rounded-lg bg-[#141414] overflow-hidden", className)}>
      {/* Formatting Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-[#292929] bg-[#181818] px-3 py-1.5 text-[#A3A3A3]">
          {/* Headings */}
          <ToolbarButton
            active={editor.isActive("heading", { level: 1 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            title="Heading 1 (Ctrl+Alt+1)"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            title="Heading 2 (Ctrl+Alt+2)"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 3 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            title="Heading 3 (Ctrl+Alt+3)"
          >
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Styling */}
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
          >
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("strike")}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            title="Strikethrough (Ctrl+Shift+X)"
          >
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("code")}
            onClick={() => editor.chain().focus().toggleCode().run()}
            title="Inline Code (Ctrl+E)"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Lists */}
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List (Ctrl+Shift+8)"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List (Ctrl+Shift+7)"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            title="Checklist / Task List"
          >
            <CheckSquare className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Blocks */}
          <ToolbarButton
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote (Ctrl+Shift+B)"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            title="Code Block"
          >
            <FileCode className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="Horizontal Divider"
          >
            <Minus className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Links */}
          <ToolbarButton
            active={editor.isActive("link")}
            onClick={setLink}
            title={editor.isActive("link") ? "Edit Hyperlink" : "Insert Hyperlink"}
          >
            <LinkIcon className="h-4 w-4" />
          </ToolbarButton>
          {editor.isActive("link") && (
            <ToolbarButton
              active={false}
              onClick={() => editor.chain().focus().unsetLink().run()}
              title="Remove Hyperlink"
            >
              <Unlink className="h-4 w-4 text-red-400" />
            </ToolbarButton>
          )}

          <div className="ml-auto flex items-center gap-0.5">
            <ToolbarButton
              active={false}
              disabled={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              active={false}
              disabled={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
            </ToolbarButton>
          </div>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="flex-1 cursor-text overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded p-1 text-[#A3A3A3] transition-colors hover:bg-[#252525] hover:text-[#F5F5F5] focus:outline-none disabled:opacity-30 disabled:pointer-events-none",
        active && "bg-[#343434] text-[#F5F5F5] hover:bg-[#383838] hover:text-white font-semibold border border-[#404040]"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-4 w-[1px] bg-[#303030]" />;
}

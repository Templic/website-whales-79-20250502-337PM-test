import React, { useState, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Quote, 
  Code, 
  Link as LinkIcon,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo
} from 'lucide-react';

// UI Components
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface EditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuButton = ({ 
  onClick, 
  isActive = false, 
  disabled = false,
  tooltip,
  children 
}: { 
  onClick: () => void; 
  isActive?: boolean; 
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={`h-8 px-2 ${isActive ? 'bg-muted text-primary' : ''}`}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);

  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    if (linkUrl) {
      // Update existing link or add new one
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
      
      setLinkUrl('');
      setShowLinkInput(false);
    }
  }, [editor, linkUrl]);

  return (
    <div className="border-b p-2 flex flex-wrap items-center gap-1">
      <MenuButton 
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        tooltip="Bold"
      >
        <Bold className="h-4 w-4" />
      </MenuButton>

      <MenuButton 
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        tooltip="Italic"
      >
        <Italic className="h-4 w-4" />
      </MenuButton>

      <MenuButton 
        onClick={() => editor.commands.toggleUnderline()}
        isActive={editor.isActive('underline')}
        tooltip="Underline"
      >
        <Underline className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        tooltip="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </MenuButton>

      <MenuButton 
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        tooltip="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton 
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        tooltip="Bullet List"
      >
        <List className="h-4 w-4" />
      </MenuButton>

      <MenuButton 
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        tooltip="Numbered List"
      >
        <ListOrdered className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton 
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        tooltip="Quote"
      >
        <Quote className="h-4 w-4" />
      </MenuButton>

      <MenuButton 
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        tooltip="Code Block"
      >
        <Code className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      {showLinkInput ? (
        <div className="flex items-center">
          <input
            type="text"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://example.com"
            className="h-8 px-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setLink();
              }
            }}
          />
          <Button 
            size="sm" 
            onClick={setLink}
            className="h-8 rounded-l-none"
          >
            Apply
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setShowLinkInput(false)}
            className="h-8 px-2 ml-1"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <MenuButton 
          onClick={() => {
            // If there's a link in the selection, grab its URL
            const href = editor.getAttributes('link').href;
            setLinkUrl(href || '');
            setShowLinkInput(true);
          }}
          isActive={editor.isActive('link')}
          tooltip="Link"
        >
          <LinkIcon className="h-4 w-4" />
        </MenuButton>
      )}

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton 
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        tooltip="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </MenuButton>

      <MenuButton 
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        tooltip="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </MenuButton>

      <MenuButton 
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        tooltip="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </MenuButton>

      <Separator orientation="vertical" className="mx-1 h-6" />

      <MenuButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        tooltip="Undo"
      >
        <Undo className="h-4 w-4" />
      </MenuButton>

      <MenuButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        tooltip="Redo"
      >
        <Redo className="h-4 w-4" />
      </MenuButton>
    </div>
  );
};

export const EnhancedAdminEditor: React.FC<EditorProps> = ({ 
  initialContent = '',
  onChange,
  placeholder = 'Start writing…'
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none min-h-[350px] p-4',
      },
    },
  });

  return (
    <div className="w-full border rounded-md overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
};

export default EnhancedAdminEditor;
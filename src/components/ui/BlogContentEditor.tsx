import { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';

interface BlogContentEditorProps {
  initialContent?: string;
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function BlogContentEditor({
  initialContent = '',
  name,
  label,
  required = false,
  placeholder = 'Escribe el contenido aquí...',
  className = ''
}: BlogContentEditorProps) {
  const [content, setContent] = useState(initialContent);

  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-foreground mb-2"
      >
        {label}
      </label>
      <RichTextEditor
        content={content}
        onChange={setContent}
        name={name}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}

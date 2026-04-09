import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export function TagInput({ tags, onChange, placeholder = 'Add tag...' }: Props) {
  const [input, setInput] = useState('');

  function addTag(value: string) {
    const tag = value.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput('');
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag));
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-800 border border-slate-600 rounded-lg focus-within:border-indigo-500 min-h-[42px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full"
        >
          {tag}
          <button type="button" onClick={() => removeTag(tag)}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => addTag(input)}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-white outline-none placeholder-slate-500"
      />
    </div>
  );
}

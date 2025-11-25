import React, { useState, useRef, useEffect } from 'react';
import { audioService } from '../services/audioService.ts';

interface TerminalInputProps {
  onSubmit: (text: string) => void;
  disabled: boolean;
  themeColor: string;
}

export const TerminalInput: React.FC<TerminalInputProps> = ({ onSubmit, disabled, themeColor }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep focus
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!disabled) {
       audioService.playKeystroke();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      audioService.playEnter();
      onSubmit(input);
      setInput('');
    }
  };

  // Determine caret color based on theme
  const caretColorClass = themeColor === 'text-green-400' ? 'caret-green-400' : 
                          themeColor === 'text-amber-400' ? 'caret-amber-400' : 'caret-cyan-400';

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full mt-4 relative">
      <span className={`mr-2 font-bold ${themeColor} animate-pulse`}>{'>'}</span>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`bg-transparent border-none outline-none w-full font-inherit text-xl md:text-2xl ${themeColor} ${caretColorClass} placeholder-gray-700`}
        placeholder={disabled ? "处理中..." : "输入指令..."}
        autoComplete="off"
        spellCheck="false"
      />
    </form>
  );
};
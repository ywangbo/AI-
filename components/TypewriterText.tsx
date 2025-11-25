import React, { useState, useEffect, useRef } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onCharTyped?: () => void; // New prop for sound
  isActive: boolean; 
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  text, 
  speed = 15, 
  onComplete,
  onCharTyped,
  isActive 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const indexRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    // If not active (history), show full text immediately
    if (!isActive) {
      setDisplayedText(text);
      return;
    }

    const animate = () => {
      if (indexRef.current < text.length) {
        const nextChar = text.charAt(indexRef.current);
        setDisplayedText((prev) => prev + nextChar);
        indexRef.current++;
        
        // Play sound for non-whitespace
        if (onCharTyped && nextChar.trim() !== '') {
          onCharTyped();
        }

        timerRef.current = window.setTimeout(animate, speed);
      } else {
        if (onComplete) onComplete();
      }
    };

    if (!timerRef.current && indexRef.current < text.length) {
       animate();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, speed, isActive, onComplete, onCharTyped]);

  return <span className="whitespace-pre-wrap">{displayedText}</span>;
};
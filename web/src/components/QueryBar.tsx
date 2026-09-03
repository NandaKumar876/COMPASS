import { useState, useEffect, useRef } from 'react';

interface QueryBarProps {
  onQuery?: (text: string) => void;
}

const EXAMPLES = [
  'Cheapest way to reach 100k children in Tamil Nadu under ₹30L',
  'Fund only healthcare projects in underserved states',
  'Maximize impact in Odisha and Bihar',
  'Most cost-efficient education portfolio',
];

export default function QueryBar({ onQuery }: QueryBarProps) {
  const [value, setValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [exampleIdx, setExampleIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Typewriter effect for placeholder
  useEffect(() => {
    if (value) return; // Don't animate if user is typing

    const example = EXAMPLES[exampleIdx];
    if (charIdx <= example.length) {
      const timer = setTimeout(() => {
        setPlaceholder(example.slice(0, charIdx));
        setCharIdx((c) => c + 1);
      }, 35);
      return () => clearTimeout(timer);
    } else {
      // Pause then move to next example
      const timer = setTimeout(() => {
        setCharIdx(0);
        setExampleIdx((i) => (i + 1) % EXAMPLES.length);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [charIdx, exampleIdx, value]);

  const handleSubmit = () => {
    if (value.trim() && onQuery) {
      onQuery(value.trim());
      setValue('');
    }
  };

  return (
    <div className="query-bar" onClick={() => inputRef.current?.focus()}>
      <span className="query-icon">⌘</span>
      <input
        ref={inputRef}
        className="query-input"
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        placeholder={placeholder || 'Ask anything about allocation...'}
      />
      <span className="query-kbd">↵</span>
    </div>
  );
}

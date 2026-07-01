'use client';

import { useState } from 'react';

/**
 * 자유 편집 가능한 숫자 입력.
 * 내부는 문자열로 관리 → 필드를 비우거나 고쳐쓰기가 자연스럽다.
 * 포커스 시 전체 선택(탭 → 바로 새 값 입력). 값 반영은 숫자로 onChange.
 */
export function NumberField({
  value,
  onChange,
  className,
  min = 0,
  step = 100,
  placeholder,
  ariaLabel,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  min?: number;
  step?: number;
  placeholder?: string;
  ariaLabel?: string;
}) {
  const [text, setText] = useState<string>(value ? String(value) : '');

  return (
    <input
      type="number"
      inputMode="numeric"
      min={min}
      step={step}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={className}
      value={text}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const v = e.target.value;
        setText(v);
        if (v === '') {
          onChange(0);
          return;
        }
        const n = Number(v);
        onChange(Number.isNaN(n) ? 0 : Math.max(min, n));
      }}
    />
  );
}

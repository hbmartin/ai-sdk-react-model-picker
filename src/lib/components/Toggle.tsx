import React from 'react';

export interface ToggleProps {
  optionOne: string;
  optionTwo: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

/**
 * Two-option toggle component
 * Migrated from Continue's Toggle component with Tailwind styling
 */
export function Toggle({
  optionOne,
  optionTwo,
  selected,
  onClick,
  className = '',
  disabled = false,
}: ToggleProps) {
  return (
    <div
      className={`
        inline-flex items-center text-center cursor-pointer
        border border-border bg-accent rounded-default
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className={`
          text-center px-3 py-2 rounded-default transition-all duration-200 ease-in-out
          ${selected 
            ? 'bg-primary text-white shadow-sm' 
            : 'text-foreground hover:bg-opacity-60'
          }
        `}
      >
        {optionOne}
      </div>
      <div
        className={`
          text-center px-3 py-2 rounded-default transition-all duration-200 ease-in-out
          ${!selected 
            ? 'bg-primary text-white shadow-sm' 
            : 'text-foreground hover:bg-opacity-60'
          }
        `}
      >
        {optionTwo}
      </div>
    </div>
  );
}

export default Toggle;
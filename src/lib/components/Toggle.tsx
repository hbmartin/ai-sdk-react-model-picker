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
      onKeyDown={disabled ? undefined : onClick}
      onKeyUp={disabled ? undefined : onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-pressed={selected}
      aria-label={`Toggle between ${optionOne} and ${optionTwo}`}
    >
      <div
        className={`
          text-center px-3 py-2 rounded-default transition-all duration-200 ease-in-out
          ${selected ? 'bg-primary text-white shadow-sm' : 'text-foreground hover:bg-opacity-60'}
        `}
      >
        {optionOne}
      </div>
      <div
        className={`
          text-center px-3 py-2 rounded-default transition-all duration-200 ease-in-out
          ${selected ? 'text-foreground hover:bg-opacity-60' : 'bg-primary text-white shadow-sm'}
        `}
      >
        {optionTwo}
      </div>
    </div>
  );
}

export default Toggle;

/* eslint-disable code-complete/no-magic-numbers-except-zero-one */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';

// Types for the Listbox components
interface ListboxContextType {
  value: any;
  onChange: (value: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  optionsRef: React.RefObject<HTMLDivElement | null>;
}

const ListboxContext = createContext<ListboxContextType | undefined>(undefined);

function useListboxContext() {
  const context = useContext(ListboxContext);
  if (!context) {
    throw new Error('Listbox components must be used within a Listbox');
  }
  return context;
}

// Main Listbox component
export interface ListboxProps {
  readonly value?: any;
  readonly onChange?: (value: any) => void;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Listbox({ value, onChange = () => {}, children, className = '' }: ListboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        isOpen &&
        buttonRef.current &&
        optionsRef.current &&
        event.target instanceof Node &&
        !buttonRef.current.contains(event.target) &&
        !optionsRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
        event.stopPropagation();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <ListboxContext.Provider
      value={{
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        value,
        onChange,
        isOpen,
        setIsOpen,
        buttonRef,
        optionsRef,
      }}
    >
      <div className={`relative ${className}`}>{children}</div>
    </ListboxContext.Provider>
  );
}

// Listbox Button
export interface ListboxButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
}

export function ListboxButton({
  children,
  className = '',
  shouldOpenList,
  ...props
}: ListboxButtonProps & { shouldOpenList?: () => boolean }) {
  const { isOpen, setIsOpen, buttonRef } = useListboxContext();

  const handleClick = (_event: React.MouseEvent<HTMLButtonElement>) => {
    if (shouldOpenList === undefined || shouldOpenList()) {
      setIsOpen(!isOpen);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(!isOpen);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      className={`
        leading-none flex items-center justify-between w-full
        bg-transparent rounded
         focus:text-foreground
        transition-all duration-150
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

// Listbox Options Container
export interface ListboxOptionsProps extends HTMLAttributes<HTMLDivElement> {
  readonly children: ReactNode;
}

export function ListboxOptions({ children, className = '', ...props }: ListboxOptionsProps) {
  const { isOpen, optionsRef, buttonRef } = useListboxContext();
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const [dropdownWidth, setDropdownWidth] = useState<number | undefined>(undefined);

  const calculateDropdownPosition = useCallback(() => {
    if (!buttonRef.current || !optionsRef.current) {
      return;
    }

    const triggerRect = buttonRef.current.getBoundingClientRect();
    const optionsRect = optionsRef.current.getBoundingClientRect();
    const modalHeight = optionsRect.height;
    const padding = 8;

    // Calculate vertical position (above the trigger)
    let top = triggerRect.top - modalHeight - padding;

    // If there's not enough space above, show below
    if (top < padding) {
      top = triggerRect.bottom + padding;
    }

    // Calculate horizontal position (align with trigger), clamp to viewport
    let left = triggerRect.left;
    const width = Math.min(400, window.innerWidth - padding - left);

    // If the left position is too close to the right edge of the viewport, move it to the left
    if (left + width > window.innerWidth - padding) {
      left = window.innerWidth - padding - width;
    }

    setDropdownPosition({ top, left });
    setDropdownWidth(width);
  }, [buttonRef, optionsRef]);

  useEffect(() => {
    const recalc = () => {
      if (isOpen) {
        calculateDropdownPosition();
      }
    };

    if (isOpen) {
      calculateDropdownPosition();
      window.addEventListener('scroll', recalc, true);
      window.addEventListener('resize', recalc);
    }

    return () => {
      window.removeEventListener('scroll', recalc, true);
      window.removeEventListener('resize', recalc);
    };
  }, [isOpen, calculateDropdownPosition]);

  // Focus management: when opening, focus first option if nothing focused
  useEffect(() => {
    if (isOpen && optionsRef.current) {
      const active = document.activeElement;
      if (!optionsRef.current.contains(active)) {
        const first = optionsRef.current.querySelector('[role="option"]');
        if (first instanceof HTMLElement) {
          first.focus();
        }
      }
    }
  }, [isOpen, optionsRef]);

  if (!isOpen || typeof document === 'undefined') {
    // eslint-disable-next-line unicorn/no-null
    return null;
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'transparent',
        zIndex: 1000,
        pointerEvents: 'none',
      }}
    >
      <div
        ref={optionsRef}
        role="listbox"
        className={`
        absolute z-50 max-w-md mt-1 py-1
        bg-background border border-solid border-border rounded
        max-h-60 overflow-auto
        ${className}
      `}
        style={{
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownWidth,
          pointerEvents: 'auto',
        }}
        {...props}
        onKeyDown={(event) => {
          if (!optionsRef.current) {
            return;
          }
          const focusable = [
            ...optionsRef.current.querySelectorAll<HTMLElement>('[role="option"]'),
          ];
          if (focusable.length === 0) {
            return;
          }
          const activeEl = document.activeElement;
          const currentIndex = activeEl instanceof HTMLElement ? focusable.indexOf(activeEl) : -1;
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (currentIndex === -1) {
              focusable[0].focus();
            } else {
              const nextIndex = (currentIndex + 1) % focusable.length;
              focusable[nextIndex].focus();
            }
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (currentIndex === -1) {
              focusable.at(-1)?.focus();
            } else {
              const prevIndex = (currentIndex - 1 + focusable.length) % focusable.length;
              focusable[prevIndex].focus();
            }
          }
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// Listbox Option
export interface ListboxOptionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  readonly value: any;
  readonly children: ReactNode | ((props: { selected: boolean }) => ReactNode);
  readonly disabled?: boolean;
}

export function ListboxOption({
  value,
  children,
  disabled = false,
  className = '',
  onClick,
  ...props
}: ListboxOptionProps) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { value: selectedValue, onChange, setIsOpen } = useListboxContext();
  const isSelected = selectedValue === value;

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    onChange(value);
    setIsOpen(false);
    onClick?.(event);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange(value);
      setIsOpen(false);
      event.stopPropagation();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      event.stopPropagation();
    }
  };

  return (
    <div
      role="option"
      aria-selected={isSelected}
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`
        px-3 py-1 cursor-pointer select-none
        ${isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-accent'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-accent'}
        transition-colors duration-150
        ${className}
      `}
      {...props}
    >
      {typeof children === 'function' ? children({ selected: isSelected }) : children}
    </div>
  );
}

// Transition component for animations (simplified)
export interface TransitionProps {
  readonly show?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}

export function Transition({ show = true, children, className = '' }: TransitionProps) {
  if (!show) {
    return;
  }

  return <div className={`transition-all duration-150 ease-out ${className}`}>{children}</div>;
}

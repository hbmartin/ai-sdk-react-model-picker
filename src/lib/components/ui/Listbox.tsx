import type { ReactNode, ButtonHTMLAttributes, HTMLAttributes } from 'react';
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

// Types for the Listbox components
interface ListboxContextType {
  value: any;
  onChange: (value: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  optionsRef: React.RefObject<HTMLDivElement | null>;
}

const ListboxContext = createContext<ListboxContextType | null>(null);

function useListboxContext() {
  const context = useContext(ListboxContext);
  if (!context) {
    throw new Error('Listbox components must be used within a Listbox');
  }
  return context;
}

// Main Listbox component
export interface ListboxProps {
  value?: any;
  onChange?: (value: any) => void;
  children: ReactNode;
  className?: string;
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
        !buttonRef.current.contains(event.target as Node) &&
        !optionsRef.current.contains(event.target as Node)
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
  children: ReactNode;
}

export function ListboxButton({ children, className = '', onClick, ...props }: ListboxButtonProps) {
  const { isOpen, setIsOpen, buttonRef } = useListboxContext();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsOpen(!isOpen);
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      className={`
        flex items-center justify-between w-full px-3 py-2
        bg-background border border-border rounded-default
        text-foreground hover:bg-accent
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1
        transition-colors duration-150
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
  children: ReactNode;
}

export function ListboxOptions({ children, className = '', ...props }: ListboxOptionsProps) {
  const { isOpen, optionsRef } = useListboxContext();

  if (!isOpen) return null;

  return (
    <div
      ref={optionsRef}
      role="listbox"
      className={`
        absolute z-50 w-full mt-1
        bg-background border border-border rounded-default shadow-lg
        max-h-60 overflow-auto
        animate-in fade-in-0 zoom-in-95 duration-150
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
}

// Listbox Option
export interface ListboxOptionProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  value: any;
  children: ReactNode | ((props: { selected: boolean }) => ReactNode);
  disabled?: boolean;
}

export function ListboxOption({
  value,
  children,
  disabled = false,
  className = '',
  onClick,
  ...props
}: ListboxOptionProps) {
  const { value: selectedValue, onChange, setIsOpen } = useListboxContext();
  const isSelected = selectedValue === value;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;

    onChange(value);
    setIsOpen(false);
    onClick?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(value);
      setIsOpen(false);
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
        px-3 py-2 cursor-pointer select-none
        ${isSelected ? 'bg-primary text-white' : 'text-foreground hover:bg-accent'}
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
  show?: boolean;
  children: ReactNode;
  className?: string;
}

export function Transition({ show = true, children, className = '' }: TransitionProps) {
  if (!show) return null;

  return <div className={`transition-all duration-150 ease-out ${className}`}>{children}</div>;
}

import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from 'react';

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

export function ListboxButton({ children, className = '', onClick, ...props }: ListboxButtonProps) {
  const { isOpen, setIsOpen, buttonRef } = useListboxContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setIsOpen(!isOpen);
    onClick?.(event);
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
  readonly children: ReactNode;
}

export function ListboxOptions({ children, className = '', ...props }: ListboxOptionsProps) {
  const { isOpen, optionsRef } = useListboxContext();

  if (!isOpen) {
    return;
  }

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

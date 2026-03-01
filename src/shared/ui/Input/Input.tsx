import { InputHTMLAttributes, forwardRef, useId } from 'react';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, fullWidth = false, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    const wrapperClasses = [
      'ts-input-wrapper',
      fullWidth ? 'ts-input-wrapper--full-width' : '',
      className,
    ].filter(Boolean).join(' ');

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className="ts-input-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`ts-input ${error ? 'ts-input--error' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} className="ts-input-error-msg">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

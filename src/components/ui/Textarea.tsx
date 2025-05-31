import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  helperText?: string;
  rows?: number;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, fullWidth = true, helperText, id, className = '', disabled, required, rows = 4, ...props }, ref) => {
    // Generiere eine eindeutige ID für Textarea-Label-Verknüpfung
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const helperTextId = `${textareaId}-helper-text`;
    const errorId = `${textareaId}-error`;

    return (
      <div className={`${fullWidth ? 'w-full' : 'w-auto'}`}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={`
            block rounded-lg
            min-h-[88px]
            p-4
            border-gray-300
            shadow-sm
            disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            ${error ? 'border-red-500' : ''}
            ${fullWidth ? 'w-full' : 'w-auto'}
            ${className}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error
              ? errorId
              : helperText
              ? helperTextId
              : undefined
          }
          disabled={disabled}
          required={required}
          {...props}
        />

        {/* Hilfetext oder Fehler */}
        {(helperText || error) && (
          <div className="mt-1">
            {helperText && !error && (
              <p
                id={helperTextId}
                className="text-sm text-gray-500"
              >
                {helperText}
              </p>
            )}
            {error && (
              <p
                id={errorId}
                className="text-sm text-red-600"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea; 
'use client';

import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/format';

const controlBase =
  'block w-full rounded-lg border bg-white text-[15px] text-slate-900 placeholder:text-slate-400 transition-colors ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ' +
  'disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 md:text-sm';

function controlClasses(invalid: boolean, extra?: string) {
  return cn(controlBase, invalid ? 'border-red-500' : 'border-slate-300', extra);
}

interface FieldShellProps {
  id: string;
  label?: React.ReactNode;
  required?: boolean;
  hint?: React.ReactNode;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

/** Label, control, then either the error or the hint below it. */
function FieldShell({ id, label, required, hint, error, className, children }: FieldShellProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label ? (
        <label htmlFor={id} className="text-[13px] font-semibold text-slate-700">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-[12.5px] font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12.5px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: React.ReactNode) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type FieldProps = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  containerClassName?: string;
};

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement>, FieldProps {
  prefix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, containerClassName, className, id, required, prefix, type, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  // Password boxes get an eye button to show or hide what was typed.
  const isPassword = type === 'password';
  const [showPassword, setShowPassword] = useState(false);
  const input = (
    <input
      ref={ref}
      id={inputId}
      required={required}
      type={isPassword && showPassword ? 'text' : type}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(inputId, error, hint)}
      className={controlClasses(Boolean(error), cn('h-11 px-3 md:h-10', prefix && 'pl-8', isPassword && 'pr-11', className))}
      {...rest}
    />
  );
  return (
    <FieldShell id={inputId} label={label} required={required} hint={hint} error={error} className={containerClassName}>
      {isPassword ? (
        <div className="relative">
          {input}
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-slate-500 hover:text-slate-800 focus-visible:outline-2 focus-visible:outline-indigo-500"
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      ) : prefix ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-slate-500">{prefix}</span>
          {input}
        </div>
      ) : (
        input
      )}
    </FieldShell>
  );
});

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, FieldProps {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, containerClassName, className, id, required, rows = 4, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} required={required} hint={hint} error={error} className={containerClassName}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        className={controlClasses(Boolean(error), cn('resize-y px-3 py-2.5', className))}
        {...rest}
      />
    </FieldShell>
  );
});

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'>, FieldProps {
  options: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, containerClassName, className, id, required, options, placeholder, ...rest },
  ref
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <FieldShell id={inputId} label={label} required={required} hint={hint} error={error} className={containerClassName}>
      <select
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(inputId, error, hint)}
        className={controlClasses(Boolean(error), cn('h-11 cursor-pointer pl-3 pr-8 md:h-10', className))}
        {...rest}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
});

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: React.ReactNode;
  boxed?: boolean;
}

/** Checkbox with a label; `boxed` draws it as a bordered row for important choices. */
export function Checkbox({ label, description, boxed = false, className, id, ...rest }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label
      htmlFor={inputId}
      className={cn(
        'flex min-h-11 cursor-pointer items-start gap-3',
        boxed && 'rounded-xl border border-slate-200 px-4 py-3 hover:border-indigo-300',
        className
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border-slate-300 accent-indigo-600"
        {...rest}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-slate-900">{label}</span>
        {description ? <span className="text-[12.5px] text-slate-600">{description}</span> : null}
      </span>
    </label>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** A row of mutually exclusive choices (radio group) — e.g. Draft / Active / Inactive. */
export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  className,
}: {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('grid gap-1 rounded-xl bg-slate-100 p-1', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'h-10 rounded-lg px-2 text-sm transition-colors',
              selected ? 'bg-white font-semibold text-indigo-900 shadow-sm' : 'font-medium text-slate-600 hover:text-slate-900'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/** Error banner shown at the top of a form when the backend rejects a save. */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
      {message}
    </div>
  );
}

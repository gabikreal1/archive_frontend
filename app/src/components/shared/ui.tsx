"use client";

import { ComponentProps, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Button = forwardRef<HTMLButtonElement, ComponentProps<'button'>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
);
Button.displayName = 'Button';

export const Card = ({ className, ...props }: ComponentProps<'div'>) => (
  <div
    className={cn('rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg backdrop-blur', className)}
    {...props}
  />
);

export const Input = forwardRef<HTMLInputElement, ComponentProps<'input'>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-sky-500 focus:outline-none',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-sky-500 focus:outline-none',
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

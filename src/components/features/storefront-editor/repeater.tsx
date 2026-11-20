'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props<T> {
  items: T[];
  onChange: (items: T[]) => void;
  max: number;
  /** A fresh, empty item for "Add". */
  create: () => T;
  /** "Question", "Photo", "Review": used in "Question 2" and "Add a question". */
  noun: string;
  /** Renders one item's fields; call `update` with the changed fields. */
  children: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
}

/**
 * A small list editor for sections that hold several entries (photos, questions, reviews): each entry sits in a
 * card with move up/down and remove buttons, and "Add" stops at the limit.
 */
export default function Repeater<T>({ items, onChange, max, create, noun, children }: Props<T>) {
  const replace = (index: number, patch: Partial<T>) => onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="space-y-3 rounded-lg border bg-muted/20 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {noun} {index + 1}
            </p>
            <div className="flex items-center">
              <Button type="button" size="icon" variant="ghost" className="h-7 w-7" aria-label={`Move ${noun.toLowerCase()} ${index + 1} up`} disabled={index === 0} onClick={() => move(index, index - 1)}>
                <ArrowUp />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                aria-label={`Move ${noun.toLowerCase()} ${index + 1} down`}
                disabled={index === items.length - 1}
                onClick={() => move(index, index + 1)}
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-destructive hover:text-destructive"
                aria-label={`Remove ${noun.toLowerCase()} ${index + 1}`}
                onClick={() => onChange(items.filter((_, i) => i !== index))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          {children(item, (patch) => replace(index, patch), index)}
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" className="w-full" disabled={items.length >= max} onClick={() => onChange([...items, create()])}>
        <Plus />
        Add {/^[aeiou]/i.test(noun) ? 'an' : 'a'} {noun.toLowerCase()}
        <span className="ml-1 text-xs text-muted-foreground">
          ({items.length}/{max})
        </span>
      </Button>
    </div>
  );
}

'use client';

import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowUp, RotateCcw, Square } from 'lucide-react';
import type { AiChat, AnyCard, ChatTurn } from './use-ai-chat';

export interface CardContext {
  /** True for cards on the newest reply (quick replies only show there). */
  latest: boolean;
  busy: boolean;
  send: (text: string) => void;
}

/**
 * The conversation and the message box, shared by every assistant. Each assistant supplies its welcome screen and how
 * to draw its own cards. Follows the reply as it streams unless the reader has scrolled up.
 */
export function ChatView({
  chat,
  welcome,
  renderCard,
  placeholder,
  footnote,
  autoFocus = true,
}: {
  chat: AiChat;
  welcome: ReactNode;
  renderCard: (card: AnyCard, ctx: CardContext) => ReactNode;
  placeholder: string;
  footnote?: string;
  autoFocus?: boolean;
}) {
  const list = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  useLayoutEffect(() => {
    const el = list.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [chat.turns]);

  const lastAssistant = [...chat.turns].reverse().find((t) => t.role === 'assistant');

  return (
    <>
      <div
        ref={list}
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 py-4"
        aria-live="polite"
      >
        {chat.turns.length === 0
          ? welcome
          : chat.turns.map((turn) => (
              <Turn
                key={turn.id}
                turn={turn}
                latest={turn === lastAssistant}
                busy={chat.busy}
                onRetry={chat.retry}
                renderCard={(card) => renderCard(card, { latest: turn === lastAssistant, busy: chat.busy, send: chat.send })}
              />
            ))}
      </div>
      <Composer
        busy={chat.busy}
        placeholder={placeholder}
        footnote={footnote}
        autoFocus={autoFocus}
        onSend={(text) => {
          stick.current = true;
          chat.send(text);
        }}
        onStop={chat.stop}
      />
    </>
  );
}

function Turn({
  turn,
  latest,
  busy,
  onRetry,
  renderCard,
}: {
  turn: ChatTurn;
  latest: boolean;
  busy: boolean;
  onRetry: () => void;
  renderCard: (card: AnyCard) => ReactNode;
}) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[15px] leading-relaxed text-primary-foreground sm:text-sm">
          {turn.text}
        </p>
      </div>
    );
  }
  const showText = turn.text.length > 0 || (turn.streaming && !turn.status);
  return (
    <div className="space-y-2.5">
      {showText && (
        <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-[15px] leading-relaxed sm:text-sm">
          <RichText text={turn.text} streaming={!!turn.streaming} />
        </div>
      )}
      {turn.status && <Status label={turn.status.label} since={turn.status.since} />}
      {turn.cards.map((card, i) => (
        <Fragment key={`${card.type}-${i}`}>{renderCard(card)}</Fragment>
      ))}
      {turn.error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-[13px] text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        >
          <span className="flex-1">{turn.error.message}</span>
          {turn.error.retryable && latest && !busy && (
            <button type="button" onClick={onRetry} className="flex items-center gap-1 rounded-md px-2 py-1 font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20">
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
          )}
        </div>
      )}
      {turn.tookMs != null && turn.tookMs > 4000 && latest && <p className="text-[10px] text-muted-foreground">Answered in {(turn.tookMs / 1000).toFixed(1)}s</p>}
    </div>
  );
}

function Composer({
  busy,
  placeholder,
  footnote,
  autoFocus,
  onSend,
  onStop,
}: {
  busy: boolean;
  placeholder: string;
  footnote?: string;
  autoFocus: boolean;
  onSend: (text: string) => void;
  onStop: () => void;
}) {
  const [draft, setDraft] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (autoFocus) input.current?.focus();
  }, [autoFocus]);

  const submit = () => {
    if (!draft.trim() || busy) return;
    onSend(draft);
    setDraft('');
    if (input.current) input.current.style.height = 'auto';
    window.setTimeout(() => input.current?.focus(), 0);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="shrink-0 border-t border-border bg-background px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5"
    >
      <div className="flex items-end gap-2 rounded-2xl border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-primary/30">
        <textarea
          ref={input}
          rows={1}
          value={draft}
          maxLength={2000}
          onChange={(e) => {
            setDraft(e.target.value);
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          aria-label="Message"
          className="max-h-[120px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-6 outline-none placeholder:text-muted-foreground sm:text-sm"
        />
        {busy ? (
          <button type="button" onClick={onStop} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground text-background" aria-label="Stop">
            <Square className="h-3 w-3 fill-current" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!draft.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
            aria-label="Send"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
      {footnote && <p className="mt-1.5 text-center text-[10px] text-muted-foreground">{footnote}</p>}
    </form>
  );
}

/** "Checking stock · 1.4s", ticking while a tool works, so a longer step never looks frozen. */
function Status({ label, since }: { label: string; since: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(t);
  }, []);
  const secs = Math.max(0, (now - since) / 1000);
  return (
    <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
      <span className="flex gap-0.5" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
      </span>
      {label}…{secs >= 1 && <span className="tabular-nums text-muted-foreground/70">{secs.toFixed(1)}s</span>}
    </p>
  );
}

/**
 * Assistant text: paragraphs, simple lists and **bold**. Nothing else is rendered: no raw HTML, and markdown images,
 * links and code fences are reduced to their text, so a made-up link or image can never appear.
 */
export function RichText({ text, streaming }: { text: string; streaming: boolean }) {
  const clean = text
    .replace(/```[a-z]*\n?([\s\S]*?)(```|$)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)?/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '');
  const blocks = clean.split(/\n{2,}/);
  return (
    <div className="space-y-2 break-words">
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        const caret = streaming && i === blocks.length - 1;
        const isList = lines.length > 0 && lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
          const ordered = /^\s*\d/.test(lines[0]);
          const ListTag = ordered ? 'ol' : 'ul';
          return (
            <ListTag key={i} className={`${ordered ? 'list-decimal' : 'list-disc'} space-y-0.5 pl-5`}>
              {lines.map((l, j) => (
                <li key={j}>
                  <Inline text={l.replace(/^\s*([-*•]|\d+[.)])\s+/, '')} />
                  {caret && j === lines.length - 1 && <Caret />}
                </li>
              ))}
            </ListTag>
          );
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            <Inline text={block} />
            {caret && <Caret />}
          </p>
        );
      })}
      {streaming && clean.length === 0 && <Caret />}
    </div>
  );
}

function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') && p.length > 4 ? <strong key={i}>{p.slice(2, -2)}</strong> : <Fragment key={i}>{p}</Fragment>,
      )}
    </>
  );
}

function Caret() {
  return <span className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-foreground/70 align-baseline" aria-hidden="true" />;
}

/** Tap-to-send suggestions. */
export function QuickReplies({ options, onPick, disabled }: { options: string[]; onPick: (text: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Suggested replies">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled}
          onClick={() => onPick(o)}
          className="rounded-full border border-primary/30 bg-background px-3 py-1.5 text-[13px] font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
        >
          {o}
        </button>
      ))}
    </div>
  );
}

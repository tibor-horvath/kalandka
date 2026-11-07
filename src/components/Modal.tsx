import { useEffect, useRef, useState, type ReactNode } from 'react';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Makes the element a real modal: everything around it goes inert (no taps, no Tab, hidden from screen readers),
 * focus moves inside unless something there already took it (autoFocus), Escape calls `onEscape` when given,
 * and on close focus goes back to where it was.
 */
export function useModal<T extends HTMLElement>(onEscape?: () => void) {
  const ref = useRef<T>(null);
  // Read while rendering, before autoFocus moves focus into the new dialog.
  const [opener] = useState(() => document.activeElement);
  const escape = useRef(onEscape);
  escape.current = onEscape;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Two dialogs can open in one go (a new sticker on the home screen as the rest screen comes up). The one later in
    // the page sits on top and keeps working; this one must not silence it, or nothing on screen could be tapped.
    const above = (node: Element) =>
      [node, ...node.querySelectorAll('[aria-modal="true"]')].some(
        (d) => d !== el && d.getAttribute('aria-modal') === 'true' && !!(el.compareDocumentPosition(d) & Node.DOCUMENT_POSITION_FOLLOWING)
      );

    const quieted: HTMLElement[] = [];
    for (let node: HTMLElement = el; node.parentElement && node !== document.body; node = node.parentElement) {
      for (const sibling of node.parentElement.children) {
        if (sibling !== node && sibling instanceof HTMLElement && !sibling.inert && !above(sibling)) {
          sibling.inert = true;
          quieted.push(sibling);
        }
      }
    }

    // The opener may be gone already (the gate hands over to the parents' corner); then whatever had focus as this opened.
    const active = document.activeElement;
    const back = opener instanceof HTMLElement && opener.isConnected ? opener : active instanceof HTMLElement && !el.contains(active) ? active : null;

    if (!el.contains(document.activeElement)) {
      const first = el.querySelector<HTMLElement>(FOCUSABLE);
      if (first) first.focus({ preventScroll: true });
      else {
        el.tabIndex = -1;
        el.focus({ preventScroll: true });
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escape.current) escape.current();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      for (const node of quieted) node.inert = false;
      if (back && back.isConnected && back !== document.body) back.focus({ preventScroll: true });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Set up once while the dialog is open; Escape is read through a ref.
  }, []);

  return ref;
}

/** A modal dialog for popups written inline (the visitor cards): `useModal` on a `role="dialog"` div. */
export function Modal({
  className,
  labelledBy,
  onEscape,
  children
}: {
  className: string;
  labelledBy: string;
  onEscape?: () => void;
  children: ReactNode;
}) {
  const ref = useModal<HTMLDivElement>(onEscape);
  return (
    <div ref={ref} className={className} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      {children}
    </div>
  );
}

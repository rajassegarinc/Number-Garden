import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { playCollectBlip, playPlaceChime } from '../utils/sfx';
import './CollectQuest.css';

const DRAG_THRESHOLD = 6;
// How long the child can go without collecting anything before a gentle
// highlight nudges them toward an uncollected item — never a failure state,
// just a hint, per "provide visual hints instead of ... the same failed question".
const HINT_DELAY_MS = 7000;

interface FieldItem {
  id: string;
  x: number;
  y: number;
}

/** Scatters `count` items across a play field as jittered-grid percentage
 * coordinates, so items stay touch-friendly and non-overlapping without any
 * collision-detection math. */
const buildLayout = (count: number): FieldItem[] => {
  const cols = Math.max(1, Math.ceil(Math.sqrt(count * 1.4)));
  const rows = Math.max(1, Math.ceil(count / cols));
  const cellW = 100 / cols;
  const cellH = 100 / rows;
  const items: FieldItem[] = [];
  for (let i = 0; i < count; i += 1) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const baseX = col * cellW + cellW / 2;
    const baseY = row * cellH + cellH / 2;
    const jitterX = (Math.random() - 0.5) * cellW * 0.55;
    const jitterY = (Math.random() - 0.5) * cellH * 0.55;
    items.push({
      id: `item-${i}`,
      x: Math.min(90, Math.max(10, baseX + jitterX)),
      y: Math.min(88, Math.max(10, baseY + jitterY)),
    });
  }
  return items;
};

interface DragState {
  id: string;
  pointerId: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  isDragging: boolean;
  width: number;
  height: number;
}

interface CollectQuestProps {
  /** How many items the child needs to collect to finish this round. */
  target: number;
  /** Total scattered items shown (>= target) — extras add a "which ones do
   * I need" discovery element without any risk of failing. */
  totalItems: number;
  itemAriaLabel: string;
  renderItem: (index: number) => ReactNode;
  containerAriaLabel: string;
  renderContainer: (collectedCount: number, target: number) => ReactNode;
  onComplete: () => void;
  /** Fired the moment a hint is shown (for mission-level star scoring) —
   * not fired again until the next hint cycle. */
  onHint?: () => void;
  /** Fired on every successful collection (tap or drag) — lets the mission
   * pulse its guide character (monkey/bird) so it visibly reacts. */
  onCollect?: () => void;
  soundOn: boolean;
  disabled?: boolean;
}

export const CollectQuest = ({
  target,
  totalItems,
  itemAriaLabel,
  renderItem,
  containerAriaLabel,
  renderContainer,
  onComplete,
  onHint,
  onCollect,
  soundOn,
  disabled = false,
}: CollectQuestProps) => {
  const [layout] = useState(() => buildLayout(Math.max(target, totalItems)));
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [hintedId, setHintedId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropHover, setDropHover] = useState(false);
  const [dockLanded, setDockLanded] = useState(false);
  // Per-item flight offset (px) toward the dock, set only for tap-collects —
  // a drag-collect already visibly travelled there via the drag ghost, so it
  // just needs to vanish where it was dropped, not fly a second time.
  const [flights, setFlights] = useState<Record<string, { dx: number; dy: number }>>({});

  const fieldRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastWasDragRef = useRef(false);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneRef = useRef(false);

  const collectedCount = collected.size;

  useEffect(() => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    setHintedId(null);
    if (disabled || collectedCount >= target) return undefined;
    hintTimerRef.current = setTimeout(() => {
      const remaining = layout.filter((item) => !collected.has(item.id));
      if (remaining.length === 0) return;
      setHintedId(remaining[Math.floor(Math.random() * remaining.length)].id);
      onHint?.();
    }, HINT_DELAY_MS);
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
    // Re-arm whenever the collected count changes or the round becomes active.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectedCount, disabled]);

  const collectItem = (id: string, viaDrag = false) => {
    if (doneRef.current || disabled || collected.has(id)) return;
    if (soundOn) playCollectBlip();
    onCollect?.();

    if (!viaDrag) {
      // Tapped (not dragged): the item never moved, so fly it toward the
      // dock itself — computed from the field's real size so it reaches
      // roughly the basket/nest position regardless of screen width.
      const item = layout.find((l) => l.id === id);
      const field = fieldRef.current;
      if (item && field) {
        const dx = ((50 - item.x) / 100) * field.clientWidth;
        const dy = ((102 - item.y) / 100) * field.clientHeight;
        setFlights((prev) => ({ ...prev, [id]: { dx, dy } }));
      }
    }

    setCollected((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setDockLanded(true);
    setTimeout(() => setDockLanded(false), 320);

    // Computed from the pre-update size rather than inside the setState
    // updater (which React/StrictMode may invoke more than once) so the
    // completion side effect below can never fire twice.
    const newCount = collected.size + 1;
    if (newCount >= target && !doneRef.current) {
      doneRef.current = true;
      if (soundOn) setTimeout(() => playPlaceChime(), 160);
      setTimeout(() => onComplete(), 420);
    }
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>, id: string) => {
    if (collected.has(id) || disabled) return;
    lastWasDragRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const state: DragState = {
      id,
      pointerId: e.pointerId,
      originX: e.clientX,
      originY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      isDragging: false,
      width: rect.width,
      height: rect.height,
    };
    dragRef.current = state;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.originX;
    const dy = e.clientY - state.originY;
    if (!state.isDragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      state.isDragging = true;
      lastWasDragRef.current = true;
    }
    if (state.isDragging) {
      e.preventDefault();
      state.x = e.clientX;
      state.y = e.clientY;
      setDrag({ ...state });
      const el = document.elementFromPoint(e.clientX, e.clientY);
      setDropHover(Boolean(el?.closest('[data-collect-dropzone]')));
    }
  };

  const endDrag = (id: string, e: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const overDropzone = Boolean(el?.closest('[data-collect-dropzone]'));
    if (state.isDragging && overDropzone) {
      collectItem(id, true);
    }
    dragRef.current = null;
    setDrag(null);
    setDropHover(false);
  };

  const handlePointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDrag(null);
    setDropHover(false);
  };

  // Primary, always-reliable interaction: a plain tap/click collects the
  // item outright (suppressed only for the trailing click some browsers
  // fire right after a drag-release). Dragging into the basket/nest is an
  // equally valid alternate path, not a requirement.
  const handleClick = (id: string, e: ReactMouseEvent<HTMLButtonElement>) => {
    if (e.detail > 0 && lastWasDragRef.current) return;
    collectItem(id);
  };

  return (
    <div className="collect-quest">
      <div className="collect-quest-field" ref={fieldRef} onPointerMove={handlePointerMove}>
        {layout.map((item, index) => {
          const isCollected = collected.has(item.id);
          const isHinted = hintedId === item.id && !isCollected;
          const isBeingDragged = drag?.id === item.id;
          const flight = flights[item.id];
          const style: Record<string, string> = { left: `${item.x}%`, top: `${item.y}%` };
          if (flight) {
            style['--collect-dx'] = `${flight.dx}px`;
            style['--collect-dy'] = `${flight.dy}px`;
          }
          const itemStyle = style as CSSProperties;
          return (
            <button
              key={item.id}
              type="button"
              className={[
                'collect-quest-item',
                isCollected ? 'collect-quest-item--collected' : '',
                isHinted ? 'collect-quest-item--hinted' : '',
                isBeingDragged ? 'collect-quest-item--dragging' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={itemStyle}
              disabled={isCollected || disabled}
              aria-label={isCollected ? `${itemAriaLabel}, collected` : itemAriaLabel}
              onPointerDown={(e) => handlePointerDown(e, item.id)}
              onPointerUp={(e) => endDrag(item.id, e)}
              onPointerCancel={handlePointerCancel}
              onClick={(e) => handleClick(item.id, e)}
            >
              {!isCollected && renderItem(index)}
            </button>
          );
        })}
      </div>

      <div
        className={`collect-quest-dock ${dropHover ? 'collect-quest-dock--hover' : ''} ${dockLanded ? 'collect-quest-dock--landed' : ''}`}
        data-collect-dropzone="true"
        role="group"
        aria-label={`${containerAriaLabel}: ${collectedCount} of ${target} collected`}
      >
        {renderContainer(collectedCount, target)}
        <span className="collect-quest-count">
          {collectedCount} / {target}
        </span>
      </div>

      {drag && (
        <div
          className="collect-quest-ghost"
          style={{ left: drag.x - drag.width / 2, top: drag.y - drag.height / 2, width: drag.width, height: drag.height }}
          aria-hidden="true"
        >
          {renderItem(0)}
        </div>
      )}
    </div>
  );
};

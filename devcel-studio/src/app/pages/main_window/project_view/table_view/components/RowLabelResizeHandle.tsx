import React, { useRef } from 'react';

type Props = { onResize: (width: number) => void; onResizeEnd: () => void };

/** The whole frozen row-label boundary can be dragged, including on touch screens. */
export function RowLabelResizeHandle({ onResize, onResizeEnd }: Props) {
  const drag = useRef<{ pointerId: number; x: number; width: number; scale: number; direction: number } | null>(null);
  function finish(event: React.PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointerId !== event.pointerId) return;
    drag.current = null;
    onResizeEnd();
  }
  return <div className="rdg-row-label-resize" role="separator" aria-orientation="vertical"
    onPointerDown={event => {
      if (drag.current || (event.pointerType === 'mouse' && event.button !== 0)) return;
      const cell = event.currentTarget.closest<HTMLElement>('.rdg-row-index, .rdg-row-indicator-header');
      if (!cell || !cell.offsetWidth) return;
      const scale = cell.getBoundingClientRect().width / cell.offsetWidth;
      if (!(scale > 0) || !Number.isFinite(scale)) return;
      event.preventDefault(); event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { pointerId: event.pointerId, x: event.clientX, width: cell.offsetWidth, scale, direction: getComputedStyle(cell).direction === 'rtl' ? -1 : 1 };
    }}
    onPointerMove={event => {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      event.preventDefault(); event.stopPropagation();
      onResize(Math.max(80, Math.min(800, Math.round(current.width + (event.clientX - current.x) * current.direction / current.scale))));
    }}
    onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}
    onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()} />;
}

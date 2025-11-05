'use client';

import { useEffect, useRef } from 'react';
import { buildCssSelector } from '@/lib/utils/css-selector';

type SelectorOverlayProps = {
  html: string;
  onSelect: (selector: { css: string }) => void;
};

export function SelectorOverlay({ html, onSelect }: SelectorOverlayProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(html);
    doc.close();

    const hover = doc.createElement('div');
    hover.style.position = 'absolute';
    hover.style.pointerEvents = 'none';
    hover.style.border = '2px solid #38bdf8';
    hover.style.background = 'rgba(56,189,248,0.2)';
    hover.style.zIndex = '9999';
    doc.body.appendChild(hover);

    function updateOverlay(target: Element | null) {
      if (!target) {
        hover.style.display = 'none';
        return;
      }
      const rect = target.getBoundingClientRect();
      hover.style.display = 'block';
      hover.style.left = `${rect.left + doc.defaultView!.scrollX}px`;
      hover.style.top = `${rect.top + doc.defaultView!.scrollY}px`;
      hover.style.width = `${rect.width}px`;
      hover.style.height = `${rect.height}px`;
    }

    function handleMouseMove(event: MouseEvent) {
      updateOverlay(event.target as Element);
    }

    function handleClick(event: MouseEvent) {
      event.preventDefault();
      event.stopPropagation();
      const target = event.target as Element;
      const css = buildCssSelector(target);
      onSelect({ css });
    }

    doc.addEventListener('mousemove', handleMouseMove, true);
    doc.addEventListener('click', handleClick, true);

    return () => {
      doc.removeEventListener('mousemove', handleMouseMove, true);
      doc.removeEventListener('click', handleClick, true);
      hover.remove();
    };
  }, [html, onSelect]);

  return <iframe ref={iframeRef} className="h-[600px] w-full rounded border bg-white" title="Selector preview" />;
}

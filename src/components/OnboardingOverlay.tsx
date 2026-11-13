import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { COAT_PALETTES } from '../engine/sprites';
import { AccessoryId, CoatId, HitRect, MonitorRect } from '../types/kitten';

interface OnboardingOverlayProps {
  catCenterX: number;
  catTopY: number;
  virtualWidth: number;
  virtualHeight: number;
  primaryMonitor?: MonitorRect;
  initialName: string;
  initialCoat: CoatId;
  initialAccessory: AccessoryId;
  onPreviewCoat: (coat: CoatId) => void;
  onPreviewAccessory: (accessory: AccessoryId) => void;
  onHitRectChange: (rect: HitRect | null) => void;
  onConfirm: (name: string, coat: CoatId, accessory: AccessoryId) => void;
}

const SUGGESTED_NAMES = ['Mochi', 'Luna', 'Lilac', 'Pearl', 'Boba', 'Daisy'];

const STARTER_COATS: CoatId[] = [
  'lavender',
  'vanilla',
  'sakura',
  'calico',
  'ginger',
  'tuxedo',
  'gray_tabby',
  'void',
];

const STARTER_ACCESSORIES: Array<{ id: AccessoryId; label: string }> = [
  { id: 'none', label: 'Natural' },
  { id: 'lavender_bow', label: 'Lavender Bow' },
  { id: 'pearl_collar', label: 'Pearl Collar' },
  { id: 'pink_bow', label: 'Pink Bow' },
];

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({
  catCenterX,
  catTopY,
  virtualWidth,
  virtualHeight,
  primaryMonitor,
  initialName,
  initialCoat,
  initialAccessory,
  onPreviewCoat,
  onPreviewAccessory,
  onHitRectChange,
  onConfirm,
}) => {
  const [name, setName] = useState(initialName || 'Mochi');
  const [coat, setCoat] = useState<CoatId>(initialCoat);
  const [accessory, setAccessory] = useState<AccessoryId>(
    initialAccessory === 'lavender_bow' ||
      initialAccessory === 'pearl_collar' ||
      initialAccessory === 'pink_bow'
      ? initialAccessory
      : 'none',
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const cardWidth = 316;
  const approxHeight = 316;

  const workX = primaryMonitor?.workX ?? 0;
  const workY = primaryMonitor?.workY ?? 0;
  const workW = primaryMonitor?.workWidth ?? virtualWidth;
  const workH = primaryMonitor?.workHeight ?? virtualHeight;

  const vw = Math.max(1, window.innerWidth || virtualWidth);
  const vh = Math.max(1, window.innerHeight || virtualHeight);
  const scaleX = vw / Math.max(1, virtualWidth);
  const scaleY = vh / Math.max(1, virtualHeight);

  const anchorLeftPx = catCenterX * scaleX - cardWidth / 2;
  const minLeftPx = workX * scaleX + 16;
  const maxLeftPx = (workX + workW) * scaleX - cardWidth - 16;
  const leftPx = Math.round(Math.max(minLeftPx, Math.min(maxLeftPx, anchorLeftPx)));

  const anchorTopPx = catTopY * scaleY - approxHeight - 20;
  const minTopPx = workY * scaleY + 16;
  const maxTopPx = (workY + workH) * scaleY - approxHeight - 16;
  const topPx = Math.round(Math.max(minTopPx, Math.min(maxTopPx, anchorTopPx)));

  useEffect(() => {
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const syncRect = () => {
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const invX = Math.max(1, virtualWidth) / Math.max(1, window.innerWidth || virtualWidth);
      const invY = Math.max(1, virtualHeight) / Math.max(1, window.innerHeight || virtualHeight);
      onHitRectChange({
        x: r.left * invX - 8,
        y: r.top * invY - 8,
        width: r.width * invX + 16,
        height: r.height * invY + 16,
      });
    };

    syncRect();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(syncRect) : null;
    if (ro && cardRef.current) ro.observe(cardRef.current);
    window.addEventListener('resize', syncRect);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', syncRect);
      onHitRectChange(null);
    };
  }, [leftPx, topPx, virtualWidth, virtualHeight, onHitRectChange]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = name.trim().slice(0, 14) || 'Mochi';
    onConfirm(cleaned, coat, accessory);
  };

  return (
    <form
      ref={cardRef as unknown as React.RefObject<HTMLFormElement>}
      className="name-tag-card"
      style={{ left: `${leftPx}px`, top: `${topPx}px`, width: `${cardWidth}px` }}
      onSubmit={handleSubmit}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="name-tag-ring" aria-hidden="true" />
      <div className="name-tag-header">
        <Sparkles size={14} />
        <span>It&apos;s a Tiny Kitten! Name Tag</span>
        <span className="name-tag-heart">♥</span>
      </div>

      <div className="name-tag-body">
        <label className="name-tag-label" htmlFor="kitten-name-tag-input">
          Give your kitten a name:
        </label>
        <input
          id="kitten-name-tag-input"
          ref={inputRef}
          type="text"
          maxLength={14}
          className="name-tag-input"
          value={name}
          placeholder="Mochi"
          onChange={(e) => setName(e.target.value)}
        />

        <div className="name-tag-chips">
          {SUGGESTED_NAMES.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className={`name-chip ${name.trim() === suggestion ? 'name-chip--active' : ''}`}
              onClick={() => setName(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="name-tag-custom-row">
          <span className="name-tag-mini-label">Coat</span>
          <div className="name-tag-swatches">
            {STARTER_COATS.map((coatId) => {
              const pal = COAT_PALETTES[coatId];
              return (
                <button
                  key={coatId}
                  type="button"
                  title={pal.name}
                  className={`mini-coat-dot ${coat === coatId ? 'mini-coat-dot--active' : ''}`}
                  style={{ background: pal.body }}
                  onClick={() => {
                    setCoat(coatId);
                    onPreviewCoat(coatId);
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="name-tag-custom-row">
          <span className="name-tag-mini-label">Ribbon</span>
          <div className="name-tag-bow-toggle">
            {STARTER_ACCESSORIES.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`name-chip ${accessory === item.id ? 'name-chip--active' : ''}`}
                onClick={() => {
                  setAccessory(item.id);
                  onPreviewAccessory(item.id);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <button type="submit" className="pixel-btn pixel-btn--primary name-tag-submit">
          Welcome Home ♥
        </button>
      </div>
    </form>
  );
};

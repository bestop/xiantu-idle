// 共享 UI 小元件
'use client';

import { ReactNode } from 'react';
import { QUALITY_COLORS, QUALITY_NAMES, QUALITY_TEXT } from '@/lib/game/items';
import { ItemQuality } from '@/types/game';
import { cn } from '@/lib/utils';

// 区块卡片
export function Section({ title, extra, children, className }: {
  title?: string; extra?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section className={cn('bg-stone-900/80 border border-stone-800 rounded-xl p-3', className)}>
      {title && (
        <header className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-amber-200/90">{title}</h3>
          {extra}
        </header>
      )}
      {children}
    </section>
  );
}

// 进度条
export function ProgressBar({ value, max, className, barClass, showText }: {
  value: number; max: number; className?: string; barClass?: string; showText?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className={cn('relative h-2 w-full bg-stone-800 rounded-full overflow-hidden', className)}>
      <div
        className={cn('h-full bg-amber-500 rounded-full transition-[width] duration-300', barClass)}
        style={{ width: `${pct}%` }}
      />
      {showText && (
        <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white/90 font-medium tabular-nums">
          {Math.floor(value)}/{Math.floor(max)}
        </span>
      )}
    </div>
  );
}

// 品质徽标
export function QualityBadge({ quality }: { quality: ItemQuality }) {
  return (
    <span className={cn('text-[10px] px-1 py-0.5 rounded border', QUALITY_COLORS[quality])}>
      {QUALITY_NAMES[quality]}
    </span>
  );
}

export function QualityText({ quality, children }: { quality: ItemQuality; children: ReactNode }) {
  return <span className={QUALITY_TEXT[quality]}>{children}</span>;
}

// 数值 pill
export function StatPill({ icon, value, label, onClick }: {
  icon: string; value: string | number; label?: string; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 bg-stone-800/80 rounded-lg px-2 py-1 text-xs text-stone-200 min-h-[32px]"
    >
      <span aria-hidden>{icon}</span>
      <span className="tabular-nums font-medium">{value}</span>
      {label && <span className="text-stone-400 text-[10px]">{label}</span>}
    </button>
  );
}

// 主操作按钮
export function ActionButton({ children, onClick, disabled, variant = 'primary', className }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: 'primary' | 'ghost' | 'danger'; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'min-h-[44px] px-4 rounded-xl text-sm font-semibold transition active:scale-95 disabled:opacity-40 disabled:active:scale-100',
        variant === 'primary' && 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/40',
        variant === 'ghost' && 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700',
        variant === 'danger' && 'bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-800',
        className
      )}
    >
      {children}
    </button>
  );
}

// 时间格式化
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)} 秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} 小时 ${m} 分`;
}

export function formatNum(n: number): string {
  if (n >= 1e8) return `${(n / 1e8).toFixed(2)}亿`;
  if (n >= 1e4) return `${(n / 1e4).toFixed(1)}万`;
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 });
}

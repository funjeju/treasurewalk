import type { ReactNode } from 'react';

/**
 * GAME UI KIT — 다크 프리미엄 재사용 컴포넌트.
 * 스타일은 app/kit.css(.g-*, .glass ...). 모든 화면이 이 어휘를 공유한다.
 */

type Div = React.HTMLAttributes<HTMLDivElement>;
const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

/** 게임 테마 배경 래퍼 — 최상위에 한 번 감싼다. */
export function GameRoot({ children, className, ...rest }: Div) {
  return (
    <div className={cx('game-root min-h-screen', className)} {...rest}>
      {children}
    </div>
  );
}

export function GlassCard({ children, className, ...rest }: Div) {
  return (
    <div className={cx('glass', className)} {...rest}>
      {children}
    </div>
  );
}

export function GlassInset({ children, className, ...rest }: Div) {
  return (
    <div className={cx('glass-inset', className)} {...rest}>
      {children}
    </div>
  );
}

type BtnVariant = 'gold' | 'glass' | 'ghost' | 'danger';
export function GButton({
  variant = 'gold',
  size,
  block,
  className,
  children,
  ...rest
}: {
  variant?: BtnVariant;
  size?: 'sm';
  block?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        'g-btn',
        `g-btn-${variant}`,
        size === 'sm' && 'g-btn-sm',
        block && 'g-btn-block',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export type OrbVariant = 'gold' | 'gem' | 'xp' | 'streak' | 'steps' | 'violet';
export function Orb({
  variant = 'gold',
  lg,
  children,
  className,
}: {
  variant?: OrbVariant;
  lg?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx('g-orb', `g-orb-${variant}`, lg && 'g-orb-lg', className)} aria-hidden>
      {children}
    </span>
  );
}

/** 스탯 칩: 오브 + (라벨) + 값 */
export function Stat({
  variant = 'gold',
  icon,
  label,
  value,
  className,
}: {
  variant?: OrbVariant;
  icon: ReactNode;
  label?: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx('g-stat', className)}>
      <Orb variant={variant}>{icon}</Orb>
      {label && <span className="text-[0.62rem] font-bold text-[var(--g-dim)]">{label}</span>}
      <span>{value}</span>
    </span>
  );
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cx('g-progress', className)}>
      <span style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
    </div>
  );
}

type ChipVariant = 'default' | 'gold' | 'red' | 'blue' | 'violet';
export function Chip({
  variant = 'default',
  children,
  className,
}: {
  variant?: ChipVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx('g-chip', variant !== 'default' && `g-chip-${variant}`, className)}>
      {children}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="g-seg" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          data-active={value === o.value}
          className="g-seg-item"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export type Rarity = 'common' | 'rare' | 'epic' | 'legend';

export function Stars({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="g-stars" aria-label={`${value}/${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < value ? 'var(--g-gold)' : 'var(--g-line)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

export function CurrencyTag({
  kind = 'coin',
  amount,
  className,
}: {
  kind?: 'coin' | 'gem';
  amount: number | string;
  className?: string;
}) {
  return (
    <span className={cx('inline-flex items-center gap-1 font-extrabold', className)}>
      <Orb variant={kind === 'coin' ? 'gold' : 'gem'} className="!h-5 !w-5 !text-[0.7rem]">
        {kind === 'coin' ? '🪙' : '💎'}
      </Orb>
      {typeof amount === 'number' ? amount.toLocaleString() : amount}
    </span>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="g-section-title">{children}</h2>
      {action}
    </div>
  );
}

export function Avatar({
  size = 44,
  level,
  children,
}: {
  size?: number;
  level?: number;
  children: ReactNode;
}) {
  return (
    <span className="g-avatar" style={{ width: size, height: size, fontSize: size * 0.5 }}>
      {children}
      {level != null && <span className="g-avatar-badge">{level}</span>}
    </span>
  );
}

/** 도감/상점 카드 */
export function GCard({
  rarity,
  locked,
  className,
  children,
  ...rest
}: { rarity?: Rarity; locked?: boolean } & Div) {
  return (
    <div
      className={cx(
        'g-card',
        locked && 'g-card-locked',
        rarity && rarity !== 'common' && `g-rarity-${rarity}`,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardThumb({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('g-card-thumb', className)}>{children}</div>;
}

/** 하단 탭바 (구성은 각 화면에서) */
export function TabBar({ children }: { children: ReactNode }) {
  return (
    <nav className="glass g-tabbar fixed bottom-3 left-1/2 z-40 w-[min(94%,26rem)] -translate-x-1/2">
      {children}
    </nav>
  );
}
export function Tab({
  active,
  icon,
  label,
  ...rest
}: { active?: boolean; icon: ReactNode; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="g-tab" data-active={active} {...rest}>
      <span className="g-tab-ico" aria-hidden>
        {icon}
      </span>
      {label}
    </button>
  );
}

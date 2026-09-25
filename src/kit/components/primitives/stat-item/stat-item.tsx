import type { ReactNode } from 'react';

import { mergeClassNames } from 'kit/components/components.config';
import './stat-item.css';

/** Semantic color variants — maps to PF status tokens via CSS. */
export type LwStatItemVariant = 'default' | 'danger' | 'warning' | 'success' | 'info';

export type LwStatItemProps = {
  /** The numeric or text value displayed prominently. */
  value: ReactNode;
  /** Caption below the value ("Total", "Critical", …). */
  label: ReactNode;
  /** Semantic color applied to the value. Defaults to `'default'` (no modifier). */
  variant?: LwStatItemVariant;
  className?: string;
};

/**
 * Kit **primitive** — stat value + label block.
 * No PF host equivalent; renders a minimal two-element block.
 * Variant maps to PF status tokens in co-located CSS.
 * Layout (centering, Flex context) is the parent's responsibility.
 */
export function LwStatItem({ value, label, variant = 'default', className }: LwStatItemProps) {
  const variantClass = variant !== 'default' ? `lw-c-stat-item--${variant}` : undefined;
  return (
    <div className={mergeClassNames('lw-c-stat-item', variantClass, className)}>
      <span className='lw-c-stat-item__value'>{value}</span>
      <span className='lw-c-stat-item__label'>{label}</span>
    </div>
  );
}

export default LwStatItem;

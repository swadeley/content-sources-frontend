import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  type CardProps,
} from '@patternfly/react-core';
import type { ReactNode } from 'react';

import {
  getLwCardDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './card.css';

type LwCardOwnedProps = {
  /** Slot: rendered in `CardTitle` inside `CardHeader`. Enables the header when truthy. */
  hasHeader?: ReactNode;
  /** Slot: rendered as `CardHeader` actions (right side). Combines with `hasHeader`. */
  hasAction?: ReactNode;
  /**
   * Slot: body content.
   * - Provide kit primitives / PF components → rendered inside `CardBody`.
   * - Omit → empty state fills the body.
   * - When neither `hasHeader` nor `hasAction` is set, children render as direct Card
   *   children (composition mode) — callers may pass `CardHeader` / `CardBody` themselves.
   */
  children?: ReactNode;
};

/** Owned slots + PF `Card` passthrough — `className` / `style` / rest merge onto the Card root.
 * `action` omitted from CardProps: PF types it narrowly; kit owns that slot. */
export type LwCardProps = LwCardOwnedProps & Omit<CardProps, 'children' | 'action'>;

const LwCardEmptyState = () => (
  <EmptyState variant={EmptyStateVariant.xs}>
    <EmptyStateBody>No content</EmptyStateBody>
  </EmptyState>
);

/**
 * Kit **assembly** — composable glass Card with cascading slots.
 *
 * Cascade per slot:
 *   1. `has*` prop provided → that slot renders with the passed value.
 *   2. `children` provided → renders in body (alongside any `has*`-driven header).
 *   3. Neither → empty state fills the body.
 *
 * Composition mode (no `hasHeader`/`hasAction`): children pass through as direct Card
 * children — callers may compose `CardHeader`, `CardBody`, etc. themselves.
 *
 * Modifier booleans (e.g. `isSummary`) pass through `...rest` onto the Card root,
 * applying `pf-m-*` classes per PF convention.
 */
export function LwCard({ hasHeader, hasAction, children, className, ...rest }: LwCardProps) {
  const cardProps = mergeComponentProps(getLwCardDefaults(), {
    ...rest,
    className: mergeClassNames('lw-c-card', className),
  });

  const headerEnabled = Boolean(hasHeader || hasAction);

  // Composition mode: no has* slots set — children own the full interior.
  if (!headerEnabled) {
    return <Card {...cardProps}>{children}</Card>;
  }

  // Slot mode: has* values fill their positions; body gets children or empty state.
  return (
    <Card {...cardProps}>
      <CardHeader actions={hasAction ? { actions: hasAction } : undefined}>
        {hasHeader && <CardTitle>{hasHeader}</CardTitle>}
      </CardHeader>
      <CardBody>{children ?? <LwCardEmptyState />}</CardBody>
    </Card>
  );
}

export default LwCard;

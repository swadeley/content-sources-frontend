import { Popover, type PopoverProps } from '@patternfly/react-core';
import type { ReactElement, ReactNode } from 'react';

type LwPopoverOwnedProps = {
  /**
   * Slot: the trigger element — rendered as PF Popover `children`.
   * Optional when using `triggerRef` for external trigger control.
   * Passthrough: whatever you pass is what clicks/focuses to show the popover.
   */
  hasTrigger?: ReactElement;
  /** Slot: popover header content — rendered as PF `headerContent`. */
  hasHeader?: ReactNode;
  /** Slot: popover body content — rendered as PF `bodyContent`. Required. */
  hasBody: ReactNode | ((hide: () => void) => ReactNode);
  /** Slot: popover footer content — rendered as PF `footerContent`. */
  hasFooter?: ReactNode | ((hide: () => void) => ReactNode);
};

/** Owned slots + PF `Popover` passthrough.
 * `children`, `headerContent`, `bodyContent`, `footerContent` are owned by `has*` slots. */
export type LwPopoverProps = LwPopoverOwnedProps &
  Omit<PopoverProps, 'children' | 'headerContent' | 'bodyContent' | 'footerContent'>;

/**
 * Kit **assembly** — `has*` slot wrappers on PF `Popover`.
 * Each `has*` prop is a direct passthrough to its PF equivalent — no transformation.
 * `hasTrigger` → `children` (trigger element); absent when using `triggerRef`.
 */
export function LwPopover({
  hasTrigger,
  hasHeader,
  hasBody,
  hasFooter,
  ...rest
}: LwPopoverProps) {
  return (
    <Popover
      headerContent={hasHeader}
      bodyContent={hasBody}
      footerContent={hasFooter}
      {...rest}
    >
      {hasTrigger}
    </Popover>
  );
}

export default LwPopover;

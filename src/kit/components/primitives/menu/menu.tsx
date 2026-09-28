import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Spinner,
  type DropdownProps,
  type MenuToggleElement,
  type MenuToggleProps,
} from '@patternfly/react-core';
import { useState, type ReactNode, type Ref } from 'react';

import {
  getLwMenuDefaults,
  mergeClassNames,
  mergeComponentProps,
} from 'kit/components/components.config';
import './menu.css';

/** One action row when using slot-build `items` (not children passthrough). */
export type LwMenuItem = {
  id: string;
  children: ReactNode;
  onSelect?: () => void;
  isDisabled?: boolean;
};

type LwMenuOwnedProps = {
  /** Toggle label when idle. Required unless call-site passes PF `toggle`. */
  label?: ReactNode;
  /** Toggle label while `isBusy`; defaults to `label`. */
  busyLabel?: ReactNode;
  /** Locks open/close and disables the toggle; shows spinner + busy label. */
  isBusy?: boolean;
  /** Disables the toggle (also true while busy). */
  isDisabled?: boolean;
  /** MenuToggle variant when harness builds the toggle. */
  toggleVariant?: MenuToggleProps['variant'];
  /** ouiaId on the harness-built MenuToggle. */
  toggleOuiaId?: string;
  /**
   * Slot build: item descriptors → `DropdownList` / `DropdownItem`.
   * Ignored when `children` is provided (passthrough wins).
   */
  items?: LwMenuItem[];
  /**
   * Passthrough: caller owns menu interior (`DropdownList`, groups, …).
   * Wins over `items`.
   */
  children?: ReactNode;
};

/** Owned slots + PF `Dropdown` passthrough. `toggle` / `children` may be caller-owned. */
export type LwMenuProps = LwMenuOwnedProps &
  Omit<DropdownProps, 'children' | 'toggle'> & {
    /** Explicit PF toggle wins over harness-built toggle from `label` / busy props. */
    toggle?: DropdownProps['toggle'];
  };

/**
 * Kit **primitive** — configured PF `Dropdown` (standard toggle + menu presentation).
 *
 * One base unit: host = `Dropdown`. Lightwell-owned props (`label`, `isBusy`, `items`, …)
 * configure that host; they do not promote this to an assembly.
 *
 * Cascade for interior:
 *   1. `children` → passthrough
 *   2. `items` → build `DropdownList` / `DropdownItem`
 *   3. neither → empty menu shell (toggle only)
 *
 * Owns open state by default; call-site `isOpen` / `onOpenChange` win when controlled.
 * `isBusy` blocks open changes and disables the toggle.
 */
export function LwMenu({
  label,
  busyLabel,
  isBusy = false,
  isDisabled = false,
  toggleVariant,
  toggleOuiaId,
  items,
  children,
  toggle: toggleProp,
  isOpen: isOpenProp,
  onOpenChange: onOpenChangeProp,
  className,
  ...rest
}: LwMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = isOpenProp !== undefined;
  const isOpen = isControlled ? isOpenProp : uncontrolledOpen;

  const setOpen = (open: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(open);
    }
    onOpenChangeProp?.(open);
  };

  const handleOpenChange = (open: boolean) => {
    if (isBusy) {
      return;
    }
    setOpen(open);
  };

  const toggleDisabled = isDisabled || isBusy;
  const toggleLabel = isBusy ? (busyLabel ?? label) : label;

  const defaultToggle = (toggleRef: Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      onClick={() => handleOpenChange(!isOpen)}
      isExpanded={isOpen}
      isDisabled={toggleDisabled}
      variant={toggleVariant}
      ouiaId={toggleOuiaId}
      aria-busy={isBusy || undefined}
      icon={isBusy ? <Spinner size='sm' aria-hidden='true' /> : undefined}
    >
      {toggleLabel}
    </MenuToggle>
  );

  // `toggle` is required by DropdownProps but excluded from LwMenuPassthroughProps
  // (it is caller-owned or harness-built). Merge only what the config type allows,
  // then spread `toggle` directly onto the host.
  const dropdownProps = mergeComponentProps(getLwMenuDefaults(), {
    ...rest,
    isOpen,
    onOpenChange: handleOpenChange,
    className: mergeClassNames('lw-c-menu', className),
  });

  const selectItem = (onSelect?: () => void) => {
    setOpen(false);
    onSelect?.();
  };

  let interior: ReactNode = null;
  if (children) {
    interior = children;
  } else if (items?.length) {
    interior = (
      <DropdownList>
        {items.map((item) => (
          <DropdownItem
            key={item.id}
            isDisabled={item.isDisabled || isBusy}
            onClick={() => selectItem(item.onSelect)}
          >
            {item.children}
          </DropdownItem>
        ))}
      </DropdownList>
    );
  }

  return (
    <Dropdown {...dropdownProps} toggle={toggleProp ?? defaultToggle}>
      {interior}
    </Dropdown>
  );
}

export default LwMenu;

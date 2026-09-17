import { useState } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import ConditionalTooltip from 'components/ConditionalTooltip/ConditionalTooltip';
import { AppContextInterface } from 'middleware/AppContext';

interface SnapshotsPrimaryActionButtonProps {
  deleteButtonLabel: string;
  onDeleteClick: () => void;
  isDeleteDisabled: boolean;
  isFetchingOrLoading: boolean;
  rbac: AppContextInterface['rbac'];
  isNothingToDelete: boolean;
}

export const SnapshotsPrimaryActionButton = ({
  deleteButtonLabel,
  onDeleteClick,
  isDeleteDisabled,
  isFetchingOrLoading,
  isNothingToDelete,
  rbac,
}: SnapshotsPrimaryActionButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isActionDisabled = isNothingToDelete;

  return (
    <Dropdown
      isOpen={isOpen}
      onSelect={() => setIsOpen(false)}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          variant='primary'
          isExpanded={isOpen}
          isDisabled={isFetchingOrLoading || isActionDisabled}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          Actions
        </MenuToggle>
      )}
      ouiaId='snapshot_bulk_actions'
      shouldFocusToggleOnSelect
    >
      <DropdownList>
        <ConditionalTooltip
          key='delete-action'
          content='You do not have the required permissions to perform this action.'
          show={!rbac?.repoWrite}
          setDisabled
        >
          <DropdownItem
            value='delete'
            ouiaId='remove_snapshots_bulk'
            isDisabled={isDeleteDisabled}
            onClick={onDeleteClick}
          >
            {deleteButtonLabel}
          </DropdownItem>
        </ConditionalTooltip>
        <DropdownItem value='publish' isDisabled>
          Publish
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

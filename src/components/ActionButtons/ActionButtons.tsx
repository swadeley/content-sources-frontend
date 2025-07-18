import { Button, Flex } from '@patternfly/react-core';

type ActionButtonsProps = {
  isAction: boolean;
  onSave: () => void;
  onClose: () => void;
};

export const ActionButtons = (props: ActionButtonsProps) => {
  const { isAction, onSave, onClose } = props;

  return (
    <Flex columnGap={{ default: 'columnGapLg' }}>
      <Button
        key='confirm'
        ouiaId='delete_modal_confirm'
        variant='danger'
        isLoading={isAction}
        isDisabled={isAction}
        onClick={onSave}
      >
        Delete
      </Button>
      <Button key='cancel' variant='link' onClick={onClose} ouiaId='delete_modal_cancel'>
        Cancel
      </Button>
    </Flex>
  );
};

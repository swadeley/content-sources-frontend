import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { useLocation } from 'react-router-dom';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';
import { usePublishSnapshotMutate } from 'services/AdminPartnerRepos/AdminPartnerReposQueries';

export default function PublishSnapshotModal() {
  const repoUUID = useSafeUUIDParam('repoUUID');
  const { search } = useLocation();
  const onClose = useNavigateTo('repositorySnapshots');

  const snapshotUUID = new URLSearchParams(search).get('snapshotUUID') || '';
  const isUnpublish = new URLSearchParams(search).get('action') === 'unpublish';

  const { mutateAsync: publishSnapshotMutate, isPending } = usePublishSnapshotMutate();

  const onConfirm = async () => {
    await publishSnapshotMutate({
      repoUUID,
      snapshotUUID,
      published: !isUnpublish,
    });
    onClose();
  };

  return (
    <Modal
      position='top'
      variant={ModalVariant.small}
      ouiaId='publish_snapshot_modal'
      isOpen
      onClose={onClose}
      aria-labelledby='publish-snapshot-modal-title'
    >
      <ModalHeader
        title={isUnpublish ? 'Unpublish snapshot?' : 'Publish snapshot?'}
        labelId='publish-snapshot-modal-title'
        titleIconVariant={isUnpublish ? 'warning' : undefined}
      />
      <ModalBody>
        <Content component='p'>
          {isUnpublish
            ? 'Are you sure you want to unpublish this snapshot? Outside users will not be able to access this repository snapshot anymore.'
            : 'Are you sure you want to publish this snapshot? Outside users will be able to access this repository snapshot.'}
        </Content>
      </ModalBody>
      <ModalFooter>
        <Stack>
          <StackItem>
            <Button
              key='confirm'
              ouiaId='publish_snapshot_modal_confirm'
              variant={isUnpublish ? 'danger' : 'primary'}
              isLoading={isPending}
              isDisabled={isPending || !snapshotUUID}
              onClick={onConfirm}
            >
              {isUnpublish ? 'Unpublish' : 'Publish'}
            </Button>
            <Button
              key='cancel'
              variant='link'
              onClick={onClose}
              ouiaId='publish_snapshot_modal_cancel'
            >
              Cancel
            </Button>
          </StackItem>
        </Stack>
      </ModalFooter>
    </Modal>
  );
}

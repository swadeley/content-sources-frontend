import {
  Button,
  Flex,
  Modal,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Stack,
  StackItem,
  Tab,
  Tabs,
  TabTitleText,
  Title,
} from '@patternfly/react-core';
import { InnerScrollContainer } from '@patternfly/react-table';
import { useParams, useSearchParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { SnapshotPackagesTab } from './Tabs/SnapshotPackagesTab';
import { createUseStyles } from 'react-jss';
import { SnapshotSelector } from './SnapshotSelector';
import { SnapshotErrataTab } from './Tabs/SnapshotErrataTab';
import { modalTableSurfaceStyles } from 'helpers';
import { useNavigateTo } from 'Hooks/navigation/useNavigateTo';
import { useGetSnapshotList } from 'services/Content/ContentQueries';
import useSafeUUIDParam from 'Hooks/useSafeUUIDParam';
import { PublishLabels } from 'components/RepositoryLabels/PublishLabels';
import {
  useRepositoryType,
  usePublishSnapshotPolling,
  usePublishedSnapshotState,
} from 'Hooks/snapshotActions/usePublishSnapshot';

const useStyles = createUseStyles({
  modalTableScope: modalTableSurfaceStyles,
  modalBody: {
    padding: '24px 24px 0 24px',
  },
  topContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '16px',
    '& button': { maxHeight: '37px', marginTop: 'auto' },
  },
});

export enum SnapshotDetailTab {
  PACKAGES = 'packages',
  ERRATA = 'errata',
}

export default function SnapshotDetailsModal() {
  const classes = useStyles();
  const { snapshotUUID } = useParams();
  const repoUUID = useSafeUUIDParam('repoUUID');
  const [urlSearchParams, setUrlSearchParams] = useSearchParams();
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);

  const [isPublishPolling, setIsPublishPolling] = useState(false);
  const { getSnapshotPublishState } = usePublishedSnapshotState();
  const { canPublish } = useRepositoryType(repoUUID);
  const { data = { data: [], meta: { count: 0, limit: 20, offset: 0 } } } = useGetSnapshotList(
    repoUUID,
    1,
    100,
    '',
    isPublishPolling,
  );
  const { data: snapshotsList = [] } = data;

  usePublishSnapshotPolling(snapshotsList, setIsPublishPolling);

  const publishState = useMemo(() => {
    const snapshot = data?.data?.find((s) => s.uuid === snapshotUUID);
    return getSnapshotPublishState(snapshot);
  }, [data?.data, snapshotUUID]);

  useEffect(() => {
    if (urlSearchParams.get('tab') === SnapshotDetailTab.ERRATA) {
      setActiveTabKey(1);
    }
  }, []);

  const handleTabClick = (
    _: React.MouseEvent<HTMLElement, MouseEvent>,
    tabIndex: string | number,
  ) => {
    setUrlSearchParams(tabIndex ? { tab: SnapshotDetailTab.ERRATA } : {});
    setActiveTabKey(tabIndex);
  };

  const onClose = useNavigateTo('repositories');
  const onBackClick = useNavigateTo('repositorySnapshots');

  return (
    <Modal
      key={snapshotUUID}
      position='top'
      ouiaId='snapshot_details_modal'
      variant={ModalVariant.large}
      isOpen
      onClose={onClose}
      aria-labelledby='snapshot-details-modal-title'
    >
      <ModalHeader labelId='snapshot-details-modal-title'>
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <Title id='snapshot-details-modal-title' headingLevel='h1'>
            Snapshot detail
          </Title>
          {canPublish && <PublishLabels publishState={publishState} />}
        </Flex>
      </ModalHeader>
      <InnerScrollContainer>
        <Stack className={`${classes.modalTableScope} ${classes.modalBody}`}>
          <StackItem className={classes.topContainer}>
            <SnapshotSelector />
            <Button variant='secondary' onClick={onBackClick}>
              View all snapshots
            </Button>
          </StackItem>
          <StackItem>
            <Tabs
              activeKey={activeTabKey}
              onSelect={handleTabClick}
              aria-label='Snapshot detail tabs'
            >
              <Tab
                eventKey={0}
                ouiaId='packages_tab'
                title={<TabTitleText>Packages</TabTitleText>}
                aria-label='Snapshot package detail tab'
              >
                <SnapshotPackagesTab />
              </Tab>
              <Tab
                eventKey={1}
                ouiaId='advisories_tab'
                title={<TabTitleText>Advisories</TabTitleText>}
                aria-label='Snapshot errata detail tab'
              >
                <SnapshotErrataTab />
              </Tab>
            </Tabs>
          </StackItem>
        </Stack>
      </InnerScrollContainer>
      <ModalFooter>
        <Button
          key='close'
          variant='secondary'
          onClick={onClose}
          aria-label='Close snapshot detail'
        >
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

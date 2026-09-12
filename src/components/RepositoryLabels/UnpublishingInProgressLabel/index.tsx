import { Label, Tooltip } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';

const UnpublishingInProgressLabel = () => (
  <Tooltip content='Snapshot unpublishing is in progress.'>
    <Label variant='outline' color='orange' isCompact icon={<InProgressIcon />}>
      Unpublishing in progress
    </Label>
  </Tooltip>
);

export default UnpublishingInProgressLabel;

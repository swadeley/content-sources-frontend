import { Label, Tooltip } from '@patternfly/react-core';
import { InProgressIcon } from '@patternfly/react-icons';

const PublishingInProgressLabel = () => (
  <Tooltip content='Snapshot publishing is in progress. The distribution URL will be available shortly.'>
    <Label variant='outline' color='green' isCompact icon={<InProgressIcon />}>
      Publishing in progress
    </Label>
  </Tooltip>
);

export default PublishingInProgressLabel;

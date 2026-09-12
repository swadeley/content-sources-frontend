import { Label, Tooltip } from '@patternfly/react-core';

const PublishedLabel = () => (
  <Tooltip content='A snapshot of this repository is published and publicly available.'>
    <Label color='green' isCompact>
      Published
    </Label>
  </Tooltip>
);

export default PublishedLabel;

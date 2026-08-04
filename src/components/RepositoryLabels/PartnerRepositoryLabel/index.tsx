import { Label, Tooltip } from '@patternfly/react-core';
import { RepositoryIcon } from '@patternfly/react-icons';
import { createUseStyles } from 'react-jss';

const useStyles = createUseStyles({
  repositoryIcon: {
    marginLeft: '8px',
  },
});

const PartnerRepositoryLabel = () => {
  const classes = useStyles();
  return (
    <Tooltip content='Partner repository: This repository is provided by a partner organization.'>
      <Label
        variant='outline'
        isCompact
        icon={<RepositoryIcon />}
        className={classes.repositoryIcon}
      >
        Partner
      </Label>
    </Tooltip>
  );
};

export default PartnerRepositoryLabel;

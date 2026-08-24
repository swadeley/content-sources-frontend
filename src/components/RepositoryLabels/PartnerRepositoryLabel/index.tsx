import { Label, Tooltip } from '@patternfly/react-core';
import { RepositoryIcon } from '@patternfly/react-icons';
import { createUseStyles } from 'react-jss';
import { useAppContext } from '../../../middleware/AppContext';

const useStyles = createUseStyles({
  repositoryIcon: {
    marginLeft: '8px',
  },
});

const PartnerRepositoryLabel = () => {
  const classes = useStyles();
  const { features } = useAppContext();
  const usePartnerTerminology =
    features?.partnerrepos?.enabled && features.partnerrepos?.accessible;

  const label = usePartnerTerminology ? 'Partner' : 'Community';
  const tooltip = usePartnerTerminology
    ? 'Partner repository: This repository is provided by a partner organization.'
    : 'Community repository: This EPEL repository is shared across organizations.';

  return (
    <Tooltip content={tooltip}>
      <Label
        variant='outline'
        isCompact
        icon={<RepositoryIcon />}
        className={classes.repositoryIcon}
      >
        {label}
      </Label>
    </Tooltip>
  );
};

export default PartnerRepositoryLabel;

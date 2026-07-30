import { Button, Content, ContentVariants, Flex, FlexItem, Icon } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { reduceStringToCharsWithEllipsis } from '../../../../../../helpers';
import { PATCH_SYSTEMS_ROUTE } from '../../../../../../Routes/constants';
import type { SystemItem } from '../../../../../../services/Systems/SystemsApi';
import HelpPopover from '../../../../../../components/HelpPopover';
import React from 'react';
import { isVersionLockedSystem } from '../../../../TemplatesTable/helpers';
import { TEMPLATES_DOCS_URL } from 'constants/docs';

type Props = Pick<SystemItem, 'id'> &
  Pick<SystemItem['attributes'], 'display_name' | 'rhsm' | 'satellite_managed' | 'image_based'> & {
    basePath: string;
    isExtendedSupportTemplate: boolean;
  };

type WarningItem = {
  key: string;
  title: string;
  description: string;
};

/**
 * Renders a system name with a warning icon if the system is incompatible with the template.
 */
export default function SystemNameCell({
  id,
  display_name,
  rhsm,
  basePath,
  satellite_managed,
  image_based,
  isExtendedSupportTemplate,
}: Props) {
  const name = (
    <Button isInline variant='link' component='a' href={`${basePath}${PATCH_SYSTEMS_ROUTE}${id}`}>
      {reduceStringToCharsWithEllipsis(display_name)}
    </Button>
  );

  const warnings: WarningItem[] = [];

  if (!isExtendedSupportTemplate && isVersionLockedSystem(rhsm)) {
    warnings.push({
      key: 'version-lock-warning',
      title: `This system is locked to version ${rhsm}`,
      description: 'Remove the version lock to assign a standard template.',
    });
  }

  if (satellite_managed) {
    warnings.push({
      key: 'satellite-managed-warning',
      title: 'This system is managed by Satellite',
      description: 'Systems managed by Satellite cannot be associated with a template.',
    });
  }

  if (image_based) {
    warnings.push({
      key: 'image-based-warning',
      title: 'This system is image-based',
      description: 'Image-based systems cannot be associated with a template.',
    });
  }

  if (warnings.length === 0) {
    return name;
  }

  return (
    <Flex columnGap={{ default: 'columnGapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{name}</FlexItem>
      <FlexItem>
        {warnings.map((warning) => (
          <HelpPopover
            key={warning.key}
            headerContent={warning.title}
            headerIcon={<ExclamationTriangleIcon />}
            alertSeverityVariant='warning'
            position='right'
            triggerAction='hover'
            hasAutoWidth
            linkText='Learn more about template compatibility'
            linkUrl={TEMPLATES_DOCS_URL}
            bodyContent={<Content component={ContentVariants.small}>{warning.description}</Content>}
          >
            <Icon data-ouia-component-id='system-list-warning-icon' status='warning'>
              <ExclamationTriangleIcon />
            </Icon>
          </HelpPopover>
        ))}
      </FlexItem>
    </Flex>
  );
}

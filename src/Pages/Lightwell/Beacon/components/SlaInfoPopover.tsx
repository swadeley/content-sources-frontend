import { Button, Content } from '@patternfly/react-core';
import HelpIcon from '@patternfly/react-icons/dist/esm/icons/help-icon';

import { LwPopover } from 'kit/components/assemblies';

/**
 * Beacon SLA policy popover — domain component using `LwPopover`.
 * Trigger, header, and body are Beacon-specific; the popover chrome is kit.
 */
export function SlaInfoPopover() {
  return (
    <LwPopover
      hasHeader='SLA Policy'
      hasBody={
        <Content>
          <p>
            <strong>Submit</strong> vulnerabilities to the clearinghouse at any time.
          </p>
          <p>
            <strong>Triage within 48 hours.</strong>
          </p>
          <p>
            <strong>Priority is yours.</strong> Your severity sets the default order. Adjust at any
            time.
          </p>
          <p>
            A fix is complete when a patched artifact is published in the repository (or when it
            gets to the Lightwell Network).
          </p>
          <br />
          <p>
            SLA applies to up to 25 findings per member per week. All other findings are worked
            continuously on a best-effort basis.
          </p>
        </Content>
      }
      hasTrigger={
        <Button variant='plain' aria-label='SLA help' className='lightwell-help-btn'>
          <HelpIcon />
        </Button>
      }
    />
  );
}

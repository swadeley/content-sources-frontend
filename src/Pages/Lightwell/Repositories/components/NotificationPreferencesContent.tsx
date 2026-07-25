import {
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Radio,
  Switch,
} from '@patternfly/react-core';
import { Severity, SeverityType } from '@patternfly/react-component-groups';
import { Dispatch, SetStateAction } from 'react';

import {
  LIGHTWELL_VULNERABILITY_SEVERITY_OPTIONS,
  LightwellNotificationPrefs,
  LightwellNotificationSeverity,
} from '../../constants';

const LIGHTWELL_TO_PF_SEVERITY: Record<LightwellNotificationSeverity, SeverityType> = {
  critical: SeverityType.critical,
  high: SeverityType.important,
  medium: SeverityType.moderate,
  low: SeverityType.minor,
};

type NotificationPreferencesContentProps = {
  preferences: LightwellNotificationPrefs;
  onPreferencesChange: Dispatch<SetStateAction<LightwellNotificationPrefs>>;
  isDisabled?: boolean;
};

const NotificationPreferencesContent = ({
  preferences,
  onPreferencesChange,
  isDisabled = false,
}: NotificationPreferencesContentProps) => {
  const { enabled, minimumSeverity } = preferences;

  return (
    <Form>
      <FormGroup fieldId='lightwell-notification-enabled-switch' label='Email notifications'>
        <Switch
          id='lightwell-notification-enabled-switch'
          name='lightwell-notification-enabled-switch'
          label={enabled ? 'Notify me when fixes are available' : 'Notifications are off'}
          aria-label='Notify me when fixes are available'
          ouiaId={`lightwell-notification-enabled-switch-${enabled ? 'on' : 'off'}`}
          isChecked={enabled}
          isDisabled={isDisabled}
          onChange={(_event, checked) =>
            onPreferencesChange((prev) => ({ ...prev, enabled: checked }))
          }
        />
      </FormGroup>

      {enabled ? (
        <FormGroup
          fieldId='lightwell-notification-severity'
          label='Severity threshold'
          role='radiogroup'
        >
          <FormHelperText>
            <HelperText>
              <HelperTextItem>
                Get notified when fixes are available for vulnerabilities of the following severity.
              </HelperTextItem>
            </HelperText>
          </FormHelperText>
          {LIGHTWELL_VULNERABILITY_SEVERITY_OPTIONS.map((option) => (
            <Radio
              key={option.value}
              id={`lightwell-notification-severity-${option.value}`}
              name='lightwell-notification-severity'
              ouiaId={`lightwell-notification-severity-${option.value}`}
              isChecked={minimumSeverity === option.value}
              isDisabled={isDisabled}
              onChange={() =>
                onPreferencesChange((prev) => ({
                  ...prev,
                  minimumSeverity: option.value,
                }))
              }
              label={
                <Severity
                  severity={LIGHTWELL_TO_PF_SEVERITY[option.value]}
                  label={option.label}
                  ouiaId={`lightwell-notification-severity-icon-${option.value}`}
                />
              }
            />
          ))}
        </FormGroup>
      ) : null}
    </Form>
  );
};

export default NotificationPreferencesContent;

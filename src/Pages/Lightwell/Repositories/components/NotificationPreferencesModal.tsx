import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
} from '@patternfly/react-core';
import spacing from '@patternfly/react-styles/css/utilities/Spacing/spacing';
import { isEqual } from 'lodash';
import React, { cloneElement, ReactElement, useEffect, useState } from 'react';

import { useSetUserPreferencesMutation } from 'services/Lightwell/UserPreferencesQueries';

import { DEFAULT_LIGHTWELL_NOTIFICATION_PREFS, LightwellNotificationPrefs } from '../../constants';
import { useLightwellNotificationPrefs } from '../hooks/useLightwellNotificationPrefs';
import NotificationPreferencesContent from './NotificationPreferencesContent';

type NotificationPreferencesModalProps = {
  children: ReactElement<{ onClick?: (event: React.MouseEvent) => void }>;
};

const NotificationPreferencesModal = ({ children }: NotificationPreferencesModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<LightwellNotificationPrefs>(
    DEFAULT_LIGHTWELL_NOTIFICATION_PREFS,
  );

  const { enabled, minimumSeverity, isLoading, isError } = useLightwellNotificationPrefs(isOpen);
  const { mutateAsync, isPending } = useSetUserPreferencesMutation();

  const savedPreferences: LightwellNotificationPrefs = {
    enabled,
    minimumSeverity,
  };
  const hasNotChanged = isEqual(preferences, savedPreferences);
  const isFormLoading = isOpen && isLoading;
  const canSave = !hasNotChanged && !isPending && !isFormLoading;

  useEffect(() => {
    if (!isOpen || isLoading) return;
    setPreferences({ enabled, minimumSeverity });
  }, [isOpen, isLoading, enabled, minimumSeverity]);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    if (isError) {
      closeModal();
    }
  }, [isError]);

  const trigger = cloneElement(children, {
    onClick: (event: React.MouseEvent) => {
      children.props.onClick?.(event);
      if (!event.defaultPrevented) {
        openModal();
      }
    },
  });

  const handleSave = async () => {
    try {
      await mutateAsync(preferences);
      closeModal();
    } catch {
      // Error toast is handled by the mutation
    }
  };

  return (
    <>
      {trigger}
      <Modal
        variant={ModalVariant.medium}
        position='top'
        isOpen={isOpen}
        onClose={closeModal}
        aria-labelledby='lightwell-notification-preferences-modal-title'
        ouiaId='lightwell-notification-preferences-modal'
      >
        <ModalHeader
          title='Notification preferences'
          description='Get notified when vulnerability fixes are available for packages in your repositories.'
          labelId='lightwell-notification-preferences-modal-title'
        />
        <ModalBody>
          {isFormLoading ? (
            <Flex justifyContent={{ default: 'justifyContentCenter' }} className={spacing.pXl}>
              <Spinner aria-label='Loading notification preferences' />
            </Flex>
          ) : (
            <NotificationPreferencesContent
              preferences={preferences}
              onPreferencesChange={setPreferences}
              isDisabled={isPending}
            />
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            key='save'
            variant='primary'
            aria-label='Save'
            ouiaId='lightwell-notification-preferences-save-button'
            onClick={handleSave}
            isDisabled={!canSave}
            isLoading={isPending}
          >
            Save
          </Button>
          <Button
            key='cancel'
            variant='link'
            aria-label='Cancel'
            ouiaId='lightwell-notification-preferences-cancel-button'
            onClick={closeModal}
            isDisabled={isPending}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default NotificationPreferencesModal;

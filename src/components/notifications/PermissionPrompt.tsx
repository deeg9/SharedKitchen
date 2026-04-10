import React from 'react';
import { AlertDialog } from '../ui/AlertDialog';

interface PermissionPromptProps {
  isOpen: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export function PermissionPrompt({ isOpen, onEnable, onDismiss }: PermissionPromptProps) {
  return (
    <AlertDialog
      visible={isOpen}
      onClose={onDismiss}
      title="Stay on top of dinner plans"
      message="Get cooking reminders so dinner is ready on time, know when leftovers need to be used, and receive budget alerts at 80% and 100%."
      actions={[
        { label: 'Not Now', variant: 'secondary', onPress: onDismiss },
        { label: 'Enable Notifications', variant: 'primary', onPress: onEnable },
      ]}
    />
  );
}

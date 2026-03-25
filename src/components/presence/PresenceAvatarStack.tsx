import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';
import { PresenceMember } from '../../hooks/usePresence';
import { colors } from '../../theme/colors';
import { borderRadius, spacing } from '../../theme/spacing';

interface PresenceAvatarStackProps {
  members: PresenceMember[];
  maxVisible?: number;
}

/**
 * Renders a horizontal stack of overlapping user avatars with an
 * overflow badge when the member count exceeds maxVisible.
 */
export function PresenceAvatarStack({
  members,
  maxVisible = 3,
}: PresenceAvatarStackProps) {
  if (members.length === 0) return null;

  const visible = members.slice(0, maxVisible);
  const overflow = members.length - maxVisible;

  return (
    <View style={styles.container}>
      {visible.map((member, index) => (
        <View
          key={member.user_id}
          style={[
            styles.avatarWrapper,
            {
              marginLeft: index > 0 ? -8 : 0,
              zIndex: maxVisible - index,
            },
          ]}
        >
          <Avatar
            uri={member.avatar_url}
            name={member.display_name}
            size="sm"
          />
        </View>
      ))}
      {overflow > 0 && (
        <View style={[styles.overflowBadge, { marginLeft: -8, zIndex: 0 }]}>
          <Text style={styles.overflowText}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: colors.surface,
    borderRadius: 999,
  },
  overflowBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  overflowText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.onPrimaryContainer,
  },
});

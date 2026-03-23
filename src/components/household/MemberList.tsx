import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { HouseholdMemberWithProfile } from '../../stores/householdStore';

interface MemberListProps {
  members: HouseholdMemberWithProfile[];
}

function getInitials(name: string | null): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function MemberRow({ item }: { item: HouseholdMemberWithProfile }) {
  const displayName = item.profiles?.display_name ?? 'Unknown';
  const initials = getInitials(item.profiles?.display_name ?? null);
  const isAdmin = item.role === 'admin';

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>{displayName}</Text>
      </View>

      <View style={[styles.roleBadge, isAdmin ? styles.adminBadge : styles.memberBadge]}>
        <Text style={[styles.roleText, isAdmin ? styles.adminText : styles.memberText]}>
          {isAdmin ? 'Admin' : 'Member'}
        </Text>
      </View>
    </View>
  );
}

export function MemberList({ members }: MemberListProps) {
  if (members.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No members yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={members}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <MemberRow item={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#5a3e8e',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a2e',
  },
  roleBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  adminBadge: {
    backgroundColor: '#fff3e0',
  },
  memberBadge: {
    backgroundColor: '#f0f4ff',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  adminText: {
    color: '#e67e22',
  },
  memberText: {
    color: '#4a90d9',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

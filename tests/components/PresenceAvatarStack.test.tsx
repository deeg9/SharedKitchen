import React from 'react';
import { render } from '@testing-library/react-native';
import { PresenceAvatarStack } from '../../src/components/presence/PresenceAvatarStack';
import { PresenceMember } from '../../src/hooks/usePresence';

function makeMember(id: string, name: string, avatar?: string): PresenceMember {
  return {
    user_id: id,
    display_name: name,
    avatar_url: avatar ?? null,
  };
}

describe('PresenceAvatarStack', () => {
  it('returns null when members array is empty', () => {
    const { toJSON } = render(<PresenceAvatarStack members={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders 1 avatar when 1 member provided', () => {
    const members = [makeMember('1', 'Alice')];
    const { getAllByText } = render(<PresenceAvatarStack members={members} />);
    // Avatar fallback shows initials "A"
    expect(getAllByText('A')).toHaveLength(1);
  });

  it('renders 3 avatars when 3 members provided (maxVisible=3 default)', () => {
    const members = [
      makeMember('1', 'Alice'),
      makeMember('2', 'Bob'),
      makeMember('3', 'Charlie'),
    ];
    const { getAllByText } = render(<PresenceAvatarStack members={members} />);
    // Each avatar shows single initial: A, B, C
    expect(getAllByText('A')).toHaveLength(1);
    expect(getAllByText('B')).toHaveLength(1);
    expect(getAllByText('C')).toHaveLength(1);
  });

  it('renders 3 avatars + "+2" overflow badge when 5 members provided', () => {
    const members = [
      makeMember('1', 'Alice'),
      makeMember('2', 'Bob'),
      makeMember('3', 'Charlie'),
      makeMember('4', 'Diana'),
      makeMember('5', 'Eve'),
    ];
    const { getByText, queryByText } = render(
      <PresenceAvatarStack members={members} />
    );
    expect(getByText('+2')).toBeTruthy();
    // Diana and Eve should NOT be rendered as avatars
    expect(queryByText('D')).toBeNull();
    expect(queryByText('E')).toBeNull();
  });

  it('renders correct overflow count text ("+N")', () => {
    const members = Array.from({ length: 7 }, (_, i) =>
      makeMember(`${i}`, `User${i}`)
    );
    const { getByText } = render(
      <PresenceAvatarStack members={members} maxVisible={4} />
    );
    expect(getByText('+3')).toBeTruthy();
  });
});

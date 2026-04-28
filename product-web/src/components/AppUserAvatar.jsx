import { Avatar } from '@mantine/core';

function initials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

export default function AppUserAvatar({ user, size = 36, radius = 'xl' }) {
  return (
    <Avatar src={user?.avatarUrl || null} size={size} radius={radius} color="teal">
      {initials(user?.fullName)}
    </Avatar>
  );
}

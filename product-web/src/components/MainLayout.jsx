import { AppShell, Burger, Group, NavLink, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBook2, IconChartBar, IconHome2, IconLogout, IconSparkles, IconUser, IconUsers } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { roleLabel } from '../utils/labels';
import AppUserAvatar from './AppUserAvatar';

const LINKS = {
  ADMIN: [
    { to: '/dashboard', label: 'Дашборд', icon: IconHome2 },
    { to: '/profile', label: 'Профиль', icon: IconUser },
    { to: '/admin/teachers', label: 'Преподаватели', icon: IconUsers },
  ],
  TEACHER: [
    { to: '/dashboard', label: 'Дашборд', icon: IconHome2 },
    { to: '/profile', label: 'Профиль', icon: IconUser },
    { to: '/teacher/disciplines', label: 'Дисциплины', icon: IconBook2 },
    { to: '/lectures', label: 'Лекции', icon: IconBook2 },
    { to: '/tests', label: 'Тесты', icon: IconSparkles },
    { to: '/teacher/groups', label: 'Группы', icon: IconUsers },
    { to: '/gradebook', label: 'Журнал', icon: IconChartBar },
  ],
  STUDENT: [
    { to: '/dashboard', label: 'Дашборд', icon: IconHome2 },
    { to: '/profile', label: 'Профиль', icon: IconUser },
    { to: '/lectures', label: 'Лекции', icon: IconBook2 },
    { to: '/tests', label: 'Тесты', icon: IconSparkles },
    { to: '/my-results', label: 'Мои результаты', icon: IconChartBar },
  ],
};

export default function MainLayout() {
  const [opened, { toggle }] = useDisclosure();
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <AppShell
      padding="md"
      header={{ height: 68 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      styles={{
        main: {
          background: 'radial-gradient(1200px 600px at 10% 10%, #122a33 0%, transparent 45%), radial-gradient(900px 500px at 90% 0%, #2a1f14 0%, transparent 40%), #0b1014',
          minHeight: '100vh',
        },
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4}>LeanEdu PGK</Title>
          </Group>
          <Group>
            <AppUserAvatar user={user} size={32} />
            <Text size="sm">{user?.fullName}</Text>
            <Text size="xs" c="dimmed">{roleLabel(user?.role)}</Text>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {user && LINKS[user.role]?.map((item) => (
          <NavLink
            key={item.to}
            component={Link}
            to={item.to}
            label={item.label}
            leftSection={<item.icon size={18} />}
            active={location.pathname.startsWith(item.to)}
          />
        ))}
        <NavLink mt="md" label="Выйти" leftSection={<IconLogout size={18} />} onClick={logout} />
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}

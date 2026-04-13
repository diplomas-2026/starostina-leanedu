import { AppShell, Burger, Group, NavLink, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBook2, IconChartBar, IconHome2, IconLogout, IconSparkles, IconUsers } from '@tabler/icons-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LINKS = {
  ADMIN: [
    { to: '/dashboard', label: 'Дашборд', icon: IconHome2 },
    { to: '/admin/teachers', label: 'Преподаватели', icon: IconUsers },
  ],
  TEACHER: [
    { to: '/dashboard', label: 'Дашборд', icon: IconHome2 },
    { to: '/lectures', label: 'Лекции', icon: IconBook2 },
    { to: '/tests', label: 'Тесты', icon: IconSparkles },
    { to: '/teacher/students', label: 'Студенты', icon: IconUsers },
    { to: '/gradebook', label: 'Журнал', icon: IconChartBar },
  ],
  STUDENT: [
    { to: '/dashboard', label: 'Дашборд', icon: IconHome2 },
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
          background: 'linear-gradient(140deg, #f4f9f8 0%, #fff5e8 55%, #eaf4ff 100%)',
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
            <Text size="sm">{user?.fullName}</Text>
            <Text size="xs" c="dimmed">{user?.role}</Text>
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

import { Card, Grid, Group, Stack, Text, Title } from '@mantine/core';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Stack>
      <Title order={2}>Добро пожаловать, {user?.fullName}</Title>
      <Text c="dimmed">Платформа обучения по дисциплине «Основы бережливого производства».</Text>
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" shadow="sm">
            <Group justify="space-between"><Text fw={600}>Роль</Text><Text>{user?.role}</Text></Group>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" shadow="sm"><Text fw={600}>Язык интерфейса</Text><Text>Русский</Text></Card>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Card withBorder radius="md" shadow="sm"><Text fw={600}>Режим</Text><Text>Учебная платформа Lean</Text></Card>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}

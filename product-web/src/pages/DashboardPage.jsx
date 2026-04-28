import { Alert, Card, Grid, Group, Loader, Progress, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { teacherApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { roleLabel } from '../utils/labels';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role !== 'TEACHER') {
      return;
    }
    const loadSummary = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await teacherApi.dashboardSummary();
        setSummary(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить статистику преподавателя'));
      } finally {
        setLoading(false);
      }
    };
    loadSummary();
  }, [user?.role]);

  return (
    <Stack>
      <Title order={2}>Добро пожаловать, {user?.fullName}</Title>
      <Text c="dimmed">Платформа обучения по дисциплине «Основы бережливого производства».</Text>

      {user?.role !== 'TEACHER' && (
        <Card withBorder>
          <Group justify="space-between">
            <Text fw={600}>Роль</Text>
            <Text>{roleLabel(user?.role)}</Text>
          </Group>
        </Card>
      )}

      {user?.role === 'TEACHER' && (
        <>
          {loading && <Loader color="teal" />}
          {error && <Alert color="red">{error}</Alert>}

          {summary && (
            <>
              <Grid>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder><Text size="sm" c="dimmed">Лекции</Text><Text fw={700} size="xl">{summary.lecturesCount}</Text></Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder><Text size="sm" c="dimmed">Тесты</Text><Text fw={700} size="xl">{summary.testsCount}</Text></Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder><Text size="sm" c="dimmed">Группы</Text><Text fw={700} size="xl">{summary.groupsCount}</Text></Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder><Text size="sm" c="dimmed">Дисциплины</Text><Text fw={700} size="xl">{summary.disciplinesCount}</Text></Card>
                </Grid.Col>
              </Grid>

              <Card withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600}>Успеваемость по вашим тестам</Text>
                    <Text>{summary.passRatePercent}%</Text>
                  </Group>
                  <Progress value={summary.passRatePercent} color="teal" size="lg" radius="xl" />
                  <Text size="sm" c="dimmed">
                    Сдано попыток: {summary.submittedAttemptsCount} · Студентов в ваших группах: {summary.studentsCount}
                  </Text>
                </Stack>
              </Card>

              <Card withBorder>
                <Stack>
                  <Text fw={600}>Нагрузка по группам</Text>
                  {summary.groups.length === 0 ? (
                    <Alert color="yellow">У вас пока нет назначенных групп.</Alert>
                  ) : (
                    summary.groups.map((group) => (
                      <Stack key={group.groupId} gap={4}>
                        <Group justify="space-between">
                          <Text>{group.groupCode} — {group.groupName}</Text>
                          <Text size="sm" c="dimmed">
                            Студентов: {group.studentsCount} · Тестов: {group.testsAssignedCount}
                          </Text>
                        </Group>
                        <Progress value={Math.min(100, group.testsAssignedCount * 10)} color="blue" />
                      </Stack>
                    ))
                  )}
                </Stack>
              </Card>
            </>
          )}
        </>
      )}
    </Stack>
  );
}

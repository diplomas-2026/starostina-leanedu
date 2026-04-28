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
              <Alert color="blue">
                На этом экране показана только ваша статистика как преподавателя.
                Учитываются только ваши тесты, ваши лекции и ваши назначенные группы.
              </Alert>

              <Grid>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder>
                    <Text size="sm" c="dimmed">Лекции (ваши)</Text>
                    <Text fw={700} size="xl">{summary.lecturesCount}</Text>
                    <Text size="xs" c="dimmed">Количество лекций, созданных вами</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder>
                    <Text size="sm" c="dimmed">Тесты (ваши)</Text>
                    <Text fw={700} size="xl">{summary.testsCount}</Text>
                    <Text size="xs" c="dimmed">Количество тестов, созданных вами</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder>
                    <Text size="sm" c="dimmed">Группы (назначены вам)</Text>
                    <Text fw={700} size="xl">{summary.groupsCount}</Text>
                    <Text size="xs" c="dimmed">Группы, где вы ведёте дисциплины</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 3 }}>
                  <Card withBorder>
                    <Text size="sm" c="dimmed">Дисциплины (ваши)</Text>
                    <Text fw={700} size="xl">{summary.disciplinesCount}</Text>
                    <Text size="xs" c="dimmed">Уникальные дисциплины из ваших назначений</Text>
                  </Card>
                </Grid.Col>
              </Grid>

              <Card withBorder>
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600}>Процент сданных попыток по вашим тестам</Text>
                    <Text>{summary.passRatePercent}%</Text>
                  </Group>
                  <Progress value={summary.passRatePercent} color="teal" size="lg" radius="xl" />
                  <Text size="sm" c="dimmed">
                    Формула: (сдано на 3,4,5 / все отправленные попытки) × 100.
                  </Text>
                  <Text size="sm" c="dimmed">
                    Отправленных попыток: {summary.submittedAttemptsCount} · Уникальных студентов в ваших группах: {summary.studentsCount}
                  </Text>
                </Stack>
              </Card>

              <Card withBorder>
                <Stack>
                  <Text fw={600}>Нагрузка по группам (детализация)</Text>
                  <Text size="sm" c="dimmed">
                    По каждой группе показано: сколько в ней студентов и сколько ваших тестов назначено этой группе.
                  </Text>
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
                        <Progress value={Math.min(100, group.testsAssignedCount * 20)} color="blue" />
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

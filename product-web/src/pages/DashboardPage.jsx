import { Alert, Card, Grid, Group, Loader, Progress, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { adminApi, lectureApi, teacherApi, testApi } from '../api/services';
import { GradeBadge, RoleBadge } from '../components/SemanticBadges';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [studentSummary, setStudentSummary] = useState(null);
  const [adminSummary, setAdminSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadSummary = async () => {
      setLoading(true);
      setError('');
      try {
        if (user?.role === 'TEACHER') {
          const { data } = await teacherApi.dashboardSummary();
          setSummary(data);
          setStudentSummary(null);
          setAdminSummary(null);
        } else if (user?.role === 'STUDENT') {
          const [{ data: attempts }, { data: tests }, { data: lectures }] = await Promise.all([
            testApi.myAttempts(),
            testApi.list(),
            lectureApi.list(),
          ]);
          const completed = attempts.filter((attempt) => attempt.status === 'SUBMITTED');
          const avgGrade = completed.length
            ? (completed.reduce((sum, attempt) => sum + (attempt.grade || 0), 0) / completed.length).toFixed(2)
            : null;
          setStudentSummary({
            testsAvailable: tests.length,
            lecturesAvailable: lectures.length,
            attemptsTotal: attempts.length,
            completedTotal: completed.length,
            avgGrade,
          });
          setSummary(null);
          setAdminSummary(null);
        } else if (user?.role === 'ADMIN') {
          const [{ data: users }, { data: groups }, { data: subjects }, { data: assignments }] = await Promise.all([
            adminApi.users(),
            adminApi.groups(),
            adminApi.subjects(),
            adminApi.teachingAssignments(),
          ]);
          const teachers = users.filter((item) => item.role === 'TEACHER');
          const students = users.filter((item) => item.role === 'STUDENT');
          const activeUsers = users.filter((item) => item.active);
          const inactiveUsers = users.filter((item) => !item.active);
          const avgAssignmentsPerTeacher = teachers.length > 0 ? (assignments.length / teachers.length).toFixed(2) : '0.00';
          const avgAssignmentsPerGroup = groups.length > 0 ? (assignments.length / groups.length).toFixed(2) : '0.00';
          setAdminSummary({
            usersCount: users.length,
            activeUsersCount: activeUsers.length,
            inactiveUsersCount: inactiveUsers.length,
            teachersCount: teachers.length,
            studentsCount: students.length,
            groupsCount: groups.length,
            subjectsCount: subjects.length,
            assignmentsCount: assignments.length,
            avgAssignmentsPerTeacher,
            avgAssignmentsPerGroup,
          });
          setSummary(null);
          setStudentSummary(null);
        } else {
          setSummary(null);
          setStudentSummary(null);
          setAdminSummary(null);
        }
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить данные дашборда'));
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
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {user?.role !== 'TEACHER' && (
        <Card withBorder>
          <Group justify="space-between">
            <Text fw={600}>Роль</Text>
            <RoleBadge role={user?.role} />
          </Group>
        </Card>
      )}

      {user?.role === 'ADMIN' && adminSummary && (
        <>
          <Alert color="blue">
            Панель администратора показывает состояние системы: пользователи, группы, дисциплины и учебные назначения.
          </Alert>
          <Grid>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">Пользователи</Text>
                <Text fw={700} size="xl">{adminSummary.usersCount}</Text>
                <Text size="xs" c="dimmed">Всего учетных записей</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">Преподаватели</Text>
                <Text fw={700} size="xl">{adminSummary.teachersCount}</Text>
                <Text size="xs" c="dimmed">Учетные записи роли преподаватель</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">Студенты</Text>
                <Text fw={700} size="xl">{adminSummary.studentsCount}</Text>
                <Text size="xs" c="dimmed">Учетные записи роли студент</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 3 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">Назначения</Text>
                <Text fw={700} size="xl">{adminSummary.assignmentsCount}</Text>
                <Text size="xs" c="dimmed">Связки преподаватель-дисциплина-группа</Text>
              </Card>
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">Группы</Text>
                <Text fw={700} size="xl">{adminSummary.groupsCount}</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">Дисциплины</Text>
                <Text fw={700} size="xl">{adminSummary.subjectsCount}</Text>
              </Card>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Card withBorder>
                <Text size="sm" c="dimmed">Деактивированные пользователи</Text>
                <Text fw={700} size="xl">{adminSummary.inactiveUsersCount}</Text>
              </Card>
            </Grid.Col>
          </Grid>

          <Card withBorder>
            <Stack gap="sm">
              <Text fw={600}>Операционная сводка</Text>
              <Text size="sm" c="dimmed">Активных пользователей: {adminSummary.activeUsersCount} из {adminSummary.usersCount}</Text>
              <Progress
                value={adminSummary.usersCount > 0 ? (adminSummary.activeUsersCount / adminSummary.usersCount) * 100 : 0}
                color="teal"
                size="lg"
              />
              <Text size="sm" c="dimmed">Среднее назначений на преподавателя: {adminSummary.avgAssignmentsPerTeacher}</Text>
              <Text size="sm" c="dimmed">Среднее назначений на группу: {adminSummary.avgAssignmentsPerGroup}</Text>
            </Stack>
          </Card>
        </>
      )}

      {user?.role === 'STUDENT' && studentSummary && (
        <Grid>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">Доступно лекций</Text>
              <Text fw={700} size="xl">{studentSummary.lecturesAvailable}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">Доступно тестов</Text>
              <Text fw={700} size="xl">{studentSummary.testsAvailable}</Text>
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder>
              <Text size="sm" c="dimmed">Средняя оценка</Text>
              <GradeBadge grade={studentSummary.avgGrade || null} prefix="Средняя" />
            </Card>
          </Grid.Col>
          <Grid.Col span={{ base: 12, md: 12 }}>
            <Card withBorder>
              <Group justify="space-between">
                <Text fw={600}>Прогресс по тестам</Text>
                <Text c="dimmed">
                  Завершено: {studentSummary.completedTotal} из {studentSummary.attemptsTotal}
                </Text>
              </Group>
              <Progress
                mt="sm"
                value={studentSummary.attemptsTotal > 0 ? (studentSummary.completedTotal / studentSummary.attemptsTotal) * 100 : 0}
                color="teal"
                size="lg"
              />
            </Card>
          </Grid.Col>
        </Grid>
      )}

      {user?.role === 'TEACHER' && (
        <>
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

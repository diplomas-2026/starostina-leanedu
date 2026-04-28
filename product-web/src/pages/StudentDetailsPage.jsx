import { Alert, Card, Grid, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentApi } from '../api/services';
import AppUserAvatar from '../components/AppUserAvatar';
import ListControls from '../components/ListControls';
import NavigationCard from '../components/NavigationCard';
import { AttemptStatusBadge, GradeBadge } from '../components/SemanticBadges';
import { extractError } from '../utils/errors';

export default function StudentDetailsPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [groupsSearch, setGroupsSearch] = useState('');
  const [attemptsSearch, setAttemptsSearch] = useState('');
  const [attemptsFilter, setAttemptsFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await studentApi.summary(id);
        setSummary(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить информацию о студенте'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const visibleGroups = useMemo(() => {
    if (!summary) return [];
    const query = groupsSearch.trim().toLowerCase();
    return summary.groups.filter((group) => `${group.groupCode} ${group.groupName}`.toLowerCase().includes(query));
  }, [summary, groupsSearch]);

  const visibleAttempts = useMemo(() => {
    if (!summary) return [];
    const query = attemptsSearch.trim().toLowerCase();
    let attempts = summary.recentAttempts.filter((attempt) =>
      `${attempt.testTitle} ${attempt.subjectName || ''}`.toLowerCase().includes(query),
    );
    if (attemptsFilter === 'submitted') attempts = attempts.filter((attempt) => attempt.status === 'SUBMITTED');
    if (attemptsFilter === 'in_progress') attempts = attempts.filter((attempt) => attempt.status === 'IN_PROGRESS');
    return attempts;
  }, [summary, attemptsSearch, attemptsFilter]);

  return (
    <Stack>
      <Title order={2}>Карточка студента</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {summary && (
        <>
          <Card withBorder>
            <Group>
              <AppUserAvatar user={summary} size={64} />
              <Stack gap={2}>
                <Text fw={700}>{summary.fullName}</Text>
                <Text c="dimmed">{summary.email}</Text>
              </Stack>
            </Group>
          </Card>

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}><Card withBorder><Text size="sm" c="dimmed">Группы</Text><Text fw={700} size="xl">{summary.groupsCount}</Text></Card></Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}><Card withBorder><Text size="sm" c="dimmed">Сдано попыток</Text><Text fw={700} size="xl">{summary.submittedAttemptsCount}</Text></Card></Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}><Card withBorder><Text size="sm" c="dimmed">Средняя оценка</Text><GradeBadge grade={summary.averageGrade || null} prefix="Средняя" /></Card></Grid.Col>
          </Grid>

          <Card withBorder>
            <Text fw={700} mb="sm">Группы студента</Text>
            <ListControls
              search={groupsSearch}
              onSearchChange={setGroupsSearch}
              searchPlaceholder="Поиск по группам"
            />
            {visibleGroups.length === 0 ? (
              <Alert color="yellow">Студент пока не состоит в группах.</Alert>
            ) : (
              <Stack>
                {visibleGroups.map((group) => (
                  <NavigationCard
                    key={group.groupId}
                    to={`/groups/${group.groupId}`}
                    title={`${group.groupCode} — ${group.groupName}`}
                    subtitle={`Курс: ${group.courseYear}`}
                    meta="Открыть карточку группы"
                  />
                ))}
              </Stack>
            )}
          </Card>

          <Card withBorder>
            <Text fw={700} mb="sm">Последние попытки</Text>
            <ListControls
              search={attemptsSearch}
              onSearchChange={setAttemptsSearch}
              searchPlaceholder="Поиск по тестам/дисциплинам"
              filterValue={attemptsFilter}
              onFilterChange={setAttemptsFilter}
              filterOptions={[
                { value: 'all', label: 'Все статусы' },
                { value: 'submitted', label: 'Только отправленные' },
                { value: 'in_progress', label: 'Только в процессе' },
              ]}
            />
            {visibleAttempts.length === 0 ? (
              <Alert color="yellow">Попыток пока нет.</Alert>
            ) : (
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Тест</Table.Th>
                    <Table.Th>Дисциплина</Table.Th>
                    <Table.Th>Статус</Table.Th>
                    <Table.Th>Баллы</Table.Th>
                    <Table.Th>Оценка</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {visibleAttempts.map((attempt) => (
                    <Table.Tr key={attempt.attemptId}>
                      <Table.Td><Text component={Link} to={`/tests/${attempt.testId}`}>{attempt.testTitle}</Text></Table.Td>
                      <Table.Td>{attempt.subjectName || '—'}</Table.Td>
                      <Table.Td><AttemptStatusBadge status={attempt.status} /></Table.Td>
                      <Table.Td>{attempt.score} / {attempt.maxScore}</Table.Td>
                      <Table.Td>{attempt.grade != null ? <GradeBadge grade={attempt.grade} size="xs" prefix="Оценка" /> : '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </Stack>
  );
}

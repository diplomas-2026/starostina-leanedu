import { Alert, Card, Grid, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentApi } from '../api/services';
import AppUserAvatar from '../components/AppUserAvatar';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';
import { attemptStatusLabel } from '../utils/labels';

export default function StudentDetailsPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
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
            <Grid.Col span={{ base: 12, md: 4 }}><Card withBorder><Text size="sm" c="dimmed">Средняя оценка</Text><Text fw={700} size="xl">{summary.averageGrade || '—'}</Text></Card></Grid.Col>
          </Grid>

          <Card withBorder>
            <Text fw={700} mb="sm">Группы студента</Text>
            {summary.groups.length === 0 ? (
              <Alert color="yellow">Студент пока не состоит в группах.</Alert>
            ) : (
              <Stack>
                {summary.groups.map((group) => (
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
            {summary.recentAttempts.length === 0 ? (
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
                  {summary.recentAttempts.map((attempt) => (
                    <Table.Tr key={attempt.attemptId}>
                      <Table.Td><Text component={Link} to={`/tests/${attempt.testId}`}>{attempt.testTitle}</Text></Table.Td>
                      <Table.Td>{attempt.subjectName || '—'}</Table.Td>
                      <Table.Td>{attemptStatusLabel(attempt.status)}</Table.Td>
                      <Table.Td>{attempt.score} / {attempt.maxScore}</Table.Td>
                      <Table.Td>{attempt.grade ?? '—'}</Table.Td>
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

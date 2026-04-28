import { Alert, Badge, Button, Card, Group, Loader, List, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { testApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

export default function TestDetailsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await testApi.get(id);
      setTest(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить тест'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return <Loader color="teal" />;
  }

  if (!test) {
    return <Alert color="red">Тест не найден</Alert>;
  }

  return (
    <Stack>
      <Group justify="space-between" align="start">
        <Stack gap={4}>
          <Title order={2}>{test.title}</Title>
          <Text c="dimmed">{test.description}</Text>
          <Text size="sm" c="dimmed">Дисциплина: {test.subjectName || 'Не указана'}</Text>
          <Text size="sm" c="dimmed">Время: {test.timeLimitMin} мин · Попыток: {test.attemptsLimit}</Text>
          <Text size="sm" c="dimmed">
            Пороги: 3 от {test.minScore3}, 4 от {test.minScore4}, 5 от {test.minScore5}
          </Text>
        </Stack>
        <Badge variant="light">{publishStatusLabel(test.published)}</Badge>
      </Group>

      {error && <Alert color="red">{error}</Alert>}

      {user?.role === 'TEACHER' && (
        <Card withBorder>
          <Group justify="space-between" align="center">
            <Text fw={600}>Управление вопросами теста</Text>
            <Button component={Link} to={`/tests/${id}/questions`} variant="light">
              Открыть отдельную страницу
            </Button>
          </Group>
        </Card>
      )}

      <Card withBorder>
        <Title order={4} mb="sm">Назначение теста</Title>
        {test.assignments?.length ? (
          <List spacing={6}>
            {test.assignments.map((assignment) => (
              <List.Item key={assignment.assignmentId}>
                {assignment.groupCode} — {assignment.groupName}, дедлайн:{' '}
                {new Date(assignment.dueAt).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </List.Item>
            ))}
          </List>
        ) : (
          <Alert color="yellow">Тест пока не назначен ни одной группе.</Alert>
        )}
      </Card>

      <Title order={4}>Вопросы</Title>
      {test.questions.length === 0 && (
        <Alert color="yellow">В тесте пока нет вопросов.</Alert>
      )}

      {test.questions.map((question, index) => (
        <Card key={question.id} withBorder>
          <Stack gap={8}>
            <Text fw={600}>{index + 1}. {question.text}</Text>
            <Text size="sm" c="dimmed">Баллы за вопрос: {question.points}</Text>
            <List spacing={6}>
              {question.options.map((option) => (
                <List.Item key={option.id}>
                  <Group gap="xs">
                    <Text>{option.text}</Text>
                    {option.correct ? <Badge size="xs" color="teal" variant="light">Правильный</Badge> : null}
                  </Group>
                </List.Item>
              ))}
            </List>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

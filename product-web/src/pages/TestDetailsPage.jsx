import { Alert, Badge, Button, Card, Group, List, Loader, Select, Stack, Table, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { teacherApi, testApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

export default function TestDetailsPage() {
  const { user } = useAuth();
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [assignForm, setAssignForm] = useState({ groupId: '', dueAtLocal: '' });
  const [assigning, setAssigning] = useState(false);
  const [removingAssignmentId, setRemovingAssignmentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await testApi.get(id);
      setTest(data);
      if (user?.role === 'TEACHER' && data?.subjectId) {
        const groupsResp = await teacherApi.groups(data.subjectId);
        const options = groupsResp.data.map((group) => ({ value: String(group.id), label: `${group.code} — ${group.name}` }));
        setAvailableGroups(options);
        setAssignForm((prev) => ({ ...prev, groupId: prev.groupId || options[0]?.value || '' }));
      }
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить тест'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id, user?.role]);

  const assignToGroup = async (e) => {
    e.preventDefault();
    setError('');
    if (!assignForm.groupId) {
      setError('Выберите группу');
      return;
    }
    if (!assignForm.dueAtLocal) {
      setError('Укажите дедлайн');
      return;
    }
    setAssigning(true);
    try {
      await testApi.assign(id, {
        groupId: Number(assignForm.groupId),
        dueAt: new Date(assignForm.dueAtLocal).toISOString(),
      });
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось назначить тест группе'));
    } finally {
      setAssigning(false);
    }
  };

  const removeAssignment = async (assignmentId) => {
    setError('');
    setRemovingAssignmentId(assignmentId);
    try {
      await testApi.removeAssignment(id, assignmentId);
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить назначение'));
    } finally {
      setRemovingAssignmentId(null);
    }
  };

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
        {user?.role === 'TEACHER' && (
          <form onSubmit={assignToGroup}>
            <Stack mb="md">
              <Select
                label="Группа"
                data={availableGroups}
                value={assignForm.groupId}
                onChange={(value) => setAssignForm((prev) => ({ ...prev, groupId: value || '' }))}
                searchable
                required
              />
              <TextInput
                type="datetime-local"
                label="Дедлайн"
                value={assignForm.dueAtLocal}
                onChange={(e) => setAssignForm((prev) => ({ ...prev, dueAtLocal: e.target.value }))}
                required
              />
              <Button type="submit" loading={assigning}>Назначить группе</Button>
            </Stack>
          </form>
        )}
        {test.assignments?.length ? (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Группа</Table.Th>
                <Table.Th>Дедлайн</Table.Th>
                {user?.role === 'TEACHER' ? <Table.Th>Действие</Table.Th> : null}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {test.assignments.map((assignment) => (
                <Table.Tr key={assignment.assignmentId}>
                  <Table.Td>{assignment.groupCode} — {assignment.groupName}</Table.Td>
                  <Table.Td>
                    {new Date(assignment.dueAt).toLocaleString('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Table.Td>
                  {user?.role === 'TEACHER' ? (
                    <Table.Td>
                      <Button
                        variant="light"
                        color="red"
                        loading={removingAssignmentId === assignment.assignmentId}
                        onClick={() => removeAssignment(assignment.assignmentId)}
                      >
                        Удалить
                      </Button>
                    </Table.Td>
                  ) : null}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
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

import { Alert, Button, Card, Group, Loader, NumberInput, Stack, Text, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { testApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

export default function TestsPage() {
  const { user } = useAuth();
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    timeLimitMin: 20,
    attemptsLimit: 3,
    minScore3: 5,
    minScore4: 7,
    minScore5: 9,
  });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await testApi.list();
      setItems(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить тесты'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const startAttempt = async (testId) => {
    setError('');
    setMessage('');
    try {
      const { data } = await testApi.startAttempt(testId);
      setMessage(`Попытка создана: ${data.id}`);
    } catch (err) {
      setError(extractError(err, 'Не удалось начать тест'));
    }
  };

  const createTest = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await testApi.create(createForm);
      setMessage('Тест создан');
      setCreateForm({
        title: '',
        description: '',
        timeLimitMin: 20,
        attemptsLimit: 3,
        minScore3: 5,
        minScore4: 7,
        minScore5: 9,
      });
      await loadData();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать тест'));
    }
  };

  return (
    <Stack>
      <Title order={2}>Тесты</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}

      {user?.role === 'TEACHER' && (
        <Card withBorder>
          <Title order={4} mb="md">Создание теста</Title>
          <form onSubmit={createTest}>
            <Stack>
              <TextInput
                label="Название"
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                required
              />
              <TextInput
                label="Описание"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                required
              />
              <Group grow>
                <NumberInput
                  label="Лимит времени (мин)"
                  min={1}
                  value={createForm.timeLimitMin}
                  onChange={(value) => setCreateForm({ ...createForm, timeLimitMin: Number(value) || 1 })}
                  required
                />
                <NumberInput
                  label="Макс. попыток"
                  min={1}
                  value={createForm.attemptsLimit}
                  onChange={(value) => setCreateForm({ ...createForm, attemptsLimit: Number(value) || 1 })}
                  required
                />
              </Group>

              <Title order={5}>Пороги оценок (в баллах)</Title>
              <Group grow>
                <NumberInput
                  label="На 3"
                  min={0}
                  value={createForm.minScore3}
                  onChange={(value) => setCreateForm({ ...createForm, minScore3: Number(value) || 0 })}
                  required
                />
                <NumberInput
                  label="На 4"
                  min={0}
                  value={createForm.minScore4}
                  onChange={(value) => setCreateForm({ ...createForm, minScore4: Number(value) || 0 })}
                  required
                />
                <NumberInput
                  label="На 5"
                  min={0}
                  value={createForm.minScore5}
                  onChange={(value) => setCreateForm({ ...createForm, minScore5: Number(value) || 0 })}
                  required
                />
              </Group>
              <Button type="submit">Создать тест</Button>
            </Stack>
          </form>
        </Card>
      )}

      {items.map((test) => (
        <Card key={test.id} withBorder radius="md" shadow="sm">
          <Group justify="space-between">
            <Stack gap={4}>
              <Text fw={700}>{test.title}</Text>
              <Text size="sm" c="dimmed">{test.description}</Text>
              {user?.role !== 'STUDENT' && (
                <Text size="xs" c="dimmed">
                  Пороги: 3 от {test.minScore3}, 4 от {test.minScore4}, 5 от {test.minScore5}
                </Text>
              )}
            </Stack>
            {user?.role === 'STUDENT' ? (
              <Button onClick={() => startAttempt(test.id)}>Начать</Button>
            ) : (
              <Stack align="end" gap={8}>
                <Text size="sm">{publishStatusLabel(test.published)}</Text>
                <Button component={Link} to={`/tests/${test.id}`} variant="light" size="xs">
                  Открыть
                </Button>
              </Stack>
            )}
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

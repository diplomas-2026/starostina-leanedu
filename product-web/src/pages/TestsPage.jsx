import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { testApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function TestsPage() {
  const { user } = useAuth();
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

  return (
    <Stack>
      <Title order={2}>Тесты</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}
      {items.map((test) => (
        <Card key={test.id} withBorder radius="md" shadow="sm">
          <Group justify="space-between">
            <Stack gap={4}>
              <Text fw={700}>{test.title}</Text>
              <Text size="sm" c="dimmed">{test.description}</Text>
            </Stack>
            {user?.role === 'STUDENT' ? (
              <Button onClick={() => startAttempt(test.id)}>Начать</Button>
            ) : (
              <Text size="sm">{test.published ? 'Опубликован' : 'Черновик'}</Text>
            )}
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

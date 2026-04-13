import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { lectureApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function LecturesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await lectureApi.list();
      setItems(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить лекции'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Лекции</Title>
        {user?.role === 'TEACHER' && <Button onClick={loadData}>Обновить</Button>}
      </Group>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      {items.map((lecture) => (
        <Card key={lecture.id} withBorder radius="md" shadow="sm">
          <Group justify="space-between" align="start">
            <Stack gap={4}>
              <Text fw={700}>{lecture.title}</Text>
              <Text size="sm" c="dimmed">{lecture.summary}</Text>
            </Stack>
            <Button component={Link} to={`/lectures/${lecture.id}`} variant="light">Открыть</Button>
          </Group>
        </Card>
      ))}
    </Stack>
  );
}

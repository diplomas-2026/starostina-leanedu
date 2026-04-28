import { Alert, Button, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { testApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';
import { publishStatusLabel } from '../utils/labels';

export default function TestsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await testApi.list();
      const subjectId = searchParams.get('subjectId');
      if (subjectId && user?.role !== 'STUDENT') {
        setItems(data.filter((test) => String(test.subjectId) === subjectId));
      } else {
        setItems(data);
      }
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить тесты'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams, user?.role]);

  const startAttempt = async (testId) => {
    setError('');
    try {
      const { data } = await testApi.startAttempt(testId);
      navigate(`/tests/${testId}/take?attemptId=${data.attemptId}`);
    } catch (err) {
      setError(extractError(err, 'Не удалось начать тест'));
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Тесты</Title>
        {user?.role === 'TEACHER' && (
          <Button component={Link} to={`/tests/new${searchParams.get('subjectId') ? `?subjectId=${searchParams.get('subjectId')}` : ''}`}>
            Создать тест
          </Button>
        )}
      </Group>

      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      {items.map((test) => (
        user?.role === 'STUDENT' ? (
          <Card key={test.id} withBorder radius="md" shadow="sm">
            <Group justify="space-between" align="start">
              <Stack gap={4}>
                <Text fw={700}>{test.title}</Text>
                <Text size="sm" c="dimmed">{test.description}</Text>
              </Stack>
              <Button onClick={() => startAttempt(test.id)}>Начать</Button>
            </Group>
          </Card>
        ) : (
          <NavigationCard
            key={test.id}
            to={`/tests/${test.id}`}
            title={test.title}
            subtitle={test.description}
            meta={`Дисциплина: ${test.subjectName || 'Не указана'} · ${publishStatusLabel(test.published)} · Пороги: 3/${test.minScore3}, 4/${test.minScore4}, 5/${test.minScore5}`}
          />
        )
      ))}
    </Stack>
  );
}

import { Alert, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { testApi } from '../api/services';
import { AttemptStatusBadge } from '../components/SemanticBadges';
import { extractError } from '../utils/errors';

export default function MyResultsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await testApi.myAttempts();
        setItems(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить результаты'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Stack>
      <Title order={2}>Мои результаты</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      {items.map((it) => (
        <Card key={it.id} withBorder>
          <Group justify="space-between">
            <Text fw={600}>{it.testTitle}</Text>
            <AttemptStatusBadge status={it.status} />
          </Group>
          <Text>Баллы: {it.score} / {it.maxScore}</Text>
          {it.grade ? <Text>Оценка: {it.grade}</Text> : null}
        </Card>
      ))}
    </Stack>
  );
}

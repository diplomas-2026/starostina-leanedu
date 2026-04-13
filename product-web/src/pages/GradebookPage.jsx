import { Alert, Card, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { gradebookApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function GradebookPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await gradebookApi.all();
        setItems(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить журнал'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Stack>
      <Title order={2}>Журнал успеваемости</Title>
      {loading && <Loader />}
      {error && <Alert color="red">{error}</Alert>}
      {items.map((item) => (
        <Card key={item.attemptId} withBorder>
          <Text fw={600}>{item.studentName}</Text>
          <Text>{item.testTitle}</Text>
          <Text>Баллы: {item.score} / {item.maxScore}</Text>
        </Card>
      ))}
    </Stack>
  );
}

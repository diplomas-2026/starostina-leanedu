import { Alert, Loader, Stack, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import NavigationCard from '../components/NavigationCard';
import { teacherApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function TeacherDisciplinesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await teacherApi.disciplines();
        setItems(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить дисциплины'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Stack>
      <Title order={2}>Мои дисциплины</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {!loading && items.length === 0 && (
        <Alert color="yellow">У вас пока нет назначенных дисциплин. Обратитесь к администратору.</Alert>
      )}

      {items.map((item) => (
        <NavigationCard
          key={item.id}
          to={`/teacher/disciplines/${item.id}`}
          title={`${item.code} — ${item.name}`}
          subtitle="Перейти к лекциям, тестам, группам и журналу"
        />
      ))}
    </Stack>
  );
}

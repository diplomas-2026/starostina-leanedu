import { Alert, Loader, Stack, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { studentApi } from '../api/services';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';

export default function StudentDisciplinesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await studentApi.myDisciplines();
        setItems(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить дисциплины'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <Stack>
      <Title order={2}>Мои дисциплины</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <Alert color="yellow">Для вашей группы пока не назначены дисциплины.</Alert>
      )}
      {items.map((item) => (
        <NavigationCard
          key={`${item.subjectId}-${item.teacherId}`}
          to={`/student/disciplines/${item.subjectId}`}
          title={`${item.subjectCode} · ${item.subjectName}`}
          subtitle={`Преподаватель: ${item.teacherName}`}
          meta={`Группа: ${item.groupCode} · ${item.groupName}`}
        />
      ))}
    </Stack>
  );
}

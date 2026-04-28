import { Alert, Loader, Stack, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { teacherApi } from '../api/services';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await teacherApi.groups();
        setGroups(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить группы преподавателя'));
      } finally {
        setLoading(false);
      }
    };
    loadGroups();
  }, []);

  return (
    <Stack>
      <Title order={2}>Группы</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {!loading && groups.length === 0 && (
        <Alert color="yellow">У вас пока нет назначенных групп.</Alert>
      )}

      {groups.map((group) => (
        <NavigationCard
          key={group.id}
          to={`/groups/${group.id}`}
          title={`${group.code} — ${group.name}`}
          subtitle={`Курс: ${group.courseYear}`}
          meta="Открыть карточку группы"
        />
      ))}
    </Stack>
  );
}

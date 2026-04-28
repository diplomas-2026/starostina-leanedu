import { Alert, Loader, Stack, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { teacherApi } from '../api/services';
import ListControls from '../components/ListControls';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('code_asc');
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

  const visibleGroups = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = groups.filter((group) =>
      `${group.code} ${group.name}`.toLowerCase().includes(query),
    );
    return filtered.sort((a, b) => {
      if (sortValue === 'course_desc') return b.courseYear - a.courseYear;
      return a.code.localeCompare(b.code, 'ru');
    });
  }, [groups, search, sortValue]);

  return (
    <Stack>
      <Title order={2}>Группы</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Код или название группы"
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOptions={[
          { value: 'code_asc', label: 'По коду (А-Я)' },
          { value: 'course_desc', label: 'По курсу (сначала старшие)' },
        ]}
      />

      {!loading && groups.length === 0 && (
        <Alert color="yellow">У вас пока нет назначенных групп.</Alert>
      )}

      {visibleGroups.map((group) => (
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

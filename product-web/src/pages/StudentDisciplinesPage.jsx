import { Alert, Loader, Stack, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { studentApi } from '../api/services';
import ListControls from '../components/ListControls';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';

export default function StudentDisciplinesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('code_asc');
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

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items.filter((item) =>
      `${item.subjectCode} ${item.subjectName} ${item.teacherName}`.toLowerCase().includes(query),
    );
    return filtered.sort((a, b) => {
      if (sortValue === 'teacher_asc') return a.teacherName.localeCompare(b.teacherName, 'ru');
      return a.subjectCode.localeCompare(b.subjectCode, 'ru');
    });
  }, [items, search, sortValue]);

  return (
    <Stack>
      <Title order={2}>Мои дисциплины</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Дисциплина или преподаватель"
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOptions={[
          { value: 'code_asc', label: 'По коду дисциплины' },
          { value: 'teacher_asc', label: 'По преподавателю' },
        ]}
      />
      {!loading && !error && items.length === 0 && (
        <Alert color="yellow">Для вашей группы пока не назначены дисциплины.</Alert>
      )}
      {visibleItems.map((item) => (
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

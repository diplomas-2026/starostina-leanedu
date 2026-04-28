import { Alert, Loader, Stack, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import ListControls from '../components/ListControls';
import NavigationCard from '../components/NavigationCard';
import { teacherApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function TeacherDisciplinesPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('code_asc');
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

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = items.filter((item) =>
      `${item.code} ${item.name}`.toLowerCase().includes(query),
    );
    return filtered.sort((a, b) => {
      if (sortValue === 'name_asc') return a.name.localeCompare(b.name, 'ru');
      return a.code.localeCompare(b.code, 'ru');
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
        searchPlaceholder="Код или название дисциплины"
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOptions={[
          { value: 'code_asc', label: 'По коду (А-Я)' },
          { value: 'name_asc', label: 'По названию (А-Я)' },
        ]}
      />

      {!loading && items.length === 0 && (
        <Alert color="yellow">У вас пока нет назначенных дисциплин. Обратитесь к администратору.</Alert>
      )}

      {visibleItems.map((item) => (
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

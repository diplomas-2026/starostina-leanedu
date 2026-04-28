import { Alert, Card, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { testApi } from '../api/services';
import ListControls from '../components/ListControls';
import { AttemptStatusBadge, GradeBadge } from '../components/SemanticBadges';
import { extractError } from '../utils/errors';

export default function MyResultsPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [sortValue, setSortValue] = useState('title_asc');
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

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    let filtered = items.filter((item) => item.testTitle.toLowerCase().includes(query));
    if (filterValue === 'submitted') filtered = filtered.filter((item) => item.status === 'SUBMITTED');
    if (filterValue === 'in_progress') filtered = filtered.filter((item) => item.status === 'IN_PROGRESS');
    return filtered.sort((a, b) => {
      if (sortValue === 'grade_desc') return (b.grade || 0) - (a.grade || 0);
      return a.testTitle.localeCompare(b.testTitle, 'ru');
    });
  }, [items, search, filterValue, sortValue]);

  return (
    <Stack>
      <Title order={2}>Мои результаты</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Поиск по названию теста"
        filterValue={filterValue}
        onFilterChange={setFilterValue}
        filterOptions={[
          { value: 'all', label: 'Все статусы' },
          { value: 'submitted', label: 'Только отправленные' },
          { value: 'in_progress', label: 'Только в процессе' },
        ]}
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOptions={[
          { value: 'title_asc', label: 'По названию (А-Я)' },
          { value: 'grade_desc', label: 'По оценке (убыв.)' },
        ]}
      />
      {visibleItems.map((it) => (
        <Card key={it.id} withBorder>
          <Group justify="space-between">
            <Text fw={600}>{it.testTitle}</Text>
            <AttemptStatusBadge status={it.status} />
          </Group>
          <Text>Баллы: {it.score} / {it.maxScore}</Text>
          <GradeBadge grade={it.grade} />
        </Card>
      ))}
    </Stack>
  );
}

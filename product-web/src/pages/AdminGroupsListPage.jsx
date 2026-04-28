import { Alert, Button, Card, Group, Loader, Stack, Table, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/services';
import ListControls from '../components/ListControls';
import { extractError } from '../utils/errors';

export default function AdminGroupsListPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.groups();
      setItems(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить группы'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const visible = useMemo(() => items
    .filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.code.localeCompare(b.code, 'ru')), [items, search]);

  const remove = async (item) => {
    if (!window.confirm(`Удалить группу ${item.code} — ${item.name}?`)) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.deleteGroup(item.id);
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить группу'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Группы</Title>
        <Button component={Link} to="/admin/groups/new">Добавить группу</Button>
      </Group>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      <ListControls search={search} onSearchChange={setSearch} searchPlaceholder="Код или название группы" />
      <Card withBorder>
        <Table striped>
          <Table.Thead><Table.Tr><Table.Th>Код</Table.Th><Table.Th>Название</Table.Th><Table.Th>Курс</Table.Th><Table.Th>Действия</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {visible.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.code}</Table.Td>
                <Table.Td>{item.name}</Table.Td>
                <Table.Td>{item.courseYear}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="light" component={Link} to={`/admin/groups/${item.id}/edit`}>Редактировать</Button>
                    <Button size="xs" color="red" variant="light" onClick={() => remove(item)} loading={saving}>Удалить</Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

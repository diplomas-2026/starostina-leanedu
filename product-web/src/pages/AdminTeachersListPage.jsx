import { Alert, Button, Card, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/services';
import AppUserAvatar from '../components/AppUserAvatar';
import ListControls from '../components/ListControls';
import { extractError } from '../utils/errors';

export default function AdminTeachersListPage() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await adminApi.users('TEACHER');
      setItems(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить преподавателей'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => items
    .filter((item) => `${item.fullName} ${item.email}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru')), [items, search]);

  const deactivate = async (item) => {
    if (!window.confirm(`Удалить преподавателя ${item.fullName}?`)) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.deactivateUser(item.id);
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить преподавателя'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Преподаватели</Title>
        <Button component={Link} to="/admin/teachers/new">Добавить преподавателя</Button>
      </Group>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      <ListControls search={search} onSearchChange={setSearch} searchPlaceholder="ФИО или email" />

      <Card withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ФИО</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Статус</Table.Th>
              <Table.Th>Действия</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visible.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Group gap="sm">
                    <AppUserAvatar user={item} size={28} />
                    <Text>{item.fullName}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{item.email}</Table.Td>
                <Table.Td>{item.active ? 'Активен' : 'Деактивирован'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="light" component={Link} to={`/admin/teachers/${item.id}/edit`} disabled={!item.active}>Редактировать</Button>
                    <Button size="xs" color="red" variant="light" onClick={() => deactivate(item)} loading={saving} disabled={!item.active}>Удалить</Button>
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

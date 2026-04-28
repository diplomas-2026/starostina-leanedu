import { Alert, Button, Card, Group, Loader, Select, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/services';
import AppUserAvatar from '../components/AppUserAvatar';
import ListControls from '../components/ListControls';
import { extractError } from '../utils/errors';

export default function AdminStudentsListPage() {
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupStudents, setGroupStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: students }, { data: groupsData }] = await Promise.all([
        adminApi.users('STUDENT'),
        adminApi.groups(),
      ]);
      setItems(students);
      setGroups(groupsData.map((item) => ({ value: String(item.id), label: `${item.code} — ${item.name}` })));
      const first = String(groupsData[0]?.id || '');
      setSelectedGroupId((prev) => prev || first);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить студентов'));
    } finally {
      setLoading(false);
    }
  };

  const loadGroupStudents = async (groupId) => {
    if (!groupId) return setGroupStudents([]);
    try {
      const { data } = await adminApi.groupStudents(groupId);
      setGroupStudents(data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить студентов группы'));
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadGroupStudents(selectedGroupId);
  }, [selectedGroupId]);

  const deactivate = async (item) => {
    if (!window.confirm(`Удалить студента ${item.fullName}?`)) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.deactivateUser(item.id);
      await load();
      await loadGroupStudents(selectedGroupId);
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить студента'));
    } finally {
      setSaving(false);
    }
  };

  const removeFromGroup = async (student) => {
    if (!selectedGroupId) return;
    if (!window.confirm(`Убрать студента ${student.fullName} из группы?`)) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.removeStudentFromGroup(selectedGroupId, student.id);
      await loadGroupStudents(selectedGroupId);
    } catch (err) {
      setError(extractError(err, 'Не удалось убрать студента из группы'));
    } finally {
      setSaving(false);
    }
  };

  const visible = useMemo(() => items
    .filter((item) => `${item.fullName} ${item.email}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru')), [items, search]);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Студенты</Title>
        <Button component={Link} to="/admin/students/new">Добавить студента</Button>
      </Group>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      <ListControls search={search} onSearchChange={setSearch} searchPlaceholder="ФИО или email" />

      <Card withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr><Table.Th>ФИО</Table.Th><Table.Th>Email</Table.Th><Table.Th>Статус</Table.Th><Table.Th>Действия</Table.Th></Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {visible.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td><Group gap="sm"><AppUserAvatar user={item} size={28} /><Text>{item.fullName}</Text></Group></Table.Td>
                <Table.Td>{item.email}</Table.Td>
                <Table.Td>{item.active ? 'Активен' : 'Деактивирован'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button size="xs" variant="light" component={Link} to={`/admin/students/${item.id}/edit`} disabled={!item.active}>Редактировать</Button>
                    <Button size="xs" color="red" variant="light" onClick={() => deactivate(item)} loading={saving} disabled={!item.active}>Удалить</Button>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      <Card withBorder>
        <Stack>
          <Text fw={600}>Состав группы</Text>
          <Select label="Группа" data={groups} value={selectedGroupId} onChange={(v) => setSelectedGroupId(v || '')} searchable />
          <Table striped>
            <Table.Thead>
              <Table.Tr><Table.Th>ID</Table.Th><Table.Th>ФИО</Table.Th><Table.Th>Email</Table.Th><Table.Th>Действия</Table.Th></Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {groupStudents.map((student) => (
                <Table.Tr key={student.id}>
                  <Table.Td>{student.id}</Table.Td>
                  <Table.Td>{student.fullName}</Table.Td>
                  <Table.Td>{student.email}</Table.Td>
                  <Table.Td>
                    <Button size="xs" color="orange" variant="light" onClick={() => removeFromGroup(student)} loading={saving}>Убрать из группы</Button>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Stack>
      </Card>
    </Stack>
  );
}

import { Alert, Button, Card, Group, Loader, Select, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/services';
import ListControls from '../components/ListControls';
import { extractError } from '../utils/errors';

export default function AdminAssignmentsPage() {
  const [items, setItems] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({ teacherId: '', subjectId: '', groupId: '' });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: assignments }, { data: teacherUsers }, { data: subjectsData }, { data: groupsData }] = await Promise.all([
        adminApi.teachingAssignments(),
        adminApi.users('TEACHER'),
        adminApi.subjects(),
        adminApi.groups(),
      ]);
      setItems(assignments);
      setTeachers(teacherUsers.map((item) => ({ value: String(item.id), label: `${item.fullName} (${item.email})` })));
      setSubjects(subjectsData.map((item) => ({ value: String(item.id), label: `${item.code} — ${item.name}` })));
      setGroups(groupsData.map((item) => ({ value: String(item.id), label: `${item.code} — ${item.name}` })));
      setForm((prev) => ({
        teacherId: prev.teacherId || String(teacherUsers[0]?.id || ''),
        subjectId: prev.subjectId || String(subjectsData[0]?.id || ''),
        groupId: prev.groupId || String(groupsData[0]?.id || ''),
      }));
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить назначения'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await adminApi.createTeachingAssignment({
        teacherId: Number(form.teacherId),
        subjectId: Number(form.subjectId),
        groupId: Number(form.groupId),
      });
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось добавить назначение'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`Удалить назначение ${item.teacherName} / ${item.subjectName} / ${item.groupCode}?`)) return;
    setSaving(true);
    setError('');
    try {
      await adminApi.deleteTeachingAssignment(item.id);
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось удалить назначение'));
    } finally {
      setSaving(false);
    }
  };

  const visible = useMemo(() => items
    .filter((item) => `${item.teacherName} ${item.subjectName} ${item.groupCode} ${item.groupName}`.toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => a.teacherName.localeCompare(b.teacherName, 'ru')), [items, search]);

  return (
    <Stack>
      <Title order={2}>Назначения</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}
      <Card withBorder>
        <form onSubmit={submit}>
          <Stack>
            <Select label="Преподаватель" data={teachers} value={form.teacherId} onChange={(v) => setForm((prev) => ({ ...prev, teacherId: v || '' }))} searchable required />
            <Select label="Дисциплина" data={subjects} value={form.subjectId} onChange={(v) => setForm((prev) => ({ ...prev, subjectId: v || '' }))} searchable required />
            <Select label="Группа" data={groups} value={form.groupId} onChange={(v) => setForm((prev) => ({ ...prev, groupId: v || '' }))} searchable required />
            <Button type="submit" loading={saving}>Добавить назначение</Button>
          </Stack>
        </form>
      </Card>

      <ListControls search={search} onSearchChange={setSearch} searchPlaceholder="Преподаватель, дисциплина или группа" />
      <Card withBorder>
        <Table striped>
          <Table.Thead><Table.Tr><Table.Th>Преподаватель</Table.Th><Table.Th>Дисциплина</Table.Th><Table.Th>Группа</Table.Th><Table.Th>Действия</Table.Th></Table.Tr></Table.Thead>
          <Table.Tbody>
            {visible.map((item) => (
              <Table.Tr key={item.id}>
                <Table.Td>{item.teacherName}</Table.Td>
                <Table.Td>{item.subjectName}</Table.Td>
                <Table.Td><Text component={Link} to={`/groups/${item.groupId}`}>{item.groupCode} — {item.groupName}</Text></Table.Td>
                <Table.Td><Button size="xs" color="red" variant="light" onClick={() => remove(item)} loading={saving}>Удалить</Button></Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>
    </Stack>
  );
}

import { Alert, Button, Card, Group, Loader, Select, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function TeacherGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [error, setError] = useState('');

  const options = useMemo(
    () => groups.map((group) => ({ value: String(group.id), label: `${group.code} — ${group.name}` })),
    [groups],
  );

  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      setError('');
      try {
        const { data } = await teacherApi.groups();
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroupId(String(data[0].id));
        }
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить группы преподавателя'));
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setStudents([]);
      return;
    }
    const loadStudents = async () => {
      setLoadingStudents(true);
      setError('');
      try {
        const { data } = await teacherApi.groupStudents(selectedGroupId);
        setStudents(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить студентов группы'));
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [selectedGroupId]);

  return (
    <Stack>
      <Title order={2}>Группы</Title>
      {error && <Alert color="red">{error}</Alert>}

      <Card withBorder>
        {loadingGroups ? (
          <Loader color="teal" />
        ) : (
          <Select
            label="Выберите группу"
            data={options}
            value={selectedGroupId}
            onChange={(value) => setSelectedGroupId(value || '')}
            searchable
            nothingFoundMessage="Группы не найдены"
          />
        )}
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Список студентов группы</Title>
          {selectedGroupId ? (
            <Button component={Link} to={`/gradebook?groupId=${selectedGroupId}`} variant="light">
              Открыть журнал группы
            </Button>
          ) : null}
        </Group>

        {loadingStudents ? (
          <Loader color="teal" />
        ) : students.length === 0 ? (
          <Alert color="yellow">В выбранной группе пока нет студентов.</Alert>
        ) : (
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>ФИО</Table.Th>
                <Table.Th>Email</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {students.map((student) => (
                <Table.Tr key={student.id}>
                  <Table.Td>{student.id}</Table.Td>
                  <Table.Td>
                    <Text fw={600}>{student.fullName}</Text>
                  </Table.Td>
                  <Table.Td>{student.email}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}

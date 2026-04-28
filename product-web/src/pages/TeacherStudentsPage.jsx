import { Alert, Badge, Button, Card, Group, Loader, Select, Stack, Table, TextInput, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { teacherApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function TeacherStudentsPage() {
  const [form, setForm] = useState({ email: '', fullName: '', password: '' });
  const [groupId, setGroupId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [students, setStudents] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  const [studentOptions, setStudentOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadOptions = async () => {
    setLoadingOptions(true);
    setError('');
    try {
      const [groupsResp, studentsResp] = await Promise.all([
        teacherApi.groups(),
        teacherApi.students(),
      ]);

      const nextGroupOptions = groupsResp.data.map((group) => ({
        value: String(group.id),
        label: `${group.code} — ${group.name}`,
      }));
      const nextStudentOptions = studentsResp.data.map((student) => ({
        value: String(student.id),
        label: `${student.fullName} (${student.email})`,
      }));

      setStudents(studentsResp.data);
      setGroupOptions(nextGroupOptions);
      setStudentOptions(nextStudentOptions);

      if (!groupId && nextGroupOptions.length > 0) {
        setGroupId(nextGroupOptions[0].value);
      }
      if (!studentId && nextStudentOptions.length > 0) {
        setStudentId(nextStudentOptions[0].value);
      }
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить список групп и студентов'));
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    loadOptions();
  }, []);

  const createStudent = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const { data } = await teacherApi.createStudent(form);
      setMessage(`Студент создан: ${data.fullName}`);
      setStudentId(String(data.id));
      setForm({ email: '', fullName: '', password: '' });
      await loadOptions();
    } catch (err) {
      setError(extractError(err, 'Не удалось создать студента'));
    }
  };

  const bindToGroup = async () => {
    if (!groupId || !studentId) {
      setError('Выберите группу и студента из списка');
      return;
    }
    setError('');
    setMessage('');
    try {
      await teacherApi.addStudentToGroup(groupId, studentId);
      setMessage('Студент добавлен в группу');
    } catch (err) {
      setError(extractError(err, 'Не удалось добавить студента в группу'));
    }
  };

  return (
    <Stack>
      <Title order={2}>Управление студентами</Title>
      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}

      <Card withBorder>
        <Title order={4} mb="md">Создание студента</Title>
        <form onSubmit={createStudent}>
          <Table verticalSpacing="sm">
            <Table.Tbody>
              <Table.Tr>
                <Table.Td w={220}>ФИО</Table.Td>
                <Table.Td>
                  <TextInput value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Email</Table.Td>
                <Table.Td>
                  <TextInput value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td>Пароль</Table.Td>
                <Table.Td>
                  <TextInput value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td />
                <Table.Td>
                  <Button type="submit">Создать студента</Button>
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </form>
      </Card>

      <Card withBorder>
        <Title order={4} mb="md">Добавление студента в группу</Title>
        <Stack>
          {loadingOptions ? (
            <Loader color="teal" />
          ) : (
            <Table verticalSpacing="sm">
              <Table.Tbody>
                <Table.Tr>
                  <Table.Td w={220}>Группа</Table.Td>
                  <Table.Td>
                    <Select
                      placeholder="Выберите группу"
                      data={groupOptions}
                      value={groupId}
                      onChange={(value) => setGroupId(value || '')}
                      searchable
                      nothingFoundMessage="Группы не найдены"
                    />
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td>Студент</Table.Td>
                  <Table.Td>
                    <Select
                      placeholder="Выберите студента"
                      data={studentOptions}
                      value={studentId}
                      onChange={(value) => setStudentId(value || '')}
                      searchable
                      nothingFoundMessage="Студенты не найдены"
                    />
                  </Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Td />
                  <Table.Td>
                    <Button onClick={bindToGroup}>Добавить в группу</Button>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>

      <Card withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Список студентов</Title>
          <Badge color="teal" variant="light">Всего: {students.length}</Badge>
        </Group>
        {loadingOptions ? (
          <Loader color="teal" />
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>ID</Table.Th>
                <Table.Th>ФИО</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Роль</Table.Th>
                <Table.Th>Статус</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {students.map((student) => (
                <Table.Tr key={student.id}>
                  <Table.Td>{student.id}</Table.Td>
                  <Table.Td>{student.fullName}</Table.Td>
                  <Table.Td>{student.email}</Table.Td>
                  <Table.Td>
                    <Badge color="blue" variant="light">Студент</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={student.active ? 'teal' : 'gray'} variant="light">
                      {student.active ? 'Активен' : 'Неактивен'}
                    </Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Card>
    </Stack>
  );
}

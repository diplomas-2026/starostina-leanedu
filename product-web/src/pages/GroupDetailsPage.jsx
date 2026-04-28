import { Alert, Button, Card, Grid, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { groupApi } from '../api/services';
import ListControls from '../components/ListControls';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';

export default function GroupDetailsPage() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [disciplinesSearch, setDisciplinesSearch] = useState('');
  const [studentsSearch, setStudentsSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await groupApi.summary(id);
        setSummary(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить информацию о группе'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const visibleDisciplines = useMemo(() => {
    if (!summary) return [];
    const query = disciplinesSearch.trim().toLowerCase();
    return summary.disciplines.filter((item) =>
      `${item.subjectCode} ${item.subjectName} ${item.teacherName}`.toLowerCase().includes(query),
    );
  }, [summary, disciplinesSearch]);

  const visibleStudents = useMemo(() => {
    if (!summary) return [];
    const query = studentsSearch.trim().toLowerCase();
    return summary.students.filter((student) =>
      `${student.fullName} ${student.email}`.toLowerCase().includes(query),
    );
  }, [summary, studentsSearch]);

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Группа: {summary?.groupCode || ''} {summary?.groupName || ''}</Title>
        {summary && (
          <Button component={Link} to={`/gradebook?groupId=${summary.groupId}`} variant="light">
            Открыть журнал группы
          </Button>
        )}
      </Group>

      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {summary && (
        <>
          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}><Card withBorder><Text size="sm" c="dimmed">Курс</Text><Text fw={700} size="xl">{summary.courseYear}</Text></Card></Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}><Card withBorder><Text size="sm" c="dimmed">Студенты</Text><Text fw={700} size="xl">{summary.studentsCount}</Text></Card></Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}><Card withBorder><Text size="sm" c="dimmed">Дисциплины</Text><Text fw={700} size="xl">{summary.disciplinesCount}</Text></Card></Grid.Col>
          </Grid>

          <Card withBorder>
            <Stack>
              <Text fw={700}>Дисциплины группы</Text>
              <ListControls
                search={disciplinesSearch}
                onSearchChange={setDisciplinesSearch}
                searchPlaceholder="Поиск по дисциплинам и преподавателям"
              />
              {visibleDisciplines.length === 0 ? (
                <Alert color="yellow">Для группы пока нет назначенных дисциплин.</Alert>
              ) : (
                <Table striped>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Дисциплина</Table.Th>
                      <Table.Th>Преподаватель</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {visibleDisciplines.map((item, idx) => (
                      <Table.Tr key={`${item.subjectId}-${item.teacherId}-${idx}`}>
                        <Table.Td>{item.subjectCode} — {item.subjectName}</Table.Td>
                        <Table.Td>{item.teacherName}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              )}
            </Stack>
          </Card>

          <Card withBorder>
            <Stack>
              <Text fw={700}>Студенты группы</Text>
              <ListControls
                search={studentsSearch}
                onSearchChange={setStudentsSearch}
                searchPlaceholder="Поиск по студентам"
              />
              {visibleStudents.length === 0 ? (
                <Alert color="yellow">В группе пока нет студентов.</Alert>
              ) : (
                visibleStudents.map((student) => (
                  <NavigationCard
                    key={student.id}
                    to={`/students/${student.id}`}
                    title={student.fullName}
                    subtitle={student.email}
                    meta="Открыть карточку студента"
                  />
                ))
              )}
            </Stack>
          </Card>
        </>
      )}
    </Stack>
  );
}

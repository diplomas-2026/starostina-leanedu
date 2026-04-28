import { Alert, Card, Group, Loader, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { teacherApi } from '../api/services';
import { extractError } from '../utils/errors';

export default function TeacherDisciplinesPage() {
  const [items, setItems] = useState([]);
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

  return (
    <Stack>
      <Title order={2}>Мои дисциплины</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {!loading && items.length === 0 && (
        <Alert color="yellow">У вас пока нет назначенных дисциплин. Обратитесь к администратору.</Alert>
      )}

      {items.length > 0 && (
        <Card withBorder>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Код</Table.Th>
                <Table.Th>Дисциплина</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {items.map((item) => (
                <Table.Tr key={item.id}>
                  <Table.Td>{item.code}</Table.Td>
                  <Table.Td>
                    <Text fw={600}>{item.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end">
                      <Text component={Link} to={`/teacher/disciplines/${item.id}`} c="teal" fw={600}>
                        Открыть
                      </Text>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}
    </Stack>
  );
}

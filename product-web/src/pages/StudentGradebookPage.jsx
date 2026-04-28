import { Alert, Card, Loader, ScrollArea, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { studentApi } from '../api/services';
import { GradeBadge, GradebookStatusBadge } from '../components/SemanticBadges';
import { extractError } from '../utils/errors';

function formatDueAt(value) {
  if (!value) return 'Без дедлайна';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StudentGradebookPage() {
  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await studentApi.myGradebook();
        setMatrix(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить журнал студента'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Stack>
      <Title order={2}>Мой журнал</Title>
      {loading && <Loader color="teal" />}
      {error && <Alert color="red">{error}</Alert>}

      {matrix && (
        <Card withBorder>
          <Stack gap="md">
            <Text c="dimmed">
              Студент: {matrix.studentName} · Группа: {matrix.groupCode} — {matrix.groupName}
            </Text>

            {matrix.columns.length === 0 ? (
              <Alert color="blue">Для вашей группы пока нет назначенных тестов.</Alert>
            ) : (
              <ScrollArea>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th miw={260}>Дисциплина</Table.Th>
                      {matrix.columns.map((column) => (
                        <Table.Th key={column.assignmentId} miw={220}>
                          <Stack gap={2}>
                            <Text fw={600}>{column.testTitle}</Text>
                            <Text size="xs" c="dimmed">Дедлайн: {formatDueAt(column.dueAt)}</Text>
                          </Stack>
                        </Table.Th>
                      ))}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {matrix.rows.map((row) => (
                      <Table.Tr key={row.subjectId}>
                        <Table.Td>
                          <Text>{row.subjectCode} — {row.subjectName}</Text>
                        </Table.Td>
                        {row.cells.map((cell, index) => (
                          <Table.Td key={`${row.subjectId}-${matrix.columns[index].assignmentId}`}>
                            {cell.status === '—' ? (
                              <Text c="dimmed">—</Text>
                            ) : cell.grade != null ? (
                              <Stack gap={4}>
                                <GradeBadge grade={cell.grade} />
                                <Text size="xs" c="dimmed">Баллы: {cell.score} / {cell.maxScore}</Text>
                              </Stack>
                            ) : (
                              <GradebookStatusBadge status={cell.status} />
                            )}
                          </Table.Td>
                        ))}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Stack>
        </Card>
      )}
    </Stack>
  );
}

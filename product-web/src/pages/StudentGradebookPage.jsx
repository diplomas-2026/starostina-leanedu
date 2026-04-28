import { Alert, Card, Loader, ScrollArea, Select, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { studentApi } from '../api/services';
import ListControls from '../components/ListControls';
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

function averageRowGrade(cells) {
  const grades = cells.map((cell) => cell.grade).filter((grade) => grade != null);
  if (grades.length === 0) return 0;
  return grades.reduce((sum, value) => sum + value, 0) / grades.length;
}

export default function StudentGradebookPage() {
  const [matrix, setMatrix] = useState(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('all');
  const [sortValue, setSortValue] = useState('subject_asc');
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

  const visibleData = useMemo(() => {
    if (!matrix) return { columns: [], rows: [] };
    const now = Date.now();
    const normalizedQuery = search.trim().toLowerCase();

    const columnIndexes = matrix.columns
      .map((column, index) => ({ column, index }))
      .filter(({ column, index }) => {
        if (mode === 'active_deadlines') {
          if (!column.dueAt) return false;
          if (new Date(column.dueAt).getTime() < now) return false;
          return true;
        }
        if (mode === 'completed') {
          return matrix.rows.some((row) => row.cells[index]?.grade != null);
        }
        return true;
      })
      .map((item) => item.index);

    const columns = columnIndexes.map((index) => matrix.columns[index]);
    let rows = matrix.rows.map((row) => ({
      ...row,
      cells: columnIndexes.map((index) => row.cells[index]),
    }));

    if (normalizedQuery) {
      rows = rows.filter((row) =>
        `${row.subjectCode} ${row.subjectName}`.toLowerCase().includes(normalizedQuery),
      );
    }

    rows = rows.sort((a, b) => {
      if (sortValue === 'grade_desc') {
        const avgA = averageRowGrade(a.cells);
        const avgB = averageRowGrade(b.cells);
        return avgB - avgA;
      }
      return `${a.subjectCode} ${a.subjectName}`.localeCompare(`${b.subjectCode} ${b.subjectName}`, 'ru');
    });

    return { columns, rows };
  }, [matrix, mode, search, sortValue]);

  const modeOptions = [
    { value: 'all', label: 'По дисциплинам (полный)' },
    { value: 'active_deadlines', label: 'Только активные дедлайны' },
    { value: 'completed', label: 'Только завершённые' },
  ];

  const sortOptions = [
    { value: 'subject_asc', label: 'По дисциплине (А-Я)' },
    { value: 'grade_desc', label: 'По средней оценке (убыв.)' },
  ];

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
            <Select
              label="Режим журнала"
              data={modeOptions}
              value={mode}
              onChange={(value) => setMode(value || 'all')}
              allowDeselect={false}
            />
            <ListControls
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Поиск по дисциплине"
              sortValue={sortValue}
              onSortChange={setSortValue}
              sortOptions={sortOptions}
            />

            {visibleData.columns.length === 0 ? (
              <Alert color="blue">Для вашей группы пока нет назначенных тестов.</Alert>
            ) : (
              <ScrollArea>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th miw={260}>Дисциплина</Table.Th>
                      {visibleData.columns.map((column) => (
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
                    {visibleData.rows.map((row) => (
                      <Table.Tr key={row.subjectId}>
                        <Table.Td>
                          <Text>{row.subjectCode} — {row.subjectName}</Text>
                        </Table.Td>
                        {row.cells.map((cell, index) => (
                          <Table.Td key={`${row.subjectId}-${visibleData.columns[index].assignmentId}`}>
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

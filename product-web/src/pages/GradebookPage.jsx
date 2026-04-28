import { Alert, Card, Loader, ScrollArea, Select, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gradebookApi } from '../api/services';
import { GradeBadge, GradebookStatusBadge } from '../components/SemanticBadges';
import ListControls from '../components/ListControls';
import { extractError } from '../utils/errors';

function averageGrade(cells) {
  const grades = cells.map((cell) => cell.grade).filter((grade) => grade != null);
  if (grades.length === 0) return 0;
  return grades.reduce((sum, value) => sum + value, 0) / grades.length;
}

export default function GradebookPage() {
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [matrix, setMatrix] = useState(null);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('name_asc');
  const [filterValue, setFilterValue] = useState('all');
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      setError('');
      try {
        const { data } = await gradebookApi.groups();
        const options = data.map((group) => ({
          value: String(group.id),
          label: `${group.code} — ${group.name}`,
        }));
        setGroups(options);
        const queryGroupId = searchParams.get('groupId');
        if (queryGroupId && options.some((option) => option.value === queryGroupId)) {
          setSelectedGroupId(queryGroupId);
        } else if (options.length > 0) {
          setSelectedGroupId(options[0].value);
        }
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить список групп'));
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, [searchParams]);

  useEffect(() => {
    if (!selectedGroupId) {
      setSubjects([]);
      setSelectedSubjectId('');
      setMatrix(null);
      return;
    }

    const loadSubjects = async () => {
      setLoadingSubjects(true);
      setError('');
      try {
        const { data } = await gradebookApi.subjects(selectedGroupId);
        const options = data.map((subject) => ({
          value: String(subject.id),
          label: `${subject.code} — ${subject.name}`,
        }));
        setSubjects(options);
        setSelectedSubjectId(options[0]?.value || '');
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить список дисциплин'));
      } finally {
        setLoadingSubjects(false);
      }
    };
    loadSubjects();
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId || !selectedSubjectId) {
      setMatrix(null);
      return;
    }

    const loadMatrix = async () => {
      setLoadingMatrix(true);
      setError('');
      try {
        const { data } = await gradebookApi.matrix(selectedGroupId, selectedSubjectId);
        setMatrix(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить журнал группы и дисциплины'));
      } finally {
        setLoadingMatrix(false);
      }
    };
    loadMatrix();
  }, [selectedGroupId, selectedSubjectId]);

  const visibleRows = useMemo(() => {
    if (!matrix) return [];
    const query = search.trim().toLowerCase();
    let rows = matrix.rows.filter((row) => row.studentName.toLowerCase().includes(query));
    if (filterValue === 'with_grade') {
      rows = rows.filter((row) => row.cells.some((cell) => cell.grade != null));
    } else if (filterValue === 'no_grade') {
      rows = rows.filter((row) => row.cells.every((cell) => cell.grade == null));
    }
    return rows.sort((a, b) => {
      if (sortValue === 'grade_desc') {
        const avgA = averageGrade(a.cells);
        const avgB = averageGrade(b.cells);
        return avgB - avgA;
      }
      return a.studentName.localeCompare(b.studentName, 'ru');
    });
  }, [matrix, search, filterValue, sortValue]);

  const formatDueAt = (value) => {
    if (!value) return 'Без дедлайна';
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Stack>
      <Title order={2}>Журнал успеваемости</Title>
      {error && <Alert color="red">{error}</Alert>}

      <Card withBorder>
        <Stack>
          {loadingGroups ? (
            <Loader color="teal" />
          ) : (
            <Select
              label="Группа"
              placeholder="Выберите группу"
              value={selectedGroupId}
              data={groups}
              onChange={(value) => setSelectedGroupId(value || '')}
              nothingFoundMessage="Группы не найдены"
              searchable
            />
          )}
          {loadingSubjects ? (
            <Loader color="teal" />
          ) : (
            <Select
              label="Дисциплина"
              placeholder="Выберите дисциплину"
              value={selectedSubjectId}
              data={subjects}
              onChange={(value) => setSelectedSubjectId(value || '')}
              nothingFoundMessage="Дисциплины не найдены"
              searchable
              disabled={!selectedGroupId}
            />
          )}
        </Stack>
      </Card>

      <Card withBorder>
        {loadingMatrix && <Loader color="teal" />}
        {!loadingMatrix && matrix && (
          <Stack gap="md">
            <Text c="dimmed">
              Группа: {matrix.groupCode} — {matrix.groupName} · Дисциплина: {matrix.subjectCode} — {matrix.subjectName}
            </Text>

            {matrix.columns.length === 0 ? (
              <Alert color="blue">Для выбранной группы пока нет назначенных тестов.</Alert>
            ) : (
              <Stack>
                <ListControls
                  search={search}
                  onSearchChange={setSearch}
                  searchPlaceholder="Поиск по студенту"
                  filterValue={filterValue}
                  onFilterChange={setFilterValue}
                  filterOptions={[
                    { value: 'all', label: 'Все строки' },
                    { value: 'with_grade', label: 'Только с оценками' },
                    { value: 'no_grade', label: 'Только без оценок' },
                  ]}
                  sortValue={sortValue}
                  onSortChange={setSortValue}
                  sortOptions={[
                    { value: 'name_asc', label: 'По ФИО (А-Я)' },
                    { value: 'grade_desc', label: 'По средней оценке (убыв.)' },
                  ]}
                />
                <ScrollArea>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th miw={260}>Студент</Table.Th>
                      <Table.Th miw={150}>Итог по дисциплине</Table.Th>
                      <Table.Th miw={260}>По лекциям</Table.Th>
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
                    {visibleRows.map((row) => (
                      <Table.Tr key={row.studentId}>
                        <Table.Td><Text component={Link} to={`/students/${row.studentId}`}>{row.studentName}</Text></Table.Td>
                        <Table.Td>
                          <GradeBadge grade={row.disciplineGrade} prefix="Итог" />
                        </Table.Td>
                        <Table.Td>
                          {row.lectureGrades?.length ? (
                            <Stack gap={4}>
                              {row.lectureGrades.map((item) => (
                                <Stack key={item.lectureId} gap={2}>
                                  <Text size="xs">{item.lectureTitle}</Text>
                                  <GradeBadge grade={item.grade} size="xs" prefix="Лекция" />
                                </Stack>
                              ))}
                            </Stack>
                          ) : (
                            <Text c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        {row.cells.map((cell, index) => (
                          <Table.Td key={`${row.studentId}-${matrix.columns[index].assignmentId}`}>
                            {cell.grade ? (
                              <Stack gap={4}>
                                <GradeBadge grade={cell.grade} />
                                <Text size="xs" c="dimmed">
                                  Баллы: {cell.score} / {cell.maxScore}
                                </Text>
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
              </Stack>
            )}
          </Stack>
        )}

        {!loadingMatrix && matrix && matrix.rows.length === 0 && (
          <Alert color="yellow" mt="md">В этой группе пока нет студентов.</Alert>
        )}
      </Card>
    </Stack>
  );
}

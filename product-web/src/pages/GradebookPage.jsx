import { Alert, Card, Loader, ScrollArea, Select, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { gradebookApi } from '../api/services';
import { GradeBadge, GradebookStatusBadge } from '../components/SemanticBadges';
import { extractError } from '../utils/errors';

export default function GradebookPage() {
  const [searchParams] = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [matrix, setMatrix] = useState(null);
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
              <ScrollArea>
                <Table striped highlightOnHover withTableBorder withColumnBorders>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th miw={260}>Студент</Table.Th>
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
                      <Table.Tr key={row.studentId}>
                        <Table.Td><Text component={Link} to={`/students/${row.studentId}`}>{row.studentName}</Text></Table.Td>
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

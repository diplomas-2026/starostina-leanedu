import { Alert, Badge, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentApi } from '../api/services';
import ListControls from '../components/ListControls';
import NavigationCard from '../components/NavigationCard';
import { AttemptStatusBadge, GradeBadge } from '../components/SemanticBadges';
import { extractError } from '../utils/errors';

export default function StudentDisciplineDetailsPage() {
  const { subjectId } = useParams();
  const [details, setDetails] = useState(null);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState('title_asc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await studentApi.myDisciplineDetails(subjectId);
        setDetails(data);
      } catch (err) {
        setError(extractError(err, 'Не удалось загрузить дисциплину'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [subjectId]);

  const visibleLectures = useMemo(() => {
    const lectures = details?.lectures || [];
    const query = search.trim().toLowerCase();
    const filtered = lectures.filter((lecture) =>
      `${lecture.lectureTitle} ${lecture.lectureSummary}`.toLowerCase().includes(query),
    );
    return filtered.sort((a, b) => {
      if (sortValue === 'grade_desc') return (b.averageGrade || 0) - (a.averageGrade || 0);
      return a.lectureTitle.localeCompare(b.lectureTitle, 'ru');
    });
  }, [details, search, sortValue]);

  if (loading) return <Loader color="teal" />;

  return (
    <Stack>
      <Title order={2}>{details?.subjectCode} · {details?.subjectName}</Title>
      <Text c="dimmed">Преподаватель: {details?.teacherName} · Группа: {details?.groupCode}</Text>
      <ListControls
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Поиск по лекциям"
        sortValue={sortValue}
        onSortChange={setSortValue}
        sortOptions={[
          { value: 'title_asc', label: 'По названию (А-Я)' },
          { value: 'grade_desc', label: 'По средней оценке (убыв.)' },
        ]}
      />

      {error && <Alert color="red">{error}</Alert>}

      {details?.lectures?.length === 0 && (
        <Alert color="yellow">По этой дисциплине пока нет опубликованных лекций.</Alert>
      )}

      {visibleLectures.map((lecture) => (
        <Stack key={lecture.lectureId} gap="xs">
          <NavigationCard
            to={`/lectures/${lecture.lectureId}`}
            title={lecture.lectureTitle}
            subtitle={lecture.lectureSummary}
            meta="Открыть лекцию"
          />
          <Group style={{ paddingLeft: 12, paddingRight: 12 }}>
            <GradeBadge grade={lecture.averageGrade} prefix="Средняя за лекцию" />
            {!lecture.averageGrade ? <Text size="sm" c="dimmed">Средняя оценка пока не рассчитана.</Text> : null}
          </Group>

          {lecture.tests?.length > 0 ? (
            lecture.tests.map((test) => (
              <Group key={test.testId} justify="space-between" style={{ paddingLeft: 12, paddingRight: 12 }}>
                <Text component={Link} to={`/tests/${test.testId}/take`} style={{ textDecoration: 'none' }}>
                  {test.testTitle}
                </Text>
                <Group gap="xs">
                  <AttemptStatusBadge status={test.status} />
                  <GradeBadge grade={test.grade} />
                  {test.score != null && test.maxScore != null ? (
                    <Badge color="blue">{test.score}/{test.maxScore}</Badge>
                  ) : null}
                </Group>
              </Group>
            ))
          ) : (
            <Text size="sm" c="dimmed" pl={12}>Для этой лекции пока нет назначенных вам тестов.</Text>
          )}
        </Stack>
      ))}
    </Stack>
  );
}

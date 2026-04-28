import { Alert, Badge, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { studentApi } from '../api/services';
import NavigationCard from '../components/NavigationCard';
import { extractError } from '../utils/errors';
import { attemptStatusLabel } from '../utils/labels';

export default function StudentDisciplineDetailsPage() {
  const { subjectId } = useParams();
  const [details, setDetails] = useState(null);
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

  if (loading) return <Loader color="teal" />;

  return (
    <Stack>
      <Title order={2}>{details?.subjectCode} · {details?.subjectName}</Title>
      <Text c="dimmed">Преподаватель: {details?.teacherName} · Группа: {details?.groupCode}</Text>

      {error && <Alert color="red">{error}</Alert>}

      {details?.lectures?.length === 0 && (
        <Alert color="yellow">По этой дисциплине пока нет опубликованных лекций.</Alert>
      )}

      {details?.lectures?.map((lecture) => (
        <Stack key={lecture.lectureId} gap="xs">
          <NavigationCard
            to={`/lectures/${lecture.lectureId}`}
            title={lecture.lectureTitle}
            subtitle={lecture.lectureSummary}
            meta={lecture.averageGrade ? `Средняя оценка за лекцию: ${lecture.averageGrade}` : 'Средняя оценка: пока нет результатов'}
          />

          {lecture.tests?.length > 0 ? (
            lecture.tests.map((test) => (
              <Group key={test.testId} justify="space-between" style={{ paddingLeft: 12, paddingRight: 12 }}>
                <Text component={Link} to={`/tests/${test.testId}/take`} style={{ textDecoration: 'none' }}>
                  {test.testTitle}
                </Text>
                <Group gap="xs">
                  <Badge variant="light">{attemptStatusLabel(test.status)}</Badge>
                  {test.grade ? <Badge color="teal">Оценка: {test.grade}</Badge> : null}
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

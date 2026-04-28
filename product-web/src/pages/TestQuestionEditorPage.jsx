import { Alert, Button, Card, Checkbox, Group, Loader, NumberInput, Stack, Text, TextInput, Textarea, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { aiApi, testApi } from '../api/services';
import AiLimitsCard from '../components/AiLimitsCard';
import { extractError } from '../utils/errors';

export default function TestQuestionEditorPage() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [showAiForm, setShowAiForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [questionForm, setQuestionForm] = useState({
    text: '',
    points: 1,
    options: [
      { text: '', correct: true },
      { text: '', correct: false },
    ],
  });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [testResp, limitsResp] = await Promise.all([testApi.get(id), aiApi.limits()]);
      setTest(testResp.data);
      setLimits(limitsResp.data);
    } catch (err) {
      setError(extractError(err, 'Не удалось загрузить редактор вопросов'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const setOption = (index, next) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((option, idx) => (idx === index ? { ...option, ...next } : option)),
    }));
  };

  const addOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { text: '', correct: false }],
    }));
  };

  const removeOption = (index) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, idx) => idx !== index),
    }));
  };

  const submitQuestion = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    const options = questionForm.options.filter((option) => option.text.trim().length > 0);
    if (options.length < 2) {
      setError('Добавьте минимум 2 варианта ответа');
      return;
    }
    if (!options.some((option) => option.correct)) {
      setError('Нужно отметить минимум один правильный вариант');
      return;
    }

    setSavingQuestion(true);
    try {
      await testApi.addQuestion(id, {
        text: questionForm.text,
        points: Number(questionForm.points),
        options: options.map((option) => ({ text: option.text.trim(), correct: option.correct })),
      });
      setQuestionForm({
        text: '',
        points: 1,
        options: [
          { text: '', correct: true },
          { text: '', correct: false },
        ],
      });
      setMessage('Вопрос добавлен');
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось добавить вопрос'));
    } finally {
      setSavingQuestion(false);
    }
  };

  const generateQuestionsWithAi = async () => {
    setGeneratingAi(true);
    setError('');
    setMessage('');
    if (!aiPrompt.trim()) {
      setError('Введите требования к генерации вопроса через LLM');
      setGeneratingAi(false);
      return;
    }
    try {
      const { data } = await aiApi.generateQuestionsForTest(id, aiPrompt.trim());
      setMessage(`LLM добавила вопросов: ${data}`);
      await load();
    } catch (err) {
      setError(extractError(err, 'Не удалось сгенерировать вопросы через LLM'));
    } finally {
      setGeneratingAi(false);
    }
  };

  if (loading) return <Loader color="teal" />;

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={2}>Вопросы теста: {test?.title}</Title>
        <Button component={Link} to={`/tests/${id}`} variant="light">К тесту</Button>
      </Group>

      {error && <Alert color="red">{error}</Alert>}
      {message && <Alert color="green">{message}</Alert>}
      <AiLimitsCard limits={limits} />

      <Card withBorder>
        <Group mb="md">
          <Button variant={showAiForm ? 'filled' : 'light'} onClick={() => setShowAiForm((prev) => !prev)}>
            Догенерировать вопросы через LLM
          </Button>
          <Button variant={showManualForm ? 'filled' : 'light'} onClick={() => setShowManualForm((prev) => !prev)}>
            Добавить вручную
          </Button>
        </Group>

        {showAiForm && (
          <Stack mb="md">
            <Title order={4}>LLM: догенерация вопросов</Title>
            <Textarea
              label="Инструкция для LLM"
              placeholder="Например: сгенерируй 3 вопроса среднего уровня по кайдзен и картированию потока..."
              minRows={3}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.currentTarget.value)}
            />
            <Button onClick={generateQuestionsWithAi} loading={generatingAi} disabled={limits?.remaining === 0}>
              Сгенерировать через LLM
            </Button>
          </Stack>
        )}

        {showManualForm && (
          <>
            <Title order={4} mb="sm">Добавить вопрос вручную</Title>
            <form onSubmit={submitQuestion}>
              <Stack>
                <TextInput
                  label="Текст вопроса"
                  value={questionForm.text}
                  onChange={(e) => setQuestionForm((prev) => ({ ...prev, text: e.target.value }))}
                  required
                />
                <NumberInput
                  label="Баллы за вопрос"
                  min={1}
                  value={questionForm.points}
                  onChange={(value) => setQuestionForm((prev) => ({ ...prev, points: Number(value) || 1 }))}
                  required
                />
                <Title order={5}>Варианты ответа</Title>
                {questionForm.options.map((option, index) => (
                  <Group key={index} align="end">
                    <TextInput
                      style={{ flex: 1 }}
                      label={`Вариант ${index + 1}`}
                      value={option.text}
                      onChange={(e) => setOption(index, { text: e.target.value })}
                      required
                    />
                    <Checkbox
                      label="Правильный"
                      checked={option.correct}
                      onChange={(e) => setOption(index, { correct: e.currentTarget.checked })}
                    />
                    <Button variant="light" color="red" onClick={() => removeOption(index)} disabled={questionForm.options.length <= 2}>
                      Удалить
                    </Button>
                  </Group>
                ))}
                <Group>
                  <Button type="button" variant="light" onClick={addOption}>Добавить вариант</Button>
                  <Button type="submit" loading={savingQuestion}>Сохранить вопрос</Button>
                </Group>
              </Stack>
            </form>
          </>
        )}
      </Card>
    </Stack>
  );
}

import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { loadUsers } from './users';

const screenshotDir = path.resolve(process.cwd(), 'artifacts/screenshots');

function ensureScreenshotDir() {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function shot(page, name) {
  await page.screenshot({ path: `${screenshotDir}/${name}.png`, fullPage: true });
}

async function login(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('Скриншоты ключевых экранов и состояний', async ({ page }) => {
  ensureScreenshotDir();
  const users = loadUsers();

  await page.goto('/login');
  await shot(page, '01-login');

  await login(page, users.ADMIN.email, users.ADMIN.password);
  await shot(page, '02-admin-dashboard');

  await page.goto('/admin/teachers');
  await expect(page.getByRole('heading', { name: 'Преподаватели' })).toBeVisible();
  await shot(page, '03-admin-teachers-list');

  await page.goto('/admin/teachers/new');
  await expect(page.getByRole('heading', { name: 'Добавление преподавателя' })).toBeVisible();
  await shot(page, '04-admin-teacher-create-form');

  await page.goto('/admin/students');
  await expect(page.getByRole('heading', { name: 'Студенты' })).toBeVisible();
  await shot(page, '05-admin-students-list');

  await page.goto('/admin/students/new');
  await expect(page.getByRole('heading', { name: 'Добавление студента' })).toBeVisible();
  await shot(page, '06-admin-student-create-form');

  await page.goto('/admin/subjects');
  await expect(page.getByRole('heading', { name: 'Дисциплины' })).toBeVisible();
  await shot(page, '07-admin-subjects-list');

  await page.goto('/admin/subjects/new');
  await expect(page.getByRole('heading', { name: 'Добавление дисциплины' })).toBeVisible();
  await shot(page, '08-admin-subject-create-form');

  await page.goto('/admin/groups');
  await expect(page.getByRole('heading', { name: 'Группы' })).toBeVisible();
  await shot(page, '09-admin-groups-list');

  await page.goto('/admin/groups/new');
  await expect(page.getByRole('heading', { name: 'Добавление группы' })).toBeVisible();
  await shot(page, '10-admin-group-create-form');

  await page.goto('/admin/assignments');
  await expect(page.getByRole('heading', { name: 'Назначения' })).toBeVisible();
  await shot(page, '11-admin-assignments');

  await page.goto('/login');

  await login(page, users.TEACHER.email, users.TEACHER.password);
  await shot(page, '12-teacher-dashboard');

  await page.goto('/teacher/disciplines');
  await expect(page.getByRole('heading', { name: 'Мои дисциплины' })).toBeVisible();
  await shot(page, '13-teacher-disciplines');

  const firstDiscipline = page.getByRole('link', { name: /Открыть/ }).first();
  if (await firstDiscipline.isVisible()) {
    await firstDiscipline.click();
    await expect(page.getByText('Лекции по дисциплине')).toBeVisible();
    await shot(page, '14-teacher-discipline-details');
  }

  await page.goto('/lectures');
  await expect(page.getByRole('heading', { name: 'Лекции' })).toBeVisible();
  await shot(page, '15-teacher-lectures-list');

  const firstLecture = page.getByRole('link', { name: /Открыть/ }).first();
  if (await firstLecture.isVisible()) {
    await firstLecture.click();
    await expect(page.getByRole('button', { name: 'Сгенерировать тест' })).toBeVisible();
    await shot(page, '16-teacher-lecture-details-with-llm');
  }

  await page.goto('/tests');
  await expect(page.getByRole('heading', { name: 'Тесты' })).toBeVisible();
  await shot(page, '17-teacher-tests-list');

  await page.goto('/tests/new');
  await expect(page.getByRole('heading', { name: 'Создание теста' })).toBeVisible();
  await shot(page, '18-teacher-test-create-form');

  const firstTeacherTest = page.getByRole('link', { name: /Открыть/ }).first();
  await page.goto('/tests');
  if (await firstTeacherTest.isVisible()) {
    await firstTeacherTest.click();
    await expect(page.getByText('Управление вопросами теста')).toBeVisible();
    await shot(page, '19-teacher-test-details');

    const manageQuestionsLink = page.getByRole('link', { name: 'Перейти к редактору вопросов' });
    if (await manageQuestionsLink.isVisible()) {
      await manageQuestionsLink.click();
      await expect(page.getByText('LLM: догенерация вопросов')).toBeVisible();
      await shot(page, '20-teacher-test-question-editor');
    }
  }

  await page.goto('/teacher/groups');
  await expect(page.getByRole('heading', { name: 'Группы' })).toBeVisible();
  await shot(page, '21-teacher-groups');

  const firstGroup = page.getByRole('link', { name: /Открыть/ }).first();
  if (await firstGroup.isVisible()) {
    await firstGroup.click();
    await expect(page.getByText('Студенты группы')).toBeVisible();
    await shot(page, '22-group-details');
  }

  await page.goto('/gradebook');
  await expect(page.getByRole('heading', { name: 'Журнал успеваемости' })).toBeVisible();
  await shot(page, '23-teacher-gradebook');

  await page.goto('/login');

  await login(page, users.STUDENT.email, users.STUDENT.password);
  await shot(page, '24-student-dashboard');

  await page.goto('/student/disciplines');
  await expect(page.getByRole('heading', { name: 'Мои дисциплины' })).toBeVisible();
  await shot(page, '25-student-disciplines');

  const firstStudentDiscipline = page.getByRole('link', { name: /Открыть/ }).first();
  if (await firstStudentDiscipline.isVisible()) {
    await firstStudentDiscipline.click();
    await expect(page.getByText('Лекции')).toBeVisible();
    await shot(page, '26-student-discipline-details');
  }

  await page.goto('/lectures');
  await expect(page.getByRole('heading', { name: 'Лекции' })).toBeVisible();
  await shot(page, '27-student-lectures');

  await page.goto('/tests');
  await expect(page.getByRole('heading', { name: 'Тесты' })).toBeVisible();
  await shot(page, '28-student-tests-list');

  const startButton = page.getByRole('button', { name: 'Начать' }).first();
  if (await startButton.isVisible()) {
    await startButton.click();
    await expect(page.getByRole('button', { name: 'Завершить тест' })).toBeVisible();
    await shot(page, '29-student-test-attempt');
  }

  await page.goto('/my-results');
  await expect(page.getByRole('heading', { name: 'Мои результаты' })).toBeVisible();
  await shot(page, '30-student-results');

  await page.goto('/student/gradebook');
  await expect(page.getByRole('heading', { name: 'Мой журнал' })).toBeVisible();
  await shot(page, '31-student-gradebook');

  await page.goto('/admin/teachers');
  await expect(page).toHaveURL(/dashboard/);
  await shot(page, '32-student-access-restricted-redirect');
});

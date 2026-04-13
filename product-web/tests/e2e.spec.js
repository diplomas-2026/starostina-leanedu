import { test, expect } from '@playwright/test';
import path from 'node:path';
import { loadUsers } from './users';

const screenshotDir = path.resolve(process.cwd(), 'artifacts/screenshots');

async function login(page, email, password) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await expect(page).toHaveURL(/dashboard/);
}

test('Логин и экран входа', async ({ page }) => {
  await page.goto('/login');
  await page.screenshot({ path: `${screenshotDir}/01-login-page.png`, fullPage: true });
  await expect(page.getByText('Платформа LeanEdu')).toBeVisible();
});

test('Сценарий преподавателя + LLM кнопка', async ({ page }) => {
  const users = loadUsers();
  await login(page, users.TEACHER.email, users.TEACHER.password);

  await page.screenshot({ path: `${screenshotDir}/02-dashboard-teacher.png`, fullPage: true });

  await page.goto('/lectures');
  await expect(page.getByRole('heading', { name: 'Лекции' })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/03-lectures.png`, fullPage: true });

  await page.getByRole('link', { name: 'Открыть' }).first().click();
  await expect(page.getByRole('button', { name: 'Сгенерировать тест' })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/04-lecture-details-with-ai.png`, fullPage: true });
});

test('Сценарий администратора', async ({ page }) => {
  const users = loadUsers();
  await login(page, users.ADMIN.email, users.ADMIN.password);

  await page.goto('/admin/teachers');
  await expect(page.getByRole('heading', { name: 'Управление преподавателями' })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/05-admin-teachers.png`, fullPage: true });
});

test('Сценарий студента и ограничения', async ({ page }) => {
  const users = loadUsers();
  await login(page, users.STUDENT.email, users.STUDENT.password);

  await page.goto('/tests');
  await expect(page.getByRole('heading', { name: 'Тесты' })).toBeVisible();
  await page.screenshot({ path: `${screenshotDir}/06-tests-student.png`, fullPage: true });

  await page.goto('/admin/teachers');
  await expect(page).toHaveURL(/dashboard/);
});

import fs from 'node:fs';
import path from 'node:path';

export function loadUsers() {
  const usersPath = path.resolve(process.cwd(), '../product-api/users.txt');
  const content = fs.readFileSync(usersPath, 'utf-8');
  const result = {};

  for (const line of content.split('\n').map((l) => l.trim()).filter(Boolean)) {
    const fields = Object.fromEntries(line.split(';').map((part) => part.trim().split('=')));
    if (fields.role) {
      result[fields.role] = { email: fields.email, password: fields.password };
    }
  }

  return result;
}

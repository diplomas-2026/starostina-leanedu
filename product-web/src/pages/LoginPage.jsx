import { Alert, Button, Card, PasswordInput, Stack, TextInput, Title } from '@mantine/core';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractError } from '../utils/errors';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('teacher@lean.local');
  const [password, setPassword] = useState('teacher123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(extractError(err, 'Не удалось выполнить вход'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'radial-gradient(circle at 10% 10%, #d9fff4, transparent 30%), radial-gradient(circle at 85% 20%, #ffe7c2, transparent 35%), #f8fbff' }}>
      <Card withBorder shadow="lg" radius="lg" p="xl" w={420}>
        <Title order={2} mb="md">Платформа LeanEdu</Title>
        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <PasswordInput label="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <Alert color="red">{error}</Alert>}
            <Button type="submit" loading={loading}>Войти</Button>
          </Stack>
        </form>
      </Card>
    </div>
  );
}

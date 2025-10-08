import { useEffect, useState } from 'react';
import { useTheme } from '../Problems/ThemeContext';
import { useAuth } from './userStore';
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Tabs,
  Tab,
  TextField,
  Button,
  Stack,
  CircularProgress,
} from '@mui/material';

export default function AuthPage() {
  const { theme } = useTheme();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  useEffect(() => {
    // reset form on mode change
    setEmail('');
    setPass('');
    if (mode === 'register') setName('');
  }, [mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailTrim = email.trim();
    const passTrim = pass.trim();
    const nameTrim = (name || 'User').trim();
    if (!emailTrim || !passTrim) return;
    setLoading(true);
    try {
      if (mode === 'login') await login(emailTrim, passTrim);
      else await register(nameTrim || 'User', emailTrim, passTrim);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
      <Card sx={{ width: 460 }}>
        <CardHeader
          title="Добро пожаловать"
          action={
            <Tabs value={mode} onChange={(_, v) => setMode(v)} aria-label="auth tabs">
              <Tab value="login" label="Вход" />
              <Tab value="register" label="Регистрация" />
            </Tabs>
          }
        />
        <CardContent sx={{ pt: 3 }}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            {mode === 'register' && (
              <TextField label="Имя" placeholder="Иван" value={name} onChange={(e) => setName(e.target.value)} fullWidth autoComplete="name" />
            )}
            <TextField label="Email" placeholder="you@mail.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth autoComplete="email" />
            <TextField label="Пароль" placeholder="••••••••" type="password" value={pass} onChange={(e) => setPass(e.target.value)} fullWidth autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : undefined}>
                {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}
              </Button>
              <Box sx={{ typography: 'caption', opacity: 0.7 }}>Ctrl+Enter — отправить</Box>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </section>
  );
}



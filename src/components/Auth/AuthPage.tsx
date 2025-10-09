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
  InputAdornment,
  IconButton,
  Grow,
  Alert,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

export default function AuthPage() {
  useTheme();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ name?: string; email?: string; pass?: string }>({});

  useEffect(() => {
    // reset form on mode change
    setEmail('');
    setPass('');
    if (mode === 'register') setName('');
    setErrorMsg(null);
    setErrors({});
  }, [mode]);

  function validate(): boolean {
    const next: { name?: string; email?: string; pass?: string } = {};
    const emailTrim = email.trim();
    const passTrim = pass.trim();
    const nameTrim = (name || '').trim();
    if (!emailTrim) next.email = 'Введите email';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) next.email = 'Некорректный email';
    if (!passTrim) next.pass = 'Введите пароль';
    else if (passTrim.length < 6) next.pass = 'Минимум 6 символов';
    if (mode === 'register' && !nameTrim) next.name = 'Введите имя';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!validate()) return;
    const emailTrim = email.trim();
    const passTrim = pass.trim();
    const nameTrim = (name || 'User').trim();
    setLoading(true);
    try {
      if (mode === 'login') await login(emailTrim, passTrim);
      else await register(nameTrim || 'User', emailTrim, passTrim);
    } catch (err: any) {
      const fallback = mode === 'login' ? 'Неверный email или пароль' : 'Не удалось зарегистрироваться';
      const message = (err && err.message) ? String(err.message) : fallback;
      setErrorMsg(message);
      setErrors(prev => ({ ...prev, pass: mode === 'login' ? 'Неверный email или пароль' : prev.pass }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display: 'grid', placeItems: 'center', minHeight: 'calc(100vh - 80px)' }}>
      <Grow in timeout={260}>
      <Card sx={{ width: 460, backdropFilter: 'blur(6px)', bgcolor: 'background.paper', transition: 'transform .25s ease', '&:hover': { transform: 'translateY(-2px)' } }}>
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
          <Grow in key={mode} timeout={220}>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
            {errorMsg && (
              <Alert severity="error" onClose={() => setErrorMsg(null)}>{errorMsg}</Alert>
            )}
            {mode === 'register' && (
              <TextField label="Имя" placeholder="Иван" value={name} onChange={(e) => setName(e.target.value)} fullWidth autoComplete="name"
                         error={!!errors.name} helperText={errors.name} />
            )}
            <TextField label="Email" placeholder="you@mail.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth autoComplete="email"
                       error={!!errors.email} helperText={errors.email} />
            <TextField label="Пароль" placeholder="••••••••" type={showPass ? 'text' : 'password'} value={pass} onChange={(e) => setPass(e.target.value)} fullWidth autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                       error={!!errors.pass} helperText={errors.pass}
                       InputProps={{
                         endAdornment: (
                           <InputAdornment position="end">
                             <IconButton aria-label="toggle password visibility" onClick={() => setShowPass(v => !v)} edge="end">
                               {showPass ? <VisibilityOff /> : <Visibility />}
                             </IconButton>
                           </InputAdornment>
                         )
                       }}
            />
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={16} /> : undefined}>
                {loading ? 'Загрузка...' : (mode === 'login' ? 'Войти' : 'Зарегистрироваться')}
              </Button>
              <Box sx={{ typography: 'caption', opacity: 0.7 }}>Ctrl+Enter — отправить</Box>
            </Stack>
          </Box>
          </Grow>
        </CardContent>
      </Card>
      </Grow>
    </section>
  );
}



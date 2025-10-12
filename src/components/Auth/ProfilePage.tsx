import { useAuth } from "./userStore";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Stack,
  Chip,
} from "@mui/material";
/*Tab, Tabs, TextField,*/

export default function ProfilePage() {
  const { user, logout } = useAuth();
  if (!user)
    return <section className="centered">Нет данных пользователя</section>;

  return (
    <section style={{ display: "grid", placeItems: "center", paddingTop: 24 }}>
      <Card sx={{ width: 720 }}>
        <CardHeader title="Профиль" />
        <CardContent>
          <Stack direction="row" spacing={3} alignItems="center">
            <Avatar
              src={
                user.avatarUrl ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3fb950&color=0a0a0a`
              }
              sx={{ width: 72, height: 72 }}
            />
            <Box>
              <Box sx={{ fontWeight: 700, mb: 0.5 }}>{user.name}</Box>
              <Box sx={{ opacity: 0.8, mb: 1 }}>{user.email}</Box>
              <Chip
                size="small"
                label={(user as any).role || "user"}
                color={(user as any).role === "admin" ? "success" : "default"}
                sx={{ mb: 1 }}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => (window.location.hash = "problems-home")}
                >
                  На главную
                </Button>
                <Button color="error" variant="outlined" onClick={logout}>
                  Выйти
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </section>
  );
}

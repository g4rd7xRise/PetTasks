import {
  Button,
  Container,
  Stack,
  Typography,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Grid,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SpaceBackground from "../UI/SpaceBackground";

// --- ДОБАВЛЕНО: Константа для темного цвета текста ---
// Используем темно-серый цвет из палитры MUI для высокого контраста.
const darkTextColor = "#1a2027";

export default function LandingPage() {
  return (
    <>
      <SpaceBackground />

      <Container maxWidth="lg" sx={{ py: 8, position: "relative" }}>
        {/* Hero */}
        <Stack
          spacing={3}
          alignItems="center"
          textAlign="center"
          // --- ИЗМЕНЕНО: Применяем темный цвет текста ко всему блоку ---
          sx={{ mb: 6, color: darkTextColor }}
        >
          <Typography variant="h3" fontWeight={800}>
            PetTasks — внутренний учебный хаб
          </Typography>
          {/* Увеличили opacity с 0.8 до 0.9 для лучшей читаемости */}
          <Typography variant="h6" sx={{ opacity: 0.9, maxWidth: 900 }}>
            Тренируйтесь, запускайте тесты, отслеживайте прогресс и прокачивайте
            алгоритмы. Доступ только для сотрудников/участников.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <Button
              size="large"
              variant="contained"
              onClick={() => (window.location.hash = "auth")}
            >
              Войти
            </Button>
            <Button
              size="large"
              variant="outlined"
              onClick={() => (window.location.hash = "auth")}
              // Сделали фон кнопки более непрозрачным
              sx={{ bgcolor: "rgba(255,255,255,0.8)" }}
            >
              Зарегистрироваться
            </Button>
          </Stack>
        </Stack>

        {/* Features */}
        <Grid container spacing={2} sx={{ mb: 6 }}>
          {[
            {
              title: "Быстрый старт",
              text: "Запускайте тесты сочетанием Ctrl+Enter и сразу видьте результат",
            },
            {
              title: "База задач",
              text: "Импортируйте задачи из GitHub и ведите прогресс по тегам",
            },
            {
              title: "Статистика",
              text: "Отслеживайте решённые задачи и попытки на главной панели",
            },
          ].map((item, index) => (
            // @ts-ignore
            <Grid item xs={12} md={4} key={index}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  height: "100%",
                  // --- ИЗМЕНЕНО: Увеличена непрозрачность фона (0.9) ---
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  backdropFilter: "blur(10px)",
                  // --- ИЗМЕНЕНО: Явно задан темный цвет текста ---
                  color: darkTextColor,
                }}
              >
                {item.title !== "Быстрый старт" && (
                  <Typography variant="subtitle1" fontWeight={700}>
                    {item.title}
                  </Typography>
                )}
                {/* Увеличили opacity для лучшей читаемости */}
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {item.text}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* How it works */}
        {/* Применяем темный цвет текста */}
        <Stack spacing={2} sx={{ mb: 6, color: darkTextColor }}>
          <Typography variant="h5" fontWeight={700}>
            Как это работает
          </Typography>
          <Divider />
          <Grid container spacing={2}>
            {[
              {
                step: "1. Выберите задачу",
                desc: "Откройте описание, видео и материалы.",
              },
              {
                step: "2. Пишите код",
                desc: "Редактор и автотесты помогают быстро находить ошибки.",
              },
              {
                step: "3. Прогресс",
                desc: "Система сохраняет решения и отмечает задачи как решённые.",
              },
              {
                step: "4. Аналитика",
                desc: "Следите за диаграммами прогресса и ведите личный To‑Do.",
              },
            ].map((item, idx) => (
              // @ts-ignore
              <Grid item xs={12} md={6} key={idx}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    // Увеличена непрозрачность и задан цвет
                    bgcolor: "rgba(255, 255, 255, 0.9)",
                    backdropFilter: "blur(10px)",
                    color: darkTextColor,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={700}>
                    {item.step}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {item.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Stack>

        {/* FAQ */}
        {/* Применяем темный цвет текста */}
        <Stack spacing={2} sx={{ mb: 6, color: darkTextColor }}>
          <Typography variant="h5" fontWeight={700}>
            FAQ
          </Typography>
          <Divider />
          <Box
            sx={{
              // Стилизация аккордеона
              "& .MuiAccordion-root": {
                bgcolor: "rgba(255, 255, 255, 0.9)", // Большая непрозрачность
                backdropFilter: "blur(10px)",
                color: darkTextColor, // Темный текст
                // Красим иконку стрелочки тоже
                "& .MuiAccordionSummary-expandIconWrapper": {
                  color: darkTextColor,
                },
              },
            }}
          >
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>Кто имеет доступ?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                Доступ только для внутренних пользователей. Авторизация
                обязательна.
              </AccordionDetails>
            </Accordion>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={600}>Где хранится прогресс?</Typography>
              </AccordionSummary>
              <AccordionDetails>
                Прогресс сохраняется в базе и отображается в интерфейсе задач.
              </AccordionDetails>
            </Accordion>
          </Box>
        </Stack>

        {/* CTA */}
        <Stack
          alignItems="center"
          spacing={2}
          sx={{ pb: 6, color: darkTextColor }}
        >
          <Typography variant="h6">Готовы начать?</Typography>
          <Button
            size="large"
            variant="contained"
            onClick={() => (window.location.hash = "auth")}
          >
            Войти в систему
          </Button>
        </Stack>
      </Container>
    </>
  );
}

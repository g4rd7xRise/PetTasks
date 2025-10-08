import { Box, Button, Container, Stack, Typography, Divider, Accordion, AccordionSummary, AccordionDetails, Paper } from '@mui/material';
import Grid from '@mui/material/Grid';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useTheme } from '../Problems/ThemeContext';

export default function LandingPage() {
	const { theme } = useTheme();
	return (
		<Container maxWidth="lg" sx={{ py: 8 }}>
			{/* Hero */}
			<Stack spacing={3} alignItems="center" textAlign="center" sx={{ mb: 6 }}>
				<Typography variant="h3" fontWeight={800}>PetTasks — внутренний учебный хаб</Typography>
				<Typography variant="h6" sx={{ opacity: 0.8, maxWidth: 900 }}>
					Тренируйтесь, запускайте тесты, отслеживайте прогресс и прокачивайте алгоритмы. Доступ только для сотрудников/участников.
				</Typography>
				<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
					<Button size="large" variant="contained" onClick={() => (window.location.hash = 'auth')}>Войти</Button>
					<Button size="large" variant="outlined" onClick={() => (window.location.hash = 'auth')}>Зарегистрироваться</Button>
				</Stack>
			</Stack>

			{/* Features */}
            <Grid container spacing={2} sx={{ mb: 6 }}>
                <Grid item xs={12} md={4}>
					<Paper variant="outlined" sx={{ p: 3 }}>
						<Typography variant="subtitle1" fontWeight={700}>Редактор кода</Typography>
						<Typography variant="body2" sx={{ opacity: 0.8 }}>Запускайте тесты сочетанием Ctrl+Enter и сразу видьте результат</Typography>
					</Paper>
				</Grid>
                <Grid item xs={12} md={4}>
					<Paper variant="outlined" sx={{ p: 3 }}>
						<Typography variant="subtitle1" fontWeight={700}>База задач</Typography>
						<Typography variant="body2" sx={{ opacity: 0.8 }}>Импортируйте задачи из GitHub и ведите прогресс по тегам</Typography>
					</Paper>
				</Grid>
                <Grid item xs={12} md={4}>
					<Paper variant="outlined" sx={{ p: 3 }}>
						<Typography variant="subtitle1" fontWeight={700}>Статистика</Typography>
						<Typography variant="body2" sx={{ opacity: 0.8 }}>Отслеживайте решённые задачи и попытки на главной панели</Typography>
					</Paper>
				</Grid>
			</Grid>

			{/* How it works */}
			<Stack spacing={2} sx={{ mb: 6 }}>
				<Typography variant="h5" fontWeight={700}>Как это работает</Typography>
				<Divider />
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
						<Paper variant="outlined" sx={{ p: 3 }}>
							<Typography variant="subtitle1" fontWeight={700}>1. Выберите задачу</Typography>
							<Typography variant="body2" sx={{ opacity: 0.8 }}>Откройте описание, видео и материалы. Начните с простых задач и повышайте сложность.</Typography>
						</Paper>
					</Grid>
                    <Grid item xs={12} md={6}>
						<Paper variant="outlined" sx={{ p: 3 }}>
							<Typography variant="subtitle1" fontWeight={700}>2. Пишите и запускайте код</Typography>
							<Typography variant="body2" sx={{ opacity: 0.8 }}>Редактор и автотесты помогают быстро находить ошибки и двигаться дальше.</Typography>
						</Paper>
					</Grid>
                    <Grid item xs={12} md={6}>
						<Paper variant="outlined" sx={{ p: 3 }}>
							<Typography variant="subtitle1" fontWeight={700}>3. Фиксируйте прогресс</Typography>
							<Typography variant="body2" sx={{ opacity: 0.8 }}>Система сохраняет решения и отмечает задачи как решённые при прохождении всех тестов.</Typography>
						</Paper>
					</Grid>
                    <Grid item xs={12} md={6}>
						<Paper variant="outlined" sx={{ p: 3 }}>
							<Typography variant="subtitle1" fontWeight={700}>4. Аналитика и цели</Typography>
							<Typography variant="body2" sx={{ opacity: 0.8 }}>Следите за диаграммами прогресса и ведите личный To‑Do прямо на главной.</Typography>
						</Paper>
					</Grid>
				</Grid>
			</Stack>

			{/* FAQ */}
			<Stack spacing={2} sx={{ mb: 6 }}>
				<Typography variant="h5" fontWeight={700}>FAQ</Typography>
				<Divider />
				<Accordion>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>Кто имеет доступ?</AccordionSummary>
					<AccordionDetails>Доступ только для внутренних пользователей. Авторизация обязательна.</AccordionDetails>
				</Accordion>
				<Accordion>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>Где хранится прогресс?</AccordionSummary>
					<AccordionDetails>Прогресс сохраняется в базе и отображается в интерфейсе задач.</AccordionDetails>
				</Accordion>
			</Stack>

			{/* CTA */}
			<Stack alignItems="center" spacing={2} sx={{ pb: 6 }}>
				<Typography variant="h6">Готовы начать?</Typography>
				<Button size="large" variant="contained" onClick={() => (window.location.hash = 'auth')}>Войти в систему</Button>
			</Stack>
		</Container>
	);
}



import { Dialog, DialogTitle, DialogContent, Stack, Typography, Button, Divider, Box } from '@mui/material';

interface Props {
	open: boolean;
	onClose: () => void;
}

export default function FrontendDialog({ open, onClose }: Props) {
	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
			<DialogTitle>Front‑End инструменты</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ pt: 1 }}>
					<Box>
						<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Дизайн и UI</Typography>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							<Button variant="contained" size="small" onClick={() => (window.location.hash = 'problems-home')}>UI Kit</Button>
							<Button variant="outlined" size="small" onClick={() => (window.location.hash = 'problems')}>Компоненты</Button>
							<Button variant="outlined" size="small" onClick={() => (window.location.hash = 'auth')}>Темы</Button>
						</Stack>
					</Box>
					<Divider />
					<Box>
						<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Документация</Typography>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							<Button variant="outlined" size="small" onClick={() => (window.open('about:blank', '_blank'))}>Storybook</Button>
							<Button variant="outlined" size="small" onClick={() => (window.open('about:blank', '_blank'))}>Стандарты кода</Button>
						</Stack>
					</Box>
					<Divider />
					<Box>
						<Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>Шаблоны</Typography>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							<Button variant="outlined" size="small">Layout</Button>
							<Button variant="outlined" size="small">Формы</Button>
							<Button variant="outlined" size="small">Таблицы</Button>
							<Button variant="contained" size="small" onClick={() => { window.location.hash = 'admin'; onClose(); }}>Админ: задачи</Button>
						</Stack>
					</Box>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}




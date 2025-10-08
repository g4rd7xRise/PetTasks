import { useAuth } from './userStore';
import {
	Avatar,
	Box,
	Button,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	Stack,
	Tab,
	Tabs,
	TextField,
	Chip
} from '@mui/material';
import { useState } from 'react';

interface Props {
	open: boolean;
	onClose: () => void;
}

export default function ProfileDialog({ open, onClose }: Props) {
	const { user, logout } = useAuth();
	const [tab, setTab] = useState<'profile' | 'settings'>('profile');
	if (!user) return null;

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle sx={{ pb: 1 }}>
				<Tabs value={tab} onChange={(_, v) => setTab(v)}>
					<Tab value="profile" label="Профиль" />
					<Tab value="settings" label="Настройки" />
				</Tabs>
			</DialogTitle>
			<Divider />
			<DialogContent sx={{ pt: 3 }}>
				{tab === 'profile' && (
					<Stack direction="row" spacing={2} alignItems="center">
						<Avatar src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3fb950&color=0a0a0a`} sx={{ width: 64, height: 64 }} />
						<Box>
							<Box sx={{ fontWeight: 700 }}>{user.name}</Box>
							<Box sx={{ opacity: 0.8, mb: 1 }}>{user.email}</Box>
							<Chip size="small" label={(user as any).role || 'user'} color={(user as any).role === 'admin' ? 'success' : 'default'} sx={{ mb: 2 }} />
							<Stack direction="row" spacing={1}>
								<Button variant="outlined" onClick={onClose}>Закрыть</Button>
								<Button variant="outlined" color="error" onClick={() => { onClose(); logout(); }}>Выйти</Button>
							</Stack>
						</Box>
					</Stack>
				)}
				{tab === 'settings' && (
					<Stack spacing={2}>
						<TextField label="Имя" defaultValue={user.name} disabled fullWidth />
						<TextField label="Email" defaultValue={user.email} disabled fullWidth />
					</Stack>
				)}
			</DialogContent>
		</Dialog>
	);
}





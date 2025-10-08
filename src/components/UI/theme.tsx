import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import React from 'react';
import { useTheme as useLocalTheme } from '../Problems/ThemeContext';

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
	const { theme } = useLocalTheme();
	const muiTheme = React.useMemo(() => createTheme({
		palette: { mode: theme === 'dark' ? 'dark' : 'light' },
		shape: { borderRadius: 10 },
		typography: { fontFamily: 'Roboto, Inter, system-ui, -apple-system, Segoe UI, Arial, sans-serif' },
	}), [theme]);
	return (
		<ThemeProvider theme={muiTheme}>
			<CssBaseline />
			{children}
		</ThemeProvider>
	);
}






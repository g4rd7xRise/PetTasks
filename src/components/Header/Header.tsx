// replaced image logos with animated logo component
import { useState } from "react";
import { useTheme } from "../Problems/ThemeContext";
import { useAuth } from "../Auth/userStore";
import { styled } from "styled-components";
import IconButton from '@mui/material/IconButton';
import AvatarMui from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import ProfileDialog from '../Auth/ProfileDialog';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import FrontendDialog from './FrontendDialog';
import Tooltip from '@mui/material/Tooltip';
import AppsIcon from '@mui/icons-material/Apps';
import Logo from './Logo';
// import "./Header.css";

const HeaderContainer = styled.header`
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid var(--header-border, #2a2f3a);
  background: var(--header-bg, #121621f0);
  color: var(--header-fg, #e6e6e6);
  backdrop-filter: blur(8px);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 700;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
`;

const UserButton = styled(Button)``;

const Dropdown = styled.div`
  position: absolute;
  right: 0;
  top: 44px;
  border: 1px solid var(--card-border);
  background: var(--panel-bg);
  border-radius: 10px;
  overflow: hidden;
  min-width: 200px;
  z-index: 100;
`;

interface HeaderProps {
  tabsActive?: string;
  onTabsChange?: (tab: string) => void;
  showTabs?: boolean;
}

export default function Header({ tabsActive, onTabsChange, showTabs }: HeaderProps) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [feOpen, setFeOpen] = useState(false);

  // removed time updater

  return (
    <header>
      <HeaderContainer>
        <Brand>
          <Logo />
        </Brand>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
          {showTabs && (
            <Tabs value={tabsActive} onChange={(_, v) => onTabsChange && onTabsChange(v)}
                  sx={{ minHeight: 44,
                       '& .MuiTabs-indicator': { height: 3, borderRadius: 2 },
                       '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                       '& .MuiTab-root.Mui-selected': { color: '#6ea8fe' } }}>
              <Tab value="problems-home" label="Главная" />
              <Tab value="problems" label="Задачи" />
              <Tab value="roadmap" label="RoadMap" />
            </Tabs>
          )}
        </div>
        <Actions>
          {user && (
            <Tooltip title="Front‑End">
              <IconButton size="small" onClick={() => setFeOpen(true)} aria-label="front-end">
                <AppsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {user ? (
            <>
              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small">
                <AvatarMui alt="avatar" src={user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3fb950&color=0a0a0a`} sx={{ width: 30, height: 30 }} />
              </IconButton>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={() => { setAnchorEl(null); setProfileOpen(true); }}>Профиль</MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); toggle(); }}>Переключить тему</MenuItem>
                <MenuItem onClick={() => { setAnchorEl(null); logout(); }} sx={{ color: '#f85149' }}>Выйти</MenuItem>
              </Menu>
            </>
          ) : (
            <Button variant="contained" onClick={() => (window.location.hash = 'auth')}>Войти</Button>
          )}
        </Actions>
      </HeaderContainer>
      <ProfileDialog open={profileOpen} onClose={() => setProfileOpen(false)} />
      <FrontendDialog open={feOpen} onClose={() => setFeOpen(false)} />
    </header>
  );
}

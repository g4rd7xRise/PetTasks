import Header from "./components/Header/Header.tsx";
import TabsSection from "./components/TabsSection.tsx";
import { useEffect, useState } from "react";
import ProblemsPage from './components/Problems/ProblemsPage.tsx';
import HomePage from './components/Problems/HomePage.tsx';
import { GITHUB_PROBLEMS_RAW_URL } from './components/Problems/config.ts';
import AuthPage from './components/Auth/AuthPage.tsx';
import ProfilePage from './components/Auth/ProfilePage.tsx';
import { AuthProvider, useAuth } from './components/Auth/userStore.tsx';
import LandingPage from './components/Auth/LandingPage.tsx';
import AdminPage from './components/Problems/AdminPage.tsx';
import Container from '@mui/material/Container';


function AppShell() {
  const [tab, setTab] = useState("problems-home");
  const [hash, setHash] = useState<string>(() => window.location.hash.replace(/^#/, ''));
  const { user } = useAuth();

  useEffect(() => {
    const handler = () => setHash(window.location.hash.replace(/^#/, ''));
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);


  return (
    <>
      <Header showTabs={!!user && hash !== 'auth'} tabsActive={tab} onTabsChange={(current) => setTab(current)} />

      <main>
        {/* Tabs moved into Header */}

        {hash === 'auth' && (
          <>
            <AuthPage />
          </>
        )}

        {!user && hash !== 'auth' && (
          <LandingPage />
        )}

        {hash === 'admin' && user && (
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
            <AdminPage />
          </Container>
        )}

        {tab === 'problems-home' && hash !== 'auth' && user && hash !== 'admin' && (
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
            <HomePage githubRawUrl={GITHUB_PROBLEMS_RAW_URL} />
          </Container>
        )}

        {tab === 'problems' && hash !== 'auth' && user && hash !== 'admin' && (
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
            <ProblemsPage githubRawUrl={GITHUB_PROBLEMS_RAW_URL} />
          </Container>
        )}
      </main>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

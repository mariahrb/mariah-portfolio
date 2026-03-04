import { useState, useCallback, useEffect } from 'react';
import { Landing } from './ui/Landing';
import { GameView } from './ui/GameView';
import { PageOverlay } from './ui/PageOverlay';

export type AppView = 'landing' | 'game';
export type PageKey = 'home' | 'devlab' | 'studio' | 'innovation' | 'library' | 'townhall' | null;
export type PageSource = 'land' | 'game';

const PAGE_TO_PATH: Record<Exclude<PageKey, null>, string> = {
  home: '/about',
  devlab: '/projects',
  studio: '/portfolio',
  innovation: '/leadership',
  library: '/resume',
  townhall: '/contact',
};

const PATH_TO_PAGE: Record<string, Exclude<PageKey, null>> = {
  '/about': 'home',
  '/projects': 'devlab',
  '/portfolio': 'studio',
  '/leadership': 'innovation',
  '/resume': 'library',
  '/contact': 'townhall',
};

const normalizePath = (pathname: string): string => {
  if (!pathname) return '/';
  const trimmed = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
  return trimmed.toLowerCase();
};

export default function App() {
  const [view, setView]           = useState<AppView>('landing');
  const [pageKey, setPageKey]     = useState<PageKey>(null);
  const [pageSource, setPageSource] = useState<PageSource>('land');
  const [splashing, setSplashing] = useState(false);

  // Splash curtain transition helper
  const splash = useCallback((cb: () => void) => {
    setSplashing(true);
    setTimeout(() => { cb(); setSplashing(false); }, 480);
  }, []);

  const enterGame = useCallback(() => {
    splash(() => {
      setView('game');
      setPageKey(null);
      window.history.pushState({}, '', '/game');
    });
  }, [splash]);

  const exitGame = useCallback(() => {
    splash(() => {
      setView('landing');
      setPageKey(null);
      setPageSource('land');
      window.history.pushState({}, '', '/');
    });
  }, [splash]);

  const openPage = useCallback((key: PageKey, source: PageSource) => {
    setPageSource(source);
    setPageKey(key);
    if (key) {
      window.history.pushState({}, '', PAGE_TO_PATH[key]);
    } else {
      window.history.pushState({}, '', source === 'game' ? '/game' : '/');
    }
  }, []);

  const closePage = useCallback(() => {
    setPageKey(null);
    window.history.pushState({}, '', pageSource === 'game' ? '/game' : '/');
  }, [pageSource]);

  // Sync URL -> app state on first load and browser back/forward.
  useEffect(() => {
    const applyPath = () => {
      const path = normalizePath(window.location.pathname);
      if (path === '/game') {
        setView('game');
        setPageKey(null);
        setPageSource('game');
        return;
      }
      const mappedPage = PATH_TO_PAGE[path];
      setView('landing');
      setPageSource('land');
      setPageKey(mappedPage ?? null);
    };

    applyPath();
    const onPopState = () => applyPath();
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return (
    <>
      {/* Splash curtain */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 500,
          background: '#0e0e1c',
          pointerEvents: splashing ? 'all' : 'none',
          opacity: splashing ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Landing screen (Phaser canvas + UI overlay) */}
      {view === 'landing' && (
        <Landing
          onEnterGame={enterGame}
          onOpenPage={(key) => openPage(key, 'land')}
        />
      )}

      {/* Game canvas */}
      {view === 'game' && (
        <GameView
          onOpenPage={(key) => openPage(key, 'game')}
          onExit={exitGame}
        />
      )}

      {/* Page overlay — sits above both */}
      {pageKey && (
        <PageOverlay
          pageKey={pageKey}
          source={pageSource}
          onClose={closePage}
          onNavigate={(key) => openPage(key, pageSource)}
        />
      )}
    </>
  );
}

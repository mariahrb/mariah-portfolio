import { useState, useCallback } from 'react';
import { Landing } from './ui/Landing';
import { GameView } from './ui/GameView';
import { PageOverlay } from './ui/PageOverlay';

export type AppView = 'landing' | 'game';
export type PageKey = 'home' | 'devlab' | 'studio' | 'innovation' | 'library' | 'townhall' | null;
export type PageSource = 'land' | 'game';

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
    splash(() => setView('game'));
  }, [splash]);

  const exitGame = useCallback(() => {
    splash(() => { setView('landing'); setPageKey(null); });
  }, [splash]);

  const openPage = useCallback((key: PageKey, source: PageSource) => {
    setPageSource(source);
    setPageKey(key);
  }, []);

  const closePage = useCallback(() => {
    setPageKey(null);
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

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './auth/AuthContext';
import { GameProvider } from './games/GameContext';
import { LanguageProvider } from './i18n/LanguageContext';
import { routerBasename } from './lib/site';
import { App } from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <GameProvider>
          <BrowserRouter basename={routerBasename()}>
            <App />
          </BrowserRouter>
        </GameProvider>
      </AuthProvider>
    </LanguageProvider>
  </StrictMode>,
);

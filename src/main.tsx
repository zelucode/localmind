import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import {ProviderDataProvider} from './lib/ProviderDataContext';
import {installGlobalErrorLogging, logInfo} from './lib/errorLog';
import './index.css';

installGlobalErrorLogging();
logInfo('ui', 'Interface started');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ProviderDataProvider>
        <App />
      </ProviderDataProvider>
    </ErrorBoundary>
  </StrictMode>,
);

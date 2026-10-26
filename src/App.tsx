import React from 'react';
import { TraceProvider } from './context/TraceContext';
import { TraceLoader } from './components/TraceLoader/TraceLoader';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { DetailsPanel } from './components/DetailsPanel/DetailsPanel';
import './App.scss';

const App: React.FC = () => {
  return (
    <TraceProvider>
      <div className="app">
        <header className="app__header">
          <h1>Decision Execution Trace Explorer</h1>
        </header>

        <div className="app__loader">
          <TraceLoader />
        </div>

        <div className="app__content">
          <div className="app__column app__column--left">
            <LeftPanel />
          </div>
          <div className="app__column app__column--right">
            <DetailsPanel />
          </div>
        </div>
      </div>
    </TraceProvider>
  );
};

export default App;

// Made with Bob

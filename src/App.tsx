import React from 'react';
import { Layer, Tile } from '@carbon/react';
import { DocumentBlank } from '@carbon/icons-react';
import { TraceProvider, useTrace } from './context/TraceContext';
import { TraceLoader } from './components/TraceLoader/TraceLoader';
import { LeftPanel } from './components/LeftPanel/LeftPanel';
import { DetailsPanel } from './components/DetailsPanel/DetailsPanel';
import './App.scss';

const AppContent: React.FC = () => {
  const { tabs } = useTrace();

  return (
    <div className="app">
      <header className="app__header">
        <h1>Decision Execution Trace Explorer</h1>
      </header>

      <div className="app__loader">
        <TraceLoader />
      </div>

      <div className="app__content">
        {tabs.length > 0 ? (
          <>
            <div className="app__column app__column--left">
              <LeftPanel />
            </div>
            <div className="app__column app__column--right">
              <DetailsPanel />
            </div>
          </>
        ) : (
          <div className="app__empty-state">
            <Layer>
              <Tile className="app__empty-tile">
                <DocumentBlank size={48} />
                <h2>No Trace Loaded</h2>
                <p>Upload a JSON trace file or select an example from the menu above to start exploring.</p>
              </Tile>
            </Layer>
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <TraceProvider>
      <AppContent />
    </TraceProvider>
  );
};

export default App;

// Made with Bob

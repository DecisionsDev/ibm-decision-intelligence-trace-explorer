import React from 'react';
import JsonView from '@uiw/react-json-view';
import { useTrace } from '../../context/TraceContext';
import { Information } from '@carbon/icons-react';
import './ConfigurationView.scss';

export const ConfigurationView: React.FC = () => {
  const { traceData } = useTrace();

  if (!traceData?.configuration) {
    return (
      <div className="configuration-view configuration-view--empty">
        <Information size={32} />
        <p>No configuration data available</p>
      </div>
    );
  }

  return (
    <div className="configuration-view">
      <div className="configuration-view__header">
        <h3>Trace Configuration</h3>
      </div>
      <div className="configuration-view__content">
        <JsonView displayDataTypes={false} value={traceData.configuration} collapsed={1} />
      </div>
    </div>
  );
};

// Made with Bob
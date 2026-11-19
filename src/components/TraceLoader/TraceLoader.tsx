import React, { useState, useCallback, useRef } from 'react';
import {
  Button,
  InlineLoading,
  InlineNotification,
  MenuButton,
  MenuItem,
  Modal,
} from '@carbon/react';
import { Upload, DocumentBlank, Settings, Close } from '@carbon/icons-react';
import JsonView from '@uiw/react-json-view';
import { useTrace } from '../../context/TraceContext';
import { validateTraceData, parseTraceData } from '../../utils/traceUtils';
import './TraceLoader.scss';

const EXAMPLE_TRACES = [
  { value: 'sample-loan-approval-mrdoeloan.json', label: 'Loan Validation Sample, MrDoe Loan' },
  { value: 'sample-loan-approval-bankrupcy.json', label: 'Loan Validation Sample, bankrupcy' },
  { value: 'sample-loan-approval-nossn.json', label: 'Loan Validation Sample, no SSN' },
  { value: 'sample-retention-offer-John.json', label: 'Retention offer Sample, John' },
  { value: 'sample-retention-offer-Peter.json', label: 'Retention offer Sample, Peter' },
  { value: 'sample-transparentML-retention-offer-John.json', label: 'Transparent ML Retention offer Sample, John' },
  { value: 'trace_composed_approval.json', label: 'Composed Loan Validation' },
  { value: 'trace_task_model_many_messages_updated_engine.json', label: 'Task Model with Messages' },
  { value: 'trace_dm.json', label: 'Decision Model - Basic' },
  { value: 'trace_dm2.json', label: 'Decision Model - With Messages' },
  { value: 'trace_dm_stop.json', label: 'Decision Model - With Stop' },
  { value: 'trace_dm_stop_objects.json', label: 'Decision Model - Stop with Objects' },
  { value: 'trace_task_model_stop.json', label: 'Task Model - With Stop' },
  { value: 'multipleBigTask_NoOptim.json', label: 'Multiple big task - no optimization' },
  { value: 'multipleBigTask_Optim.json', label: 'Multiple big task - optimization' },
  { value: "monkey.json", label: 'Engine test - Monkey eats bananas - Rete only'},
  { value: '2026/trace_flat_loanvalidation_Approved.json', label: '[2026] Loan Validation - Approved (flat)' },
  { value: '2026/trace_flat_loanvalidation_Bankruptcy.json', label: '[2026] Loan Validation - Bankruptcy (flat)' },
];

export const TraceLoader: React.FC = () => {
  const { loadTrace, traceData, tabs, activeTabId, setActiveTabId, closeTab } = useTrace();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      
      if (!file) return;

      setLoading(true);
      setError(null);

      try {
        const text = await file.text();
        const jsonData = JSON.parse(text);

        const raw = jsonData.executionTrace ? jsonData.executionTrace : jsonData;

        if (!validateTraceData(raw)) {
          throw new Error('Invalid trace data format');
        }

        loadTrace(parseTraceData(raw), file.name);
      } catch (err) {
        console.error('Error loading file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load trace file');
      } finally {
        setLoading(false);
        // Reset input so same file can be selected again
        event.target.value = '';
      }
    },
    [loadTrace]
  );

  const handleExampleSelect = useCallback(
    async (filename: string, label: string) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/examples/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to load example: ${response.statusText}`);
        }

        const jsonData = await response.json();

        const raw = jsonData.executionTrace ? jsonData.executionTrace : jsonData;

        if (!validateTraceData(raw)) {
          throw new Error('Invalid trace data format');
        }

        loadTrace(parseTraceData(raw), label);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load example trace');
      } finally {
        setLoading(false);
      }
    },
    [loadTrace]
  );

  const handleClearError = useCallback(() => {
    setError(null);
  }, []);

  const handleOpenConfig = useCallback(() => {
    setShowConfigModal(true);
  }, []);

  const handleCloseConfig = useCallback(() => {
    setShowConfigModal(false);
  }, []);

  return (
    <div className="trace-loader">
      <div className="trace-loader__controls">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* Trace tabs */}
        <div className="trace-loader__tabs" role="tablist" aria-label="Open traces">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                role="tab"
                tabIndex={0}
                aria-selected={isActive}
                className={`trace-loader__tab ${isActive ? 'trace-loader__tab--active' : ''}`}
                onClick={() => setActiveTabId(tab.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveTabId(tab.id);
                  }
                }}
                title={tab.title}
              >
                <DocumentBlank size={16} className="trace-loader__tab-icon" />
                <span className="trace-loader__tab-title">{tab.title}</span>
                {isActive && (
                  <button
                    type="button"
                    className="trace-loader__tab-action"
                    title="View configuration"
                    aria-label="View configuration"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenConfig();
                    }}
                  >
                    <Settings size={14} />
                  </button>
                )}
                <button
                  type="button"
                  className="trace-loader__tab-action trace-loader__tab-action--close"
                  title={`Close ${tab.title}`}
                  aria-label={`Close ${tab.title}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                >
                  <Close size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {loading && (
          <InlineLoading description="Loading trace…" status="active" className="trace-loader__loading" />
        )}

        <div className="trace-loader__spacer" />

        <Button
          kind="primary"
          size="sm"
          renderIcon={Upload}
          onClick={handleUploadClick}
          disabled={loading}
        >
          Upload Trace
        </Button>

        <MenuButton
          label="Load Example"
          kind="tertiary"
          size="sm"
          disabled={loading}
          className="trace-loader__menu-button"
        >
          {EXAMPLE_TRACES.map((example) => (
            <MenuItem
              key={example.value}
              label={example.label}
              onClick={() => handleExampleSelect(example.value, example.label)}
            />
          ))}
        </MenuButton>
      </div>

      {error && (
        <InlineNotification
          kind="error"
          title="Error"
          subtitle={error}
          onCloseButtonClick={handleClearError}
          lowContrast
        />
      )}

      <Modal
        open={showConfigModal}
        onRequestClose={handleCloseConfig}
        modalHeading="Trace Configuration"
        passiveModal
        size="lg"
      >
        <div className="trace-loader__config-modal">
          {traceData?.configuration ? (
            <JsonView displayDataTypes={false} value={traceData.configuration} collapsed={1} />
          ) : (
            <p>No configuration data available</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

// Made with Bob

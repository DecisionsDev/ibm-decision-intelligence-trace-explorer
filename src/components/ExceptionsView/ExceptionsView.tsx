import React from 'react';
import { StructuredListWrapper, StructuredListHead, StructuredListRow, StructuredListCell, StructuredListBody, Tag } from '@carbon/react';
import { WarningAlt } from '@carbon/icons-react';
import { useTrace } from '../../context/TraceContext';
import { getRecordLabel, getIconKind } from '../../utils/traceUtils';
import { iconByKind } from '../../utils/IconsByKind';
import './ExceptionsView.scss';

export const ExceptionsView: React.FC = () => {
  const { rootScopedExceptions, navigateToRecord, selectedRecordIndex, recordIndexMap } = useTrace();

  const handleExceptionClick = (recordIndex: string) => {
    navigateToRecord(recordIndex);
  };

  if (rootScopedExceptions.length === 0) {
    return (
      <div className="exceptions-view exceptions-view--empty">
        <WarningAlt size={32} />
        <p>No exceptions in this trace</p>
      </div>
    );
  }

  return (
    <div className="exceptions-view">
      <div className="exceptions-view__header">
        <h3>Exceptions Raised</h3>
        <Tag type="red" size="sm">
          {rootScopedExceptions.length} {rootScopedExceptions.length === 1 ? 'exception' : 'exceptions'}
        </Tag>
      </div>

      <StructuredListWrapper className="exceptions-view__list">
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Origin</StructuredListCell>
            <StructuredListCell head>Exception Details</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {rootScopedExceptions.map((exception, index) => {
            const record = recordIndexMap.get(exception.recordIndex);
            const iconKind = record ? getIconKind(record) : 'GENERIC';
            const icon = iconByKind(exception.recordIndex, iconKind);
            const label = record ? getRecordLabel(record) : exception.recordIndex;
            
            return (
              <StructuredListRow
                key={`${exception.recordIndex}-${index}`}
                className={`exceptions-view__row ${
                  selectedRecordIndex === exception.recordIndex ? 'exceptions-view__row--selected' : ''
                }`}
              >
                <StructuredListCell className="exceptions-view__cell--origin"
                
                onClick={() => handleExceptionClick(exception.recordIndex)}>
                  <span className="exceptions-view__origin-icon">{icon}</span>
                  <span className="exceptions-view__origin-label">{label}</span>
                </StructuredListCell>
                <StructuredListCell className="exceptions-view__cell--details">
                  {exception.exceptionType && (
                    <div className="exception-type">
                      <strong>{exception.exceptionType}</strong>
                    </div>
                  )}
                  {exception.message && (
                    <div className="exception-message">{exception.message}</div>
                  )}
                  {exception.stackTrace && (
                    <details className="exception-stack">
                      <summary>Stack Trace</summary>
                      <pre>{exception.stackTrace}</pre>
                    </details>
                  )}
                </StructuredListCell>
              </StructuredListRow>
            );
          })}
        </StructuredListBody>
      </StructuredListWrapper>
    </div>
  );
};

// Made with Bob

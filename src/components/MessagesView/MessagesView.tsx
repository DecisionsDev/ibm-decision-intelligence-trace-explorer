import React from 'react';
import { StructuredListWrapper, StructuredListHead, StructuredListRow, StructuredListCell, StructuredListBody, Tag } from '@carbon/react';
import { Information } from '@carbon/icons-react';
import { useTrace } from '../../context/TraceContext';
import { getRecordLabel, getIconKind } from '../../utils/traceUtils';
import { iconByKind } from '../../utils/IconsByKind';
import './MessagesView.scss';

export const MessagesView: React.FC = () => {
  const { rootScopedMessages, navigateToRecord, selectedRecordIndex, recordIndexMap } = useTrace();

  const handleMessageClick = (recordIndex: string) => {
    navigateToRecord(recordIndex);
  };

  // Sort messages by record index (hierarchical sorting like "1.2.3")
  const sortedMessages = React.useMemo(() => {
    return [...rootScopedMessages].sort((a, b) => {
      const aParts = a.recordIndex.split('.').map(Number);
      const bParts = b.recordIndex.split('.').map(Number);
      
      const maxLength = Math.max(aParts.length, bParts.length);
      
      for (let i = 0; i < maxLength; i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        
        if (aVal !== bVal) {
          return aVal - bVal;
        }
      }
      
      return 0;
    });
  }, [rootScopedMessages]);

  if (rootScopedMessages.length === 0) {
    return (
      <div className="messages-view messages-view--empty">
        <Information size={32} />
        <p>No messages in this trace</p>
      </div>
    );
  }

  return (
    <div className="messages-view">
      <div className="messages-view__header">
        <h3>Printed Messages</h3>
        <Tag type="blue" size="sm">
          {rootScopedMessages.length} {rootScopedMessages.length === 1 ? 'message' : 'messages'}
        </Tag>
      </div>

      <StructuredListWrapper className="messages-view__list">
        <StructuredListHead>
          <StructuredListRow head>
            <StructuredListCell head>Origin</StructuredListCell>
            <StructuredListCell head>Message</StructuredListCell>
          </StructuredListRow>
        </StructuredListHead>
        <StructuredListBody>
          {sortedMessages.map((message, index) => {
            const record = recordIndexMap.get(message.recordIndex);
            const iconKind = record ? getIconKind(record) : 'GENERIC';
            const icon = iconByKind(message.recordIndex, iconKind);
            const label = record ? getRecordLabel(record) : message.recordIndex;
            
            return (
              <StructuredListRow
                key={`${message.recordIndex}-${index}`}
                className={`messages-view__row ${
                  selectedRecordIndex === message.recordIndex ? 'messages-view__row--selected' : ''
                }`}
              >
                <StructuredListCell className="messages-view__cell--origin"
                
                onClick={() => handleMessageClick(message.recordIndex)}>
                  <span className="messages-view__origin-icon">{icon}</span>
                  <span className="messages-view__origin-label">{label}</span>
                </StructuredListCell>
                <StructuredListCell className="messages-view__cell--message">
                  {message.message}
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

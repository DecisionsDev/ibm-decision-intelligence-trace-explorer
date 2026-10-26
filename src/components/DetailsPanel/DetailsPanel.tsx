import React, { useState, useMemo } from 'react';
import { Breadcrumb, BreadcrumbItem, Tabs, TabList, Tab, TabPanels, TabPanel, Accordion, AccordionItem, Tag, Layer, Tile, StructuredListWrapper, StructuredListHead, StructuredListRow, StructuredListCell, StructuredListBody, DataTable, Table, TableHead, TableRow, TableHeader, TableBody, TableCell } from '@carbon/react';
import { Checkmark, Close, DocumentBlank } from '@carbon/icons-react';
import JsonView from '@uiw/react-json-view';
import { useTrace } from '../../context/TraceContext';
import { getRecordLabel, buildPathToRecord, getIconKind, getRecordDescription, getRecordKind, buildJsonMergePatch } from '../../utils/traceUtils';
import { isRuleBasedEngine, hasValidRules, getRuleEngineStats, hasValidTasks, getTasks } from '../../types/trace.types';
import { iconByKind } from '../../utils/IconsByKind';
import './DetailsPanel.scss';


export const DetailsPanel: React.FC = () => {
  const { selectedRecord, filteredMessages, filteredExceptions, navigateToRecord, recordIndexMap } = useTrace();

  // Sort messages by record index (hierarchical sorting like "1.2.3")
  const sortedFilteredMessages = React.useMemo(() => {
    return [...filteredMessages].sort((a, b) => {
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
  }, [filteredMessages]);

  const recordType = selectedRecord?.recordType;
  const recordIndex = selectedRecord?.recordIndex ?? '';
  const recordKind = selectedRecord ? getRecordKind(selectedRecord) : '';
  const description = selectedRecord ? getRecordDescription(selectedRecord) : '';
  const label = selectedRecord ? getRecordLabel(selectedRecord) : '';
  const path = selectedRecord ? buildPathToRecord(recordIndex) : [];

  const diffPatch = useMemo(() => {
    if (!selectedRecord || !(recordType == 'Rule' || recordType == 'DecisionTable')) {
      return null;
    }

    if (selectedRecord.boundObjectsDiff !== undefined)
      return selectedRecord.boundObjectsDiff;

    return buildJsonMergePatch(selectedRecord.boundObjectsAtStart, selectedRecord.boundObjectsAtEnd);
  }, [selectedRecord, recordType]);

  const hasDiffTab = Boolean(
    selectedRecord &&
    (recordType === 'Rule' || recordType === 'DecisionTable') &&
    ((selectedRecord.boundObjectsAtStart !== undefined && selectedRecord.boundObjectsAtEnd !== undefined) ||
    selectedRecord.boundObjectsDiff !== undefined)
  );

  if (!selectedRecord) {
    return (
      <div className="details-panel details-panel--empty">
        <Layer>
          <Tile className="details-panel__empty-tile">
            <DocumentBlank size={32} />
            <p>Select a record from the execution tree to view details</p>
          </Tile>
        </Layer>
      </div>
    );
  }

  return (
    <div className="details-panel">
      {/* Header with breadcrumb */}
      <div className="details-panel__header">
        <Breadcrumb className="details-panel__breadcrumb" noTrailingSlash>
          {path.map((pathIndex, index) => {
            const pathRecord = recordIndexMap.get(pathIndex);
            const iconKind = pathRecord ? getIconKind(pathRecord) : 'GENERIC';
            const icon = iconByKind(pathIndex, iconKind);
            const itemLabel = pathRecord ? getRecordLabel(pathRecord) : `#${pathIndex}`;
            const isActive = pathIndex === recordIndex;
            const isFirst = index === 0;
            const isLast = index === path.length - 1;

            // Show first, last, and items near the active one for long paths
            const shouldShow = path.length <= 4 || isFirst || isLast ||
                              Math.abs(index - path.indexOf(recordIndex)) <= 1;

            if (!shouldShow) return null;

            return (
              <BreadcrumbItem
                key={`breadcrumb-${pathIndex}-${index}`}
                isCurrentPage={isActive}
                onClick={isActive ? undefined : () => navigateToRecord(pathIndex)}
                title={itemLabel}
              >
                <span className="breadcrumb-icon" aria-hidden="true">{icon}</span>
                <span className="breadcrumb-text">{itemLabel}</span>
              </BreadcrumbItem>
            );
          })}
        </Breadcrumb>
        <div className="details-panel__title">
          <h2>{label}</h2>
          <Tag type="blue" size="sm">
            {recordKind}
          </Tag>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="details-panel__content">
        <Tabs>
          <TabList aria-label="Record details tabs" contained>
            <Tab>Overview</Tab>
            <Tab>Input</Tab>
            <Tab>Output</Tab>
            {hasDiffTab && <Tab>Diff</Tab>}
            <Tab>Raw Trace</Tab>
          </TabList>
          <TabPanels>
            {/* Overview Tab */}
            <TabPanel>
              <div className="details-section">
                <h3>{recordKind} {label}</h3>
                <StructuredListWrapper className="details-list" isCondensed>
                  <StructuredListBody>
                    <StructuredListRow>
                      <StructuredListCell className="details-list__label">Record index</StructuredListCell>
                      <StructuredListCell><code>{recordIndex}</code></StructuredListCell>
                    </StructuredListRow>

                    {selectedRecord.identifier && (
                      <StructuredListRow>
                        <StructuredListCell className="details-list__label">Identifier</StructuredListCell>
                        <StructuredListCell>{selectedRecord.identifier}</StructuredListCell>
                      </StructuredListRow>
                    )}

                    {selectedRecord.comments && (
                      <StructuredListRow>
                        <StructuredListCell className="details-list__label">Comments</StructuredListCell>
                        <StructuredListCell>{selectedRecord.comments}</StructuredListCell>
                      </StructuredListRow>
                    )}

                    {selectedRecord.executionDuration != null && (
                      <StructuredListRow>
                        <StructuredListCell className="details-list__label">Execution duration</StructuredListCell>
                        <StructuredListCell>{selectedRecord.executionDuration} ms</StructuredListCell>
                      </StructuredListRow>
                    )}

                    {selectedRecord.hitPolicy && (
                      <StructuredListRow>
                        <StructuredListCell className="details-list__label">Hit policy</StructuredListCell>
                        <StructuredListCell>{selectedRecord.hitPolicy}</StructuredListCell>
                      </StructuredListRow>
                    )}

                    {selectedRecord.actionName && (
                      <StructuredListRow>
                        <StructuredListCell className="details-list__label">Action name</StructuredListCell>
                        <StructuredListCell>{selectedRecord.actionName}</StructuredListCell>
                      </StructuredListRow>
                    )}

                    {selectedRecord.actionIndex && (
                      <StructuredListRow>
                        <StructuredListCell className="details-list__label">Action index</StructuredListCell>
                        <StructuredListCell>{selectedRecord.actionIndex}</StructuredListCell>
                      </StructuredListRow>
                    )}

                    {selectedRecord.stopMessage && (
                      <StructuredListRow>
                        <StructuredListCell className="details-list__label">Stop message</StructuredListCell>
                        <StructuredListCell className="stop-message">{selectedRecord.stopMessage}</StructuredListCell>
                      </StructuredListRow>
                    )}
                  </StructuredListBody>
                </StructuredListWrapper>
              </div>

              {/* Rules List for rule-based engines */}
              {recordType && isRuleBasedEngine(recordType) && hasValidRules(selectedRecord) && (() => {
                const stats = getRuleEngineStats(selectedRecord);
                if (!stats) return null;

                const rulesData = selectedRecord.allRules!.map((ruleName: string, index: number) => {
                  const isSelected = selectedRecord.selectedRules == undefined || selectedRecord.selectedRules?.includes(ruleName);
                  const isExecuted = !selectedRecord.nonExecutedRules?.includes(ruleName);
                  return {
                    id: `${index}`,
                    name: ruleName,
                    status: isSelected ? isExecuted ? 'Executed' : 'Not executed' : 'Not selected',
                    executed: isExecuted,
                  };
                });

                const headers = [
                  { key: 'name', header: 'Rule Name' },
                  { key: 'status', header: 'Status' },
                ];
                
                return (
                  <div className="details-section">
                    <h3>Rules ({stats.totalRules && "total number: "+stats.totalRules } {stats.selectedRules && "selected: "+ stats.selectedRules} {stats.executedRules && "executed: "+stats.executedRules})</h3>
                    <div className="rules-table-container">
                      <DataTable rows={rulesData} headers={headers} isSortable>
                        {({ rows, headers, getHeaderProps, getTableProps, getRowProps }: any) => (
                          <Table {...getTableProps()} size="sm" className="rules-table">
                            <TableHead>
                              <TableRow>
                                {headers.map((header: any) => (
                                  <TableHeader {...getHeaderProps({ header })} isSortable>
                                    {header.header}
                                  </TableHeader>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows.map((row: any) => (
                                <TableRow {...getRowProps({ row })} className={row.cells[1].value === 'Executed' ? 'rule-row--executed' : 'rule-row--not-executed'}>
                                  {row.cells.map((cell: any) => {
                                    if (cell.info.header === 'status') {
                                      const isExecuted = cell.value === 'Executed';
                                      return (
                                        <TableCell key={cell.id} className="rule-cell--status">
                                          {isExecuted ? (
                                            <span className="rule-status-badge rule-status-badge--executed">
                                              <Checkmark size={16} />
                                              {cell.value}
                                            </span>
                                          ) : (
                                            <span className="rule-status-badge rule-status-badge--not-executed">
                                              <Close size={16} />
                                              {cell.value}
                                            </span>
                                          )}
                                        </TableCell>
                                      );
                                    }
                                    return <TableCell key={cell.id}>{cell.value}</TableCell>;
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </DataTable>
                    </div>
                  </div>
                );
              })()}

              {/* Task list for ruleflow engines */}
              {recordType === 'RuleFlow' && hasValidTasks(selectedRecord) && (() => {
                const stats = getTasks(selectedRecord);
                if (!stats) return null;
                
                const tasksData = selectedRecord.allTasks!.map((taskName: string, index: number) => {
                  const isExecuted = !selectedRecord.notExecutedTasks?.includes(taskName);
                  return {
                    id: `${index}`,
                    name: taskName,
                    status: isExecuted ? 'Executed' : 'Not executed',
                    executed: isExecuted,
                  };
                });

                const headers = [
                  { key: 'name', header: 'Task Name' },
                  { key: 'status', header: 'Status' },
                ];
                
                return (
                  <div className="details-section">
                    <h3>Tasks ({tasksData.filter((t: { executed: boolean }) => t.executed).length}/{tasksData.length} executed)</h3>
                    <div className="rules-table-container">
                      <DataTable rows={tasksData} headers={headers} isSortable>
                        {({ rows, headers, getHeaderProps, getTableProps, getRowProps }: any) => (
                          <Table {...getTableProps()} size="sm" className="rules-table">
                            <TableHead>
                              <TableRow>
                                {headers.map((header: any) => (
                                  <TableHeader {...getHeaderProps({ header })} isSortable>
                                    {header.header}
                                  </TableHeader>
                                ))}
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {rows.map((row: any) => (
                                <TableRow {...getRowProps({ row })} className={row.cells[1].value === 'Executed' ? 'rule-row--executed' : 'rule-row--not-executed'}>
                                  {row.cells.map((cell: any) => {
                                    if (cell.info.header === 'status') {
                                      const isExecuted = cell.value === 'Executed';
                                      return (
                                        <TableCell key={cell.id} className="rule-cell--status">
                                          {isExecuted ? (
                                            <span className="rule-status-badge rule-status-badge--executed">
                                              <Checkmark size={16} />
                                              {cell.value}
                                            </span>
                                          ) : (
                                            <span className="rule-status-badge rule-status-badge--not-executed">
                                              <Close size={16} />
                                              {cell.value}
                                            </span>
                                          )}
                                        </TableCell>
                                      );
                                    }
                                    return <TableCell key={cell.id}>{cell.value}</TableCell>;
                                  })}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </DataTable>
                    </div>
                  </div>
                );
              })()}
            </TabPanel>

            {/* Input Tab */}
            <TabPanel>
              <div className="details-section">
                {selectedRecord.input && (
                    <>
                        <h3>Input Parameters</h3>
                        <JsonView displayDataTypes={false} value={selectedRecord.input} collapsed={1} />
                    </>
                )}
                
                {selectedRecord.boundObjectsAtStart && (
                  <>
                    <h3>Bound Objects at Start</h3>
                    <JsonView displayDataTypes={false} value={selectedRecord.boundObjectsAtStart} collapsed={1} />
                  </>
                )}
              </div>
            </TabPanel>

            {/* Output Tab */}
            <TabPanel>
              <div className="details-section">
                
                {selectedRecord.output && (
                  <>
                    <h3>Output Parameters</h3>
                    <JsonView displayDataTypes={false} value={selectedRecord.output} collapsed={1} />
                  </>
                )}
                
                {selectedRecord.boundObjectsAtEnd && (
                  <>
                    <h3>Bound Objects at End</h3>
                    <JsonView displayDataTypes={false} value={selectedRecord.boundObjectsAtEnd} collapsed={1} />
                  </>
                )}
                
                {selectedRecord.defaultValueAfter && (
                  <>
                    <h3>Default Value After</h3>
                    <JsonView displayDataTypes={false} value={selectedRecord.defaultValueAfter} collapsed={1} />
                  </>
                )}
              </div>
            </TabPanel>

            {/* Diff Tab */}
            {hasDiffTab && (
              <TabPanel>
                <div className="details-section">
                  <h3>Diff between bound objects at start and at end</h3>
                  {diffPatch !== null ? (
                    <>
                      <p className="details-panel__hint">
                        Changes in JSON merge patch format
                      </p>
                      <JsonView displayDataTypes={false} value={diffPatch} collapsed={1} />
                    </>
                  ) : (
                    <p className="empty-state">No diff available</p>
                  )}
                </div>
              </TabPanel>
            )}

            {/* Raw Trace Tab */}
            <TabPanel>
              <div className="details-section">
                <h3>Raw Trace Record</h3>
                <JsonView displayDataTypes={false} value={selectedRecord} collapsed={2} />
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>

      {/* Related Messages and Exceptions */}
      <div className="details-panel__related">
        <Accordion>
          <AccordionItem
            title={`Related Messages (${filteredMessages.length})`}
            open={filteredMessages.length > 0}
          >
            {filteredMessages.length > 0 ? (
              <StructuredListWrapper className="related-messages-table">
                <StructuredListHead>
                  <StructuredListRow head>
                    <StructuredListCell head>Origin</StructuredListCell>
                    <StructuredListCell head>Message</StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                  {sortedFilteredMessages.map((msg, index) => {
                    const record = recordIndexMap.get(msg.recordIndex);
                    const iconKind = record ? getIconKind(record) : 'GENERIC';
                    const icon = iconByKind(msg.recordIndex, iconKind);
                    const label = record ? getRecordLabel(record) : msg.recordIndex;
                    
                    return (
                      <StructuredListRow
                        key={`${msg.recordIndex}-${index}`}
                        className="related-messages-row"
                      >
                        <StructuredListCell className="related-messages-cell--origin"
                        
                        onClick={() => navigateToRecord(msg.recordIndex)}>
                          <span className="related-origin-icon">{icon}</span>
                          <span className="related-origin-label">{label}</span>
                        </StructuredListCell>
                        <StructuredListCell className="related-messages-cell--message">
                          {msg.message}
                        </StructuredListCell>
                      </StructuredListRow>
                    );
                  })}
                </StructuredListBody>
              </StructuredListWrapper>
            ) : (
              <p className="empty-state">No messages for this record</p>
            )}
          </AccordionItem>

          <AccordionItem
            title={`Related Exceptions (${filteredExceptions.length})`}
            open={filteredExceptions.length > 0}
          >
            {filteredExceptions.length > 0 ? (
              <StructuredListWrapper className="related-exceptions-table">
                <StructuredListHead>
                  <StructuredListRow head>
                    <StructuredListCell head>Origin</StructuredListCell>
                    <StructuredListCell head>Exception Details</StructuredListCell>
                  </StructuredListRow>
                </StructuredListHead>
                <StructuredListBody>
                  {filteredExceptions.map((exc, index) => {
                    const record = recordIndexMap.get(exc.recordIndex);
                    const iconKind = record ? getIconKind(record) : 'GENERIC';
                    const icon = iconByKind(exc.recordIndex, iconKind);
                    const label = record ? getRecordLabel(record) : exc.recordIndex;
                    
                    return (
                      <StructuredListRow
                        key={`${exc.recordIndex}-${index}`}
                        className="related-exceptions-row"
                      >
                        <StructuredListCell className="related-exceptions-cell--origin"
                        
                        onClick={() => navigateToRecord(exc.recordIndex)}>
                          <span className="related-origin-icon">{icon}</span>
                          <span className="related-origin-label">{label}</span>
                        </StructuredListCell>
                        <StructuredListCell className="related-exceptions-cell--details">
                          {exc.exceptionType && <strong className="exception-type-inline">{exc.exceptionType}</strong>}
                          {exc.message && <span className="exception-message-inline">{exc.message}</span>}
                        </StructuredListCell>
                      </StructuredListRow>
                    );
                  })}
                </StructuredListBody>
              </StructuredListWrapper>
            ) : (
              <p className="empty-state">No exceptions for this record</p>
            )}
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

// Made with Bob

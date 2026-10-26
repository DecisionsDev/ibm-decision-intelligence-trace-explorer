import React, { useMemo } from 'react';
import { Tabs, TabList, Tab, Button } from '@carbon/react';
import { ChevronDown, ChevronRight, Pin, Reset, Flash, Chat } from '@carbon/icons-react';
import { useTrace } from '../../context/TraceContext';
import { ExecutionTreeView } from '../ExecutionTree/ExecutionTreeView';
import { MessagesView } from '../MessagesView/MessagesView';
import { ExceptionsView } from '../ExceptionsView/ExceptionsView';
import { FlameChart } from '../FlameChart/FlameChart';
import { getRecordLabel, getRootRecord } from '../../utils/traceUtils';
import './LeftPanel.scss';

export const LeftPanel: React.FC = () => {
  const {
    traceData,
    activeLeftTab,
    setActiveLeftTab,
    rootScopedMessages,
    rootScopedExceptions,
    expandAll,
    collapseAll,
    selectedRecord,
    customRootRecord,
    isCustomRoot,
    setTreeRoot,
    resetTreeRoot,
    recordIndexMap,
  } = useTrace();

  const handleTabChange = (evt: { selectedIndex: number }) => {
    const tabs: Array<'tree' | 'messages' | 'exceptions' | 'flame'> = ['tree', 'messages', 'exceptions', 'flame'];
    setActiveLeftTab(tabs[evt.selectedIndex]);
  };

  const getSelectedIndex = () => {
    const tabs: Array<'tree' | 'messages' | 'exceptions' | 'flame'> = ['tree', 'messages', 'exceptions', 'flame'];
    return tabs.indexOf(activeLeftTab);
  };

  const anchorPath = useMemo(() => {
    if (!isCustomRoot || !customRootRecord || !traceData) return [];
    const parts = customRootRecord.recordIndex.split('.');
    const segments: { index: string; label: string }[] = [];
    for (let i = 1; i <= parts.length; i++) {
      const idx = parts.slice(0, i).join('.');
      const rec = recordIndexMap.get(idx);
      if (rec) segments.push({ index: idx, label: getRecordLabel(rec) });
    }
    return segments;
  }, [isCustomRoot, customRootRecord, traceData, recordIndexMap]);

  const canSetAnchor = !!(
    traceData &&
    selectedRecord &&
    selectedRecord.recordIndex !== getRootRecord(traceData.records).recordIndex
  );

  return (
    <div className="left-panel">
      {/* Anchor bar */}
      {traceData && (
        <div className="left-panel__anchor-bar">
          <div className="left-panel__anchor-left">
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Pin}
              iconDescription={
                canSetAnchor
                  ? `Set "${getRecordLabel(selectedRecord!)}" as root`
                  : selectedRecord
                  ? 'Cannot anchor the trace root'
                  : 'Select a record to set as anchor'
              }
              hasIconOnly
              onClick={() => canSetAnchor && setTreeRoot(selectedRecord!.recordIndex)}
              disabled={!canSetAnchor}
              tooltipPosition="right"
            />
            {isCustomRoot && customRootRecord && (
              <div className="left-panel__anchor-path">
                {anchorPath.map((seg, i) => (
                  <React.Fragment key={seg.index}>
                    {i > 0 && <span className="left-panel__anchor-sep">›</span>}
                    <span
                      className={
                        i === anchorPath.length - 1
                          ? 'left-panel__anchor-crumb left-panel__anchor-crumb--active'
                          : 'left-panel__anchor-crumb'
                      }
                      title={seg.index}
                    >
                      {seg.label}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
          {isCustomRoot && (
            <Button
              kind="ghost"
              size="sm"
              renderIcon={Reset}
              iconDescription="Reset to trace root"
              hasIconOnly
              onClick={resetTreeRoot}
              tooltipPosition="left"
            />
          )}
        </div>
      )}

      {/* Tab bar — only <TabList> inside <Tabs>, no <TabPanels> */}
      <div className="left-panel__tabbar">
        <Tabs selectedIndex={getSelectedIndex()} onChange={handleTabChange}>
          <TabList aria-label="Trace views" contained>
            <Tab>Execution Tree</Tab>
            <Tab renderIcon={Chat}>
              Messages
              {rootScopedMessages.length > 0 && (
                <span className="tab-badge">{rootScopedMessages.length}</span>
              )}
            </Tab>
            <Tab renderIcon={Flash}>
              Exceptions
              {rootScopedExceptions.length > 0 && (
                <span className="tab-badge tab-badge--error">{rootScopedExceptions.length}</span>
              )}
            </Tab>
            <Tab>Flame Chart</Tab>
          </TabList>
        </Tabs>

        {activeLeftTab === 'tree' && (
          <div className="left-panel__controls">
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ChevronDown}
              iconDescription="Expand all"
              hasIconOnly
              onClick={expandAll}
              tooltipPosition="bottom"
            />
            <Button
              kind="ghost"
              size="sm"
              renderIcon={ChevronRight}
              iconDescription="Collapse all"
              hasIconOnly
              onClick={collapseAll}
              tooltipPosition="bottom"
            />
          </div>
        )}
      </div>

      {/* Tab panels — plain divs, shown/hidden by React directly */}
      <div className="left-panel__panel" hidden={activeLeftTab !== 'tree'}>
        <ExecutionTreeView />
      </div>
      <div className="left-panel__panel" hidden={activeLeftTab !== 'messages'}>
        <MessagesView />
      </div>
      <div className="left-panel__panel" hidden={activeLeftTab !== 'exceptions'}>
        <ExceptionsView />
      </div>
      <div className="left-panel__panel" hidden={activeLeftTab !== 'flame'}>
        <FlameChart />
      </div>
    </div>
  );
};

// Made with Bob

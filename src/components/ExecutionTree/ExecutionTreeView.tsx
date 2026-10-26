import React, { useMemo, useCallback, useState } from 'react';
import { TreeView, TreeNode as CarbonTreeNode, Menu, MenuItem, Tag, Tooltip } from '@carbon/react';
import { Pin, Chat, Flash } from '@carbon/icons-react';
import { useTrace } from '../../context/TraceContext';
import { TraceRecord, isRuleBasedEngine, getRuleEngineStats } from '../../types/trace.types';
import { getRecordLabel, recordHasMessages, recordHasExceptions, getIconKind, getChildren, getRootRecord } from '../../utils/traceUtils';
import { iconByKind } from '../../utils/IconsByKind';
import './ExecutionTreeView.scss';

interface TreeNodeData {
  id: string;
  label: string;
  record: TraceRecord;
  children: TreeNodeData[];
  hasMessages: boolean;
  hasExceptions: boolean;
}


export const ExecutionTreeView: React.FC = () => {
  const {
    traceData,
    selectedRecordIndex,
    expandedNodes,
    setSelectedRecordIndex,
    toggleNodeExpansion,
    allMessages,
    allExceptions,
    customRootRecord,
    setTreeRoot,
  } = useTrace();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

  // Derived: is the context-menu target the trace root (cannot be set as root)
  const contextMenuIsRoot = !!(
    contextMenu &&
    traceData &&
    contextMenu.nodeId === getRootRecord(traceData.records).recordIndex
  );

  // Build tree structure from trace data
  const treeData = useMemo((): TreeNodeData | null => {
    if (!traceData) return null;

    const buildNode = (record: TraceRecord): TreeNodeData => {
      const children = getChildren(traceData.records, record.recordIndex).map(buildNode);
      return {
        id: record.recordIndex,
        label: getRecordLabel(record),
        record,
        children,
        hasMessages: recordHasMessages(record.recordIndex, allMessages),
        hasExceptions: recordHasExceptions(record.recordIndex, allExceptions),
      };
    };

    // Use custom root if set, otherwise use original root
    const rootRecord = customRootRecord ?? getRootRecord(traceData.records);
    return buildNode(rootRecord);
  }, [traceData, allMessages, allExceptions, customRootRecord]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedRecordIndex(nodeId);
    },
    [setSelectedRecordIndex]
  );

  const handleNodeToggle = useCallback(
    (nodeId: string) => {
      toggleNodeExpansion(nodeId);
    },
    [toggleNodeExpansion]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
    },
    []
  );

  const handleSetAsRoot = useCallback(() => {
    if (contextMenu) {
      setTreeRoot(contextMenu.nodeId);
      setContextMenu(null);
    }
  }, [contextMenu, setTreeRoot]);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const renderTreeNode = useCallback(
    (node: TreeNodeData): React.ReactNode => {
      const isExpanded = expandedNodes.has(node.id);
      const isSelected = selectedRecordIndex === node.id;
      const hasChildren = node.children.length > 0;
      
      // Get the appropriate icon kind for this record
      const iconKind = getIconKind(node.record);
      const icon = iconByKind(node.id, iconKind);
      
      // Get rule statistics for rule-based engines
      const ruleStats = isRuleBasedEngine(node.record.recordType)
        ? getRuleEngineStats(node.record)
        : null;

      return (
        <CarbonTreeNode
          key={node.id}
          id={node.id}
          label={
            <div
              className="tree-node-label"
              onContextMenu={(e) => handleContextMenu(e, node.id)}
            >
              <span className="tree-node-icon">{icon}</span>
              <span className="tree-node-text">{node.label}</span>
              {ruleStats && (
                <Tag type="green" size="sm" title={`${ruleStats.executedRules} of ${ruleStats.totalRules} rules executed`}>
                  {ruleStats.executedRules}/{ruleStats.totalRules}
                </Tag>
              )}
              {node.hasMessages && (
                <Tag renderIcon={Chat} type="blue" title="Has messages"></Tag>
              )}
              {node.hasExceptions && (
                <Tag renderIcon={Flash} type="red" title="Has exceptions"></Tag>
              )}
            </div>
          }
          isExpanded={isExpanded}
          onToggle={() => handleNodeToggle(node.id)}
          onClick={() => handleNodeClick(node.id)}
          className={`tree-node ${isSelected ? 'tree-node--selected' : ''} tree-node--${node.record.recordType.toLowerCase()}`}
        >
          {hasChildren && node.children.map(renderTreeNode)}
        </CarbonTreeNode>
      );
    },
    [expandedNodes, selectedRecordIndex, handleNodeClick, handleNodeToggle, handleContextMenu]
  );

  if (!treeData) {
    return (
      <div className="execution-tree-view execution-tree-view--empty">
        <p>No trace data loaded. Please upload or select a trace file.</p>
      </div>
    );
  }

  return (
    <div className="execution-tree-view">
      {/* Tree view */}
      <TreeView label="Execution Trace" hideLabel>
        {renderTreeNode(treeData)}
      </TreeView>

      {/* Carbon context menu */}
      <Menu
        open={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={handleCloseContextMenu}
        label="Node actions"
      >
        <MenuItem
          label="Set as anchor"
          renderIcon={Pin}
          disabled={contextMenuIsRoot}
          onClick={handleSetAsRoot}
        />
      </Menu>
    </div>
  );
};

// Made with Bob

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  TraceData,
  TraceRecord,
  LeftPanelTab,
  PrintedMessage,
  Exception,
} from '../types/trace.types';
import {
  buildPathToRecord,
  getMessagesForRecord,
  getExceptionsForRecord,
  getRootRecord,
} from '../utils/traceUtils';

interface TraceContextValue {
  // State
  traceData: TraceData | null;
  selectedRecordIndex: string | null;
  selectedRecord: TraceRecord | null;
  activeLeftTab: LeftPanelTab;
  expandedNodes: Set<string>;
  searchQuery: string;
  recordIndexMap: Map<string, TraceRecord>;
  customRootIndex: string | null;
  customRootRecord: TraceRecord | null;
  isCustomRoot: boolean;

  // Actions
  loadTrace: (data: TraceData) => void;
  setSelectedRecordIndex: (index: string | null) => void;
  navigateToRecord: (index: string) => void;
  setActiveLeftTab: (tab: LeftPanelTab) => void;
  toggleNodeExpansion: (index: string) => void;
  expandNode: (index: string) => void;
  collapseNode: (index: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  setSearchQuery: (query: string) => void;
  clearTrace: () => void;
  setTreeRoot: (index: string) => void;
  resetTreeRoot: () => void;

  // Computed values
  filteredMessages: PrintedMessage[];
  filteredExceptions: Exception[];
  allMessages: PrintedMessage[];
  allExceptions: Exception[];
  rootScopedMessages: PrintedMessage[];
  rootScopedExceptions: Exception[];
}

const TraceContext = createContext<TraceContextValue | undefined>(undefined);

export const TraceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [traceData, setTraceData] = useState<TraceData | null>(null);
  const [selectedRecordIndex, setSelectedRecordIndexState] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<LeftPanelTab>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [customRootIndex, setCustomRootIndex] = useState<string | null>(null);

  // The flat records map is already TraceData.records — expose it directly for O(1) lookup
  const recordIndexMap = useMemo((): Map<string, TraceRecord> => {
    return traceData?.records ?? new Map();
  }, [traceData]);

  // Root record is the first (shallowest) entry in the ordered map
  const traceRootIndex = useMemo((): string | null => {
    if (!traceData) return null;
    return getRootRecord(traceData.records).recordIndex;
  }, [traceData]);

  // Get custom root record
  const customRootRecord = useMemo((): TraceRecord | null => {
    if (!customRootIndex || !recordIndexMap.size) return null;
    return recordIndexMap.get(customRootIndex) ?? null;
  }, [customRootIndex, recordIndexMap]);

  // Check if we're using a custom root
  const isCustomRoot = useMemo(() => {
    return customRootIndex !== null && traceData !== null && customRootIndex !== traceRootIndex;
  }, [customRootIndex, traceData, traceRootIndex]);

  // Get selected record
  const selectedRecord = useMemo((): TraceRecord | null => {
    if (!selectedRecordIndex || !recordIndexMap.size) return null;
    return recordIndexMap.get(selectedRecordIndex) ?? null;
  }, [selectedRecordIndex, recordIndexMap]);

  // Get all messages and exceptions
  const allMessages = useMemo(() => traceData?.printedMessages ?? [], [traceData]);
  const allExceptions = useMemo(() => traceData?.exceptionsRaised ?? [], [traceData]);

  // Messages/exceptions scoped to the current root (custom or full trace root)
  const rootScopedMessages = useMemo(() => {
    if (!customRootIndex) return allMessages;
    return getMessagesForRecord(allMessages, customRootIndex);
  }, [customRootIndex, allMessages]);

  const rootScopedExceptions = useMemo(() => {
    if (!customRootIndex) return allExceptions;
    return getExceptionsForRecord(allExceptions, customRootIndex);
  }, [customRootIndex, allExceptions]);

  // Get filtered messages for selected record
  const filteredMessages = useMemo(() => {
    if (!selectedRecordIndex) return rootScopedMessages;
    return getMessagesForRecord(rootScopedMessages, selectedRecordIndex);
  }, [selectedRecordIndex, rootScopedMessages]);

  // Get filtered exceptions for selected record
  const filteredExceptions = useMemo(() => {
    if (!selectedRecordIndex) return rootScopedExceptions;
    return getExceptionsForRecord(rootScopedExceptions, selectedRecordIndex);
  }, [selectedRecordIndex, rootScopedExceptions]);

  // Load trace data
  const loadTrace = useCallback((data: TraceData) => {
    setTraceData(data);
    setSelectedRecordIndexState(null);
    setCustomRootIndex(null);
    const root = getRootRecord(data.records);
    setExpandedNodes(new Set([root.recordIndex]));
    setSearchQuery('');
    setActiveLeftTab('tree');
  }, []);

  // Set selected record index
  const setSelectedRecordIndex = useCallback((index: string | null) => {
    setSelectedRecordIndexState(index);
  }, []);

  // Navigate to a record (from message or exception click)
  const navigateToRecord = useCallback((index: string) => {
    setActiveLeftTab('tree');
    const path = buildPathToRecord(index);
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      path.forEach((nodeIndex) => newSet.add(nodeIndex));
      return newSet;
    });
    setSelectedRecordIndexState(index);
  }, []);

  // Toggle node expansion
  const toggleNodeExpansion = useCallback((index: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  // Expand a specific node
  const expandNode = useCallback((index: string) => {
    setExpandedNodes((prev) => new Set(prev).add(index));
  }, []);

  // Collapse a specific node
  const collapseNode = useCallback((index: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      newSet.delete(index);
      return newSet;
    });
  }, []);

  // Expand all nodes
  const expandAll = useCallback(() => {
    if (!recordIndexMap.size) return;
    setExpandedNodes(new Set(recordIndexMap.keys()));
  }, [recordIndexMap]);

  // Collapse all nodes (keep root expanded)
  const collapseAll = useCallback(() => {
    if (!traceRootIndex) return;
    setExpandedNodes(new Set([traceRootIndex]));
  }, [traceRootIndex]);

  // Set a custom tree root
  const setTreeRoot = useCallback((index: string) => {
    setCustomRootIndex(index);
    setExpandedNodes(new Set([index]));
    setSelectedRecordIndexState(index);
  }, []);

  // Reset to original tree root
  const resetTreeRoot = useCallback(() => {
    setCustomRootIndex(null);
    if (traceRootIndex) {
      setExpandedNodes(new Set([traceRootIndex]));
      setSelectedRecordIndexState(traceRootIndex);
    }
  }, [traceRootIndex]);

  // Clear trace data
  const clearTrace = useCallback(() => {
    setTraceData(null);
    setSelectedRecordIndexState(null);
    setCustomRootIndex(null);
    setExpandedNodes(new Set());
    setSearchQuery('');
    setActiveLeftTab('tree');
  }, []);

  const value: TraceContextValue = {
    // State
    traceData,
    selectedRecordIndex,
    selectedRecord,
    activeLeftTab,
    expandedNodes,
    searchQuery,
    recordIndexMap,
    customRootIndex,
    customRootRecord,
    isCustomRoot,

    // Actions
    loadTrace,
    setSelectedRecordIndex,
    navigateToRecord,
    setActiveLeftTab,
    toggleNodeExpansion,
    expandNode,
    collapseNode,
    expandAll,
    collapseAll,
    setSearchQuery,
    clearTrace,
    setTreeRoot,
    resetTreeRoot,

    // Computed values
    filteredMessages,
    filteredExceptions,
    allMessages,
    allExceptions,
    rootScopedMessages,
    rootScopedExceptions,
  };

  return <TraceContext.Provider value={value}>{children}</TraceContext.Provider>;
};

// Custom hook to use the trace context
export const useTrace = (): TraceContextValue => {
  const context = useContext(TraceContext);
  if (!context) {
    throw new Error('useTrace must be used within a TraceProvider');
  }
  return context;
};

// Made with Bob

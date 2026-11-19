import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import {
  TraceData,
  TraceRecord,
  TraceTabItem,
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
  // Tabs State
  tabs: TraceTabItem[];
  activeTabId: string | null;
  activeTab: TraceTabItem | null;

  // Active Tab State (derived from current tab)
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
  loadTrace: (data: TraceData, title?: string) => void;
  setActiveTabId: (id: string) => void;
  closeTab: (id: string) => void;
  closeAllTabs: () => void;
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
  const [tabs, setTabs] = useState<TraceTabItem[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Active tab reference
  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) ?? null;
  }, [tabs, activeTabId]);

  const traceData = activeTab?.traceData ?? null;
  const selectedRecordIndex = activeTab?.selectedRecordIndex ?? null;
  const activeLeftTab = activeTab?.activeLeftTab ?? 'tree';
  const expandedNodes = useMemo(() => activeTab?.expandedNodes ?? new Set<string>(), [activeTab?.expandedNodes]);
  const searchQuery = activeTab?.searchQuery ?? '';
  const customRootIndex = activeTab?.customRootIndex ?? null;

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

  // Load a new trace as a new tab
  const loadTrace = useCallback((data: TraceData, title?: string) => {
    const root = getRootRecord(data.records);
    const newTabId = 'trace-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    const newTab: TraceTabItem = {
      id: newTabId,
      title: title || 'Trace',
      traceData: data,
      selectedRecordIndex: null,
      activeLeftTab: 'tree',
      expandedNodes: new Set([root.recordIndex]),
      searchQuery: '',
      customRootIndex: null,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTabId);
  }, []);

  // Close a specific tab
  const closeTab = useCallback((idToClose: string) => {
    setTabs((prevTabs) => {
      const tabIndex = prevTabs.findIndex((t) => t.id === idToClose);
      if (tabIndex === -1) return prevTabs;

      const newTabs = prevTabs.filter((t) => t.id !== idToClose);
      return newTabs;
    });

    setActiveTabId((currentActiveId) => {
      if (currentActiveId !== idToClose) return currentActiveId;
      const tabIndex = tabs.findIndex((t) => t.id === idToClose);
      const remainingTabs = tabs.filter((t) => t.id !== idToClose);
      if (remainingTabs.length === 0) return null;
      const nextIndex = Math.min(tabIndex, remainingTabs.length - 1);
      return remainingTabs[nextIndex].id;
    });
  }, [tabs]);

  // Close all tabs
  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  // Set selected record index in active tab
  const setSelectedRecordIndex = useCallback((index: string | null) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, selectedRecordIndex: index } : t))
    );
  }, [activeTabId]);

  // Navigate to a record (from message or exception click)
  const navigateToRecord = useCallback((index: string) => {
    const path = buildPathToRecord(index);
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const newExpanded = new Set(t.expandedNodes);
        path.forEach((nodeIndex) => newExpanded.add(nodeIndex));
        return {
          ...t,
          activeLeftTab: 'tree',
          expandedNodes: newExpanded,
          selectedRecordIndex: index,
        };
      })
    );
  }, [activeTabId]);

  // Set active left panel tab in active tab
  const setActiveLeftTab = useCallback((tab: LeftPanelTab) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, activeLeftTab: tab } : t))
    );
  }, [activeTabId]);

  // Toggle node expansion in active tab
  const toggleNodeExpansion = useCallback((index: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const newExpanded = new Set(t.expandedNodes);
        if (newExpanded.has(index)) {
          newExpanded.delete(index);
        } else {
          newExpanded.add(index);
        }
        return { ...t, expandedNodes: newExpanded };
      })
    );
  }, [activeTabId]);

  // Expand a specific node in active tab
  const expandNode = useCallback((index: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        return { ...t, expandedNodes: new Set(t.expandedNodes).add(index) };
      })
    );
  }, [activeTabId]);

  // Collapse a specific node in active tab
  const collapseNode = useCallback((index: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const newExpanded = new Set(t.expandedNodes);
        newExpanded.delete(index);
        return { ...t, expandedNodes: newExpanded };
      })
    );
  }, [activeTabId]);

  // Expand all nodes in active tab
  const expandAll = useCallback(() => {
    if (!activeTab) return;
    const allKeys = Array.from(activeTab.traceData.records.keys());
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, expandedNodes: new Set(allKeys) } : t
      )
    );
  }, [activeTab, activeTabId]);

  // Collapse all nodes in active tab (keep root expanded)
  const collapseAll = useCallback(() => {
    if (!activeTab) return;
    const root = getRootRecord(activeTab.traceData.records);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? { ...t, expandedNodes: new Set([root.recordIndex]) }
          : t
      )
    );
  }, [activeTab, activeTabId]);

  // Set a custom tree root in active tab
  const setTreeRoot = useCallback((index: string) => {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              customRootIndex: index,
              expandedNodes: new Set([index]),
              selectedRecordIndex: index,
            }
          : t
      )
    );
  }, [activeTabId]);

  // Reset to original tree root in active tab
  const resetTreeRoot = useCallback(() => {
    if (!activeTab) return;
    const root = getRootRecord(activeTab.traceData.records);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              customRootIndex: null,
              expandedNodes: new Set([root.recordIndex]),
              selectedRecordIndex: root.recordIndex,
            }
          : t
      )
    );
  }, [activeTab, activeTabId]);

  // Set search query in active tab
  const setSearchQuery = useCallback((query: string) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, searchQuery: query } : t))
    );
  }, [activeTabId]);

  // Clear trace data / close all tabs
  const clearTrace = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  const value: TraceContextValue = {
    // Tabs state
    tabs,
    activeTabId,
    activeTab,

    // Active tab state
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
    setActiveTabId,
    closeTab,
    closeAllTabs,
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

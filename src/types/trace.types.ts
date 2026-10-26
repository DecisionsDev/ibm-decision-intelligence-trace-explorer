// Core trace data structure types

export interface TraceData {
  configuration: Configuration;
  /**
   * Ordered flat map of all records, keyed by recordIndex.
   * Entries are in execution order (numeric segment comparison: "1.3" before "1.26").
   * This is the canonical representation — both the 2026 flat format and the older
   * nested format are normalised into this shape at load time.
   */
  records: Map<string, TraceRecord>;
  printedMessages: PrintedMessage[];
  exceptionsRaised: Exception[];
}

export interface Configuration {
  executionDuration: boolean;
  printedMessages: boolean;
  objectsInMemoryLimit: number;
  decisionModel: {
    inputParameters: string;
    outputParameters: string;
    inputNode: string;
    outputNode: string;
  };
  rules: {
    boundObjectsAtStart: string;
    boundObjectsAtEnd: string;
    allRules: boolean;
    executedRules: boolean;
    nonExecutedRules: boolean;
    exceptions: string;
  };
  ruleflow: {
    inputParameters: string;
    outputParameters: string;
    allTasks: boolean;
    executedTasks: boolean;
    notExecutedTasks: boolean;
    selectedRules: boolean;
  };
}

/**
 * A single execution record. All payload fields from the trace are owned
 * directly on this object alongside `recordType` and `recordIndex` — there
 * is no intermediate `properties` wrapper.
 */
export interface TraceRecord {
  recordType: RecordType;
  recordIndex: string; // Hierarchical identifier like "1.3.1.1"
  // --- payload fields (formerly RecordProperties) ---
  name?: string;
  kind?: string | string[];
  engineVersion?: string;
  mainTask?: string;
  hitPolicy?: string;
  input?: Record<string, any>;
  output?: Record<string, any>;
  boundObjectsAtStart?: Record<string, any>;
  boundObjectsAtEnd?: Record<string, any>;
  boundObjectsDiff?: Record<string, any>;
  actionIndex?: string;
  actionName?: string;
  stopMessage?: string;
  defaultValueAfter?: Record<string, any>;
  allTasks?: string[];
  notExecutedTasks?: string[];
  allRules?: string[];
  selectedRules?: string[];
  nonExecutedRules?: string[];
  executionDuration?: number;
  [key: string]: any; // Allow additional properties from the trace
}

export type RecordType =
  | 'DecisionModel'
  | 'DecisionModelNode'
  | 'RuleFlow'
  | 'Task'
  | 'FastpathEngine'
  | 'ReteEngine'
  | 'SequentialEngine'
  | 'Rule'
  | 'DecisionTable'
  | 'Action';

export interface PrintedMessage {
  recordIndex: string; // Links to TraceRecord.recordIndex
  message: string;
}

export interface Exception {
  recordIndex: string; // Links to TraceRecord.recordIndex
  exceptionType?: string;
  message?: string;
  stackTrace?: string;
  [key: string]: any;
}

// UI State types

export type LeftPanelTab = 'tree' | 'messages' | 'exceptions' | 'flame';

export interface TraceContextState {
  traceData: TraceData | null;
  selectedRecordIndex: string | null;
  activeLeftTab: LeftPanelTab;
  expandedNodes: Set<string>;
  searchQuery: string;
}

// Tree node structure for UI rendering
export interface TreeNode {
  id: string; // Same as recordIndex
  label: string;
  recordType: RecordType;
  record: TraceRecord;
  children: TreeNode[];
  isExpanded: boolean;
  isSelected: boolean;
  hasMessages: boolean;
  hasExceptions: boolean;
}

// Filter and search types
export interface SearchFilter {
  query: string;
  recordTypes: RecordType[];
  hasMessages: boolean;
  hasExceptions: boolean;
}

// Rule engine statistics
export interface RuleEngineStats {
  totalRules: number;
  executedRules?: number;
  selectedRules?: number;
  nonExecutedRules?: number;
}

export interface RuleflowStats {
  totalTasks: number;
}

// Constants for rule-based engine types
export const RULE_ENGINE_TYPES: readonly RecordType[] = ['SequentialEngine', 'ReteEngine', 'FastpathEngine'] as const;

// Helper function to check if record type is a rule-based engine
export const isRuleBasedEngine = (recordType: RecordType | string): boolean => {
  return RULE_ENGINE_TYPES.includes(recordType as RecordType);
};

// Helper function to check if a record contains valid rules
export const hasValidRules = (record: TraceRecord): boolean => {
  return Boolean(
    record.allRules &&
    Array.isArray(record.allRules) &&
    record.allRules.length > 0
  );
};

export const hasValidTasks = (record: TraceRecord): boolean => {
  return Boolean(
    record.allTasks &&
    Array.isArray(record.allTasks) &&
    record.allTasks.length > 0
  );
};

// Helper function to get rule execution statistics
export const getRuleEngineStats = (record: TraceRecord): RuleEngineStats | null => {
  if (!hasValidRules(record)) {
    return null;
  }

  const totalRules = record.allRules!.length;
  const selectedCount = record.selectedRules?.length;
  const nonExecutedCount = record.nonExecutedRules?.length;

  return {
    totalRules,
    executedRules: nonExecutedCount != undefined ? (totalRules - nonExecutedCount) : undefined,
    selectedRules: selectedCount,
    nonExecutedRules: nonExecutedCount,
  };
};

export const getTasks = (record: TraceRecord): RuleflowStats | null => {
  if (!hasValidTasks(record)) {
    return null;
  }

  return {
    totalTasks: record.allTasks!.length,
  };
};

// Made with Bob

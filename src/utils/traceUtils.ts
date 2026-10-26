
import { TraceRecord, TraceData, PrintedMessage, Exception, Configuration } from '../types/trace.types';

function isPlainObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) {
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return false;
    }

    return a.every((item, index) => deepEqual(item, b[index]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    return aKeys.every((key) => deepEqual(a[key], b[key]));
  }

  return false;
}

export function buildJsonMergePatch(
  source: Record<string, any> | undefined,
  target: Record<string, any> | undefined
): Record<string, any> | null {
  if (source === undefined && target === undefined) {
    return null;
  }

  if (source === undefined) {
    return target ?? null;
  }

  if (target === undefined) {
    return null;
  }

  if (!isPlainObject(source) || !isPlainObject(target)) {
    return deepEqual(source, target) ? {} : target;
  }

  const patch: Record<string, any> = {};
  const keys = new Set([...Object.keys(source), ...Object.keys(target)]);

  keys.forEach((key) => {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (!(key in target)) {
      patch[key] = null;
      return;
    }

    if (!(key in source)) {
      patch[key] = targetValue;
      return;
    }

    if (deepEqual(sourceValue, targetValue)) {
      return;
    }

    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      const nestedPatch = buildJsonMergePatch(sourceValue, targetValue);
      if (nestedPatch && Object.keys(nestedPatch).length > 0) {
        patch[key] = nestedPatch;
      }
      return;
    }

    patch[key] = targetValue;
  });

  return patch;
}

/**
 * Compare two record indices numerically segment by segment.
 * Each dot-separated segment is compared as an integer so that
 * "1.3" < "1.26" (not lexicographic string order).
 * Returns negative / 0 / positive like Array.sort comparators.
 */
export function compareRecordIndex(a: string, b: string): number {
  const aParts = a.split('.');
  const bParts = b.split('.');
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const aNum = i < aParts.length ? parseInt(aParts[i], 10) : 0;
    const bNum = i < bParts.length ? parseInt(bParts[i], 10) : 0;
    if (aNum !== bNum) return aNum - bNum;
  }
  return 0;
}

/**
 * Parse hierarchical record index into array of parts
 * Example: "1.3.1.1" => ["1", "3", "1", "1"]
 */
export function parseRecordIndex(index: string): string[] {
  return index.split('.');
}

/**
 * Build path to record for tree expansion
 * Example: "1.3.1.1" => ["1", "1.3", "1.3.1", "1.3.1.1"]
 */
export function buildPathToRecord(index: string): string[] {
  const parts = parseRecordIndex(index);
  const paths: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    paths.push(parts.slice(0, i).join('.'));
  }
  return paths;
}

/**
 * Get parent record index.
 * Example: "1.3.1.1" => "1.3.1"
 */
export function getParentRecordIndex(recordIndex: string): string | null {
  const parts = parseRecordIndex(recordIndex);
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

/**
 * Get depth of record in hierarchy
 */
export function getRecordDepth(recordIndex: string): number {
  return parseRecordIndex(recordIndex).length;
}

/**
 * Return the root record (depth-1 entry) from the flat records map.
 */
export function getRootRecord(records: Map<string, TraceRecord>): TraceRecord {
  for (const record of records.values()) {
    if (!record.recordIndex.includes('.')) return record;
  }
  // Fallback: first entry
  return records.values().next().value as TraceRecord;
}

/**
 * Return the direct children of a record from the flat records map.
 * Children are records whose parent index equals the given recordIndex,
 * returned in numeric segment order.
 */
export function getChildren(
  records: Map<string, TraceRecord>,
  recordIndex: string
): TraceRecord[] {
  const results: TraceRecord[] = [];
  for (const record of records.values()) {
    if (getParentRecordIndex(record.recordIndex) === recordIndex) {
      results.push(record);
    }
  }
  // Already insertion-ordered (map is sorted at load time), but sort defensively
  return results.sort((a, b) => compareRecordIndex(a.recordIndex, b.recordIndex));
}

/**
 * Check if a message/exception index is a descendant of or equal to the target index.
 * Example: isDescendantOrEqual("1.2.1.1", "1.2") => true
 * Example: isDescendantOrEqual("1.2.1.1", "1.2.1.1") => true
 * Example: isDescendantOrEqual("1.3", "1.2") => false
 */
function isDescendantOrEqual(itemIndex: string, targetIndex: string): boolean {
  if (itemIndex === targetIndex) return true;
  return itemIndex.startsWith(targetIndex + '.');
}

/**
 * Get all messages for a specific record index and its descendants.
 */
export function getMessagesForRecord(
  messages: PrintedMessage[],
  recordIndex: string
): PrintedMessage[] {
  return messages.filter((msg) => isDescendantOrEqual(msg.recordIndex, recordIndex));
}

/**
 * Get all exceptions for a specific record index and its descendants.
 */
export function getExceptionsForRecord(
  exceptions: Exception[],
  recordIndex: string
): Exception[] {
  return exceptions.filter((exc) => isDescendantOrEqual(exc.recordIndex, recordIndex));
}

/**
 * Check if a record has any messages
 */
export function recordHasMessages(
  recordIndex: string,
  messages: PrintedMessage[]
): boolean {
  return messages.some((msg) => msg.recordIndex === recordIndex);
}

/**
 * Check if a record has any exceptions
 */
export function recordHasExceptions(
  recordIndex: string,
  exceptions: Exception[]
): boolean {
  return exceptions.some((exc) => exc.recordIndex === recordIndex);
}

/**
 * Get a human-readable label for a record
 */
export function getRecordLabel(record: TraceRecord): string {
  const { name, kind, mainTask, recordType } = record;
  
  if (name) {
    if (recordType == 'Task') {
      const dotindex = name.lastIndexOf('>');
      if (dotindex > 0) {
            return name.substring(dotindex+1); 
      }
    }
    if (recordType == 'Rule') {
      const dotindex = name.lastIndexOf('.');
      if (dotindex > 0) {
            return name.substring(dotindex+1); 
      }
    }
    return name;
  }

  if (mainTask) {
    return mainTask;
  }
  
  if (kind) {
    const kindStr = Array.isArray(kind) ? kind.join(', ') : kind;
    return `${recordType} (${kindStr})`;
  }
  
  return recordType;
}

export function getRecordDescription(record: TraceRecord): string {
  const recordKind = getRecordKind(record);
  const label = getRecordLabel(record);
  if (label)
    return `${recordKind} ${label}`;
  return recordKind;
}

/**
 * Count total records in trace
 */
export function countRecords(records: Map<string, TraceRecord>): number {
  return records.size;
}

/**
 * Search records by name or type
 */
export function searchRecords(
  records: Map<string, TraceRecord>,
  query: string
): TraceRecord[] {
  const results: TraceRecord[] = [];
  const lowerQuery = query.toLowerCase();

  for (const record of records.values()) {
    const label = getRecordLabel(record).toLowerCase();
    const type = record.recordType.toLowerCase();
    if (label.includes(lowerQuery) || type.includes(lowerQuery)) {
      results.push(record);
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Format detection & normalisation
// ---------------------------------------------------------------------------

/**
 * Detect whether raw JSON is a 2026+ flat trace.
 * Flat traces have a `records` plain-object (keyed by recordIndex) instead of `rootRecord`.
 */
export function isFlatTraceFormat(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    'records' in data &&
    isPlainObject(data.records) &&
    !('rootRecord' in data)
  );
}

/**
 * Normalise a 2026+ flat trace JSON into canonical TraceData.
 *
 * Flat JSON shape:
 *   { configuration, records: { "1.1": { recordType, recordIndex, ...props }, ... },
 *     printedMessages, exceptionsRaised }
 */
export function normalizeFlatTrace(data: any): TraceData {
  const flatRecords: Record<string, any> = data.records;

  const unsorted: TraceRecord[] = Object.keys(flatRecords).map((key) => {
    const entry = flatRecords[key];
    const { recordType, recordIndex, ...rest } = entry;
    return { recordType, recordIndex, ...rest };
  });

  unsorted.sort((a, b) => compareRecordIndex(a.recordIndex, b.recordIndex));

  const records = new Map<string, TraceRecord>();
  for (const record of unsorted) {
    records.set(record.recordIndex, record);
  }

  return {
    configuration: data.configuration as Configuration,
    records,
    printedMessages: Array.isArray(data.printedMessages) ? data.printedMessages : [],
    exceptionsRaised: Array.isArray(data.exceptionsRaised) ? data.exceptionsRaised : [],
  };
}

/**
 * Normalise an older nested trace JSON into canonical TraceData.
 *
 * Nested JSON shape:
 *   { configuration, rootRecord: { recordType, recordIndex, properties: { nestedRecords: [...] } },
 *     printedMessages, exceptionsRaised }
 */
export function normalizeNestedTrace(data: any): TraceData {
  const records = new Map<string, TraceRecord>();

  function traverse(node: any) {
    const { recordType, recordIndex, properties } = node;
    const { nestedRecords, ...restProps } = properties ?? {};
    records.set(recordIndex, { recordType, recordIndex, ...restProps });
    if (Array.isArray(nestedRecords)) {
      for (const child of nestedRecords) {
        traverse(child);
      }
    }
  }

  traverse(data.rootRecord);

  // Re-sort by numeric segment order
  const sorted = Array.from(records.entries()).sort(([a], [b]) => compareRecordIndex(a, b));
  const sortedMap = new Map<string, TraceRecord>(sorted);

  return {
    configuration: data.configuration as Configuration,
    records: sortedMap,
    printedMessages: Array.isArray(data.printedMessages) ? data.printedMessages : [],
    exceptionsRaised: Array.isArray(data.exceptionsRaised) ? data.exceptionsRaised : [],
  };
}

/**
 * Validate that raw data is a recognised trace format (flat or nested).
 */
export function validateTraceData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;
  if (!('configuration' in data)) return false;
  if (!('printedMessages' in data) || !Array.isArray(data.printedMessages)) return false;
  if (!('exceptionsRaised' in data) || !Array.isArray(data.exceptionsRaised)) return false;
  // Must have either a flat records object or a nested rootRecord
  return isFlatTraceFormat(data) || 'rootRecord' in data;
}

/**
 * Parse raw JSON into canonical TraceData, handling both formats.
 */
export function parseTraceData(raw: any): TraceData {
  if (isFlatTraceFormat(raw)) {
    return normalizeFlatTrace(raw);
  }
  return normalizeNestedTrace(raw);
}

export const getRecordKind = (record: TraceRecord): string => {
  const { recordType, kind } = record;

  if (kind) {
    const kindString = Array.isArray(kind) ? kind[0] : kind;
    switch (kindString.toUpperCase()) {
      case 'INPUTDATA':
        return 'Input node';
      case 'FUNCTIONTASK':
        return 'Function task';
      case 'FLOWTASK':
        return 'Flow task';
      case 'RULETASK':
        return 'Rule task';
      case 'SEQUENTIALTASK':
        return 'Rule task';
    }
  }

  switch (recordType) {
    case 'DecisionModel':
      return 'Decision model';
    case 'DecisionModelNode':
      return 'Decision node';
    case 'RuleFlow':
      return 'Task model';
    case 'Task':
      return 'Flow';
    case 'ReteEngine':
      return 'RetePlus engine';
    case 'FastpathEngine':
      return 'Fastpath engine';
    case 'SequentialEngine':
      return 'Sequential engine';
    case 'Rule':
      if (record.actionIndex !== undefined && record.actionIndex !== null) {
        return 'Decision table';
      }
      return 'Business rule';
    case 'DecisionTable':
      return 'Decision table';
    case 'Action':
      return 'Action';
    default:
      return '';
  }
};

// Map recordType and kind to the icon kind expected by iconByKind
export const getIconKind = (record: TraceRecord): string => {
  const { recordType, kind } = record;

  if (kind) {
    const kindString = Array.isArray(kind) ? kind[0] : kind;
    switch (kindString.toUpperCase()) {
      case 'DECISION':
        return 'DECISION';
      case 'INPUTDATA':
        return 'INPUT_NODE';
      case 'FUNCTIONTASK':
        return 'FUNCTIONTASK';
      case 'FLOWTASK':
        return 'RULEFLOW';
      case 'RULETASK':
      case 'SEQUENTIALTASK':
        return 'ENGINE';
      default:
        return kindString.toUpperCase();
    }
  }

  switch (recordType) {
    case 'DecisionModel':
      return 'DECISION_MODEL';
    case 'DecisionModelNode':
      return 'DECISION';
    case 'RuleFlow':
      return 'RULEFLOW';
    case 'Task':
      return 'RULEFLOW';
    case 'ReteEngine':
      return 'ENGINE';
    case 'FastpathEngine':
      return 'ENGINE';
    case 'SequentialEngine':
      return 'ENGINE';
    case 'Rule':
      return 'BUSINESS_RULE';
    case 'DecisionTable':
      return 'DECISION_TABLE';
    case 'Action':
      return 'ACTION';
    default:
      return 'GENERIC';
  }
};

// Made with Bob

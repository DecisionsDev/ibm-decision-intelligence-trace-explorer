import React, { useMemo, useCallback, useRef, useState } from 'react';
import { useTrace } from '../../context/TraceContext';
import { TraceRecord } from '../../types/trace.types';
import { getRecordLabel, getChildren, getRootRecord } from '../../utils/traceUtils';
import './FlameChart.scss';

interface FlameNode {
  record: TraceRecord;
  label: string;
  duration: number;
  startTime: number;
  depth: number;
  children: FlameNode[];
}

export const FlameChart: React.FC = () => {
  const { traceData, selectedRecordIndex, setSelectedRecordIndex, customRootRecord } = useTrace();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<FlameNode | null>(null);

  // Build flame chart data structure
  const flameData = useMemo((): FlameNode | null => {
    if (!traceData) return null;

    let currentTime = 0;

    const buildFlameNode = (record: TraceRecord, depth: number): FlameNode | null => {
      const duration = record.executionDuration;

      // Skip records without execution duration
      if (duration === undefined || duration === null) {
        return null;
      }

      const recordedStartTime = record.executionStartTime;
      if (recordedStartTime !== undefined) {
        currentTime = recordedStartTime;
      }

      const startTime = currentTime;
      const node: FlameNode = {
        record,
        label: getRecordLabel(record),
        duration,
        startTime,
        depth,
        children: [],
      };

      // Process children
      for (const childRecord of getChildren(traceData.records, record.recordIndex)) {
        const childNode = buildFlameNode(childRecord, depth + 1);
        if (childNode) {
          node.children.push(childNode);
          currentTime += childNode.duration;
        }
      }

      return node;
    };

    currentTime = 0;
    const rootRecord = customRootRecord ?? getRootRecord(traceData.records);
    return buildFlameNode(rootRecord, 0);
  }, [traceData, customRootRecord]);

  // Calculate total duration and max depth
  const { totalDuration, maxDepth } = useMemo(() => {
    if (!flameData) return { totalDuration: 0, maxDepth: 0 };

    let maxD = 0;
    const calculateMetrics = (node: FlameNode) => {
      maxD = Math.max(maxD, node.depth);
      node.children.forEach(calculateMetrics);
    };

    calculateMetrics(flameData);
    return { totalDuration: flameData.duration, maxDepth: maxD };
  }, [flameData]);

  const handleNodeClick = useCallback(
    (node: FlameNode) => {
      setSelectedRecordIndex(node.record.recordIndex);
    },
    [setSelectedRecordIndex]
  );

  const renderFlameNode = useCallback(
    (node: FlameNode) => {
      if (totalDuration <= 0) return null;

      const rootStartTime = flameData?.startTime ?? 0;
      const isZeroDuration = node.duration <= 0;
      const widthPercent = isZeroDuration ? 0 : (node.duration / totalDuration) * 100;
      const leftPercent = ((node.startTime - rootStartTime) / totalDuration) * 100;
      const isSelected = selectedRecordIndex === node.record.recordIndex;
      const isHovered = hoveredNode?.record.recordIndex === node.record.recordIndex;

      return (
        <React.Fragment key={node.record.recordIndex}>
          <div
            className={`flame-node ${isZeroDuration ? 'flame-node--zero' : ''} ${isSelected ? 'flame-node--selected' : ''} ${isHovered ? 'flame-node--hovered' : ''}`}
            data-depth={node.depth % 10}
            style={{
              width: isZeroDuration ? '2px' : `${widthPercent}%`,
              left: `${leftPercent}%`,
              top: `${node.depth * 24}px`,
            }}
            onClick={() => handleNodeClick(node)}
            onMouseEnter={() => setHoveredNode(node)}
            onMouseLeave={() => setHoveredNode(null)}
            title={`${node.label}\nDuration: ${node.duration === 0 ? '<1' : node.duration}ms`}
          >
            {!isZeroDuration && <span className="flame-node-label">{node.label}</span>}
            {!isZeroDuration && <span className="flame-node-duration">{node.duration === 0 ? '<1' : node.duration}ms</span>}
          </div>
          {node.children.map((child) => renderFlameNode(child))}
        </React.Fragment>
      );
    },
    [totalDuration, flameData, selectedRecordIndex, hoveredNode, handleNodeClick]
  );

  if (!flameData) {
    return (
      <div className="flame-chart flame-chart--empty">
        <p>No execution duration data available in this trace.</p>
      </div>
    );
  }

  const chartHeight = (maxDepth + 1) * 24 + 40; // 24px per level + padding

  const hoveredLabel = hoveredNode?.label ?? 'No node hovered';
  const hoveredDuration = hoveredNode ? `${hoveredNode.duration === 0 ? '<1' : hoveredNode.duration}ms` : '—';
  const hoveredPercentage =
    hoveredNode && totalDuration > 0
      ? `${((hoveredNode.duration / totalDuration) * 100).toFixed(2)}%`
      : '—';

  return (
    <div className="flame-chart" ref={containerRef}>
      <div className="flame-chart-header">
        <div className="flame-chart-info">
          <span className="flame-chart-label">Total Duration:</span>
          <span className="flame-chart-value">{totalDuration === 0 ? '<1' : totalDuration}ms</span>
        </div>
        <div className="flame-chart-tooltip" aria-live="polite">
          <div className="flame-chart-tooltip-label">{hoveredLabel}</div>
          <div className="flame-chart-tooltip-details">
            <span>Duration: {hoveredDuration}</span>
            <span>({hoveredPercentage})</span>
          </div>
        </div>
      </div>
      <div className="flame-chart-container" style={{ height: chartHeight }}>
        {renderFlameNode(flameData)}
      </div>
    </div>
  );
};

// Made with Bob
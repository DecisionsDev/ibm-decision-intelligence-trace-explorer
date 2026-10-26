import {
  BuildRun,
  CarbonIconType,
  Connect,
  Data_1,
  Document,
  DocumentBlank,
  DocumentTasks,
  DocumentUnknown,
  Flash,
  Folder,
  Network_3,
  NotebookReference,
  ParentChild,
  TableSplit,
  TreeView,
  Types,
  Gears,
  Task,
  WatsonHealthAiStatus,
  WatsonMachineLearning,
} from '@carbon/react/icons';
import * as React from 'react';

// ---------------
//  Rule elements
// ---------------

export const BusinessRule: CarbonIconType = Document;
export const DecisionTable: CarbonIconType = TableSplit;
export const DefaultRule: CarbonIconType = DocumentTasks;
export const RulePackage: CarbonIconType = Folder;
export const Ruleflow: CarbonIconType = TreeView;
export const VariableSet: CarbonIconType = Types;
export const DecisionRule: CarbonIconType = Document;
export const Action: CarbonIconType = Task;

// ---------------
//  Artifacts
// ---------------

export const DataModel: CarbonIconType = Data_1;
export const DecisionModel: CarbonIconType = ParentChild;
export const GenerativeAIModel: CarbonIconType = WatsonHealthAiStatus;
export const TaskModel: CarbonIconType = Network_3;
export const MachineLearningAds: CarbonIconType = WatsonMachineLearning;

// ---------------
//  Others
// ---------------

export const Operation: CarbonIconType = Connect;
export const ExternalLibrary: CarbonIconType = NotebookReference;

// ------------------
//  Helper functions
// ------------------
function Decision20(nodeId: string) {
  return (
    <svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1">
      <g
        id={`Decision-node-${nodeId}`}
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id={`Group-${nodeId}`}
          transform="translate(1.000000, 2.000000)"
          fill="#000000"
        >
          {}
          <path
            d="M0,1.28571429 C0,0.575633893 0.575633893,0 1.28571429,0 L16.7142857,0 C17.4243661,0 18,0.575633893 18,1.28571429 L18,14.1428571 C18,14.8529375 17.4243661,15.4285714 16.7142857,15.4285714 L1.28571429,15.4285714 C0.575633893,15.4285714 0,14.8529375 0,14.1428571 L0,1.28571429 Z M1.28571429,1.28571429 L1.28571429,14.1428571 L16.7142857,14.1428571 L16.7142857,1.28571429 L1.28571429,1.28571429 Z"
            id={`Rectangle-0-${nodeId}`}
            fillRule="nonzero"
          />
          <rect
            id={`Rectangle-1-${nodeId}`}
            x="3.85714286"
            y="5.14285714"
            width="7.71428571"
            height="1.28571429"
          />
          <rect
            id={`Rectangle-2-${nodeId}`}
            x="3.85714286"
            y="9"
            width="10.2857143"
            height="1.28571429"
          />
        </g>
        <rect id={`Rectangle-3-${nodeId}`} x="0" y="0" width="20" height="20" />
      </g>
    </svg>
  );
}

export function InputData20(nodeId: string) {
  return (
    <svg width="20px" height="20px" viewBox="0 0 20 20" version="1.1">
      <g
        id={`Data-node-${nodeId}`}
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g
          id={`Group-${nodeId}`}
          transform="translate(1.000000, 2.000000)"
          fill="#000000"
        >
          {}
          <path
            d="M6.42857143,0 L11.5714286,0 C15.1218305,0 18,2.87816947 18,6.42857143 L18,9 C18,12.550402 15.1218305,15.4285714 11.5714286,15.4285714 L6.42857143,15.4285714 C2.87816947,15.4285714 0,12.550402 0,9 L0,6.42857143 C0,2.87816947 2.87816947,0 6.42857143,0 Z M6.42857143,1.28571429 C3.58824986,1.28571429 1.28571429,3.58824986 1.28571429,6.42857143 L1.28571429,9 C1.28571429,11.8403216 3.58824986,14.1428571 6.42857143,14.1428571 L11.5714286,14.1428571 C14.4117501,14.1428571 16.7142857,11.8403216 16.7142857,9 L16.7142857,6.42857143 C16.7142857,3.58824986 14.4117501,1.28571429 11.5714286,1.28571429 L6.42857143,1.28571429 Z"
            id={`Rectangle-0-${nodeId}`}
            fillRule="nonzero"
          />
          <circle
            id={`Oval-${nodeId}`}
            cx="5.14285714"
            cy="7.71428571"
            r="1.28571429"
          />
          <circle
            id={`Oval-1-${nodeId}`}
            cx="9"
            cy="7.71428571"
            r="1.28571429"
          />
          <circle
            id={`Oval-2-${nodeId}`}
            cx="12.8571429"
            cy="7.71428571"
            r="1.28571429"
          />
        </g>
        <rect id={`Rectangle-2-${nodeId}`} x="0" y="0" width="20" height="20" />
      </g>
    </svg>
  );
}

export function iconByKind(id: string, kind: string): React.ReactElement {
  
  // We are looking for the icon of another type of element
  switch (kind) {
    case 'DECISION_MODEL':
      return <DecisionModel size={16} />;
    case 'ENGINE':
      return <Gears size={16} />;
    case 'RULEFLOW':
      return <Ruleflow size={16} />;
    case 'FUNCTIONTASK':
      return <Flash size={16} />;
    case 'DECISION':
      return Decision20(id);
    case 'INPUT_NODE':
      return InputData20(id);
    case 'BUSINESS_RULE':
    case 'DECISION_RULE':
      return <DecisionRule size={16} />;
    case 'BUSINESS_TABLE':
    case 'DECISION_TABLE':
      return <DecisionTable size={16} />;
    case 'ACTION':
      return <Action size={16} />;
    case 'RULEPACKAGE':
      return <RulePackage size={16} />;
    case 'GENERATIVE_AI':
      return <GenerativeAIModel size={16} />;
    case 'DATASET':
      return <BuildRun size={16} />;
    case 'VARIABLE_SET':
      return <VariableSet size={16} />;
    case 'GENERIC':
    default:
      return <DocumentBlank size={16} />;
  }
}

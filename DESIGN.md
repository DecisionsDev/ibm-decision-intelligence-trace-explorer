# Decision Execution Trace Explorer - Design Documentation

## Features

### 🌳 Hierarchical Tree View
- Visual representation of execution flow
- Expandable/collapsible nodes
- Color-coded record types
- Badges for messages and exceptions
- Quick expand/collapse all controls

### 🔄 Bidirectional Navigation
- **Select a record** → View filtered messages and exceptions
- **Click a message** → Navigate to the corresponding record in the tree
- **Click an exception** → Navigate to the corresponding record in the tree

### 📊 Detailed Record Information
- Tabbed interface for Overview, Input, Output, and Properties
- JSON syntax highlighting for data visualization
- Display diff of JSON input/output
- Breadcrumb navigation for deep hierarchies
- Related messages and exceptions display

### 📝 Messages & Exceptions Views
- Dedicated tabs for viewing all messages and exceptions
- Click-to-navigate functionality
- Visual indicators for selected records
- Empty state handling

### 🔥 Flame chart
- Discover the time each decision/node/task/rule is taking

### 🎨 Modern UI
- Carbon Design System components
- Responsive layout
- Dark/light theme support
- Accessible keyboard navigation

## Trace Data Format

The application expects JSON files with the following structure:

```json
{
  "configuration": {
    "executionDuration": boolean,
    "printedMessages": boolean,
    "objectsInMemoryLimit": number,
    "decisionModel": { ... },
    "rules": { ... },
    "ruleflow": { ... }
  },
  "rootRecord": {
    "recordType": "DecisionModel" | "RuleFlow" | ...,
    "recordIndex": "1",
    "properties": {
      "name": string,
      "input": object,
      "output": object,
      "nestedRecords": [ ... ]
    }
  },
  "printedMessages": [
    {
      "recordIndex": "1.3.1.1",
      "message": "..."
    }
  ],
  "exceptionsRaised": [
    {
      "recordIndex": "1.3.1.1",
      "exceptionType": "...",
      "message": "..."
    }
  ]
}
```

Note that there is another format called flat that will be available in a future version of DICMS.

### Record Types

- **DecisionModel**: Root decision model execution
- **DecisionModelNode**: Individual decision nodes (InputData, Decision)
- **RuleFlow**: Root ruleflow execution
- **Task**: Task execution within a ruleflow
- **SequentialEngine**: Sequential rule engine
- **Rule**: Individual rule execution

### Record Index Format

Record indices are hierarchical identifiers (e.g., "1.3.1.1"):
- "1" - Root record
- "1.3" - Third child of root
- "1.3.1" - First child of "1.3"
- "1.3.1.1" - First child of "1.3.1"

## Project Structure

```
TraceExplorer/
├── src/
│   ├── components/
│   │   ├── ConfigurationView/  # View of trace configuration
│   │   ├── TraceLoader/        # File upload and example selection
│   │   ├── LeftPanel/          # Tabbed left panel container
│   │   ├── ExecutionTree/      # Hierarchical tree view
│   │   ├── FlameChart/         # Flame chart
│   │   ├── MessagesView/       # Messages list view
│   │   ├── ExceptionsView/     # Exceptions list view
│   │   └── DetailsPanel/       # Record details display
│   ├── context/
│   │   └── TraceContext.tsx    # Global state management
│   ├── types/
│   │   └── trace.types.ts      # TypeScript type definitions
│   ├── utils/
│   │   ├── IconsByKind.tsx        # Icons
│   │   └── traceUtils.ts       # Utility functions
│   ├── App.tsx                 # Main application component
│   ├── App.scss                # Application styles
│   ├── main.tsx                # Application entry point
│   └── index.scss              # Global styles
├── examples/                   # Example trace files
├── public/                     # Static assets
├── index.html                  # HTML template
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies

```

## Technologies Used

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Carbon Design System** - IBM's open-source design system
- **@carbon/react** - Carbon React components
- **@carbon/icons-react** - Carbon icon library
- **@uiw/react-json-view** - JSON syntax highlighting
- **Sass** - CSS preprocessing

## Architecture

### State Management

The application uses React Context API for global state management:
- `TraceContext` provides trace data and navigation functions
- Bidirectional navigation between records, messages, and exceptions
- Efficient O(1) record lookup using index maps

### Key Features Implementation

#### Bidirectional Navigation
1. Clicking a record filters messages/exceptions by `recordIndex`
2. Clicking a message/exception:
   - Switches to tree tab
   - Expands path to the record
   - Scrolls to and selects the record

#### Performance Optimizations
- Memoized computed values (filtered messages, exceptions)
- Record index map for O(1) lookups
- Lazy rendering of nested records
- Virtual scrolling ready (for very large traces)

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
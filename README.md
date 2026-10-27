# Decision Execution Trace Explorer

A React-based web application for visualizing execution traces from decision models and ruleflows. Built with TypeScript, Vite, and Carbon Design System.


## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ibm-decision-intelligence-trace-explorer
```

2. Install dependencies:
```bash
npm ci
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Loading Traces

#### Option 1: Upload a File
1. Click "Choose file" in the trace loader
2. Select the result of an extended execute, or just a JSON trace file from your computer
3. The trace will be automatically loaded and displayed

#### Option 2: Load Example Trace
1. Use the dropdown menu to select an example trace

### Navigating the Interface

#### Left Panel - 4 Tabs:

1. **Execution Tree**
   - Hierarchical view of all execution records
   - Click any node to view details
   - Use expand/collapse buttons to manage tree state
   - Badges show which records have messages (M) or exceptions (E)

2. **Messages**
   - List of all printed messages in the trace
   - Click any message to navigate to its record
   - Selected record's messages are highlighted

3. **Exceptions**
   - List of all raised exceptions in the trace
   - Click any exception to navigate to its record
   - Detailed exception information with stack traces

4. **Flame chart**
   - Flame chart showing all items (including those with 0ms duration) based on their duration
   - Not available if the execution time wasn't recorded

#### Right Panel - Record Details:

- **Breadcrumb Navigation**: Click any index to navigate up the hierarchy
- **Overview Tab**: Basic record information (type, name, kind, etc.), list of rules, list of tasks
- **Input Tab**: Input parameters and bound objects at start
- **Output Tab**: Output parameters and bound objects at end
- **Diff Tab**: Show the changes between bound objects at start and bound objects at end
- **Properties Tab**: Complete record properties in JSON format
- **Related Messages**: Messages specific to the selected record
- **Related Exceptions**: Exceptions specific to the selected record

### Keyboard Navigation

- **Tab**: Navigate between interactive elements
- **Arrow Keys**: Navigate tree nodes (when focused)
- **Enter/Space**: Expand/collapse tree nodes
- **Escape**: Close modals and dropdowns


## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

# Notice
© Copyright IBM Corporation 2026.

# License
[Apache 2.0](LICENSE)

## Support

For issues, questions, or suggestions, please open an issue on the repository.

---

Built with ❤️ using React, TypeScript, and Carbon Design System

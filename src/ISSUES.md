# Issues in the trace itself

### Distinction between rules and DTs

The action index should be then or else for a regular rule.
For a DT, it should be the index in the DT starting at 1, e.g. #1 or #10.

### Naming of ruleflow

There is no name in the ruleflow record. This is not like the decision model.
This is fixed in the engine.

### Naming of tasks

This is known as a story DBACLD-55460.

### execution duration

The numbers are very strange, they correspond mostly to Java class loading time.
I added executionStartTime to the engine trace, to get nice flame charts.

### Engine

Rule engine could be collapsed in the previous node

# Issues in the explorer UI

## no scrollbar when the view becomes too large


# To be done in the UI

## Missing a search by name
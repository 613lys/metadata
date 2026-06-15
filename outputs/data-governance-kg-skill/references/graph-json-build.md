# Build graph.json From Node YAML

There is no edge YAML. Build edges from fields embedded in node YAML.

## Build Steps

```text
1. Load every YAML file under knowledge/nodes.
2. Validate id, type, name, and description.
3. Normalize node IDs.
4. Create one graph node for every YAML node.
5. Create graph nodes for top-level YAML nodes. Create derived graph nodes for inline table/view/API/feedfile fields when UI/Agent needs field-level impact analysis.
6. Compile embedded relationships into graph edges.
7. Resolve references and report dangling IDs.
8. Write graph.json.
9. Write catalog.json, search.json, lineage.json.
```

## Edge Generation Rules

Lineage edges must be direct. The compiler should not invent transitive edges and should not preserve YAML shortcuts when the YAML says A depends on C only because A reaches C through B. If `A -> B -> C` is represented, do not also create `A -> C` unless A directly reads, writes, calls, or serves C.

Recommended lineage relation names:

```text
consumes      feedfile/table/view -> pipeline
reads         table/view -> pipeline/api/view
writes        pipeline/api/process -> table/view
produces      pipeline/process -> table/view/feedfile
serves        api -> dashboard/frontend
derived_from  source table/view -> derived table/view when no process node is modeled
```

Generate edges from these fields:

```text
node.related_nodes[]                 -> related_nodes[].relation
node.lineage.upstream[]              -> upstream relation, source=upstream.id, target=node.id
node.lineage.downstream[]            -> downstream relation, source=node.id, target=downstream.id
node.quality_checks[]                -> checks, source=quality_check.id, target=node.id
node.quality_checks[].validates[]    -> validates, source=quality_check.id, target=validates.id
table.columns[]                      -> contains, source=table.id, target=derived column id
view.columns[]                       -> contains, source=view.id, target=derived column id
table.columns[].lineage[]            -> field-level lineage
view.columns[].lineage[]             -> field-level lineage
table.columns[].quality_checks[]     -> checks
view.columns[].quality_checks[]      -> checks
object.properties[].maps_to[]        -> maps_to_property
feedfile.fields[].related_nodes[]    -> relation named by field relation or related_to
api.parameters[].related_nodes[]     -> relation named by field relation or related_to
api.returns[].related_nodes[]        -> relation named by field relation or related_to
api.returns[].lineage[]              -> field-level lineage into API response fields
dashboard.displays[]                 -> displays
scenario.child_scenarios[]           -> contains_scenario
scenario.scenario_flow[]             -> scenario_flow[].relation or precedes by default
```

## graph.json Shape

```json
{
  "nodes": [
    {
      "id": "table.margin.margin_calculation",
      "type": "table",
      "label": "margin_calculation",
      "properties": {
        "description": "Stores calculated margin results.",
        "verified": false,
        "confidence": "medium"
      }
    }
  ],
  "edges": [
    {
      "id": "edge.table.margin.margin_calculation.related.object.margin_call",
      "type": "represents",
      "source": "table.margin.margin_calculation",
      "target": "object.margin_call",
      "properties": {
        "description": "This table stores margin-call level calculation results.",
        "verified": false
      }
    }
  ]
}
```

## catalog.json

Map each node ID to its full YAML-derived detail.

## search.json

Flatten names, aliases, descriptions, tags, terms, owners, fields, and related node labels for search.

## lineage.json

Precompute upstream and downstream adjacency from `lineage` fields and generated dependency edges.

## Business Context Projection

The Business Context view should be a projection of the graph created from YAML. It should render existing edges among visible `scenario`, `term`, `object`, `asset`, and `quality_check` nodes in the active scenario context.

```text
include:
- scenario-to-scenario business handoff edges from scenario_flow
- scenario/object/term/asset/quality edges from related_nodes
- quality-to-business edges from quality_checks.validates
- quality-to-executable asset edges from quality_checks

exclude:
- asset-to-asset technical data-flow edges
- field/column nodes unless the view explicitly expands fields
- term-to-column/field mappings when fields are collapsed
```

Technical data-flow edges from `lineage` remain in `graph.json` because Catalog and Lineage need them, but they should not be treated as business-context edges. Do not create direct `term -> asset` shortcut edges; terms should map to columns/fields when the mapping is field-level. If a business-context edge looks wrong, fix the YAML relationship instead of hiding it in the UI.

## Field Map Projection

Use a separate Field Map view for field-level information that is intentionally hidden from Catalog and Business Context by default. The default layout should be global and asset-centric, like a database ER diagram:

```text
asset box
  field
  field
  field

field -> field lineage edges between asset boxes
```

Render:

```text
all assets that contain fields
all fields inside each asset box
field descriptions and data types
field-to-field lineage edges across assets, including dashboard displayed fields
term/object/scenario mappings in the field profile
quality checks in the field profile
asset-level quality checks as chips inside the asset box
field-level quality checks as badges on the field row
cross-asset quality checks repeated as the same quality chip inside every involved asset box
```

For `dashboard.displays[]`, create one derived `dashboard_field` node per displayed field and a field-level lineage edge:

```text
source column/API/view field -> dashboard_field
```

For standalone `quality_check.targets[]`, create `checks` edges to the target asset and, when `targets[].fields` is present, also create `checks` edges to each concrete field node. This lets Field Map repeat one cross-asset quality chip in all involved asset boxes and highlight all target fields when selected.

Do not collapse `term -> column` into `term -> table` or `term -> api`. The exact field mapping is what makes the graph useful for Agent query and impact analysis.

## Validation Warnings

Report:

- Dangling references.
- Duplicate IDs.
- Related node entries without `description`.
- Quality checks without target or expectation.
- Technical fields that appear hand-written but should come from source systems.
- Lineage entries without description.
- Lineage entries that look transitive, such as `feedfile -> table` when a pipeline also connects them, or `table -> dashboard` when API/view nodes sit in between.

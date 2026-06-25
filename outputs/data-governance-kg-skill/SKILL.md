---
name: data-governance-kg
description: |
  Build and query a lightweight data-governance semantic graph for a data
  domain. Model business entities, glossary terms, physical tables, physical
  views, derived columns, derived business properties, field mappings, direct
  lineage, named business flows, constraints, and verified descriptions. YAML
  files are the source of truth; generated JSON indexes power the UI and Agent
  queries.
---

# Data Governance Semantic Graph

Use this skill when a user wants an Agent-maintained data catalog and semantic graph without deploying a full metadata platform.

The current implementation uses a lightweight project YAML format. It does not store data in OSI format by default.

## Model

```text
semantic level
  business_entity
  term
  business_entity_property  derived from business_entity.properties[]

physical data level
  table
  view
  column                    derived from table/view columns[]

process view level
  flow                      named view over existing graph nodes and edges
```

Top-level source YAML lives under:

```text
knowledge/
  nodes/
    business_entities/
    terms/
    tables/
    views/
  flows/
  indexes/
```

`business_entity_property` and `column` are generated graph nodes from inline YAML fields. They are not separate YAML files unless a project explicitly needs independent field profiles.

## Source Of Truth

YAML source files are authoritative. Generated JSON files are read models for UI and Agent query.

```text
knowledge/nodes/**/*.yaml        source of truth for graph nodes and graph edges
knowledge/flows/*.yaml           source of truth for named flow views
knowledge/indexes/graph.json     generated graph nodes and graph edges
knowledge/indexes/catalog.json   generated full node details
knowledge/indexes/flows.json     generated flow views
knowledge/indexes/search.json    generated search index
knowledge/indexes/lineage.json   generated lineage adjacency
frontend/graph-data.js           generated browser graph wrapper
frontend/catalog-data.js         generated browser catalog wrapper
frontend/flows-data.js           generated browser flow wrapper
frontend/views-data.js           generated browser curated-view wrapper
```

Do not create standalone edge YAML. Graph edges are compiled from fields embedded inside node YAML. Flow YAML may reference existing graph edge IDs and add flow-specific metadata such as step, lifecycle, dependency, SLA, and condition.

## Modeling Workflow

Build or update a graph in this order.

1. Inventory source metadata.
   - Read database catalogs, table schemas, column comments, keys, SQL, code, documents, and user-provided domain notes.
   - Do not invent physical column names, data types, source tables, or view definitions.
   - Mark inferred semantic facts as unverified and include evidence.

2. Identify business entities.
   - A `business_entity` is a real business thing the organization reasons about: something with identity, lifecycle, status, important measures, or relationships to other business things.
   - Examples: Customer Order, Refund Request, Refund Decision, Payment Refund.
   - Do not create a business entity merely because a table exists.

3. Define entity properties.
   - Add only properties that truly belong to the business entity.
   - Use `semantic_role` for important properties: `identifier`, `dimension`, `time_dimension`, `fact`, `measure`, or `status`.
   - Do not mirror every table column into the entity. Purely technical columns remain only in table/view YAML.

4. Create glossary terms.
   - A `term` defines meaning for a business entity, business property, or physical field.
   - Use `business_entity.term` for entity-level glossary concepts.
   - Use `business_entity.properties[].term` for property-level concepts.
   - Use `table/view.columns[].term` for field-level concepts.

5. Add constraints.
   - Constraints are properties of the thing they govern: business entity, business property, relationship/action, table, view, or flow edge.
   - Use constraints for quality, validity, lifecycle rules, referential rules, reconciliation, accepted values, ranges, and freshness.
   - Do not create standalone quality-check nodes by default.

6. Inventory physical data assets.
   - Create `table` and `view` YAML from database catalogs, `information_schema`, dbt catalog, migrations, ORM metadata, or SQL definitions.
   - Read column names, data types, nullability, keys, and view SQL from source systems.
   - Use conservative descriptions when source evidence is weak.

7. Map semantics to physical data.
   - Use `business_entity.mapped_assets[]` to connect a business entity to the table/view that stores or represents it.
   - Use `business_entity.properties[].maps_to[]` to connect a business property to concrete columns.
   - Use `business_entity.properties[].related_nodes[]` for property-to-property semantic relationships such as identifier references, derivations, reconciliations, or cross-entity constraints.
   - Map only meaningful properties. Technical implementation fields can remain unmapped.

8. Add direct relationships and lineage.
   - Use node-level `related_nodes[]` for semantic relationships between business entities, terms, or assets.
   - Use `lineage` for direct table/view and column dependencies.
   - Keep relation labels coarse and selected from `references/relation-types.md`.
   - Put business conditions in `description`, `constraints`, or flow edge fields, not in custom relation names.

9. Add business flows when process order matters.
   - Create `knowledge/flows/flow.<name>.yaml` after graph nodes and base graph edge IDs are stable.
   - A `flow` is not a normal graph node. It is a named graph view with process semantics.
   - Reference existing graph node IDs in `nodes[]`.
   - Reference existing graph edge IDs in `edges[].base_edge` whenever possible.
   - Use flow edge `source` and `target` for business display direction, even when the base edge has the opposite semantic direction.
   - Use `step` for order and `edge_dependencies[]` for edge-to-edge dependencies or gating.
   - Build flow YAML into `knowledge/indexes/flows.json` and `frontend/flows-data.js`.

10. Add governance trust fields.
   - Add `owner` when a business or data steward is accountable for the definition or asset.
   - Add `evidence` for important descriptions, mappings, lineage, relationships, constraints, and flow edges.
   - Add `verified` to distinguish confirmed knowledge from useful but inferred knowledge.

11. Ask the user to confirm uncertain semantics.
   - Confirm entity boundaries, ambiguous terms, relationship meaning, property meanings, field mappings, flow order, and business rules.
   - Keep unconfirmed descriptions useful but explicit about uncertainty.

## Required References

Load these files progressively when creating or modifying YAML:

- Shared fields and conventions: `references/common-node-fields.md`
- Business entity YAML: `references/business-entity-node.md`
- Term YAML: `references/term-node.md`
- Table YAML: `references/table-node.md`
- View YAML: `references/view-node.md`
- Flow YAML: `references/flow-node.md`
- Controlled relation vocabulary: `references/relation-types.md`
- Graph build rules: `references/graph-json-build.md`

Only load `references/osi-generation-practices.md` if the user explicitly asks to convert this project to OSI or compare against OSI. OSI is not the default storage format for the current implementation.

## Node Types

Top-level source YAML types:

```text
business_entity
term
table
view
flow
```

Top-level visible graph node types:

```text
business_entity
term
table
view
```

Derived graph node types:

```text
business_entity_property
column
```

Minimum source fields:

```text
business_entity  id, type, name, description, owner, properties, mapped_assets, related_nodes, constraints, evidence, verified
term             id, type, name, description, definition, aliases, owner, related_nodes, evidence, verified
table            id, type, name, description, owner, schema, columns, primary_key, related_nodes, lineage, evidence, verified
view             id, type, name, description, owner, schema, definition/sql, columns, related_nodes, lineage, evidence, verified
flow             id, type, name, description, owner, nodes, edges, edge_dependencies, evidence, verified
```

`flow` appears in catalog search as a flow result, not as a normal graph node in `graph.json`.

## Relation Rules

Relations connect graph nodes. The relation value must come from `references/relation-types.md`.

Common relations:

```text
business_entity -> business_entity
  CREATES
  REFERENCES
  DEPENDS_ON
  DERIVES_FROM
  AGGREGATES
  RECONCILES_WITH
  SETTLES
  VALUES
  PART_OF
  CHILD_OF
  RELATED_TO

business_entity/property/column -> term
  HAS_TERM

business_entity_property -> column
  MAPS_TO

business_entity -> table/view
  IMPLEMENTED_BY
  REPRESENTED_BY

table/view -> column
  CONTAINS

view/table/column lineage
  READS_FROM
  DERIVES_FROM

flow edge and flow dependency
  INITIATES
  PRODUCES
  ENABLES
  PRECEDES
  DEPENDS_ON
  BLOCKS
  COMPLETES
  RELATED_TO
```

Every reasoning-relevant edge needs a `description`. The relation label answers "what kind of connection is this"; the description answers "why this connection exists in this business/system."

Write one source-of-truth edge for a relationship. Do not add the inverse edge just to make traversal easier. Use generated indexes and UI aggregation for reverse traversal or bidirectional display.

## Build And Query Runtime

Recommended local flow:

```powershell
python scripts/build_graph.py
python -m http.server 8765 -d frontend
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

Frontend build contract:

```text
frontend/index.html is a committed static UI shell.
frontend/vendor/elk.bundled.js is a committed local ELKJS layout dependency used by the graph page.
scripts/build_graph.py does not generate or overwrite index.html.
scripts/build_graph.py generates graph-data.js, catalog-data.js, flows-data.js, and views-data.js.
If YAML changes, rerun scripts/build_graph.py and refresh the browser.
If app.js/style.css/index.html or frontend vendor files change, update those frontend files directly and bump their query-string version in index.html when browser cache may matter.
```

Agent query tools should read generated JSON indexes, not scrape the UI.

Useful query operations:

```text
search(query, type?)
get_node(id)
neighbors(id, depth=1, edge_type?)
upstream(id)
downstream(id)
field_lineage(column_id)
constraints_for(id)
fields_for_term(term_id)
assets_for_entity(entity_id)
entity_relationships(entity_id)
list_flows()
get_flow(flow_id)
flow_edges(flow_id)
unverified()
```

If `scripts/kg_query.py` exists, use it as the default CLI interface.

## UI Expectation

The UI should be a catalog explorer:

```text
search nodes, edges, and flows
filter by node type, edge type, and tag/data type
open a node-centered graph neighborhood
open a named flow graph from flow YAML
show node profile, edge profile, field profile, and flow edge profile
show both flow-specific edge metadata and base graph edge metadata
hide/show node properties
draw field/property-level edges only after a concrete field/property is selected
auto-layout the graph with ELKJS
allow manual drag adjustment after layout
save reusable graph filter/layout views when the UI supports it
```

`column` and `business_entity_property` nodes are collapsed inside their parent table/view/business entity by default.

## Validation Checklist

Before finishing a graph update, check:

```text
No duplicate node IDs.
No dangling references.
No missing top-level descriptions.
No invented physical columns or data types.
No transitive lineage shortcuts.
No custom relation names outside the controlled vocabulary.
No entity properties that merely mirror technical columns.
No term-to-table shortcut when the meaning belongs to a field.
Constraints have type, description, and governed target.
Flow YAML references existing graph node IDs.
Flow edges reference existing base graph edge IDs when the relationship already exists.
Flow order uses step; flow dependencies use edge_dependencies[].
Uncertain business facts are marked for user confirmation.
Generated indexes and frontend wrappers are rebuilt after YAML changes.
Browser verification covers at least one node, one edge, one field/property relationship, and one flow when flow YAML exists.
```

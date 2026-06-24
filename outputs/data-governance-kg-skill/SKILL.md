---
name: data-governance-kg
description: |
  Build and query a lightweight data-governance semantic graph for a data
  domain. Model business entities, glossary terms, physical tables, physical
  views, derived columns, derived business properties, field mappings, direct
  lineage, constraints, and verified descriptions. YAML node files are the
  source of truth; generated JSON indexes power the UI and Agent queries.
---

# Data Governance Semantic Graph

Use this skill when a user wants an Agent-maintained data catalog and semantic graph without deploying a full metadata platform.

The graph models a data domain at two levels:

```text
semantic level
  business_entity
  term
  business_entity_property  derived from business_entity.properties[]

physical data level
  table
  view
  column                    derived from table/view columns[]
```

Top-level YAML files exist only for:

```text
knowledge/
  nodes/
    business_entities/
    terms/
    tables/
    views/
  indexes/
    graph.json
    catalog.json
    search.json
    lineage.json
```

`business_entity_property` and `column` are graph nodes generated from inline YAML fields. They are not separate YAML files unless a project explicitly needs very large independent field profiles.

## Source Of Truth

YAML node files are the source of truth. Generated JSON files are read models for UI and Agent query.

```text
knowledge/nodes/**/*.yaml        source of truth
knowledge/indexes/*.json         generated query indexes
frontend/graph-data.js           generated browser data wrapper
frontend/catalog-data.js         generated browser data wrapper
```

Do not create edge YAML. Edges are compiled from fields embedded inside node YAML.

## Modeling Workflow

Build a new data-domain graph in this order.

1. Identify business entities.
   - A `business_entity` is a real business thing the organization reasons about: something with identity, lifecycle, status, important measures, or relationships to other business things.
   - Examples: Customer Order, Refund Request, Refund Decision, Payment Refund.
   - Business processes are represented by relationships among business entities, not by a separate process node type.
   - Start from user-provided business descriptions, business documents, data product descriptions, metric definitions, operational workflows, and domain interviews.

2. Define entity properties.
   - Add only properties that truly belong to the business entity.
   - Use `semantic_role` for each important property: `identifier`, `dimension`, `time_dimension`, `fact`, `measure`, or `status`.
   - Do not mirror every table column into the entity. Purely technical columns remain only in table/view YAML.

3. Create glossary terms.
   - A `term` defines meaning for a business entity, business property, or physical field.
   - Use `business_entity.term` for the entity-level glossary concept.
   - Use `business_entity.properties[].term` for property-level concepts.
   - Use `table/view.columns[].term` for field-level concepts.
   - Prefer precise field-level term mappings over broad table-level mappings.

4. Add constraints.
   - Constraints are properties of the thing they govern: business entity, business property, relationship/action, table, or view.
   - Use constraints for quality, validity, lifecycle rules, referential rules, reconciliation, accepted values, ranges, and freshness.
   - Start with business constraints from entity definitions and lifecycle rules before adding schema-derived checks.

5. Inventory physical data assets.
   - Create `table` and `view` YAML from database catalogs, `information_schema`, dbt catalog, migrations, ORM metadata, or SQL definitions.
   - Read column names, data types, nullability, keys, and view SQL from source systems.
   - Do not invent physical column names or data types.
   - Use conservative descriptions when source evidence is weak.

6. Map semantics to physical data.
   - Use `business_entity.mapped_assets[]` to connect a business entity to the table/view that stores or represents it.
   - Use `business_entity.properties[].maps_to[]` to connect a business property to concrete columns.
   - Map only meaningful properties. Technical implementation fields can remain unmapped.

7. Add direct relationships and lineage.
   - Use `related_nodes[]` for semantic relationships between business entities or terms.
   - Use `lineage` for direct table/view and column dependencies.
   - Keep relation labels coarse and selected from `references/relation-types.md`.
   - Put business conditions in `description` and `constraints`, not in custom relation names.

8. Add governance trust fields.
   - Add `owner` when a business or data steward is accountable for the definition or asset.
   - Add `evidence` for important descriptions, mappings, lineage, relationships, and constraints.
   - Add `verified` to distinguish confirmed knowledge from useful but inferred knowledge.

9. Ask the user to confirm uncertain semantics.
   - Confirm entity boundaries, ambiguous terms, relationship meaning, property meanings, field mappings, and business rules.
   - Keep unconfirmed descriptions useful but explicit about uncertainty.

Example uncertainty marker:

```yaml
description: Needs user confirmation: appears to store booking eligibility based on column name and view SQL usage.
verified:
  status: false
  reason: inferred_from_name_and_usage
```

## Required References

Load these files progressively when creating or modifying YAML:

- Shared fields and conventions: `references/common-node-fields.md`
- Business entity YAML: `references/business-entity-node.md`
- Term YAML: `references/term-node.md`
- Table YAML: `references/table-node.md`
- View YAML: `references/view-node.md`
- Controlled relation vocabulary: `references/relation-types.md`
- Graph build rules: `references/graph-json-build.md`

## Node Types

Top-level YAML node types:

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

Minimum top-level fields:

```text
business_entity  id, type, name, description, owner, properties, mapped_assets, related_nodes, constraints, evidence, verified
term             id, type, name, description, definition, aliases, owner, related_nodes, evidence, verified
table            id, type, name, description, owner, schema, columns, primary_key, related_nodes, lineage, evidence, verified
view             id, type, name, description, owner, schema, definition/sql, columns, related_nodes, lineage, evidence, verified
```

## Semantic Roles

Use `semantic_role` on business entity properties:

```text
identifier       identifies an entity, such as order_id or refund_request_id
dimension        categorical context, such as counterparty, region, product_type
time_dimension   date/time context, such as order_created_at or decision_at
fact             row-level quantitative fact, such as quantity or item_count
measure          business numeric value used for analysis, such as refund_amount
status           lifecycle/status value, such as request_status or approval_status
```

Do not put `semantic_role` on table/view columns. Columns are physical fields; their business role is expressed by mapping them to `business_entity.properties[]`.

## Tags And Constraints

These are properties by default, not graph nodes:

```text
tags
constraints
semantic_role
```

Use `tags` as lightweight taxonomy facets:

```yaml
tags:
  - domain.commerce
  - lifecycle.refund
  - sensitivity.internal
```

Model hierarchy as relations between real nodes:

```yaml
related_nodes:
  - id: business_entity.financial_obligation
    relation: CHILD_OF
    description: Margin Call is a specialized financial obligation.
```

Use `CHILD_OF` for subtype, specialization, roll-up, or parent/child hierarchy. Use `PART_OF` for composition. Do not create relation edges for tags, constraints, or semantic roles unless the project explicitly promotes them into first-class nodes.

## Owner, Evidence, Verified

Use these fields to make the graph trustworthy for Agent use:

```yaml
owner:

evidence:
  - kind:
    ref:

verified:
  status: true | false
  by:
  at:
  reason:
```

Guidance:

- `owner` answers who is accountable for the definition, asset, or rule. Keep it as a simple string such as `Margin Operations` or `Risk Data Engineering`.
- `evidence` answers where the claim came from: schema, SQL, code, document, test, or human confirmation.
- `verified` answers whether the claim has been confirmed by an owner, user, source system, test, or trusted process.
- Use these fields on important business entities, physical assets, lineage, constraints, and inferred semantic mappings.

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
```

Every reasoning-relevant edge needs a `description`. The relation label answers "what kind of connection is this"; the description answers "why does this connection exist in this business/system."

## Direct Lineage

Lineage must describe direct dependencies only.

```text
Good: view.analytics.v_order_summary READS_FROM view.analytics.v_orders
Bad:  view.analytics.v_order_summary READS_FROM table.raw.orders
      when the real path is table.raw.orders -> view.analytics.v_orders -> view.analytics.v_order_summary
```

For columns, use `DERIVES_FROM` from derived column to source column.

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
scripts/build_graph.py generates the data files consumed by index.html.
If YAML changes, rerun scripts/build_graph.py and refresh the browser.
If app.js/style.css/index.html or frontend vendor files change, update those frontend files directly and bump their query-string version in index.html when browser cache may matter.
```

Generated outputs:

```text
knowledge/indexes/graph.json       graph nodes and edges
knowledge/indexes/catalog.json     full node details
knowledge/indexes/search.json      search index
knowledge/indexes/lineage.json     upstream/downstream adjacency
frontend/graph-data.js             browser wrapper
frontend/catalog-data.js           browser wrapper
frontend/views-data.js             browser wrapper
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
unverified()
```

If `scripts/kg_query.py` exists, use it as the default CLI interface:

```powershell
python scripts/kg_query.py search refund
python scripts/kg_query.py get business_entity.refund_request
python scripts/kg_query.py neighbors business_entity.refund_request --depth 2
python scripts/kg_query.py upstream view.analytics.v_refund_lifecycle
python scripts/kg_query.py fields-for-term term.refund_amount
python scripts/kg_query.py assets-for-entity business_entity.refund_request
```

## UI Expectation

The UI should be a catalog explorer:

```text
search node by name/id/description/tag
select one node as focus
filter visible neighborhood by node type
filter visible neighborhood by edge type
filter by tag
choose max depth
show related nodes and edges
show node profile
show edge profile
auto-layout the graph with ELKJS
allow manual drag adjustment after layout
```

`column` and `business_entity_property` nodes are collapsed inside their parent table/view/business entity by default. Show field/property-level connections only after the user selects a concrete field/property; then expand the linked parent nodes and draw only the selected field/property relationships.

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
Uncertain business facts are marked for user confirmation.
```

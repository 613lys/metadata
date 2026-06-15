---
name: data-governance-kg
description: |
  Build and query a lightweight data-governance knowledge graph from scenarios,
  documents, database schemas, code, feed files, APIs, dashboards, and user
  confirmation. Use YAML node files as source of truth and generate graph.json
  for UI and Agent query. There is no edge YAML; lineage, quality, and semantic
  relationships live inside node YAML files and are compiled into graph edges.
---

# Data Governance Knowledge Graph

Use this skill to create a data-governance graph with:

```text
knowledge/
  nodes/
    scenarios/
    terms/
    objects/
    tables/
    views/
    feedfiles/
    apis/
    dashboards/
    pipelines/
    quality_checks/
  indexes/
    graph.json
    catalog.json
    search.json
    lineage.json
```

YAML node files are the source of truth. Generated JSON indexes are query and UI artifacts. Do not create `edges.yaml`; all graph edges are generated from fields embedded in node YAML.

Generate node YAML from real sources whenever possible:

```text
tables/views/columns  -> database catalogs, information_schema, dbt catalog, migrations, ORM metadata
feedfiles             -> file contracts, samples, ingestion configs
apis                  -> OpenAPI, routes, controllers, protobuf/GraphQL schemas
dashboards            -> BI exports, dashboard configs, embedded SQL
pipelines             -> Airflow/Dagster/dbt/Spark/SQL/job configs
terms/objects/scenarios -> documents, user input, interviews, confirmed business knowledge
```

## Core Workflow

Build the graph in two passes: create the technical skeleton from real systems first, then add business meaning from scenarios.

1. Inventory technical sources and create skeleton YAML for `table`, `view`, `feedfile`, `api`, `dashboard`, and `pipeline`.
   - Read table/view/column names, data types, nullability, keys, and view SQL from database catalogs, dbt catalog, migrations, or ORM metadata.
   - Read API parameters and response fields from OpenAPI, route/controller code, GraphQL/protobuf schemas, query builders, or tests.
   - Read feed file fields from file contracts, sample files, ingestion configs, or pipeline code.
   - Read dashboard displayed fields from BI exports, dashboard configs, semantic model files, or embedded SQL.
   - Read pipeline inputs/outputs from Airflow/Dagster/dbt/Spark/SQL/job configs.
   - At this stage, do not invent business descriptions. Use conservative placeholders only when the field is visible in source but the meaning is unknown.
2. Add direct technical lineage from source evidence.
   - Keep only direct runtime dependencies. For example, `feedfile -> pipeline -> table`, not `feedfile -> table`.
   - Prefer writing lineage on the node that performs the action: pipeline reads/writes, API reads/serves, view reads.
3. Create parent and child `scenario` nodes from the user's business flow.
   - Parent scenarios group the business journey.
   - Child scenarios represent sub-processes with distinct assets, business rules, handoffs, or quality concerns.
   - Use `scenario_flow` for scenario-to-scenario handoffs, and write a description for why the handoff exists.
4. Use scenarios to enrich the skeleton top down.
   - Link each scenario to the assets that implement or support it with `related_nodes`.
   - Fill asset and field descriptions only when they are supported by source evidence or user confirmation.
   - Ask the user when a description, owner, scenario boundary, lineage edge, or business rule is uncertain.
5. Infer candidate `term` and `object` nodes from scenarios and assets, then ask the user to confirm.
   - A `term` is a business word or concept that needs definition, aliases, or field interpretation.
   - An `object` is a business entity with properties, lifecycle, status, or representation in assets.
   - It is acceptable to draft candidate terms/objects from scenario text, table names, API response fields, and dashboard labels, but do not mark ambiguous meanings as verified without user confirmation.
6. Infer candidate quality checks, then ask the user to confirm and add missing checks.
   - Start with obvious checks from schemas and code: not-null, enum, range, freshness, required parameter, pipeline success.
   - Propose business checks from scenario logic: state transitions, cross-field consistency, cross-table completeness, reconciliation.
   - Attach executable checks to assets/fields; use `validates` to explain which scenario/object/term the rule protects.
7. Build `graph.json` by compiling embedded YAML relationships into nodes and edges. Generated JSON is a UI/Agent query artifact, not the source of truth.

When information is uncertain, leave the node useful but honest:

```yaml
description: Needs user confirmation: appears to store refund approval status based on column name and API usage.
verified:
  status: false
  reason: inferred_from_name_and_usage
```

## Load References Progressively

- Shared required fields and relationship conventions: `references/common-node-fields.md`
- Scenario node YAML: `references/scenario-node.md`
- Term node YAML: `references/term-node.md`
- Object node YAML: `references/object-node.md`
- Table node YAML: `references/table-node.md`
- View node YAML: `references/view-node.md`
- Feed file node YAML: `references/feedfile-node.md`
- API node YAML: `references/api-node.md`
- Dashboard node YAML: `references/dashboard-node.md`
- Pipeline node YAML: `references/pipeline-node.md`
- Quality check YAML: `references/quality-check-node.md`
- Graph generation rules: `references/graph-json-build.md`

## Non-Negotiables

- Every node must include `id`, `type`, `name`, and `description`.
- Use `related_nodes` for semantic or business relationships to any node type.
- Use `lineage` only for direct data movement or direct runtime dependency. Do not write transitive shortcuts such as `feedfile -> table` when the real path is `feedfile -> pipeline -> table`.
- Put simple executable checks inline on the asset/field with `quality_checks`. Use standalone `quality_check` nodes with `targets` for multi-field, cross-asset, policy-like, or reused rules. Use `validates` to link the protected `scenario`, `object`, or `term`.
- Put `evidence` and `verified` on technical assets, lineage entries, quality checks, rules, or inferred relationships when trust matters.
- Do not mechanically add `owner`, `domain`, `confidence`, `evidence`, or `verified` to lightweight semantic nodes such as simple terms.
- For tables, use `table.<schema>.<table>` as the default ID. For columns, use `column.<schema>.<table>.<column>`.
- Do not invent table fields, column names, or data types. Read them from the database/schema/code source.
- Ask the user before verifying ambiguous terms, objects, scenario boundaries, business rules, or lineage.

## Node Types And Core Fields

Load the matching reference file for exact YAML format and examples. These are the minimum fields the Agent should understand for each node type:

```text
scenario       id, type, name, description, parent_scenario, child_scenarios, scenario_flow, business_logic, related_nodes
term           id, type, name, description, definition, aliases, related_nodes
object         id, type, name, description, properties, related_nodes
table          id, type, name, description, schema, columns, primary_key, related_nodes, lineage, quality_checks
view           id, type, name, description, schema, definition/sql, columns, related_nodes, lineage, quality_checks
column         derived from table/view columns; use column.<schema>.<table>.<column> or column.<schema>.<view>.<column>
feedfile       id, type, name, description, location, format, frequency, owner, fields, related_nodes, quality_checks
api            id, type, name, description, parameters, returns, logic, related_nodes, lineage, quality_checks
dashboard      id, type, name, description, platform, url, displays, related_nodes, lineage when directly querying data
pipeline       id, type, name, description, platform, schedule, code_refs, related_nodes, lineage, quality_checks
quality_check  id, type, name, description, check_type, severity, targets, rule, related_nodes, validates
```

`column` and dashboard displayed-field nodes are usually derived graph nodes created by the builder from inline `columns`, API `returns`, feedfile `fields`, and dashboard `displays`. Create standalone YAML for a field only when the field needs a large independent profile that would make the asset YAML hard to maintain.

## Edge Types And Where They Come From

Do not create edge YAML. Create edges only from node fields:

```text
contains              table/view/api/feedfile/dashboard -> derived field node
contains_scenario     parent scenario -> child scenario
precedes/enables/...   scenario.scenario_flow source -> target
related_to or custom   related_nodes[] source -> target
consumes              feedfile/table/view -> pipeline
reads                 table/view/feedfile -> pipeline/api/view/dashboard
writes                pipeline/api/process -> table/view/feedfile
produces              pipeline/process -> table/view/feedfile
serves                api -> dashboard/frontend grid
displays              source field -> dashboard displayed field
lineage               source field -> derived field
maps_to_property      object property -> column/API/feedfile/dashboard field
checks                quality_check -> asset/field
validates             quality_check -> scenario/object/term
implemented_by        scenario/object -> asset, when explicitly described
served_by             object/scenario -> api/dashboard, when explicitly described
defines/explains      term -> object/scenario/term
mapped_to             term -> concrete field/column, not whole asset
```

Every edge that affects reasoning should carry a `description`. The label answers "what kind of relationship is this"; the description answers "why does this relationship exist in this business/system".

## Runtime Order: YAML To UI And Agent Query

Use this execution order after YAML files exist:

```text
source systems/docs/user input
  -> knowledge/nodes/**/*.yaml
  -> build_graph.py or equivalent compiler
  -> knowledge/indexes/graph.json
  -> knowledge/indexes/catalog.json
  -> knowledge/indexes/search.json
  -> knowledge/indexes/lineage.json
  -> frontend/graph-data.js, catalog-data.js, views-data.js
  -> static UI loads data JS files
  -> Agent CLI/MCP queries JSON indexes or graph API
```

The source of truth is always `knowledge/nodes/**/*.yaml`. If the YAML changes, rerun the graph builder. The UI should not edit or own graph facts unless it writes changes back to YAML and rebuilds.

Recommended local command flow:

```powershell
python -m pip install -r requirements.txt
python scripts/build_graph.py
python -m http.server 8765 -d frontend
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

The builder should write two kinds of outputs:

```text
knowledge/indexes/*.json
  Agent/CLI/MCP query artifacts. These are stable data products.

frontend/*-data.js
  Browser-friendly wrappers such as window.GRAPH_DATA = {...}.
  These let a static HTML UI load graph data without a backend server.
```

If the UI is served by a real backend later, it can fetch `knowledge/indexes/*.json` directly instead of using `frontend/*-data.js`.

Use this change loop:

```text
1. Edit or generate YAML.
2. Run builder.
3. Fix validation warnings: duplicate IDs, missing descriptions, dangling refs, suspicious transitive lineage.
4. Refresh UI.
5. Inspect Browse/Catalog/Semantics/Field Map/Asset Profile.
6. Ask user to confirm uncertain descriptions, terms, objects, quality checks, and lineage.
7. Write confirmed corrections back to YAML.
8. Rebuild.
```

For Agent usage, expose commands or MCP tools over the generated indexes:

```text
search(query, type?)
get_node(id)
neighbors(id, depth=1, edge_type?)
upstream(id)
downstream(id)
field_lineage(field_id)
quality_for(id)
assets_for_scenario(scenario_id)
fields_for_term(term_id)
assets_for_object(object_id)
unverified()
```

These query tools should read generated JSON indexes, never scrape the UI.

If the project includes `scripts/kg_query.py`, use it as the default Agent query interface after running the builder:

```powershell
cd <project-root>
python scripts/kg_query.py search margin_call_id
python scripts/kg_query.py search margin --type term
python scripts/kg_query.py get table.margin.margin_calculation
python scripts/kg_query.py neighbors table.margin.margin_calculation
python scripts/kg_query.py neighbors table.margin.margin_calculation --edge-type reads
python scripts/kg_query.py upstream api.margin.get_margin_settlement_summary
python scripts/kg_query.py downstream table.margin.margin_calculation --depth 2
python scripts/kg_query.py quality table.booking.booking_order
python scripts/kg_query.py fields-for-term term.margin
python scripts/kg_query.py assets-for-scenario scenario.settlement
python scripts/kg_query.py assets-for-object object.margin_call
```

The CLI returns JSON so the Agent can parse it directly. Treat CLI results as generated query output; if a result is wrong, fix YAML and rerun `python scripts/build_graph.py`.

## Direct Lineage Rule

Lineage in YAML is source-of-truth, so it must describe only direct references:

```text
Good: feedfile -> pipeline -> table -> view -> api -> dashboard
Bad:  feedfile -> table, pipeline -> dashboard, table -> dashboard
```

Prefer declaring direct lineage on the node that performs the action:

```text
pipeline upstream relation=consumes/reads
pipeline downstream relation=writes/produces
view upstream relation=reads
api upstream relation=reads
api downstream relation=serves
```

If a missing process explains the dependency, create that process/API/pipeline/frontend node or keep the dependency in a description. Do not create graph edges for reachable-but-not-direct relationships.

## UI Projections

Use three complementary views instead of one overloaded graph:

```text
Catalog / Implementation
  shows scenario-contained assets and direct asset data-flow edges:
  feedfile -> pipeline -> table/view -> api -> dashboard

Business Context
  shows scenario, term, object, asset, and quality_check semantic relationships.
  Do not show asset-to-asset data-flow edges here.
  Do not expand fields/columns here.

Field Map
  shows all assets as ER-style boxes that contain their fields.
  Draw field-to-field lineage edges between fields across assets.
  Clicking a field shows field meaning, parent asset, semantic mappings, field-level lineage, and quality.
  Show asset-level quality checks as compact chips inside the asset box.
  Show field-level quality checks as badges on the field row and details in the field profile.
  For cross-asset quality checks, repeat the same quality chip in every involved asset box; clicking it highlights all target assets and fields.
  This view is global by default; do not group it by scenario unless the user explicitly asks for a scenario filter.
```

Term-to-data mappings should point to real fields/columns, not to whole assets. When fields are collapsed in Business Context, those mappings are intentionally absent from that view and should appear in Field Map.

## Supported Node Types

```text
scenario
term
object
table
view
column
feedfile
api
dashboard
pipeline
quality_check
```

## Supported Agent Queries

The generated graph should support:

```text
search node by name/type/tag
get node by id
get upstream/downstream lineage
impact analysis
find fields mapped to a term
find assets representing an object
find assets supporting a scenario
find unverified relationships
find quality checks for an asset or field
find missing owner/tag/description/evidence
```

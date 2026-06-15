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

1. Start with `scenario` nodes when the user describes a business process.
2. Split broad flows into child `scenario` nodes when each sub-process has its own assets, rules, quality checks, or owners.
3. Extract `term` and `object` nodes from each scenario. Ask the user when meaning or object boundaries are unclear.
4. Create technical nodes from schemas, code, feed files, APIs, dashboards, and pipelines.
5. Put relationships, lineage, quality checks, policies, evidence, and verification inside the relevant node YAML.
6. Build `graph.json` by compiling embedded relationships into nodes and edges.

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
- Use `quality_checks` inside the executable asset/field that owns the check, and use `validates` inside each check to link the protected `scenario`, `object`, or `term`.
- Put `evidence` and `verified` on technical assets, lineage entries, quality checks, rules, or inferred relationships when trust matters.
- Do not mechanically add `owner`, `domain`, `confidence`, `evidence`, or `verified` to lightweight semantic nodes such as simple terms.
- For tables, use `table.<schema>.<table>` as the default ID. For columns, use `column.<schema>.<table>.<column>`.
- Do not invent table fields, column names, or data types. Read them from the database/schema/code source.
- Ask the user before verifying ambiguous terms, objects, scenario boundaries, business rules, or lineage.

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
  shows field-level meaning, lineage, and quality:
  field/column -> term/object mappings
  field/column -> field/column lineage
  quality_check -> field/column checks
  field/column -> parent asset context
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

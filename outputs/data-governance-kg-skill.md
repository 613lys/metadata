---
title: Data Governance Knowledge Graph Skill
description: A progressive-disclosure skill spec for building a lightweight data-governance knowledge graph from scenario descriptions, documents, schemas, code, APIs, dashboards, and user confirmation.
---

# Data Governance Knowledge Graph Skill

This document is a single-file draft of a skill package. It is intentionally organized with progressive disclosure:

```text
SKILL.md                         # Core routing and workflow only
references/node-types.md         # Load when creating or validating nodes
references/edge-types.md         # Load when creating or validating edges
references/build-workflow.md     # Load when building YAML from scenarios/schemas/code
references/graph-json.md         # Load when generating graph.json and indexes
references/uncertainty.md        # Load when concepts are ambiguous
```

In a real skill folder, split each section below into the matching file.

---

# SKILL.md

```yaml
---
name: data-governance-kg
description: |
  Use this skill to build and query a lightweight data-governance knowledge graph.
  It creates YAML source-of-truth nodes and edges for data catalog, lineage,
  glossary, ontology, scenario context, ownership, tags, policies, quality checks,
  evidence, and verification, then builds graph.json for UI and Agent query.
---
```

## Purpose

Build a lightweight graph for data governance using:

```text
knowledge/
  nodes/
    *.yaml
  edges/
    *.yaml
  indexes/
    graph.json
    catalog.json
    search.json
    lineage.json
```

YAML is the source of truth. JSON files are generated indexes. Do not hand-edit generated JSON.

## Core Workflow

1. Start from a `scenario` when the user describes a business process.
2. Decompose broad scenarios into smaller child `scenario` nodes when each sub-process has its own assets, rules, or quality checks.
3. Extract candidate `term` and `object` nodes from each scenario.
4. Ask the user to confirm ambiguous business concepts.
5. Create technical asset nodes from schemas, code, files, APIs, dashboards, and UI grids.
6. Create semantic, lineage, usage, governance, quality, and scenario-flow edges.
7. Add evidence, confidence, and verification status.
8. Generate `graph.json` and query indexes.

## When To Load References

- Need node schemas or node examples: read `references/node-types.md`.
- Need edge taxonomy or edge examples: read `references/edge-types.md`.
- Need construction order from scenario, docs, DB schema, or code: read `references/build-workflow.md`.
- Need to build `graph.json`, `catalog.json`, `search.json`, or `lineage.json`: read `references/graph-json.md`.
- Need to decide whether to ask the user: read `references/uncertainty.md`.

## Non-Negotiables

- Every node has `id`, `type`, `name`, and `verified`.
- Every inferred fact has `confidence` and `evidence` when possible.
- Do not mark ambiguous terms, objects, mappings, or lineage as verified without user confirmation.
- Prefer explicit data-governance commands over natural-language guessing.

## Supported Queries

The graph should support:

```text
search nodes by name/type/tag
get node by id
get upstream/downstream lineage
impact analysis
find fields mapped to a term
find assets representing an object
find assets supporting a scenario
find unverified concepts or edges
find quality checks for a field/table/API
find missing owner/tag/description
```

---

# references/node-types.md

## Node Model

All graph entities are nodes. Directory placement is not semantic; `type` is semantic.

Minimum node:

```yaml
id: table.risk.public.mtm_valuation
type: table
name: mtm_valuation
description:
confidence: high
evidence: []
verified:
  status: false
```

## Required Node Types

### `scenario`

A business process, workflow, analytical context, or sub-process.

Examples:

```text
scenario.margin_booking_settlement
scenario.margin_calculation
scenario.booking
scenario.settlement
scenario.sales_revenue_analysis
```

Use it as the entry point when the user describes a business flow. If a scenario contains meaningful sub-processes, model those sub-processes as child scenarios instead of using plain-text steps.

```yaml
id: scenario.margin_booking_settlement
type: scenario
name: Margin Calculation, Booking, and Settlement
description: >
  Positions are valued using MTM, margin is calculated, booking orders are
  created, and undisputed bookings proceed to settlement.
child_scenarios:
  - scenario.mtm_valuation
  - scenario.margin_calculation
  - scenario.booking
  - scenario.settlement
scenario_flow:
  - source: scenario.mtm_valuation
    target: scenario.margin_calculation
    type: precedes
  - source: scenario.margin_calculation
    target: scenario.booking
    type: precedes
  - source: scenario.booking
    target: scenario.settlement
    type: precedes
related_nodes:
  - id: term.mtm
    relation: uses
  - id: term.margin
    relation: uses
  - id: term.booking
    relation: uses
  - id: term.settlement
    relation: uses
  - id: object.position
    relation: involves
  - id: object.mtm_valuation
    relation: involves
  - id: object.margin_call
    relation: involves
  - id: object.booking_order
    relation: involves
  - id: object.settlement_instruction
    relation: involves
evidence: []
verified:
  status: false
```

Child scenario example:

```yaml
id: scenario.margin_calculation
type: scenario
name: Margin Calculation
description: Calculate required margin from MTM valuation and collateral rules.
parent_scenario: scenario.margin_booking_settlement
related_nodes:
  - id: term.margin
    relation: uses
  - id: term.mtm
    relation: uses
  - id: object.mtm_valuation
    relation: involves
  - id: object.margin_call
    relation: involves
  - id: table.risk.public.mtm_valuation
    relation: uses
  - id: table.margin.public.margin_calculation
    relation: uses
  - id: pipeline.airflow.margin_calculation_job
    relation: uses
evidence: []
verified:
  status: false
```

### `term`

A glossary concept or business word.

Examples:

```text
term.mtm
term.margin
term.undisputed
term.settlement
```

Use for definitions, synonyms, equivalence, contrast, and business vocabulary.

```yaml
id: term.mtm
type: term
name: MTM
definition: Mark-to-market valuation used to estimate current position value.
synonyms:
  - mark-to-market
related_nodes:
  - id: term.valuation
    relation: specializes
    description: MTM is a valuation approach based on current market value.
  - id: object.mtm_valuation
    relation: describes
    description: The MTM term defines the business meaning of the MTM Valuation object.
  - id: column.risk.public.mtm_valuation.mtm_value
    relation: maps_to
    description: This field stores the MTM value used by margin calculation.
owner:
confidence: medium
evidence: []
verified:
  status: false
```

### `object`

A business entity with properties, lifecycle, and relationships.

Examples:

```text
object.trade
object.position
object.margin_call
object.booking_order
object.settlement_instruction
```

```yaml
id: object.booking_order
type: object
name: Booking Order
description: Order created from a margin call before settlement.
properties:
  - name: booking_id
  - name: margin_call_id
  - name: dispute_status
  - name: booking_status
relations:
  - type: created_from
    target: object.margin_call
  - type: eligible_for
    target: object.settlement_instruction
verified:
  status: false
```

### `table`

A physical database table.

```yaml
id: table.margin.public.margin_calculation
type: table
name: margin_calculation
platform: postgres
database: margin
schema: public
description: Stores calculated margin results.
columns:
  - column.margin.public.margin_calculation.margin_requirement
owner:
tags: []
evidence:
  - kind: db_schema
    ref: evidence.schema.margin_db
verified:
  status: false
```

### `view`

A database view or virtual dataset.

```yaml
id: view.margin.public.v_margin_summary
type: view
name: v_margin_summary
platform: postgres
database: margin
schema: public
depends_on:
  - table.margin.public.margin_calculation
columns: []
verified:
  status: false
```

### `column`

A field belonging to a table or view. Columns may be embedded in a table YAML for simple cases, but create standalone column nodes when the field has independent lineage, tags, quality, glossary mapping, object mapping, or downstream impact.

```yaml
id: column.margin.public.margin_calculation.margin_requirement
type: column
name: margin_requirement
parent: table.margin.public.margin_calculation
data_type: decimal
description: Required margin amount calculated from MTM valuation and collateral rules.
field_role: calculated_field
terms:
  - term.margin
maps_to_property:
  - object.margin_call.margin_requirement
calculation:
  inputs:
    - column.risk.public.mtm_valuation.mtm_value
quality_checks:
  - quality.margin_requirement.non_negative
verified:
  status: false
```

### `feedfile`

A file-based data input or output.

```yaml
id: feedfile.sftp.counterparty_mtm_feed
type: feedfile
name: counterparty_mtm_feed.csv
location: sftp://counterparty/outbound/mtm/
format: csv
schema:
  fields:
    - name: counterparty_id
      data_type: string
    - name: mtm_value
      data_type: decimal
consumed_by:
  - pipeline.airflow.daily_mtm_valuation
verified:
  status: false
```

### `api`

A backend API endpoint or service contract.

```yaml
id: api.booking.create_order
type: api
name: POST /booking/orders
service: booking-service
description: Creates a booking order from a margin call when eligible.
inputs:
  - object.margin_call
outputs:
  - object.booking_order
reads:
  - table.margin.public.margin_calculation
writes:
  - table.booking.public.booking_order
policies:
  - policy.booking_requires_undisputed_status
evidence:
  - kind: code_ref
    file: services/booking/routes.ts
verified:
  status: false
```

### `dashboard`

A BI dashboard, report, or analytical surface.

```yaml
id: dashboard.powerbi.margin_overview
type: dashboard
name: Margin Overview
platform: powerbi
description: Dashboard for margin calculation, booking status, and settlement status.
uses:
  - table.margin.public.margin_calculation
  - table.booking.public.booking_order
  - table.settlement.public.settlement_instruction
verified:
  status: false
```

### `pipeline`

A job, DAG, ETL/ELT process, dbt model, Spark job, or scheduled script.

```yaml
id: pipeline.airflow.margin_calculation_job
type: pipeline
name: margin_calculation_job
platform: airflow
description: Calculates margin based on MTM valuation and collateral data.
consumes:
  - table.risk.public.mtm_valuation
produces:
  - table.margin.public.margin_calculation
evidence:
  - kind: code_ref
    file: dags/margin_calculation.py
verified:
  status: false
```

## Supporting Node Types

Use these when needed:

```text
quality_check
business_rule
policy
owner
tag
domain
evidence
```

### `quality_check`

A data quality assertion. It can target a field, multiple fields, a table, multiple tables, an API response, or a business rule.

```yaml
id: quality.booking.disputed_not_settled
type: quality_check
name: Disputed Booking Must Not Be Settled
check_type: conditional_expression
target:
  level: row
  asset: table.booking.public.booking_order
  fields:
    - column.booking.public.booking_order.dispute_status
    - column.booking.public.booking_order.settlement_status
expectation:
  if: dispute_status == "disputed"
  then: settlement_status != "settled"
related_rule: rule.settlement_requires_undisputed
severity: critical
status:
  current: unknown
verified:
  status: false
```

### `business_rule`

A rule of the business process.

```yaml
id: rule.settlement_requires_undisputed
type: business_rule
name: Settlement Requires Undisputed Booking
description: Settlement can proceed only when the booking is undisputed.
condition:
  object: object.booking_order
  property: dispute_status
  operator: equals
  value: undisputed
effect:
  action: allow
  target: object.settlement_instruction
verified:
  status: false
```

---

# references/edge-types.md

## Edge Model

Minimum edge:

```yaml
id: edge.lineage.mtm_valuation.margin_calculation
type: lineage
source: table.risk.public.mtm_valuation
target: table.margin.public.margin_calculation
confidence: medium
evidence: []
verified:
  status: false
```

## Structure Edges

### `contains`

Parent contains child.

```text
table -> column
view -> column
api -> api_field
dashboard -> dashboard_field
```

## Data Flow Edges

### `lineage`

Data flows from source to target.

```text
feedfile -> pipeline
pipeline -> table
table -> table
column -> column
```

### `consumes`

A process reads an input.

```text
pipeline -> table
pipeline -> feedfile
```

### `produces`

A process creates an output.

```text
pipeline -> table
pipeline -> feedfile
```

### `depends_on`

A derived asset depends on another asset.

```text
view -> table
api -> table
dashboard -> table
```

### `calculated_from`

A calculated field depends on another field.

```text
column.margin_requirement -> column.mtm_value
```

## Semantic Edges

### `maps_to_term`

A technical asset or field maps to a business term.

```text
column.mtm_value -> term.mtm
```

### `represents`

A technical asset represents a business object.

```text
table.booking_order -> object.booking_order
api.booking.create_order -> object.booking_order
```

### `maps_to_property`

A field maps to a property of a business object.

```text
column.booking_order.dispute_status -> object.booking_order.dispute_status
```

### `supports_scenario`

An asset, term, object, rule, or quality check supports a business scenario.

```text
table.margin_calculation -> scenario.margin_booking_settlement
object.margin_call -> scenario.margin_booking_settlement
```

## Usage Edges

### `uses`

A consumer uses an asset.

```text
dashboard -> table
api -> table
frontend grid -> api
```

### `reads`

An API, pipeline, or service reads an asset.

### `writes`

An API, pipeline, or service writes an asset.

### `exposes`

An API exposes an object or field.

### `displays`

A dashboard or UI surface displays an object, field, or table.

## Governance Edges

```text
owned_by
tagged_as
belongs_to_domain
governed_by
verified_by
evidenced_by
```

Examples:

```text
table -> owner
column -> tag
asset -> policy
edge -> evidence
```

## Quality Edges

### `checks`

A quality check checks a target.

```text
quality_check -> column
quality_check -> table
```

### `validates`

A quality check validates a business rule.

```text
quality_check -> business_rule
```

### `monitors`

A quality check monitors an asset over time.

## Scenario and Business Process Edges

```text
contains_scenario
precedes
triggers
blocks
allows
requires
```

Examples:

```text
scenario.margin_booking_settlement -> scenario.margin_calculation
scenario.margin_calculation -> scenario.booking
scenario.booking -> scenario.settlement
object.mtm_valuation -> object.margin_call
object.margin_call -> object.booking_order
object.dispute_case -> object.settlement_instruction
term.undisputed -> object.settlement_instruction
```

Use `contains_scenario` from a parent scenario to a child scenario. Use `precedes` between sibling scenarios to preserve business flow order.

---

# references/build-workflow.md

## Preferred Construction Order

For business-process knowledge, build in this order:

```text
1. parent scenario
2. child scenarios
3. candidate terms
4. candidate objects
5. technical assets
6. semantic mappings
7. lineage and dependencies
8. quality checks and business rules
9. evidence and verification
10. generated indexes
```

## Scenario-First Flow

Start from a user description or document summary.

Example input:

```text
Margin calculation + booking + settlement uses MTM valuation. Calculate margin,
then create booking. If undisputed, settle.
```

Create:

```text
scenario.margin_booking_settlement
```

Then decompose into child scenarios when sub-processes have their own assets, rules, owners, or quality checks:

```text
scenario.mtm_valuation
scenario.margin_calculation
scenario.booking
scenario.settlement
```

Then extract terms, objects, rules, and assets per scenario:

```text
terms: MTM, margin, booking, settlement, undisputed, dispute
objects: position, mtm_valuation, margin_call, booking_order, dispute_case, settlement_instruction
business rules: settlement requires undisputed booking
```

## How To Extract Terms

Create a `term` when a word or phrase:

- Needs a business definition.
- Has synonyms or multiple department meanings.
- Is used across multiple assets.
- Affects interpretation of fields, rules, APIs, dashboards, or workflows.

Ask the user before confirming terms with multiple meanings.

Examples:

```text
MTM
margin
booking
settlement
undisputed
```

## How To Extract Objects

Create an `object` when a concept:

- Has properties.
- Has lifecycle/status.
- Participates in relationships.
- Is created, updated, approved, booked, settled, or disputed.
- Is represented by one or more tables, APIs, or UI grids.

Examples:

```text
position
mtm_valuation
margin_call
booking_order
settlement_instruction
```

If a concept is only a word, make it a `term`. If it has properties and relationships, make it an `object`. Some concepts may have both.

Example:

```text
term.booking       # definition of the word
object.booking_order # business entity created by a workflow
```

## Technical-Asset Flow

When starting from database schema or code instead of scenario:

1. Create `table`, `view`, `column`, `feedfile`, `api`, `dashboard`, and `pipeline` nodes.
2. Preserve evidence from schema snapshots, SQL files, code references, and configs.
3. Infer candidate terms and objects from names and descriptions.
4. Ask the user to confirm semantic mappings.
5. Link technical assets back to scenarios.

## Quality Construction

Represent data quality as `quality_check` nodes.

Use field-level checks for one field:

```text
not_null
unique
range
enum
format
freshness
```

Use multi-field checks for rules involving multiple fields:

```text
settlement_date >= booking_date
if dispute_status = disputed then settlement_status != settled
```

Use cross-table checks for referential or reconciliation rules:

```text
booking_order.margin_call_id exists in margin_calculation.margin_call_id
```

Connect quality checks to fields/tables through `checks`, and to business rules through `validates`.

---

# references/graph-json.md

## Generated Files

Generate:

```text
knowledge/indexes/graph.json
knowledge/indexes/catalog.json
knowledge/indexes/search.json
knowledge/indexes/lineage.json
```

## Build Steps

```text
1. Load all YAML files under knowledge/nodes and knowledge/edges.
2. Validate every node has id, type, name, verified.
3. Validate every edge has id, type, source, target, verified.
4. Normalize IDs.
5. Create graph nodes from YAML nodes.
6. Create explicit edges from YAML edge files.
7. Generate implicit edges from node fields.
8. Resolve references and report dangling IDs.
9. Write graph.json.
10. Write catalog.json, search.json, and lineage.json.
```

## Implicit Edge Rules

Generate these automatically:

```text
table.columns[]               -> contains
view.columns[]                -> contains
asset.owner                   -> owned_by
asset.tags[]                  -> tagged_as
asset.domain                  -> belongs_to_domain
asset.terms[]                 -> maps_to_term
asset.represents[]            -> represents
column.maps_to_property[]     -> maps_to_property
asset.scenarios[]             -> supports_scenario
node.related_nodes[]          -> relation named by related_nodes[].relation
scenario.child_scenarios[]    -> contains_scenario
scenario.scenario_flow[]      -> precedes/triggers/blocks/allows/requires
quality_check.target.fields[] -> checks
quality_check.related_rule    -> validates
pipeline.consumes[]           -> consumes
pipeline.produces[]           -> produces
api.reads[]                   -> reads
api.writes[]                  -> writes
dashboard.uses[]              -> uses
```

## graph.json Shape

```json
{
  "nodes": [
    {
      "id": "table.risk.public.mtm_valuation",
      "type": "table",
      "label": "mtm_valuation",
      "properties": {
        "description": "Daily MTM valuation results.",
        "owner": "owner.team.risk-data",
        "tags": ["tag.valuation"],
        "verified": false,
        "confidence": "medium"
      }
    }
  ],
  "edges": [
    {
      "id": "edge.table.mtm_valuation.contains.mtm_value",
      "type": "contains",
      "source": "table.risk.public.mtm_valuation",
      "target": "column.risk.public.mtm_valuation.mtm_value",
      "properties": {
        "confidence": "high",
        "verified": true
      }
    }
  ]
}
```

## catalog.json

Map node ID to full node details.

```json
{
  "table.risk.public.mtm_valuation": {
    "id": "table.risk.public.mtm_valuation",
    "type": "table",
    "name": "mtm_valuation"
  }
}
```

## search.json

Flatten names, descriptions, terms, tags, owners, and aliases for simple search.

```json
[
  {
    "id": "term.mtm",
    "type": "term",
    "text": "MTM mark-to-market valuation"
  }
]
```

## lineage.json

Precompute upstream and downstream adjacency for fast impact analysis.

```json
{
  "downstream": {
    "table.risk.public.mtm_valuation": [
      "table.margin.public.margin_calculation"
    ]
  },
  "upstream": {
    "table.margin.public.margin_calculation": [
      "table.risk.public.mtm_valuation"
    ]
  }
}
```

---

# references/uncertainty.md

## When To Ask The User

Ask the user before marking something verified when:

- A term has multiple business meanings.
- A concept might be either a `term`, `object`, `pipeline`, or `business_rule`.
- A table appears to represent multiple business objects.
- A field name is generic: `status`, `type`, `amount`, `value`, `flag`, `date`.
- A lineage edge is inferred from naming but not evidenced by code.
- A rule changes business behavior, permissions, settlement, booking, or reporting.
- A quality check encodes business logic rather than basic technical validity.

## Good Clarifying Questions

Ask concise, concrete questions.

```text
Does "booking" mean accounting booking, trade booking, or operational order creation in this system?
```

```text
Is "MTM" always mark-to-market valuation here, or can it include model-based valuation adjustments?
```

```text
Should "Margin Calculation" be modeled as a business object with stored results, a pipeline, or both?
```

```text
Does "settled" mean cash settlement completed, or only settlement instruction created?
```

```text
Is "undisputed" a field on booking_order, a status on margin_call, or both?
```

## Verification Rules

For unconfirmed facts:

```yaml
confidence: medium
verified:
  status: false
  reason: needs_business_confirmation
```

For user-confirmed facts:

```yaml
verified:
  status: true
  by: user
  at: "YYYY-MM-DD"
```

For code/schema-derived facts:

```yaml
confidence: high
evidence:
  - kind: code_ref
    file: jobs/margin_calculation.sql
verified:
  status: false
  reason: inferred_from_code
```

## Key Distinction

Evidence is not the same as verification.

```text
evidence = where the fact came from
verified = whether a trusted person or process confirmed it
```

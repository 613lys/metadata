# Common Node Fields

Use these fields across all node YAML files unless a reference says otherwise. Keep nodes small: include only fields that help UI or Agent understand, query, map, or validate the graph.

## Required Fields

```yaml
id:
type:
name:
description:
```

## Optional Fields

```yaml
tags: []
aliases: []
source:
  kind:
  system:
  captured_at:
```

Only add `owner`, `domain`, `confidence`, `evidence`, or `verified` when they are meaningful for that node. Do not add them mechanically.
Only add `tags`, `aliases`, or `source` when UI/Agent will actually use them.

## Source Rules

Generate technical facts from systems, not guesses:

```text
table/view/column names and data types -> database catalog, dbt catalog, migrations, ORM metadata
feed file fields -> file contract, sample file, ingestion config
API request/response fields -> OpenAPI, route code, controller code, protobuf/GraphQL schema
dashboard fields -> BI export, dashboard config, embedded SQL
pipeline inputs/outputs -> Airflow/Dagster/dbt/Spark/SQL/job config
semantic definitions -> documents, user input, interviews, confirmed business knowledge
```

Agent-authored descriptions are allowed, but they should be concise and based on evidence or user confirmation.

## Evidence

Evidence explains where a claim came from. It is not the same as verification.

```yaml
evidence:
  - kind: db_schema
    ref: evidence/schema_snapshots/risk_db_2026_06_14.json
  - kind: code_ref
    file: jobs/margin_calculation.sql
    line:
  - kind: doc
    file: docs/margin_process.md
  - kind: human_confirmation
    by: user
    at: "2026-06-14"
```

## Verification

```yaml
verified:
  status: false
  reason: inferred_from_schema
```

After user or trusted-process confirmation:

```yaml
verified:
  status: true
  by: user
  at: "2026-06-14"
```

## related_nodes

Use `related_nodes` to connect any node to any other node. This replaces type-specific fields such as `related_terms`, `related_objects`, or `related_assets`.

```yaml
related_nodes:
  - id: term.mtm
    description: This scenario uses MTM as the valuation concept.
```

The `description` is more important than the relation name. Add `relation` only when a precise relation helps graph queries. If omitted, the graph builder may use `related_to`.

Common relations:

```text
uses
involves
describes
maps_to
represents
specializes
broader_than
narrower_than
equivalent_to
differs_from
supports
governed_by
owned_by
tagged_as
enables
produces_input_for
uses_term
produces
consumes
defines
qualifies
explains
derived_from
created_from
creates
implemented_by
served_by
```

## lineage

Use `lineage` inside the node that knows the relationship.

```yaml
lineage:
  upstream:
    - id: table.risk.mtm_valuation
      description: Margin calculation reads MTM valuation data.
  downstream:
    - id: api.booking.create_order
      description: Booking API uses calculated margin values.
```

## quality_checks

Put quality checks in the executable node that owns the check: table, view, column, feed file, pipeline, API, or dashboard. The check should point to the concrete asset or field that can actually be tested.

Use `validates` to connect the check back to the business meaning it protects. `validates` should usually reference `scenario`, `object`, or `term` nodes.

```yaml
quality_checks:
  - name: Disputed Booking Must Not Be Settled
    check_type: conditional_expression
    fields:
      - dispute_status
      - settlement_status
    expectation:
      if: dispute_status == "disputed"
      then: settlement_status != "settled"
    severity: critical
    validates:
      - id: object.booking_order
        description: Booking order status controls whether settlement can proceed.
      - id: term.undisputed
        description: Undisputed status is required before settlement.
```

Graph meaning:

```text
quality_check -> asset/field       checks
quality_check -> scenario/object/term   validates
```

Do not put executable quality checks only on `object` or `term` nodes. Objects and terms describe business meaning; assets and fields are where checks can run.

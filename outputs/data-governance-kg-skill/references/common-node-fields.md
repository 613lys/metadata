# Common Node Fields

Use these fields across all node YAML files unless a reference says otherwise. Keep nodes small: include only fields that help UI or Agent understand, query, map, or validate the graph.

Flow YAML under `knowledge/flows/` reuses `id`, `type`, `name`, `description`, `owner`, `tags`, `evidence`, and `verified`, but it is not a normal graph node. Do not put `related_nodes` or `lineage` on a flow; use `edges[]` and `edge_dependencies[]` as described in `flow-node.md`.

## Required Fields

```yaml
id:
type:
name:
description:
```

## Optional Fields

```yaml
owner:
tags: []
aliases: []
evidence: []
verified:
  status:
  by:
  at:
  reason:
source:
  kind:
  system:
  captured_at:
```

Use `owner`, `evidence`, and `verified` when the node or relationship is important for governance, user trust, or Agent decision-making. They are especially useful on business entities, tables, views, lineage entries, constraints, and inferred mappings.

Only add `tags`, `aliases`, or `source` when UI/Agent will actually use them.

## Source Rules

Generate technical facts from systems, not guesses:

```text
table/view/column names and data types -> database catalog, dbt catalog, migrations, ORM metadata
semantic definitions -> documents, user input, interviews, confirmed business knowledge
```

Agent-authored descriptions are allowed, but they should be concise and based on evidence or user confirmation.

## Owner

Owner identifies who is accountable for the meaning or correctness of a node. Keep it as a simple string so it is easy for Agents and humans to maintain.

```yaml
owner: Commerce Operations
```

Guidance:

- For `business_entity`, owner is the business owner accountable for the entity definition.
- For `table` and `view`, owner is the data or system owner accountable for the physical asset.
- For `term`, owner is optional and should be used only when glossary stewardship matters.
- For derived `column` and `business_entity_property`, prefer inheriting owner from the parent unless a field has a distinct steward.

## Evidence

Evidence explains where a claim came from. It is not the same as verification.

```yaml
evidence:
  - kind: db_schema
    ref: evidence/schema_snapshots/commerce_db_2026_06_14.json
  - kind: code_ref
    file: jobs/refund_lifecycle.sql
    line:
  - kind: doc
    file: docs/refund_policy.md
  - kind: human_confirmation
    by: user
    at: "2026-06-14"
```

Use evidence for descriptions, lineage, mappings, constraints, and any relationship that the Agent inferred from code, schema, documents, or user confirmation.

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

Guidance:

- `verified.status: false` means useful but not yet trusted.
- `verified.status: true` means the claim was confirmed by a user, owner, source system, test, or trusted process.
- `verified.reason` should explain why an unverified claim is still present, such as `inferred_from_schema`, `inferred_from_sql`, or `needs_owner_confirmation`.

## related_nodes

Use `related_nodes` to connect any node to any other node. This replaces type-specific fields such as `related_terms`, `related_entities`, or `related_assets`.

```yaml
related_nodes:
  - id: business_entity.customer_order
    relation: REFERENCES
    description: This refund request references the customer order being refunded.
```

The `description` is more important than the relation name. Add `relation` only when a precise relation helps graph queries. If omitted, the graph builder may use `RELATED_TO`.

Common relations use uppercase snake case and must come from `references/relation-types.md`. Common current-scope relations:

```text
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
HAS_TERM
CONTAINS
READS_FROM
WRITES_TO
MAPS_TO
IMPLEMENTED_BY
REPRESENTED_BY
```

## lineage

Use `lineage` inside the node that knows the relationship.

```yaml
lineage:
  upstream:
    - id: table.support.refund_request
      description: Refund lifecycle view reads refund request data.
```

## constraints

Put constraints on the business entity, business property, relationship/action, table, or view that the rule governs. Constraints are not standalone graph nodes.

```yaml
constraints:
  - type: state_transition
    description: Payment refund can be created only after a refund decision is approved.
    fields:
      - decision_status
      - payment_status
    severity: critical
    expression: if decision_status == "approved" then payment_status may be "submitted"
```

Common constraint types:

```text
not_null
unique
accepted_values
range
regex
referential_integrity
relationship_required
cardinality
state_transition
conditional_required
mutual_exclusion
reconciliation
freshness
```

For relationship/action constraints, put `constraints` inside the relevant `related_nodes[]` entry. Do not put business constraints on physical columns; describe schema-level facts in the column `description` and put business validation on the mapped business entity property.

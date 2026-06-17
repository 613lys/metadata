# View Node

A `view` is a database view or virtual dataset.

## Source Of Truth

Read view name, schema, columns, and data types from the database catalog when possible. Read view definition from database metadata, migration files, dbt models, or source code.

## ID Rule

```text
view.<schema>.<view>
```

## YAML Format

```yaml
id: view.<schema>.<view>
type: view
name:
description:
owner:

schema:
definition:
sql:

columns:
  - name:
    data_type:
    description:
    term:
    lineage:
      upstream:
        - id: column.<schema>.<table>.<column>
          description:
      downstream:
        - id: column.<schema>.<table>.<column>
          description:

related_nodes:
  - id: business_entity.<entity>
    description:

lineage:
  upstream:
    - id: table.<schema>.<table>
      relation: READS_FROM
      description:

evidence:
  - kind:
    ref:
verified:
  status:
  by:
  at:
  reason:
```

## Example

```yaml
id: view.orders.v_refund_summary
type: view
name: v_refund_summary
description: Aggregated view of refund requests and settlement status.
owner: Orders Analytics Engineering

schema: orders
definition: Combines refund requests with settlement records so downstream services can show refund lifecycle status.
sql: |
  select
    rr.refund_id,
    rr.approval_status,
    fs.settlement_status
  from orders.refund_request rr
  left join finance.refund_settlement fs
    on rr.refund_id = fs.refund_id

columns:
  - name: refund_id
    data_type: varchar
    description: Refund request identifier selected into the summary view.
    term: term.refund_request_identifier
    lineage:
      upstream:
        - id: column.orders.refund_request.refund_id
          description: Directly selected from refund_request.refund_id.
  - name: approval_status
    data_type: varchar
    description: Approval status selected into the summary view.
    term: term.approval_status
    lineage:
      upstream:
        - id: column.orders.refund_request.approval_status
          description: Directly selected from refund_request.approval_status.
  - name: settlement_status
    data_type: varchar
    description: Settlement status selected into the summary view.
    term: term.settlement_status
    lineage:
      upstream:
        - id: column.finance.refund_settlement.settlement_status
          description: Directly selected from refund_settlement.settlement_status.

related_nodes:
  - id: business_entity.refund_request
    description: This view summarizes refund request state.
  - id: business_entity.refund_settlement
    description: This view includes refund settlement status.

lineage:
  upstream:
    - id: table.orders.refund_request
      relation: READS_FROM
      description: View reads refund request status.
    - id: table.finance.refund_settlement
      relation: READS_FROM
      description: View reads refund settlement status.

evidence:
  - kind: sql
    ref: models/orders/v_refund_summary.sql
  - kind: db_catalog
    ref: evidence/schema_snapshots/orders_v_refund_summary.json
verified:
  status: true
  by: orders_analytics_owner
  at: "2026-06-14"
```

## Keep It Small

Use `definition` when the exact SQL is too long or not available. Add `sql` when the SQL is short enough to be useful for Agent reasoning. Add column-level lineage when the view renames, derives, joins, or transforms fields; direct pass-through fields can still include lineage if impact analysis needs field-level precision.

Keep lineage direct. If a view reads a table, declare the table in `lineage.upstream`. If a view column is derived from source columns, declare column-level lineage on that column.

## Glossary Mapping

Use `term` on a view column when the view column directly represents one glossary concept. Preserve source column lineage separately.

## Column Scope

View columns are physical or logical fields produced by SQL. Keep view column YAML focused on:

```text
name
data_type
description
term
lineage.upstream
lineage.downstream
```

Do not put `semantic_role`, business `constraints`, or `related_nodes` on view columns. Put semantic role and business constraints on `business_entity.properties[]`, then map those properties to view/table columns.

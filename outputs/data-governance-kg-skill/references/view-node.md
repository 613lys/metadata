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

schema:
definition:
sql:

columns:
  - name:
    data_type:
    lineage:
      - source: column.<schema>.<table>.<column>
        description:
    quality_checks:
      - name:
        check_type:
        expectation:

related_nodes:
  - id: scenario.<scenario>
    description:

lineage:
  upstream:
    - id: table.<schema>.<table>
      relation: reads
      description:
```

## Example

```yaml
id: view.orders.v_refund_summary
type: view
name: v_refund_summary
description: Aggregated view of refund requests and settlement status.

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
    lineage:
      - source: column.orders.refund_request.refund_id
        description: Directly selected from refund_request.refund_id.
  - name: approval_status
    data_type: varchar
    lineage:
      - source: column.orders.refund_request.approval_status
        description: Directly selected from refund_request.approval_status.
  - name: settlement_status
    data_type: varchar
    lineage:
      - source: column.finance.refund_settlement.settlement_status
        description: Directly selected from refund_settlement.settlement_status.
    quality_checks:
      - name: Settlement Status Is Known
        check_type: enum
        expectation: settlement_status is one of pending, settled, failed

related_nodes:
  - id: scenario.order_to_refund_settlement
    description: This view summarizes the parent refund scenario.

lineage:
  upstream:
    - id: table.orders.refund_request
      relation: reads
      description: View reads refund request status.
    - id: table.finance.refund_settlement
      relation: reads
      description: View reads refund settlement status.
```

## Keep It Small

Use `definition` when the exact SQL is too long or not available. Add `sql` when the SQL is short enough to be useful for Agent reasoning. Add column-level lineage when the view renames, derives, joins, or transforms fields; direct pass-through fields can still include lineage if impact analysis needs field-level precision.

Prefer declaring `api -> view` reads on the API node instead of duplicating `view -> api` on the view. Keep one direct edge source of truth.

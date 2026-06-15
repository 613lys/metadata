# Dashboard Node

A `dashboard` is a BI dashboard, report, or analytical surface.

## Source Of Truth

Generate from BI exports, dashboard configs, semantic model files, embedded SQL, or documentation. Use dashboard metadata for name and upstream sources. Do not invent widgets or fields.

## YAML Format

```yaml
id: dashboard.<platform>.<dashboard_name>
type: dashboard
name:
description:

platform:
url:

displays:
  - column.<schema>.<table>.<column>

related_nodes:
  - id: scenario.<scenario>
    description:

```

## Example

```yaml
id: dashboard.powerbi.refund_operations
type: dashboard
name: Refund Operations
description: Dashboard for refund approval and settlement monitoring.

platform: powerbi
url:

displays:
  - column.orders.refund_request.refund_amount
  - column.orders.refund_request.approval_status
  - column.finance.refund_settlement.settlement_status

related_nodes:
  - id: scenario.order_to_refund_settlement
    description: Dashboard monitors the parent refund scenario.

```

## Keep It Small

Use a flat `displays` list unless widget-level detail is important. Add widget details only when UI/Agent needs to answer widget-specific impact questions.

Each `displays` entry should be a concrete field reference when possible. The graph builder should create a derived `dashboard_field` node for each displayed field so Field Map can show the dashboard as an asset box with fields, and draw field-level lineage from the source field to the dashboard field.

## Lineage Notes

Prefer declaring the serving edge on the API node:

```yaml
lineage:
  downstream:
    - id: dashboard.powerbi.refund_operations
      relation: serves
      description: Dashboard calls this API for refund summary data.
```

If a dashboard directly queries a table or view without an API/semantic layer, then the dashboard may list that direct upstream with `relation: reads`.

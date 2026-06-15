# Object Node

An `object` is a business entity with properties and relationships. It is not a database table, though a table may represent it.

## When To Create

Create an object when a concept:

- Has properties or status.
- Has lifecycle.
- Is created, approved, rejected, settled, reconciled, or displayed.
- Is represented by tables, APIs, dashboards, or UI grids.

## YAML Format

```yaml
id: object.<object_name>
type: object
name:
description:

properties:
  - name:
    description:
    allowed_values:
      - <value>
    maps_to:
      - column.<schema>.<table>.<column>

related_nodes:
  - id: object.<related_object>
    relation:
    description:
  - id: table.<schema>.<table>
    relation: implemented_by
    description:
  - id: api.<service>.<api_name>
    relation:
    description:
```

## Example

```yaml
id: object.refund_request
type: object
name: Refund Request
description: Business object representing a request to refund all or part of a customer order.

properties:
  - name: refund_id
    description: Unique refund request identifier.
    maps_to:
      - column.orders.refund_request.refund_id
  - name: approval_status
    description: Current approval state of the refund request.
    allowed_values:
      - pending
      - approved
      - rejected
    maps_to:
      - column.orders.refund_request.approval_status

related_nodes:
  - id: object.order
    relation: created_for
    description: A refund request is created for an order.
  - id: object.refund_settlement
    relation: creates_when_approved
    description: An approved refund request can create a refund settlement.
  - id: table.orders.refund_request
    relation: implemented_by
    description: This table stores refund requests.
  - id: api.refunds.create_refund
    relation: served_by
    description: This API creates refund requests.
```

## Keep It Small

Only include `properties` that matter for business understanding, mapping, quality, or impact analysis. Do not mirror every table column into the object.

Use object relationships to show lifecycle and business causality:

```text
created_from
creates
creates_when_approved
creates_when_undisputed
derived_from
values
qualifies
implemented_by
served_by
displayed_by
```

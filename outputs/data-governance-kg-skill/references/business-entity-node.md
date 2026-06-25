# Business Entity Node

A `business_entity` is a real business thing that the organization reasons about. It has identity, properties, lifecycle, state, ownership, or relationships to other business entities. It is not a database table, though a table or view may represent it.

Business process meaning is captured by relationships among business entities, lifecycle fields, and relationship constraints.

## When To Create

Create a business entity when a concept:

- Has an identifier or natural key.
- Has properties or status.
- Has lifecycle or state transitions.
- Is created, valued, booked, approved, disputed, settled, reconciled, displayed, or reported.
- Participates in important business relationships with other entities.

Physical representation is not a creation criterion. A table or view can provide evidence and later mapping for a business entity, but the entity should exist because the business reasons about it.

## YAML Format

```yaml
id: business_entity.<entity_name>
type: business_entity
name:
description:
owner:
term: term.<entity_term>
tags:
  - domain.<domain>
  - entity_type.<type>
  - lifecycle.<phase>

properties:
  - name:
    description:
    term: term.<property_term>
    semantic_role:
    allowed_values:
      - <value>
    constraints:
      - type:
        description:
        severity:
        expression:
    maps_to:
      - column.<schema>.<table>.<column>
    related_nodes:
      - id: business_entity.<entity>.<property>
        relation:
        description:
        constraints:
          - type:
            description:
            severity:
            expression:

mapped_assets:
  - id: table.<schema>.<table>
    relation: IMPLEMENTED_BY
    description:
  - id: view.<schema>.<view>
    relation: REPRESENTED_BY
    description:

lifecycle:
  states:
    - <state>
  description:

constraints:
  - type:
    description:
    severity:
    expression:

evidence:
  - kind:
    ref:
verified:
  status:
  by:
  at:
  reason:

related_nodes:
  - id: business_entity.<related_entity>
    relation:
    description:
    constraints:
      - type:
        description:
        severity:
        expression:
  - id: term.<term>
    relation:
    description:
```

## Example

```yaml
id: business_entity.refund_request
type: business_entity
name: Refund Request
description: Business entity representing a request to refund all or part of a customer order.
owner: Payments Operations
term: term.refund_request
tags:
  - domain.payments
  - entity_type.request
  - lifecycle.refund

properties:
  - name: refund_id
    description: Unique refund request identifier.
    term: term.refund_request_identifier
    semantic_role: identifier
    maps_to:
      - column.orders.refund_request.refund_id
  - name: approval_status
    description: Current approval state of the refund request.
    term: term.approval_status
    semantic_role: status
    allowed_values:
      - pending
      - approved
      - rejected
    constraints:
      - type: accepted_values
        severity: high
        description: Approval status must be one of the known lifecycle states.
        expression: approval_status in ("pending", "approved", "rejected")
    maps_to:
      - column.orders.refund_request.approval_status

mapped_assets:
  - id: table.orders.refund_request
    relation: IMPLEMENTED_BY
    description: This table is the primary physical representation of refund requests.

lifecycle:
  states:
    - pending
    - approved
    - rejected
    - settled
  description: Refund requests are reviewed, approved or rejected, and approved requests can be settled.

evidence:
  - kind: doc
    ref: docs/refund_operations.md
  - kind: human_confirmation
    by: payments_ops_lead
    at: "2026-06-14"
verified:
  status: true
  by: payments_ops_lead
  at: "2026-06-14"

related_nodes:
  - id: business_entity.financial_request
    relation: CHILD_OF
    description: A refund request is a specialized financial request.
  - id: business_entity.order
    relation: REFERENCES
    description: A refund request references the customer order being refunded.
  - id: business_entity.refund_settlement
    relation: CREATES
    description: An approved refund request can create a refund settlement.
    constraints:
      - type: state_transition
        severity: high
        description: A settlement can be created only after the refund request is approved.
        expression: refund_request.approval_status = "approved"
```

## Relationship Guidance

Entity-to-entity relationships are the first semantic graph to build. Prefer direct business relationships that a user can confirm.

Recommended relationship labels:

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
```

The `description` is required. It should explain the business meaning, not just repeat the label.

Good:

```yaml
- id: business_entity.refund_settlement
  relation: CREATES
  description: An approved refund request can produce a refund settlement instruction.
```

Bad:

```yaml
- id: business_entity.refund_settlement
  relation: RELATED_TO
  description: Related entity.
```

## Keep It Small

Only include properties that matter to the business entity itself: identifiers, dimensions, time dimensions, facts, measures, and status fields. Do not mirror every table column into the entity. Technical implementation columns can stay only in table/view YAML without a business entity property mapping.

## Asset And Field Mapping

Use `mapped_assets` to map the entity to the physical table/view that represents it:

```yaml
mapped_assets:
  - id: table.orders.refund_request
    relation: IMPLEMENTED_BY
    description: This table is the primary physical representation of refund requests.
```

Use `properties[].maps_to` only for business properties that truly belong to the entity:

```yaml
properties:
  - name: approval_status
    semantic_role: status
    maps_to:
      - column.orders.refund_request.approval_status
```

Do not create an entity property for a purely technical table column such as `etl_batch_id`, `created_at` used only for ingestion, hash keys, soft-delete flags, or internal audit fields unless the business explicitly reasons about it.

## Property-To-Property Relationships

Use `properties[].related_nodes[]` for semantic relationships between business properties. Use this when the business meaning is between fields on two entities, not just between the entities as a whole.

Common examples:

```yaml
properties:
  - name: refund_request_id
    semantic_role: identifier
    related_nodes:
      - id: business_entity.refund_request.refund_request_id
        relation: REFERENCES
        description: Refund Decision refund_request_id references the reviewed Refund Request.
  - name: approved_amount
    semantic_role: measure
    related_nodes:
      - id: business_entity.refund_request.requested_amount
        relation: DEPENDS_ON
        description: Approved amount is evaluated against the requested refund amount.
        constraints:
          - type: comparison
            severity: high
            description: Approved amount cannot exceed the requested amount.
            expression: approved_amount <= refund_request.requested_amount
```

Use `properties[].maps_to[]` only for physical column mapping. Use `properties[].related_nodes[]` for business property references, derivations, reconciliations, and cross-entity constraints. Use `term` for definition.

## Glossary Mapping

Use `term` for the one-to-one glossary concept that defines the entity or property.

```yaml
term: term.refund_request

properties:
  - name: approval_status
    term: term.approval_status
```

Avoid using broad `related_nodes` for this mapping. `related_nodes` is for relationships that need business explanation; `term` is for definition.

## Taxonomy Tags

Use `tags` for classification. Tags are lightweight taxonomy values, not full nodes by default.

```yaml
tags:
  - domain.payments
  - entity_type.request
  - lifecycle.refund
  - sensitivity.internal
```

Prefer stable namespaced tags. Do not create many ad hoc one-off tags.

## Hierarchy Relations

Model hierarchy as explicit relationships in `related_nodes`.

```yaml
related_nodes:
  - id: business_entity.financial_request
    relation: CHILD_OF
    description: Refund Request is a specialized financial request.
```

Use `CHILD_OF` for subtype, specialization, roll-up, or parent/child hierarchy. Use `PART_OF` for composition. The `description` must explain what the hierarchy means in business terms.

## Constraints

Use `constraints` as properties of the governed entity, property, or relationship/action. Do not create standalone quality check nodes.

Entity-level constraint:

```yaml
constraints:
  - type: uniqueness
    severity: critical
    description: Refund request identifiers must be unique.
    expression: refund_id is unique
```

Property-level constraint:

```yaml
properties:
  - name: approval_status
    constraints:
      - type: accepted_values
        severity: high
        description: Approval status must be a known lifecycle state.
        expression: approval_status in ("pending", "approved", "rejected")
```

Relationship/action-level constraint:

```yaml
related_nodes:
  - id: business_entity.refund_settlement
    relation: CREATES
    description: An approved refund request can create a refund settlement.
    constraints:
      - type: state_transition
        severity: high
        description: Settlement creation requires an approved refund request.
        expression: refund_request.approval_status = "approved"
```

## semantic_role

Use `semantic_role` on properties when it helps query planning or business interpretation:

```text
identifier       identifies the entity
dimension        categorical context
time_dimension   date/time context
fact             row-level quantitative fact
measure          business numeric value used for analysis
status           lifecycle/status value
```

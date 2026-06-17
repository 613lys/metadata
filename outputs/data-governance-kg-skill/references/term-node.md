# Term Node

A `term` is a glossary concept. Terms define meaning for business entities, business entity properties, and fields. Terms are not entities with lifecycle.

## When To Create

Create a term when a concept:

- Needs a definition.
- Has aliases or department-specific meanings.
- Is used to define a business entity, an entity property, a column, or a rule.
- Might be confused with a similar concept.

## YAML Format

```yaml
id: term.<term_name>
type: term
name:
description:
definition:
owner:
aliases:
  - <alias>
evidence:
  - kind:
    ref:
verified:
  status:
  by:
  at:
  reason:

related_nodes:
  - id: term.<related_term>
    relation:
    description:
```

## Example

```yaml
id: term.refund
type: term
name: Refund
description: Business term for returning money to a customer after an order payment.
definition: A refund is a full or partial reversal of a captured payment for an order.
owner: Payments Glossary Steward
aliases:
  - repayment
  - payment reversal
evidence:
  - kind: doc
    ref: docs/payments_glossary.md
verified:
  status: true
  by: payments_glossary_steward
  at: "2026-06-14"

related_nodes:
  - id: term.settlement
    relation: RELATED_TO
    description: Refund settlement is the financial completion of an approved refund.
```

## Glossary Mapping Guidance

Prefer one-way explicit references from entity/property/field to term:

```yaml
business_entity.refund_request:
  term: term.refund_request

business_entity.refund_request.properties[].approval_status:
  term: term.approval_status

table.orders.refund_request.columns[].approval_status:
  term: term.approval_status
```

Do not duplicate every entity/field mapping back inside the term. The graph builder can create queryable edges from the references.

## related_nodes Guidance

Use `related_nodes` on a term only for term-to-term semantic relationships. The `description` is required because it tells the Agent what the relationship means.

Recommended term relations:

```text
RELATED_TO
EQUIVALENT_TO
```

## aliases

Use `aliases` for equivalent phrases and name variants that help search or matching.

## User Confirmation

Ask when meanings may differ:

```text
Does "refund" mean a payment reversal only, or can it include store credit adjustments?
```

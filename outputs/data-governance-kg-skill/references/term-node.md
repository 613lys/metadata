# Term Node

A `term` is a business word or glossary concept. Terms define meaning; they are not necessarily entities with lifecycle.

## When To Create

Create a term when a concept:

- Needs a definition.
- Has aliases or department-specific meanings.
- Is used to interpret columns, APIs, dashboards, rules, or objects.
- Might be confused with a similar concept.

## YAML Format

```yaml
id: term.<term_name>
type: term
name:
description:
definition:
aliases:
  - <alias>

related_nodes:
  - id: term.<related_term>
    relation:
    description:
  - id: object.<related_object>
    relation:
    description:
  - id: column.<schema>.<table>.<column>
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
aliases:
  - repayment
  - payment reversal

related_nodes:
  - id: term.settlement
    relation: related_to
    description: Refund settlement is the financial completion of an approved refund.
  - id: object.refund_request
    relation: defines
    description: Refund Request is the business object that applies the refund concept.
  - id: column.orders.refund_request.refund_amount
    relation: mapped_to
    description: This column stores the refund amount.
  - id: scenario.refund_settlement
    relation: explains
    description: This scenario defines how approved refunds are settled.
```

## related_nodes Guidance

The `description` is required because it tells the Agent what the relationship means in business terms. Use `relation` when it improves graph query or UI labels.

Recommended term relations:

```text
defines
qualifies
explains
specializes
broader_than
narrower_than
mapped_to
```

## aliases

Use `aliases` for equivalent phrases and name variants that help search or matching.

## User Confirmation

Ask when meanings may differ:

```text
Does "refund" mean a payment reversal only, or can it include store credit adjustments?
```

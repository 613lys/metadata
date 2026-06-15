# Quality Check Node

A `quality_check` is a reusable or complex data quality rule. Simple field checks can stay inline in table/view/API/feedfile YAML. Create a separate quality check node when the rule is multi-field, cross-table, policy-like, reused, or important for Agent reasoning.

## When To Create

Create a standalone quality check when it:

- Checks multiple fields together.
- Checks relationships across tables/views/APIs/files.
- Encodes business logic, not just technical validity.
- Needs to be reused across assets.
- Should appear as a first-class item in UI or Agent query.

## YAML Format

```yaml
id: quality.<domain>.<check_name>
type: quality_check
name:
description:

check_type:
severity:

targets:
  - id: table.<schema>.<table>
    fields:
      - <field_name>
  - id: view.<schema>.<view>
    fields:
      - <field_name>

rule:
  description:
  expression:

related_nodes:
  - id: scenario.<scenario>
    description:
  - id: object.<object>
    description:

validates:
  - id: scenario.<scenario>
    description:
  - id: object.<object>
    description:
  - id: term.<term>
    description:
```

## Example

```yaml
id: quality.refunds.approved_refund_requires_settlement
type: quality_check
name: Approved Refund Requires Settlement
description: Approved refund requests should have a settlement record unless they are explicitly cancelled.

check_type: cross_table_business_rule
severity: high

targets:
  - id: table.orders.refund_request
    fields:
      - refund_id
      - approval_status
      - cancellation_status
  - id: table.finance.refund_settlement
    fields:
      - refund_id
      - settlement_status

rule:
  description: >
    For every refund request with approval_status = approved and cancellation_status != cancelled,
    there should be a matching refund_settlement row by refund_id.
  expression: approved refund_request.refund_id must exist in refund_settlement.refund_id unless cancellation_status = cancelled

related_nodes:
  - id: scenario.refund_settlement
    description: This check validates the refund settlement scenario.
  - id: object.refund_request
    description: The rule starts from approved refund requests.
  - id: object.refund_settlement
    description: The rule expects settlement records for approved refunds.

validates:
  - id: scenario.refund_settlement
    description: The rule protects the refund settlement scenario.
  - id: object.refund_request
    description: The rule validates approved refund request state.
  - id: object.refund_settlement
    description: The rule validates expected settlement output.
```

## Keep It Small

Do not put execution history, run logs, or long SQL here by default. Keep the business-readable rule, targets, and related scenario/object links. Execution status can be added later if UI/Agent needs monitoring.

## Where Quality Checks Belong

Attach executable checks to the asset or field where the check can run:

```text
table/view/column checks      -> table, view, or standalone column node
feed freshness checks         -> feedfile node
pipeline success/output checks -> pipeline node
API parameter/response checks -> API node
dashboard freshness checks    -> dashboard node
```

Use `validates` for semantic meaning:

```text
quality_check -> asset/field          checks
quality_check -> scenario/object/term validates
```

Do not attach a check only to an `object` just because the rule is business-oriented. The object explains what the rule protects; the asset or field explains where it is executed.

## Field Map Display

In Field Map, display quality checks by execution scope:

```text
single field check      -> badge on that field row
single asset check      -> chip inside that asset box
cross-field same asset  -> chip inside that asset box and badges on the involved fields
cross-asset check       -> repeat the same quality chip inside every involved asset box
```

For cross-asset checks, the repeated chips must represent the same `quality_check` node, not duplicated rules. When the user clicks the chip, highlight every related asset and field listed in `targets`, and show the full rule, all targets, and `validates` links in the profile panel.

Use `targets[].fields` for precision:

```yaml
targets:
  - id: table.booking.booking_order
    fields:
      - margin_call_id
  - id: table.margin.margin_calculation
    fields:
      - margin_call_id
```

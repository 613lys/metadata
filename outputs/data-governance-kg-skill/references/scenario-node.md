# Scenario Node

A `scenario` is a business context or sub-process. Use it to help Agent understand why assets and objects matter.

## When To Create

Create a scenario when the user describes a business flow or a sub-process with its own assets, rules, or quality checks.

## YAML Format

```yaml
id: scenario.<scenario_name>
type: scenario
name:
description:

parent_scenario:
child_scenarios:
  - scenario.<child_scenario>

scenario_flow:
  - source: scenario.<upstream_scenario>
    target: scenario.<downstream_scenario>
    relation:
    description:

business_logic:
  - name:
    description:

related_nodes:
  - id: term.<term>
    relation:
    description:
  - id: object.<object>
    relation:
    description:
  - id: table.<schema>.<table>
    relation:
    description:
```

## Example

```yaml
id: scenario.order_to_refund_settlement
type: scenario
name: Order to Refund Settlement
description: Parent business scenario covering order capture, refund approval, and refund settlement.

child_scenarios:
  - scenario.order_capture
  - scenario.refund_approval
  - scenario.refund_settlement

scenario_flow:
  - source: scenario.order_capture
    target: scenario.refund_approval
    relation: enables
    description: Refund approval can happen only after an order has been captured.
  - source: scenario.refund_approval
    target: scenario.refund_settlement
    relation: produces_input_for
    description: Approved refunds proceed to settlement.

business_logic:
  - name: Capture refund intent
    description: Identify the order and amount that the customer wants refunded.
  - name: Approve refund request
    description: Decide whether the refund can proceed based on policy and order status.
  - name: Settle approved refund
    description: Create settlement output for approved refunds.

related_nodes:
  - id: term.refund
    relation: uses_term
    description: Refund is the main business concept in this flow.
  - id: object.refund_request
    relation: involves
    description: Refund requests move through approval and settlement.
  - id: table.orders.refund_request
    relation: implemented_by
    description: This table stores refund requests used by the scenario.
```

## Keep It Small

Keep `business_logic` short and business-readable. It should explain decisions, handoffs, and lifecycle steps, not repeat SQL or implementation details.

Business Context UI should be driven by the graph created from YAML, not by UI-only meaning switches:

```text
scenario.business_logic   -> displayed inside the scenario profile/card, not as a separate node type
scenario.scenario_flow    -> scenario-to-scenario business handoff edges
scenario.related_nodes    -> scenario-to-term/object/asset/quality context edges
object.related_nodes      -> object-to-object lifecycle and object-to-asset implementation edges
term.related_nodes        -> term-to-term/object meaning edges, or term-to-field/column mappings
quality_checks.validates  -> quality-to-business object/scenario meaning
quality_checks            -> quality-to-asset/field executable checks
```

The Business Context map displays existing edges among visible `scenario`, `term`, `object`, `asset`, and `quality_check` nodes in the current scenario context. It does not expand fields/columns, and it does not display asset-to-asset technical data-flow edges; those belong in Catalog/Lineage.

Do not create direct `term -> asset` shortcut edges just to make the UI simpler. If a term maps to data, map it to the real column/field. That mapping remains available to the agent and asset profile, but it will not appear in the Business Context map unless the view explicitly expands fields.

Do not rely on UI toggles to hide unwanted business-context edges. If a semantic edge should not exist, do not write it in YAML.

Use scenario relationship names when they help the UI/Agent:

```text
enables
precedes
triggers
depends_on
produces_input_for
enables_when_undisputed
```

Do not add `business_questions`, `quality_checks`, `evidence`, or `verified` by default. Add them only if the user wants them or they are used by UI/Agent.

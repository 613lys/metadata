# Flow YAML

A `flow` describes a business lifecycle or process view over existing graph nodes and edges.

It is not a normal graph node. It is a named graph view that references existing nodes and edges, then adds flow-specific semantics: edge step order, edge-to-edge dependencies, lifecycle stages, SLA, dependency type, conditions, evidence, and verification.

Flow node IDs are project-specific compiled graph node IDs. In OSI projects they may look like `entity_type.refund_request` or `physical_table.refund_request`; in legacy projects they may look like `business_entity.refund_request` or `table.support.refund_request`. Always use IDs that exist in the generated `graph.json`.

Store flow YAML under:

```text
knowledge/flows/flow.<name>.yaml
```

Create flow YAML only after the referenced graph nodes and base graph edges exist in the project's source YAML and the graph can be built.

## Generation Workflow

1. Identify a business lifecycle where relationship order matters.
   - Good flow candidates are refund lifecycle, booking lifecycle, settlement lifecycle, approval workflow, reconciliation workflow, or operational handoff.
   - Do not create a flow for a simple static relationship that can be understood from one edge.

2. Build or confirm the base graph first.
   - Ensure every flow `nodes[]` entry is an existing top-level graph node.
   - Ensure important flow steps have an existing base graph edge from `related_nodes`, `mapped_assets`, or lineage.
   - If the base relationship is missing, update the owning node YAML first instead of hiding the missing semantic relationship inside the flow.

3. Add flow edges.
   - Use `base_edge` to point to the existing graph edge ID whenever possible.
   - Use `source` and `target` to show the business lifecycle direction for this flow.
   - Use `step` for display order.
   - Use `label` for a short UI action phrase.
   - Use `description`, `lifecycle`, `dependency`, `sla`, `condition`, and `constraints` for flow-specific meaning.

4. Add edge dependencies.
   - Use `edge_dependencies[]` to express edge-to-edge order or gating.
   - Do not create extra graph nodes to represent steps.
   - Do not add inverse edges just to make traversal easier.

5. Add governance fields.
   - Use `owner`, `evidence`, and `verified` on the flow.
   - Put flow-step evidence or policy references in edge `description`, `condition`, `constraints`, or flow-level `evidence`.

## YAML Format

```yaml
id: flow.<name>
type: flow
name:
description:
owner:
tags:
  - <classification>

nodes:
  - <node_id>

edges:
  - base_edge: <existing_graph_edge_id>
    flow_edge_id: flow.<name>.edge.<step>
    step: 1
    relation: <flow_relation>
    source: <node_id>
    target: <node_id>
    label:
    description:
    lifecycle:
    dependency:
    sla:
    condition:
    constraints:
      - type:
        severity:
        description:
        expression:

edge_dependencies:
  - from: flow.<name>.edge.<step>
    to: flow.<name>.edge.<step>
    type: PRECEDES | ENABLES | DEPENDS_ON | BLOCKS
    condition:
    description:

evidence:
  - kind:
    ref:

verified:
  status: true | false
  by:
  at:
  reason:
```

## Field Meaning

`nodes` are existing graph node IDs included in this business flow.

`edges` are flow-specific edge presentations. Each edge should reference an existing graph edge with `base_edge` when possible. The flow may override `source` and `target` to show the business lifecycle direction, even if the base edge is stored in a different semantic direction such as `DERIVES_FROM`.

`base_edge` is an existing edge ID from `knowledge/indexes/graph.json`. It links the flow edge back to the source-of-truth relationship compiled from node YAML.

`flow_edge_id` should be stable. Use `flow.<name>.edge.<step>` unless a more stable business identifier exists.

`step` is the display order in this flow. It is not a timestamp.

`relation` must use the controlled flow relation vocabulary from `references/relation-types.md`.

`label` is a short UI label such as `Request refund` or `Review request`.

`description` explains what this relationship means inside this flow.

`lifecycle` is a short stage label, such as `request`, `review`, `approval`, `booking`, `settlement`, or `payment`.

`dependency` describes why the step depends on earlier steps, such as `business_required`, `approval_required`, `operational_review`, or `data_required`.

`sla` is the expected completion window for this step in ISO-8601 duration format when possible, such as `PT5M`, `PT2H`, or `P1D`.

`condition` captures business conditions such as `decision_status = approved`.

`edge_dependencies` defines dependencies between flow edges. This is how the flow expresses edge-to-edge ordering without turning edges into graph nodes.

## Build Output

`scripts/build_graph.py` compiles flow YAML after compiling the normal graph:

```text
knowledge/flows/*.yaml
  -> knowledge/indexes/flows.json
  -> frontend/flows-data.js
```

Flow YAML does not create records in `graph.json.nodes` or `graph.json.edges`. It creates named flow views in `flows.json`.

The compiler should:

- validate `id`, `type`, `name`, and `description`;
- require `type: flow`;
- resolve `edges[].base_edge` against generated `graph.json.edges` when present;
- derive `source` and `target` from the base edge when they are not explicitly set;
- include edge endpoints in the flow node set;
- keep only flow nodes that exist in the generated graph;
- normalize `edges[].relation` and `edge_dependencies[].type`;
- remap dependency references to stable `flow_edge_id` values when possible;
- preserve `raw` and `base_raw` metadata for UI/Agent inspection.

The UI should show flows as a separate catalog result type. Opening a flow should render only the declared flow nodes and flow edges. Clicking a flow edge should show both the flow-specific metadata and the base graph edge metadata.

## Consistency Rules

- Flow YAML is a view over graph knowledge, not a replacement for graph knowledge.
- Do not use flow edges to create missing business relationships. Add the underlying `related_nodes[]` edge first.
- Use `step` for order. Use `edge_dependencies[]` for dependency or gating between flow edges.
- Put status values, SLA windows, lifecycle stages, and conditions in flow edge fields, not in custom relation names.
- Use relation values from `references/relation-types.md`.
- Keep flow nodes at top-level node granularity. Do not put column/property nodes in `nodes[]` unless the UI/Agent explicitly needs a field-level flow view.

## Example

This example uses legacy `business_entity.*` IDs because the demo data uses that format. For OSI projects, use the equivalent generated `entity_type.*`, `physical_table.*`, `regulatory_requirement.*`, or `report_implementation.*` IDs.

```yaml
id: flow.refund_lifecycle
type: flow
name: Refund Lifecycle
description: Business flow from customer order to payment refund issuance.
owner: Commerce Operations
tags:
  - domain.commerce
  - flow.refund
nodes:
  - business_entity.customer_order
  - business_entity.refund_request
  - business_entity.refund_decision
  - business_entity.payment_refund
edges:
  - base_edge: edge.business_entity.refund_request.REFERENCES.business_entity.customer_order
    flow_edge_id: flow.refund_lifecycle.edge.1
    step: 1
    relation: INITIATES
    source: business_entity.customer_order
    target: business_entity.refund_request
    label: Request refund
    description: A confirmed customer order can initiate a refund request.
    lifecycle: request
    dependency: business_required
    sla: PT5M
    condition: customer_order exists and is eligible for refund
edge_dependencies:
  - from: flow.refund_lifecycle.edge.1
    to: flow.refund_lifecycle.edge.2
    type: PRECEDES
    description: The refund request must exist before it can be reviewed.
evidence:
  - kind: policy
    ref: evidence/refund_policy.md
verified:
  status: false
  reason: inferred_from_demo
```

# OSI Generation Practices

Use this reference when generating OSI YAML from metadata and rendering the graph UI.

## YAML Shape

Prefer one domain YAML file unless the project is already split by package:

```yaml
metadata:
  name:
  description:
  owner:

ontology:
  name:
  concepts:
    - name:
      type: EntityType | ValueType
      description:
      extends: []
      relationships: []

semantic_models:
  - name:
    datasets: []

ontology_mappings:
  - name:
    concept_mappings: []
    link_mappings: []
    referent_mappings: []

physical_datasets:
  - name:
    type: table
    schema:
    columns: []

reporting_requirements:
  - name:
    type: RegulatoryRequirement
    semantic_scope: {}

report_implementations:
  - name:
    type: ReportImplementation
    output_datasets: []
    source_fields: []
```

Store ordered process views separately when they are needed:

```text
knowledge/flows/flow.<name>.yaml
```

Use the repo's existing YAML shape if it already has one. Keep IDs stable and deterministic.

## Metadata-To-YAML Rules

1. Generate physical datasets from source metadata first.
   - Preserve table names, column names, data types, nullability, keys, and comments.
   - Do not invent physical fields. If a needed field is absent, model it as a gap or inferred requirement, not as an existing column.

2. Infer EntityType concepts from business identity and lifecycle.
   - Good EntityTypes have identity, lifecycle, important status, measures, or relationships.
   - Examples: `Trade`, `Customer`, `Account`, `Product`, `ExchangeRate`.
   - Do not create an EntityType for every table automatically.

3. Infer ValueType concepts from reusable field meanings.
   - Examples: `TradeIdentifier`, `CustomerIdentifier`, `CurrencyCode`, `MonetaryAmount`.
   - ValueTypes can exist independently in YAML but should normally render as child fields under EntityTypes.
   - Reuse a ValueType when multiple EntityTypes share the same value meaning.
   - When two EntityType fields use the same ValueType, the graph build should derive a `SHARES_VALUE_TYPE` field edge between those fields even if YAML does not explicitly declare that edge.

4. Model EntityType fields as relationships/roles to ValueTypes.
   - The field name should be the role, such as `trade_id`, `fair_value_amount`, or `domicile_country`.
   - Include descriptions that explain the semantic role, not only the physical column.

5. Model EntityType relationships with semantic ids.
   - Put relationships under the source EntityType.
   - Use names such as `own_trade`, `booked_for_customer`, `references_product`.
   - For several edges with the same verb, keep unique ids: `own_trade`, `own_position`, `own_collateral`.
   - Use `verbalizes` for natural-language renderings such as `{Account} owns {Trade}`.

6. Use `extends` only for specialization.
   - Use it when one concept is a subtype or refinement of another.
   - Do not use `extends` for tags, ownership, lineage, or broad grouping.

7. Use `derived_by` and `requires` deliberately.
   - `derived_by` records the expression or rule that derives a field or relationship.
   - `requires` records constraints that must hold for the relationship or field to be valid.

8. Use referent/identity mapping for composite identity.
   - If an EntityType cannot be identified by one field, model its identifier as a composite referent or identity mapping.
   - Do not use link mappings just to express composite identity. Link mappings connect two records/entities; referent mappings identify what a record refers to.

9. Add flows only when process order matters.
   - A flow is a named view over existing graph nodes and graph edges.
   - Do not use a flow to create a missing EntityType relationship. Add the underlying relationship first.
   - Use flow `step` for order and `edge_dependencies[]` for dependencies between flow edges.
   - Use flow edge `source` and `target` for business display direction.

## Mapping Levels

Use the narrowest mapping level that matches the evidence:

```text
concept mapping      EntityType or ValueType concept -> semantic/physical representation
field mapping        EntityType role / ValueType field -> physical column
link mapping         relationship between two mapped concepts or datasets
referent mapping     identity/reference resolution, including composite identifiers
ontology mapping     mapping between ontology concepts or ontology and semantic model context
```

Use ontology mappings when aligning ontology concepts to a semantic model, another ontology, or a reusable mapping package. Do not use ontology mapping as the visible business edge between two concepts; that edge should be the relationship declared on the EntityType.

## Regulatory Requirement Pattern

A `RegulatoryRequirement` expresses the semantic subset a regulator/report needs. It should not pull in all fields from every EntityType.

Model:

```yaml
reporting_requirements:
  - name: TradeExposureRequirement
    type: RegulatoryRequirement
    regulator: ExampleRegulator
    regulation: ExampleRule
    reporting_frequency: daily
    reporting_grain:
      concept: Trade
      description: One row per reportable trade exposure.
    semantic_scope:
      concepts:
        - Trade
        - Account
        - Customer
      relationships:
        - source: Account
          relationship: own_trade
          target: Trade
          mandatory: true
          purpose: Owning account is required for aggregation.
      required_fields:
        - name: trade_identifier
          concept: Trade
          relationship: trade_id
          semantic_reference: Trade.trade_id
          value_concept: TradeIdentifier
          required: true
          purpose: Unique line identity and reconciliation key.
      calculations:
        - name: exposure_amount_report_currency
          output: exposure_amount_report_currency
          inputs:
            - Trade.fair_value_amount
            - ExchangeRate.rate_value
          expression: Trade.fair_value_amount * ExchangeRate.rate_value
      controls:
        - name: trade_key_presence
          target: Trade.trade_id
          rule: Trade identifier must be present.
```

Compile required fields into child nodes and connect them to EntityType value fields with `REQUIRES_SEMANTIC_FIELD`. Compile calculation inputs into field-level edges such as `USES_SEMANTIC_INPUT`.

## Report Implementation Pattern

A `ReportImplementation` is physical delivery. It can implement a requirement and materialize dataset fields, but it should not replace semantic-to-physical mappings.

Model:

```yaml
report_implementations:
  - name: DailyTradeExposureReport
    type: ReportImplementation
    implements: TradeExposureRequirement
    owner: Regulatory Reporting Engineering
    output_datasets:
      - dataset: regulatory_report_lines
        role: line
        fields:
          - name: exposure_amount
            semantic_reference: Trade.fair_value_amount
            requirement_field: fair_value_amount
            source_field: trades.fair_value_amount
    source_fields:
      - trades.trade_id
      - trades.fair_value_amount
```

Compile implementation fields into child nodes and connect them with:

```text
IMPLEMENTS                implementation -> requirement
MATERIALIZED_AS           implementation -> output dataset
READS_FROM                implementation -> source dataset
MATERIALIZES_FIELD        implementation field -> output column
READS_FIELD               implementation field -> source column
```

Keep `semantic_reference` and `requirement_field` on implementation fields as descriptive metadata only. Do not draw implementation field edges directly to EntityType value fields; that semantic connection belongs to the requirement field.

## Flow Pattern

A flow expresses lifecycle, ordering, gating, and SLA over graph knowledge that already exists.

Model flow files as:

```yaml
id: flow.refund_lifecycle
type: flow
name: Refund Lifecycle
description: Ordered view of refund request, decision, and payment refund issuance.
owner: Commerce Operations
tags:
  - domain.commerce
nodes:
  - entity_type.customer_order
  - entity_type.refund_request
  - entity_type.refund_decision
  - entity_type.payment_refund
edges:
  - base_edge: edge.entity_type.refund_request.REFERENCES.entity_type.customer_order
    flow_edge_id: flow.refund_lifecycle.edge.1
    step: 1
    relation: INITIATES
    source: entity_type.customer_order
    target: entity_type.refund_request
    label: Request refund
    description: A confirmed order can initiate a refund request.
    lifecycle: request
    dependency: business_required
    sla: PT5M
    condition: order is eligible for refund
edge_dependencies:
  - from: flow.refund_lifecycle.edge.1
    to: flow.refund_lifecycle.edge.2
    type: PRECEDES
    description: The refund request must exist before it can be reviewed.
verified:
  status: false
  reason: inferred_from_workflow_notes
```

Flow generation rules:

- Generate flow YAML after graph node IDs and base edge IDs are known.
- Put flow YAML under `knowledge/flows/`.
- Reference existing graph nodes in `nodes[]`.
- Reference existing graph edges in `edges[].base_edge` when possible.
- Let `source` and `target` express lifecycle display direction; this may differ from the base semantic edge direction.
- Put status values, lifecycle stages, conditions, dependency categories, and SLA windows on the flow edge.
- Put edge-to-edge ordering in `edge_dependencies[]`, not in extra graph nodes.
- Compile flows into `knowledge/indexes/flows.json` and `frontend/flows-data.js`.
- Do not insert flows into `graph.json.nodes` or flow edges into `graph.json.edges`.

## UI Rendering Practices

Render the graph for analysis, not as a raw dump of every YAML container.

Default visible node types:

```text
entity_type_concept
physical_table
regulatory_requirement
report_implementation
```

When flows exist, render them as catalog result items beside nodes and edges. Opening a flow should render only the nodes and flow edges declared by the flow YAML.

Default hidden/container types:

```text
ontology
semantic_model
ontology_mapping
value_type_concept
```

Render these as child rows under their parent:

```text
ValueType role under EntityType
column under physical table
requirement semantic item under RegulatoryRequirement
implementation field binding under ReportImplementation
```

Default child rows should be collapsed. When expanded:

- EntityType fields show ValueType roles.
- Table fields show columns.
- Requirement fields show required semantic fields, relationships, calculations, and controls.
- Implementation fields show output/source bindings.
- Do not draw every field-level edge just because a node is expanded.
- Field-level edges should draw only when the user selects a concrete child field row.
- Selecting a requirement field should expand the related EntityType field parent and draw only that requirement field's edges to the corresponding EntityType value field rows.
- Selecting an implementation field should expand the related dataset field parents and draw only that implementation field's edges to output/source column rows.
- All graph and field edge anchors should attach to the left or right side of nodes/field rows, never to top or bottom edges.

The right-side profile must update for node clicks, edge clicks, and child field clicks.

Flow graph behavior:

- Flow edge labels should show `step` and `label`.
- Clicking a flow edge should show flow metadata and the referenced base graph edge metadata.
- Clicking a node inside a flow graph should open the normal node-centered graph for that node.
- Field/property-level edges remain collapsed unless a concrete child row is selected.

## Verification

After generating YAML or changing the UI:

```powershell
python scripts/build_osi_graph.py
node --check frontend/app.js
python -m http.server 8766 -d frontend
```

Verify in the browser:

```text
catalog opens
graph opens
node profile appears
edge profile appears
field profile appears
requirement starts collapsed
requirement Show reveals requirement fields without drawing field-level edges
clicking one requirement field draws only that field's edge(s) to EntityType fields
implementation fields map to dataset field level
flow catalog result appears when flow YAML exists
flow graph opens and shows flow edge labels
flow edge profile shows flow metadata and base edge metadata
clicking a node inside a flow opens its node-centered graph
hide/show works for node properties
```

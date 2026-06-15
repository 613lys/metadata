# API Node

An `api` is a data-serving API that returns fields for dashboards, UI grids, or downstream consumers. Model how the API query parameters and returned fields relate to underlying tables/views.

## Source Of Truth

Generate from OpenAPI specs, route/controller code, GraphQL schemas, query builders, SQL in service code, API docs, or integration tests. Parameters and response fields should come from the API contract or code, not from guesses.

## YAML Format

```yaml
id: api.<service>.<api_name>
type: api
name:
description:

parameters:
  - name:
    data_type:
    required:
    description:

returns:
  - name:
    data_type:
    description:
    lineage:
      - source: column.<schema>.<table>.<column>
        description:
    related_nodes:
      - id: term.<term>
        description:
      - id: object.<object>.<property>
        description:

logic:
  description:
  sql:

related_nodes:
  - id: scenario.<scenario>
    description:
  - id: object.<object>
    description:

lineage:
  upstream:
    - id: table.<schema>.<table>
      relation: reads
      description:
    - id: view.<schema>.<view>
      relation: reads
      description:
  downstream:
    - id: dashboard.<platform>.<dashboard_name>
      relation: serves
      description:

quality_checks:
  - name:
    check_type:
    fields:
      - <parameter_or_return_field>
```

## Example

```yaml
id: api.refunds.get_refund_summary
type: api
name: GET /refunds/summary
description: Returns refund request, approval, and settlement data for refund operations dashboards.

parameters:
  - name: start_date
    data_type: date
    required: true
    description: Start date for refund creation time filter.
  - name: end_date
    data_type: date
    required: true
    description: End date for refund creation time filter.
  - name: approval_status
    data_type: string
    required: false
    description: Optional refund approval status filter.

returns:
  - name: refund_id
    data_type: string
    description: Refund request identifier.
    lineage:
      - source: column.orders.refund_request.refund_id
        description: Directly selected from refund_request.refund_id.
  - name: refund_amount
    data_type: decimal
    description: Requested refund amount.
    lineage:
      - source: column.orders.refund_request.refund_amount
        description: Directly selected from refund_request.refund_amount.
    related_nodes:
      - id: term.refund
        description: This response field returns the refund amount.
      - id: object.refund_request.refund_amount
        description: This response field maps to the refund amount property.
  - name: settlement_status
    data_type: string
    description: Current settlement status for the refund.
    lineage:
      - source: column.finance.refund_settlement.settlement_status
        description: Joined from refund_settlement by refund_id.

logic:
  description: >
    Reads refund requests and left joins settlement records by refund_id. Filters
    by refund creation date and optional approval status.
  sql: |
    select
      rr.refund_id,
      rr.refund_amount,
      fs.settlement_status
    from orders.refund_request rr
    left join finance.refund_settlement fs
      on rr.refund_id = fs.refund_id
    where rr.created_at between :start_date and :end_date
      and (:approval_status is null or rr.approval_status = :approval_status)

related_nodes:
  - id: scenario.order_to_refund_settlement
    description: API serves data for the refund settlement scenario.
  - id: object.refund_request
    description: API returns refund request fields.
  - id: object.refund_settlement
    description: API returns settlement status joined to refund requests.

lineage:
  upstream:
    - id: table.orders.refund_request
      relation: reads
      description: API reads refund request data.
    - id: table.finance.refund_settlement
      relation: reads
      description: API joins settlement status by refund_id.
  downstream:
    - id: dashboard.powerbi.refund_operations
      relation: serves
      description: Dashboard calls this API for refund summary data.

quality_checks:
  - name: Summary API Requires Date Range
    check_type: required_parameters
    fields:
      - start_date
      - end_date
    validates:
      - id: scenario.refund_settlement
        description: Refund summary queries must be scoped to a date range.
```

## Keep It Small

Keep parameters, returned fields, transformation logic, upstream tables/views, and downstream dashboards. If SQL is long, keep only `logic.description` and reference the code path elsewhere if your project tracks code references.

Do not use a read-only API as the direct upstream of a table just because a user workflow uses API output to create data later. Model the create/update API, frontend grid, backend command, or pipeline as a separate node when that direct write matters.

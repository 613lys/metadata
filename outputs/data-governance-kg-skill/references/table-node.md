# Table Node

A `table` is a physical database table. Generate it from the database catalog, not from guesses.

## Source Of Truth

Read these fields from the database:

```text
schema
table name
columns.name
columns.data_type
columns.nullable
primary key / unique constraints when available
foreign keys when available
```

Use sources such as `information_schema`, database system catalogs, dbt catalog, migration files, or ORM metadata. The Agent may add descriptions and semantic mappings, but must not invent column names or data types.

## ID Rule

Use the data's own `schema.table` as the table identity:

```text
table.<schema>.<table>
```

If multiple databases/platforms are in the same graph and schema/table may collide, add a namespace prefix:

```text
table.<source>.<schema>.<table>
```

## YAML Format

```yaml
id: table.<schema>.<table>
type: table
name:
description:

schema:

columns:
  - name:
    data_type:
    nullable:
    description:
    lineage:
      - source: column.<schema>.<table>.<column>
        description:
    quality_checks:
      - name:
        check_type:
        expectation:
    related_nodes:
      - id: term.<term>
        description:
      - id: object.<object>.<property>
        description:

primary_key:
  - <column_name>

related_nodes:
  - id: object.<object>
    description:
  - id: scenario.<scenario>
    description:

lineage:
  upstream:
    - id: pipeline.<platform>.<pipeline_name>
      relation: writes
      description:
  downstream:
    - id: api.<service>.<api_name>
      relation: reads
      description:

quality_checks:
  - name:
    check_type:
    fields:
      - <column_name>
    expectation:
```

## Example

```yaml
id: table.orders.refund_request
type: table
name: refund_request
description: Stores customer refund requests and approval status.

schema: orders

columns:
  - name: refund_id
    data_type: varchar
    nullable: false
  - name: order_id
    data_type: varchar
    nullable: false
  - name: refund_amount
    data_type: decimal
    nullable: false
    description: Amount requested for refund.
    quality_checks:
      - name: Refund Amount Non Negative
        check_type: range
        expectation: refund_amount >= 0
        validates:
          - id: term.refund
            description: Refund amounts should not be negative.
          - id: object.refund_request
            description: Refund requests require a valid refund amount.
    related_nodes:
      - id: term.refund
        description: This column stores the refund amount.
      - id: object.refund_request.refund_amount
        description: This column maps to the refund amount property.
  - name: approval_status
    data_type: varchar
    nullable: false

primary_key:
  - refund_id

related_nodes:
  - id: object.refund_request
    description: This table stores refund requests.
  - id: scenario.refund_approval
    description: This table supports the refund approval scenario.

quality_checks:
  - id: quality.refunds.approved_refund_requires_settlement
    description: Approved refunds should eventually have settlement records.
    validates:
      - id: scenario.refund_settlement
        description: This rule protects refund settlement completeness.
      - id: object.refund_request
        description: Approved refund requests are the source business object.
```

## Lineage Notes

Prefer putting lineage on the node that performs the action. For example, put pipeline input/output on the pipeline node and API reads on the API node. A table should include `lineage` only when the table itself is the clearest place to state a direct dependency, or when the process node is not modeled.

If a pipeline creates or updates the table, prefer this on the pipeline node:

```yaml
lineage:
  downstream:
    - id: table.orders.refund_request
      relation: writes
      description: Pipeline loads refund requests into this table.
```

Do not add shortcut edges. If `feedfile.s3.orders` is consumed by `pipeline.airflow.load_orders` and the pipeline writes `table.raw.orders`, do not also write `feedfile.s3.orders -> table.raw.orders`.

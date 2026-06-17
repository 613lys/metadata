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
owner:

schema:

columns:
  - name:
    data_type:
    nullable:
    description:
    term:
    lineage:
      upstream:
        - id: column.<schema>.<table>.<column>
          description:
      downstream:
        - id: column.<schema>.<table>.<column>
          description:

primary_key:
  - <column_name>

related_nodes:
  - id: business_entity.<entity>
    description:

lineage:
  upstream:
    - id: table.<schema>.<table>
      relation: DERIVES_FROM
      description:
  downstream:
    - id: view.<schema>.<view>
      relation: READS_FROM
      description: The downstream view/table reads this table.

evidence:
  - kind:
    ref:
verified:
  status:
  by:
  at:
  reason:
```

## Example

```yaml
id: table.orders.refund_request
type: table
name: refund_request
description: Stores customer refund requests and approval status.
owner: Orders Data Engineering

schema: orders

columns:
  - name: refund_id
    data_type: varchar
    nullable: false
    term: term.refund_request_identifier
    description: Primary key. Stores the refund request identifier.
  - name: order_id
    data_type: varchar
    nullable: false
    term: term.order_identifier
    description: Foreign key to the source order.
    lineage:
      upstream:
        - id: column.orders.order.order_id
          description: Refund request carries the order identifier from the source order.
      downstream:
        - id: column.analytics.refund_summary.order_id
          description: Refund summary uses this order identifier for order-level reporting.
  - name: refund_amount
    data_type: decimal
    nullable: false
    term: term.refund_amount
    description: Amount requested for refund. Schema allows decimal values; business non-negative validation belongs on the mapped business entity property.
    lineage:
      downstream:
        - id: column.analytics.refund_summary.total_refund_amount
          description: Refund summary aggregates requested refund amount.
  - name: approval_status
    data_type: varchar
    nullable: false
    term: term.approval_status
    description: Stores approval lifecycle status as a physical field.

primary_key:
  - refund_id

related_nodes:
  - id: business_entity.refund_request
    description: This table stores refund requests.

lineage:
  upstream:
    - id: table.orders.order
      relation: READS_FROM
      description: Refund requests reference source orders.
  downstream:
    - id: view.analytics.refund_summary
      relation: READS_FROM
      description: Refund summary reads refund request records.

evidence:
  - kind: db_schema
    ref: evidence/schema_snapshots/orders_refund_request.json
  - kind: migration
    ref: migrations/2026_06_01_create_refund_request.sql
verified:
  status: false
  reason: needs_data_owner_confirmation
```

## Lineage Notes

Prefer column-level lineage when a table/view column is derived from another table/view column. A table should include asset-level `lineage` only when the table itself is the clearest place to state a direct table/view dependency.

For table/view lineage, keep only direct dependencies:

```yaml
lineage:
  upstream:
    - id: table.raw.refund_request_events
      relation: DERIVES_FROM
      description: This table is built from raw refund request events.
```

Do not add shortcut edges. If `table.a -> view.b -> view.c`, do not also add `table.a -> view.c` unless `view.c` directly reads `table.a`.

## Glossary Mapping

Use `term` on a column when the column directly represents one glossary concept:

```yaml
columns:
  - name: approval_status
    term: term.approval_status
```

## Column Scope

Columns are physical fields. Keep column YAML focused on facts that come from schema, SQL, catalog, or code:

```text
name
data_type
nullable
description
term
lineage.upstream
lineage.downstream
```

Do not put `semantic_role`, business `constraints`, or `related_nodes` on table columns. Put semantic role and business constraints on `business_entity.properties[]`, and map those properties to columns with `properties[].maps_to[]`.

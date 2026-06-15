# Feedfile Node

A `feedfile` is a file-based data input or output.

## Source Of Truth

Generate from file contracts, sample files, ingestion configs, SFTP/object-storage paths, or pipeline code. Read field names and data types from schema contracts when available; otherwise infer from sample files and keep descriptions conservative.

## YAML Format

```yaml
id: feedfile.<source>.<file_name>
type: feedfile
name:
description:

location:
format:
frequency:
owner:

fields:
  - name:
    data_type:
    description:
    related_nodes:
      - id: term.<term>
        description:

related_nodes:
  - id: scenario.<scenario>
    description:

quality_checks:
  - name:
    check_type:
    expectation:
```

## Example

```yaml
id: feedfile.s3.refund_adjustments
type: feedfile
name: refund_adjustments.csv
description: Daily finance-provided file of manual refund adjustments.

location: s3://finance-data/outbound/refunds/refund_adjustments.csv
format: csv
frequency: daily
owner: team.finance-operations

fields:
  - name: refund_id
    data_type: string
  - name: adjustment_amount
    data_type: decimal
    description: Manual adjustment amount applied to a refund.
    related_nodes:
      - id: term.refund_adjustment
        description: Field stores the manual adjustment applied to a refund.

related_nodes:
  - id: scenario.refund_settlement
    description: Feed provides adjustment inputs for refund settlement.

quality_checks:
  - name: Refund Adjustments Freshness
    check_type: freshness
    expectation: received within 24 hours
    validates:
      - id: scenario.refund_settlement
        description: Refund settlement depends on fresh adjustment files.
```

## Lineage Notes

Prefer declaring the direct dependency on the consuming pipeline:

```yaml
lineage:
  upstream:
    - id: feedfile.s3.refund_adjustments
      relation: consumes
      description: Pipeline consumes this feed.
```

Do not also add `feedfile -> table` if the feed is loaded through a pipeline.

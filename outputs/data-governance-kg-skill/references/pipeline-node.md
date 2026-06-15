# Pipeline Node

A `pipeline` is a job, DAG, script, dbt model, Spark job, ETL/ELT process, or scheduled workflow.

## Source Of Truth

Generate from Airflow/Dagster definitions, dbt manifest, Spark jobs, SQL scripts, scheduler configs, CI jobs, or ingestion configs. Inputs and outputs should come from code/config parsing when possible.

## YAML Format

```yaml
id: pipeline.<platform>.<pipeline_name>
type: pipeline
name:
description:

platform:
schedule:
code_refs:
  - <path>

related_nodes:
  - id: scenario.<scenario>
    description:

lineage:
  upstream:
    - id: table.<schema>.<table>
      relation: reads
      description:
  downstream:
    - id: table.<schema>.<table>
      relation: writes
      description:

quality_checks:
  - name:
    check_type:
    expectation:
```

## Example

```yaml
id: pipeline.airflow.refund_settlement_job
type: pipeline
name: refund_settlement_job
description: Creates refund settlement records for approved refund requests.

platform: airflow
schedule: "0 2 * * *"
code_refs:
  - dags/refund_settlement.py
  - jobs/refund_settlement.sql

related_nodes:
  - id: scenario.refund_settlement
    description: Pipeline implements the refund settlement scenario.

lineage:
  upstream:
    - id: table.orders.refund_request
      relation: reads
      description: Pipeline consumes approved refund requests.
    - id: feedfile.sftp.refund_adjustments
      relation: consumes
      description: Pipeline consumes manual refund adjustments.
  downstream:
    - id: table.finance.refund_settlement
      relation: writes
      description: Pipeline produces refund settlement records.

quality_checks:
  - name: Refund Settlement Pipeline Success
    check_type: pipeline_success
    expectation: last run succeeded
    validates:
      - id: scenario.refund_settlement
        description: Refund settlement depends on this pipeline succeeding.
```

## Keep It Small

Keep `platform`, `schedule`, `code_refs`, `related_nodes`, `lineage`, and pipeline-level quality checks. Do not add operational metadata unless the Agent needs it.

## Direct Dependency Notes

Pipeline lineage should list only the direct inputs read by the job and the direct outputs written by the job. Do not list downstream APIs, dashboards, or tables reached through later jobs.

window.GRAPH_DATA = {
  "nodes": [
    {
      "id": "api.margin.get_margin_booking_candidates",
      "type": "api",
      "label": "GET /margin/booking-candidates",
      "properties": {
        "description": "Returns eligible margin calls for booking users.",
        "source_file": "knowledge/nodes/apis/api.margin.get_margin_booking_candidates.yaml"
      }
    },
    {
      "id": "api.margin.get_margin_settlement_summary",
      "type": "api",
      "label": "GET /margin/settlement-summary",
      "properties": {
        "description": "Returns margin, booking, and settlement status for operational dashboards.",
        "source_file": "knowledge/nodes/apis/api.margin.get_margin_settlement_summary.yaml"
      }
    },
    {
      "id": "column.risk.mtm_valuation.mtm_value",
      "type": "column",
      "label": "mtm_value",
      "properties": {
        "description": "MTM value for the position.",
        "source_file": "knowledge/nodes/columns/column.risk.mtm_valuation.mtm_value.yaml",
        "data_type": "decimal",
        "parent": "table.risk.mtm_valuation"
      }
    },
    {
      "id": "dashboard.powerbi.margin_operations",
      "type": "dashboard",
      "label": "Margin Operations",
      "properties": {
        "description": "Dashboard for monitoring margin calls, booking dispute status, and settlement status.",
        "source_file": "knowledge/nodes/dashboards/dashboard.powerbi.margin_operations.yaml"
      }
    },
    {
      "id": "feedfile.s3.counterparty_mtm_feed",
      "type": "feedfile",
      "label": "counterparty_mtm_feed.csv",
      "properties": {
        "description": "Daily counterparty-provided MTM feed.",
        "source_file": "knowledge/nodes/feedfiles/feedfile.s3.counterparty_mtm_feed.yaml"
      }
    },
    {
      "id": "object.booking_order",
      "type": "object",
      "label": "Booking Order",
      "properties": {
        "description": "Business object representing a booking created from an eligible margin call.",
        "source_file": "knowledge/nodes/objects/object.booking_order.yaml"
      }
    },
    {
      "id": "object.margin_call",
      "type": "object",
      "label": "Margin Call",
      "properties": {
        "description": "Business object representing required margin generated from valuation and collateral data.",
        "source_file": "knowledge/nodes/objects/object.margin_call.yaml"
      }
    },
    {
      "id": "object.mtm_valuation",
      "type": "object",
      "label": "MTM Valuation",
      "properties": {
        "description": "Business object representing a mark-to-market valuation record for a position.",
        "source_file": "knowledge/nodes/objects/object.mtm_valuation.yaml"
      }
    },
    {
      "id": "object.position",
      "type": "object",
      "label": "Position",
      "properties": {
        "description": "Business object representing a trading or collateral position that can be valued.",
        "source_file": "knowledge/nodes/objects/object.position.yaml"
      }
    },
    {
      "id": "object.settlement_instruction",
      "type": "object",
      "label": "Settlement Instruction",
      "properties": {
        "description": "Business object representing a settlement instruction created for an undisputed booking.",
        "source_file": "knowledge/nodes/objects/object.settlement_instruction.yaml"
      }
    },
    {
      "id": "pipeline.airflow.daily_mtm_valuation",
      "type": "pipeline",
      "label": "daily_mtm_valuation",
      "properties": {
        "description": "Loads counterparty MTM feed and produces normalized MTM valuation records.",
        "source_file": "knowledge/nodes/pipelines/pipeline.airflow.daily_mtm_valuation.yaml"
      }
    },
    {
      "id": "pipeline.airflow.margin_calculation_job",
      "type": "pipeline",
      "label": "margin_calculation_job",
      "properties": {
        "description": "Calculates margin requirement from MTM valuation and collateral balance.",
        "source_file": "knowledge/nodes/pipelines/pipeline.airflow.margin_calculation_job.yaml"
      }
    },
    {
      "id": "scenario.booking",
      "type": "scenario",
      "label": "Booking",
      "properties": {
        "description": "Creates booking orders from margin calls after calculation.",
        "source_file": "knowledge/nodes/scenarios/scenario.booking.yaml"
      }
    },
    {
      "id": "scenario.margin_booking_settlement",
      "type": "scenario",
      "label": "Margin Booking Settlement",
      "properties": {
        "description": "Parent business scenario covering MTM valuation, margin calculation, booking, dispute handling, and settlement.",
        "source_file": "knowledge/nodes/scenarios/scenario.margin_booking_settlement.yaml"
      }
    },
    {
      "id": "scenario.margin_calculation",
      "type": "scenario",
      "label": "Margin Calculation",
      "properties": {
        "description": "Calculates required margin from MTM valuation and collateral balance.",
        "source_file": "knowledge/nodes/scenarios/scenario.margin_calculation.yaml"
      }
    },
    {
      "id": "scenario.mtm_valuation",
      "type": "scenario",
      "label": "MTM Valuation",
      "properties": {
        "description": "Values positions using mark-to-market inputs and produces valuation records.",
        "source_file": "knowledge/nodes/scenarios/scenario.mtm_valuation.yaml"
      }
    },
    {
      "id": "scenario.settlement",
      "type": "scenario",
      "label": "Settlement",
      "properties": {
        "description": "Creates settlement instructions for undisputed booking orders.",
        "source_file": "knowledge/nodes/scenarios/scenario.settlement.yaml"
      }
    },
    {
      "id": "table.booking.booking_order",
      "type": "table",
      "label": "booking_order",
      "properties": {
        "description": "Stores booking orders created from eligible margin calls.",
        "source_file": "knowledge/nodes/tables/table.booking.booking_order.yaml"
      }
    },
    {
      "id": "table.collateral.collateral_balance",
      "type": "table",
      "label": "collateral_balance",
      "properties": {
        "description": "Stores available collateral balance by account and business date.",
        "source_file": "knowledge/nodes/tables/table.collateral.collateral_balance.yaml"
      }
    },
    {
      "id": "table.margin.margin_calculation",
      "type": "table",
      "label": "margin_calculation",
      "properties": {
        "description": "Stores calculated margin requirement and booking eligibility.",
        "source_file": "knowledge/nodes/tables/table.margin.margin_calculation.yaml"
      }
    },
    {
      "id": "table.risk.mtm_valuation",
      "type": "table",
      "label": "mtm_valuation",
      "properties": {
        "description": "Stores normalized MTM valuation records by position and valuation date.",
        "source_file": "knowledge/nodes/tables/table.risk.mtm_valuation.yaml"
      }
    },
    {
      "id": "table.settlement.settlement_instruction",
      "type": "table",
      "label": "settlement_instruction",
      "properties": {
        "description": "Stores settlement instructions created for undisputed booking orders.",
        "source_file": "knowledge/nodes/tables/table.settlement.settlement_instruction.yaml"
      }
    },
    {
      "id": "term.booking",
      "type": "term",
      "label": "Booking",
      "properties": {
        "description": "Business term for creating a booking order from an eligible margin call.",
        "source_file": "knowledge/nodes/terms/term.booking.yaml"
      }
    },
    {
      "id": "term.margin",
      "type": "term",
      "label": "Margin",
      "properties": {
        "description": "Business term for collateral requirement calculated from exposure and valuation.",
        "source_file": "knowledge/nodes/terms/term.margin.yaml"
      }
    },
    {
      "id": "term.mtm",
      "type": "term",
      "label": "MTM",
      "properties": {
        "description": "Business term for mark-to-market valuation.",
        "source_file": "knowledge/nodes/terms/term.mtm.yaml"
      }
    },
    {
      "id": "term.settlement",
      "type": "term",
      "label": "Settlement",
      "properties": {
        "description": "Business term for creating settlement instructions after booking.",
        "source_file": "knowledge/nodes/terms/term.settlement.yaml"
      }
    },
    {
      "id": "term.undisputed",
      "type": "term",
      "label": "Undisputed",
      "properties": {
        "description": "Business status indicating no active dispute blocks settlement.",
        "source_file": "knowledge/nodes/terms/term.undisputed.yaml"
      }
    },
    {
      "id": "view.settlement.v_margin_settlement_summary",
      "type": "view",
      "label": "v_margin_settlement_summary",
      "properties": {
        "description": "View combining margin calculation, booking order, and settlement instruction status.",
        "source_file": "knowledge/nodes/views/view.settlement.v_margin_settlement_summary.yaml"
      }
    },
    {
      "id": "api.margin.get_margin_booking_candidates.margin_call_id",
      "type": "api_field",
      "label": "margin_call_id",
      "properties": {
        "description": "Margin call identifier.",
        "data_type": "string",
        "parent": "api.margin.get_margin_booking_candidates"
      }
    },
    {
      "id": "api.margin.get_margin_booking_candidates.margin_requirement",
      "type": "api_field",
      "label": "margin_requirement",
      "properties": {
        "description": "Required margin amount.",
        "data_type": "decimal",
        "parent": "api.margin.get_margin_booking_candidates"
      }
    },
    {
      "id": "quality.api.margin.get_margin_booking_candidates.Candidate_API_Requires_Business_Date",
      "type": "quality_check",
      "label": "Candidate API Requires Business Date",
      "properties": {
        "description": "",
        "check_type": "required_parameters",
        "parent": "api.margin.get_margin_booking_candidates"
      }
    },
    {
      "id": "api.margin.get_margin_settlement_summary.margin_call_id",
      "type": "api_field",
      "label": "margin_call_id",
      "properties": {
        "description": "Margin call identifier.",
        "data_type": "string",
        "parent": "api.margin.get_margin_settlement_summary"
      }
    },
    {
      "id": "api.margin.get_margin_settlement_summary.dispute_status",
      "type": "api_field",
      "label": "dispute_status",
      "properties": {
        "description": "Booking dispute status.",
        "data_type": "string",
        "parent": "api.margin.get_margin_settlement_summary"
      }
    },
    {
      "id": "api.margin.get_margin_settlement_summary.settlement_status",
      "type": "api_field",
      "label": "settlement_status",
      "properties": {
        "description": "Settlement instruction status.",
        "data_type": "string",
        "parent": "api.margin.get_margin_settlement_summary"
      }
    },
    {
      "id": "quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null",
      "type": "quality_check",
      "label": "MTM Value Not Null",
      "properties": {
        "description": "",
        "check_type": "not_null",
        "parent": "column.risk.mtm_valuation.mtm_value"
      }
    },
    {
      "id": "feedfile.s3.counterparty_mtm_feed.position_id",
      "type": "feedfile_field",
      "label": "position_id",
      "properties": {
        "description": "",
        "data_type": "string",
        "parent": "feedfile.s3.counterparty_mtm_feed"
      }
    },
    {
      "id": "feedfile.s3.counterparty_mtm_feed.mtm_value",
      "type": "feedfile_field",
      "label": "mtm_value",
      "properties": {
        "description": "Counterparty-provided MTM value.",
        "data_type": "decimal",
        "parent": "feedfile.s3.counterparty_mtm_feed"
      }
    },
    {
      "id": "feedfile.s3.counterparty_mtm_feed.valuation_date",
      "type": "feedfile_field",
      "label": "valuation_date",
      "properties": {
        "description": "",
        "data_type": "date",
        "parent": "feedfile.s3.counterparty_mtm_feed"
      }
    },
    {
      "id": "quality.feedfile.s3.counterparty_mtm_feed.Counterparty_MTM_Feed_Freshness",
      "type": "quality_check",
      "label": "Counterparty MTM Feed Freshness",
      "properties": {
        "description": "received within 24 hours",
        "check_type": "freshness",
        "parent": "feedfile.s3.counterparty_mtm_feed"
      }
    },
    {
      "id": "quality.pipeline.airflow.daily_mtm_valuation.Daily_MTM_Valuation_Pipeline_Success",
      "type": "quality_check",
      "label": "Daily MTM Valuation Pipeline Success",
      "properties": {
        "description": "last run succeeded",
        "check_type": "pipeline_success",
        "parent": "pipeline.airflow.daily_mtm_valuation"
      }
    },
    {
      "id": "quality.pipeline.airflow.margin_calculation_job.Margin_Calculation_Pipeline_Success",
      "type": "quality_check",
      "label": "Margin Calculation Pipeline Success",
      "properties": {
        "description": "last run succeeded",
        "check_type": "pipeline_success",
        "parent": "pipeline.airflow.margin_calculation_job"
      }
    },
    {
      "id": "column.booking.booking_order.booking_id",
      "type": "column",
      "label": "booking_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.booking.booking_order"
      }
    },
    {
      "id": "column.booking.booking_order.margin_call_id",
      "type": "column",
      "label": "margin_call_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.booking.booking_order"
      }
    },
    {
      "id": "column.booking.booking_order.booking_amount",
      "type": "column",
      "label": "booking_amount",
      "properties": {
        "description": "",
        "data_type": "decimal",
        "parent": "table.booking.booking_order"
      }
    },
    {
      "id": "column.booking.booking_order.dispute_status",
      "type": "column",
      "label": "dispute_status",
      "properties": {
        "description": "Indicates whether booking is disputed or undisputed.",
        "data_type": "varchar",
        "parent": "table.booking.booking_order"
      }
    },
    {
      "id": "quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled",
      "type": "quality_check",
      "label": "Disputed Booking Must Not Be Settled",
      "properties": {
        "description": "settlement can proceed only when dispute_status == \"undisputed\"",
        "check_type": "conditional_expression",
        "parent": "table.booking.booking_order"
      }
    },
    {
      "id": "column.collateral.collateral_balance.account_id",
      "type": "column",
      "label": "account_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.collateral.collateral_balance"
      }
    },
    {
      "id": "column.collateral.collateral_balance.available_collateral",
      "type": "column",
      "label": "available_collateral",
      "properties": {
        "description": "",
        "data_type": "decimal",
        "parent": "table.collateral.collateral_balance"
      }
    },
    {
      "id": "column.collateral.collateral_balance.business_date",
      "type": "column",
      "label": "business_date",
      "properties": {
        "description": "",
        "data_type": "date",
        "parent": "table.collateral.collateral_balance"
      }
    },
    {
      "id": "quality.table.collateral.collateral_balance.Available_Collateral_Non_Negative",
      "type": "quality_check",
      "label": "Available Collateral Non Negative",
      "properties": {
        "description": "available_collateral >= 0",
        "check_type": "range",
        "parent": "table.collateral.collateral_balance"
      }
    },
    {
      "id": "column.margin.margin_calculation.margin_call_id",
      "type": "column",
      "label": "margin_call_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.margin.margin_calculation"
      }
    },
    {
      "id": "column.margin.margin_calculation.valuation_id",
      "type": "column",
      "label": "valuation_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.margin.margin_calculation"
      }
    },
    {
      "id": "column.margin.margin_calculation.margin_requirement",
      "type": "column",
      "label": "margin_requirement",
      "properties": {
        "description": "Required margin amount calculated from MTM valuation and collateral.",
        "data_type": "decimal",
        "parent": "table.margin.margin_calculation"
      }
    },
    {
      "id": "column.margin.margin_calculation.booking_eligible",
      "type": "column",
      "label": "booking_eligible",
      "properties": {
        "description": "",
        "data_type": "boolean",
        "parent": "table.margin.margin_calculation"
      }
    },
    {
      "id": "quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative",
      "type": "quality_check",
      "label": "Margin Requirement Non Negative",
      "properties": {
        "description": "margin_requirement >= 0",
        "check_type": "range",
        "parent": "table.margin.margin_calculation"
      }
    },
    {
      "id": "column.risk.mtm_valuation.valuation_id",
      "type": "column",
      "label": "valuation_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.risk.mtm_valuation"
      }
    },
    {
      "id": "column.risk.mtm_valuation.position_id",
      "type": "column",
      "label": "position_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.risk.mtm_valuation"
      }
    },
    {
      "id": "column.risk.mtm_valuation.valuation_date",
      "type": "column",
      "label": "valuation_date",
      "properties": {
        "description": "",
        "data_type": "date",
        "parent": "table.risk.mtm_valuation"
      }
    },
    {
      "id": "quality.table.risk.mtm_valuation.MTM_Value_Not_Null",
      "type": "quality_check",
      "label": "MTM Value Not Null",
      "properties": {
        "description": "",
        "check_type": "not_null",
        "parent": "table.risk.mtm_valuation"
      }
    },
    {
      "id": "quality.table.risk.mtm_valuation.Valuation_Date_Not_Null",
      "type": "quality_check",
      "label": "Valuation Date Not Null",
      "properties": {
        "description": "",
        "check_type": "not_null",
        "parent": "table.risk.mtm_valuation"
      }
    },
    {
      "id": "column.settlement.settlement_instruction.settlement_id",
      "type": "column",
      "label": "settlement_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.settlement.settlement_instruction"
      }
    },
    {
      "id": "column.settlement.settlement_instruction.booking_id",
      "type": "column",
      "label": "booking_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.settlement.settlement_instruction"
      }
    },
    {
      "id": "column.settlement.settlement_instruction.settlement_amount",
      "type": "column",
      "label": "settlement_amount",
      "properties": {
        "description": "",
        "data_type": "decimal",
        "parent": "table.settlement.settlement_instruction"
      }
    },
    {
      "id": "column.settlement.settlement_instruction.settlement_status",
      "type": "column",
      "label": "settlement_status",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "table.settlement.settlement_instruction"
      }
    },
    {
      "id": "quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative",
      "type": "quality_check",
      "label": "Settlement Amount Non Negative",
      "properties": {
        "description": "settlement_amount >= 0",
        "check_type": "range",
        "parent": "table.settlement.settlement_instruction"
      }
    },
    {
      "id": "column.settlement.v_margin_settlement_summary.margin_call_id",
      "type": "column",
      "label": "margin_call_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "view.settlement.v_margin_settlement_summary"
      }
    },
    {
      "id": "column.settlement.v_margin_settlement_summary.margin_requirement",
      "type": "column",
      "label": "margin_requirement",
      "properties": {
        "description": "",
        "data_type": "decimal",
        "parent": "view.settlement.v_margin_settlement_summary"
      }
    },
    {
      "id": "column.settlement.v_margin_settlement_summary.booking_id",
      "type": "column",
      "label": "booking_id",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "view.settlement.v_margin_settlement_summary"
      }
    },
    {
      "id": "column.settlement.v_margin_settlement_summary.dispute_status",
      "type": "column",
      "label": "dispute_status",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "view.settlement.v_margin_settlement_summary"
      }
    },
    {
      "id": "column.settlement.v_margin_settlement_summary.settlement_status",
      "type": "column",
      "label": "settlement_status",
      "properties": {
        "description": "",
        "data_type": "varchar",
        "parent": "view.settlement.v_margin_settlement_summary"
      }
    }
  ],
  "edges": [
    {
      "id": "edge.api.margin.get_margin_booking_candidates.related_to.scenario.booking",
      "type": "related_to",
      "source": "api.margin.get_margin_booking_candidates",
      "target": "scenario.booking",
      "properties": {
        "inferred": true,
        "description": "API serves candidates for the booking scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.api.margin.get_margin_booking_candidates.related_to.object.margin_call",
      "type": "related_to",
      "source": "api.margin.get_margin_booking_candidates",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "API returns eligible margin calls.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.reads.api.margin.get_margin_booking_candidates",
      "type": "reads",
      "source": "table.margin.margin_calculation",
      "target": "api.margin.get_margin_booking_candidates",
      "properties": {
        "inferred": true,
        "description": "API reads margin calculation records.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.api.margin.get_margin_booking_candidates.contains.api.margin.get_margin_booking_candidates.margin_call_id",
      "type": "contains",
      "source": "api.margin.get_margin_booking_candidates",
      "target": "api.margin.get_margin_booking_candidates.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "GET /margin/booking-candidates contains field margin_call_id.",
        "source_field": "returns"
      }
    },
    {
      "id": "edge.column.margin.margin_calculation.margin_call_id.field_lineage.api.margin.get_margin_booking_candidates.margin_call_id",
      "type": "field_lineage",
      "source": "column.margin.margin_calculation.margin_call_id",
      "target": "api.margin.get_margin_booking_candidates.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "Directly selected from margin_calculation.margin_call_id.",
        "source_field": "returns.lineage"
      }
    },
    {
      "id": "edge.api.margin.get_margin_booking_candidates.contains.api.margin.get_margin_booking_candidates.margin_requirement",
      "type": "contains",
      "source": "api.margin.get_margin_booking_candidates",
      "target": "api.margin.get_margin_booking_candidates.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "GET /margin/booking-candidates contains field margin_requirement.",
        "source_field": "returns"
      }
    },
    {
      "id": "edge.column.margin.margin_calculation.margin_requirement.field_lineage.api.margin.get_margin_booking_candidates.margin_requirement",
      "type": "field_lineage",
      "source": "column.margin.margin_calculation.margin_requirement",
      "target": "api.margin.get_margin_booking_candidates.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "Directly selected from margin_calculation.margin_requirement.",
        "source_field": "returns.lineage"
      }
    },
    {
      "id": "edge.quality.api.margin.get_margin_booking_candidates.Candidate_API_Requires_Business_Date.checks.api.margin.get_margin_booking_candidates",
      "type": "checks",
      "source": "quality.api.margin.get_margin_booking_candidates.Candidate_API_Requires_Business_Date",
      "target": "api.margin.get_margin_booking_candidates",
      "properties": {
        "inferred": true,
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.api.margin.get_margin_booking_candidates.Candidate_API_Requires_Business_Date.validates.scenario.booking",
      "type": "validates",
      "source": "quality.api.margin.get_margin_booking_candidates.Candidate_API_Requires_Business_Date",
      "target": "scenario.booking",
      "properties": {
        "inferred": true,
        "description": "Booking candidate selection must be scoped to a business date.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.api.margin.get_margin_booking_candidates.Candidate_API_Requires_Business_Date.validates.object.margin_call",
      "type": "validates",
      "source": "quality.api.margin.get_margin_booking_candidates.Candidate_API_Requires_Business_Date",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "The API returns eligible margin calls for booking.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.api.margin.get_margin_settlement_summary.related_to.scenario.margin_booking_settlement",
      "type": "related_to",
      "source": "api.margin.get_margin_settlement_summary",
      "target": "scenario.margin_booking_settlement",
      "properties": {
        "inferred": true,
        "description": "API serves dashboard data for the parent scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.view.settlement.v_margin_settlement_summary.reads.api.margin.get_margin_settlement_summary",
      "type": "reads",
      "source": "view.settlement.v_margin_settlement_summary",
      "target": "api.margin.get_margin_settlement_summary",
      "properties": {
        "inferred": true,
        "description": "API reads the margin settlement summary view.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.api.margin.get_margin_settlement_summary.serves.dashboard.powerbi.margin_operations",
      "type": "serves",
      "source": "api.margin.get_margin_settlement_summary",
      "target": "dashboard.powerbi.margin_operations",
      "properties": {
        "inferred": true,
        "description": "Dashboard calls this API for operational monitoring.",
        "source_field": "lineage.downstream"
      }
    },
    {
      "id": "edge.api.margin.get_margin_settlement_summary.contains.api.margin.get_margin_settlement_summary.margin_call_id",
      "type": "contains",
      "source": "api.margin.get_margin_settlement_summary",
      "target": "api.margin.get_margin_settlement_summary.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "GET /margin/settlement-summary contains field margin_call_id.",
        "source_field": "returns"
      }
    },
    {
      "id": "edge.column.settlement.v_margin_settlement_summary.margin_call_id.field_lineage.api.margin.get_margin_settlement_summary.margin_call_id",
      "type": "field_lineage",
      "source": "column.settlement.v_margin_settlement_summary.margin_call_id",
      "target": "api.margin.get_margin_settlement_summary.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "Returned from summary view.",
        "source_field": "returns.lineage"
      }
    },
    {
      "id": "edge.api.margin.get_margin_settlement_summary.contains.api.margin.get_margin_settlement_summary.dispute_status",
      "type": "contains",
      "source": "api.margin.get_margin_settlement_summary",
      "target": "api.margin.get_margin_settlement_summary.dispute_status",
      "properties": {
        "inferred": true,
        "description": "GET /margin/settlement-summary contains field dispute_status.",
        "source_field": "returns"
      }
    },
    {
      "id": "edge.column.settlement.v_margin_settlement_summary.dispute_status.field_lineage.api.margin.get_margin_settlement_summary.dispute_status",
      "type": "field_lineage",
      "source": "column.settlement.v_margin_settlement_summary.dispute_status",
      "target": "api.margin.get_margin_settlement_summary.dispute_status",
      "properties": {
        "inferred": true,
        "description": "Returned from summary view.",
        "source_field": "returns.lineage"
      }
    },
    {
      "id": "edge.api.margin.get_margin_settlement_summary.contains.api.margin.get_margin_settlement_summary.settlement_status",
      "type": "contains",
      "source": "api.margin.get_margin_settlement_summary",
      "target": "api.margin.get_margin_settlement_summary.settlement_status",
      "properties": {
        "inferred": true,
        "description": "GET /margin/settlement-summary contains field settlement_status.",
        "source_field": "returns"
      }
    },
    {
      "id": "edge.column.settlement.v_margin_settlement_summary.settlement_status.field_lineage.api.margin.get_margin_settlement_summary.settlement_status",
      "type": "field_lineage",
      "source": "column.settlement.v_margin_settlement_summary.settlement_status",
      "target": "api.margin.get_margin_settlement_summary.settlement_status",
      "properties": {
        "inferred": true,
        "description": "Returned from summary view.",
        "source_field": "returns.lineage"
      }
    },
    {
      "id": "edge.column.risk.mtm_valuation.mtm_value.related_to.term.mtm",
      "type": "related_to",
      "source": "column.risk.mtm_valuation.mtm_value",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "This column stores the MTM amount.",
        "source_field": "columns.related_nodes"
      }
    },
    {
      "id": "edge.column.risk.mtm_valuation.mtm_value.related_to.object.mtm_valuation.mtm_value",
      "type": "related_to",
      "source": "column.risk.mtm_valuation.mtm_value",
      "target": "object.mtm_valuation.mtm_value",
      "properties": {
        "inferred": true,
        "description": "This column maps to the MTM valuation value property.",
        "source_field": "columns.related_nodes"
      }
    },
    {
      "id": "edge.column.risk.mtm_valuation.mtm_value.related_to.scenario.margin_calculation",
      "type": "related_to",
      "source": "column.risk.mtm_valuation.mtm_value",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Margin calculation uses this column as an input.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.column.risk.mtm_valuation.mtm_value.lineage.column.margin.margin_calculation.margin_requirement",
      "type": "lineage",
      "source": "column.risk.mtm_valuation.mtm_value",
      "target": "column.margin.margin_calculation.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "Margin requirement is calculated using MTM value.",
        "source_field": "lineage.downstream"
      }
    },
    {
      "id": "edge.quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null.checks.column.risk.mtm_valuation.mtm_value",
      "type": "checks",
      "source": "quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null",
      "target": "column.risk.mtm_valuation.mtm_value",
      "properties": {
        "inferred": true,
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null.validates.term.mtm",
      "type": "validates",
      "source": "quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "MTM value must exist for the MTM concept to be usable.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null.validates.object.mtm_valuation",
      "type": "validates",
      "source": "quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "MTM valuation records require a valuation amount.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null.validates.scenario.margin_calculation",
      "type": "validates",
      "source": "quality.column.risk.mtm_valuation.mtm_value.MTM_Value_Not_Null",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Margin calculation depends on this MTM value input.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.dashboard.powerbi.margin_operations.related_to.scenario.margin_booking_settlement",
      "type": "related_to",
      "source": "dashboard.powerbi.margin_operations",
      "target": "scenario.margin_booking_settlement",
      "properties": {
        "inferred": true,
        "description": "Dashboard monitors the parent margin booking settlement scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.dashboard.powerbi.margin_operations.related_to.scenario.settlement",
      "type": "related_to",
      "source": "dashboard.powerbi.margin_operations",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "Dashboard shows settlement status.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.dashboard.powerbi.margin_operations.displays.column.settlement.v_margin_settlement_summary.margin_call_id",
      "type": "displays",
      "source": "dashboard.powerbi.margin_operations",
      "target": "column.settlement.v_margin_settlement_summary.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "Margin Operations displays column.settlement.v_margin_settlement_summary.margin_call_id.",
        "source_field": "displays"
      }
    },
    {
      "id": "edge.dashboard.powerbi.margin_operations.displays.column.settlement.v_margin_settlement_summary.dispute_status",
      "type": "displays",
      "source": "dashboard.powerbi.margin_operations",
      "target": "column.settlement.v_margin_settlement_summary.dispute_status",
      "properties": {
        "inferred": true,
        "description": "Margin Operations displays column.settlement.v_margin_settlement_summary.dispute_status.",
        "source_field": "displays"
      }
    },
    {
      "id": "edge.dashboard.powerbi.margin_operations.displays.column.settlement.v_margin_settlement_summary.settlement_status",
      "type": "displays",
      "source": "dashboard.powerbi.margin_operations",
      "target": "column.settlement.v_margin_settlement_summary.settlement_status",
      "properties": {
        "inferred": true,
        "description": "Margin Operations displays column.settlement.v_margin_settlement_summary.settlement_status.",
        "source_field": "displays"
      }
    },
    {
      "id": "edge.feedfile.s3.counterparty_mtm_feed.related_to.scenario.mtm_valuation",
      "type": "related_to",
      "source": "feedfile.s3.counterparty_mtm_feed",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Feed provides input data for MTM valuation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.feedfile.s3.counterparty_mtm_feed.contains.feedfile.s3.counterparty_mtm_feed.position_id",
      "type": "contains",
      "source": "feedfile.s3.counterparty_mtm_feed",
      "target": "feedfile.s3.counterparty_mtm_feed.position_id",
      "properties": {
        "inferred": true,
        "description": "counterparty_mtm_feed.csv contains field position_id.",
        "source_field": "fields"
      }
    },
    {
      "id": "edge.feedfile.s3.counterparty_mtm_feed.contains.feedfile.s3.counterparty_mtm_feed.mtm_value",
      "type": "contains",
      "source": "feedfile.s3.counterparty_mtm_feed",
      "target": "feedfile.s3.counterparty_mtm_feed.mtm_value",
      "properties": {
        "inferred": true,
        "description": "counterparty_mtm_feed.csv contains field mtm_value.",
        "source_field": "fields"
      }
    },
    {
      "id": "edge.feedfile.s3.counterparty_mtm_feed.mtm_value.related_to.term.mtm",
      "type": "related_to",
      "source": "feedfile.s3.counterparty_mtm_feed.mtm_value",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "Field stores MTM value.",
        "source_field": "fields.related_nodes"
      }
    },
    {
      "id": "edge.feedfile.s3.counterparty_mtm_feed.contains.feedfile.s3.counterparty_mtm_feed.valuation_date",
      "type": "contains",
      "source": "feedfile.s3.counterparty_mtm_feed",
      "target": "feedfile.s3.counterparty_mtm_feed.valuation_date",
      "properties": {
        "inferred": true,
        "description": "counterparty_mtm_feed.csv contains field valuation_date.",
        "source_field": "fields"
      }
    },
    {
      "id": "edge.quality.feedfile.s3.counterparty_mtm_feed.Counterparty_MTM_Feed_Freshness.checks.feedfile.s3.counterparty_mtm_feed",
      "type": "checks",
      "source": "quality.feedfile.s3.counterparty_mtm_feed.Counterparty_MTM_Feed_Freshness",
      "target": "feedfile.s3.counterparty_mtm_feed",
      "properties": {
        "inferred": true,
        "description": "received within 24 hours",
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.feedfile.s3.counterparty_mtm_feed.Counterparty_MTM_Feed_Freshness.validates.scenario.mtm_valuation",
      "type": "validates",
      "source": "quality.feedfile.s3.counterparty_mtm_feed.Counterparty_MTM_Feed_Freshness",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Fresh MTM feed data is required for daily MTM valuation.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.feedfile.s3.counterparty_mtm_feed.Counterparty_MTM_Feed_Freshness.validates.term.mtm",
      "type": "validates",
      "source": "quality.feedfile.s3.counterparty_mtm_feed.Counterparty_MTM_Feed_Freshness",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "The check protects the timeliness of MTM values.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.object.booking_order.created_from.object.margin_call",
      "type": "created_from",
      "source": "object.booking_order",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "A booking order is created from a margin call.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.booking_order.creates_when_undisputed.object.settlement_instruction",
      "type": "creates_when_undisputed",
      "source": "object.booking_order",
      "target": "object.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "An undisputed booking order can lead to a settlement instruction.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.booking_order.implemented_by.table.booking.booking_order",
      "type": "implemented_by",
      "source": "object.booking_order",
      "target": "table.booking.booking_order",
      "properties": {
        "inferred": true,
        "description": "This table stores booking orders.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.booking_order.served_by.api.margin.get_margin_booking_candidates",
      "type": "served_by",
      "source": "object.booking_order",
      "target": "api.margin.get_margin_booking_candidates",
      "properties": {
        "inferred": true,
        "description": "This API exposes candidates for booking.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.margin_call.derived_from.object.mtm_valuation",
      "type": "derived_from",
      "source": "object.margin_call",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Margin calls are derived from MTM valuations.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.margin_call.creates.object.booking_order",
      "type": "creates",
      "source": "object.margin_call",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Eligible margin calls can create booking orders.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.margin_call.implemented_by.table.margin.margin_calculation",
      "type": "implemented_by",
      "source": "object.margin_call",
      "target": "table.margin.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "This table stores margin call calculation results.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.mtm_valuation.values.object.position",
      "type": "values",
      "source": "object.mtm_valuation",
      "target": "object.position",
      "properties": {
        "inferred": true,
        "description": "MTM valuation values a position.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.mtm_valuation.defined_by.term.mtm",
      "type": "defined_by",
      "source": "object.mtm_valuation",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "MTM defines the valuation meaning.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.mtm_valuation.implemented_by.table.risk.mtm_valuation",
      "type": "implemented_by",
      "source": "object.mtm_valuation",
      "target": "table.risk.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "This table stores MTM valuation records.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.position.valued_by.object.mtm_valuation",
      "type": "valued_by",
      "source": "object.position",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Positions are valued by MTM valuation records.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.position.involved_in.scenario.mtm_valuation",
      "type": "involved_in",
      "source": "object.position",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Positions are the primary subject of MTM valuation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.settlement_instruction.created_from.object.booking_order",
      "type": "created_from",
      "source": "object.settlement_instruction",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Settlement instruction is created from an undisputed booking order.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.settlement_instruction.implemented_by.table.settlement.settlement_instruction",
      "type": "implemented_by",
      "source": "object.settlement_instruction",
      "target": "table.settlement.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "This table stores settlement instructions.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.object.settlement_instruction.produced_by.scenario.settlement",
      "type": "produced_by",
      "source": "object.settlement_instruction",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "This object is produced in the settlement scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.pipeline.airflow.daily_mtm_valuation.related_to.scenario.mtm_valuation",
      "type": "related_to",
      "source": "pipeline.airflow.daily_mtm_valuation",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Pipeline implements the MTM valuation scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.feedfile.s3.counterparty_mtm_feed.consumes.pipeline.airflow.daily_mtm_valuation",
      "type": "consumes",
      "source": "feedfile.s3.counterparty_mtm_feed",
      "target": "pipeline.airflow.daily_mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Pipeline consumes counterparty MTM feed.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.pipeline.airflow.daily_mtm_valuation.writes.table.risk.mtm_valuation",
      "type": "writes",
      "source": "pipeline.airflow.daily_mtm_valuation",
      "target": "table.risk.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Pipeline produces normalized MTM valuation table.",
        "source_field": "lineage.downstream"
      }
    },
    {
      "id": "edge.quality.pipeline.airflow.daily_mtm_valuation.Daily_MTM_Valuation_Pipeline_Success.checks.pipeline.airflow.daily_mtm_valuation",
      "type": "checks",
      "source": "quality.pipeline.airflow.daily_mtm_valuation.Daily_MTM_Valuation_Pipeline_Success",
      "target": "pipeline.airflow.daily_mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "last run succeeded",
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.pipeline.airflow.daily_mtm_valuation.Daily_MTM_Valuation_Pipeline_Success.validates.scenario.mtm_valuation",
      "type": "validates",
      "source": "quality.pipeline.airflow.daily_mtm_valuation.Daily_MTM_Valuation_Pipeline_Success",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "The valuation scenario depends on this pipeline completing successfully.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.pipeline.airflow.daily_mtm_valuation.Daily_MTM_Valuation_Pipeline_Success.validates.object.mtm_valuation",
      "type": "validates",
      "source": "quality.pipeline.airflow.daily_mtm_valuation.Daily_MTM_Valuation_Pipeline_Success",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "The pipeline produces MTM valuation records.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.pipeline.airflow.margin_calculation_job.related_to.scenario.margin_calculation",
      "type": "related_to",
      "source": "pipeline.airflow.margin_calculation_job",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Pipeline implements the margin calculation scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.risk.mtm_valuation.reads.pipeline.airflow.margin_calculation_job",
      "type": "reads",
      "source": "table.risk.mtm_valuation",
      "target": "pipeline.airflow.margin_calculation_job",
      "properties": {
        "inferred": true,
        "description": "Pipeline consumes MTM valuation records.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.table.collateral.collateral_balance.reads.pipeline.airflow.margin_calculation_job",
      "type": "reads",
      "source": "table.collateral.collateral_balance",
      "target": "pipeline.airflow.margin_calculation_job",
      "properties": {
        "inferred": true,
        "description": "Pipeline consumes collateral balance.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.pipeline.airflow.margin_calculation_job.writes.table.margin.margin_calculation",
      "type": "writes",
      "source": "pipeline.airflow.margin_calculation_job",
      "target": "table.margin.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Pipeline produces margin calculation records.",
        "source_field": "lineage.downstream"
      }
    },
    {
      "id": "edge.quality.pipeline.airflow.margin_calculation_job.Margin_Calculation_Pipeline_Success.checks.pipeline.airflow.margin_calculation_job",
      "type": "checks",
      "source": "quality.pipeline.airflow.margin_calculation_job.Margin_Calculation_Pipeline_Success",
      "target": "pipeline.airflow.margin_calculation_job",
      "properties": {
        "inferred": true,
        "description": "last run succeeded",
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.pipeline.airflow.margin_calculation_job.Margin_Calculation_Pipeline_Success.validates.scenario.margin_calculation",
      "type": "validates",
      "source": "quality.pipeline.airflow.margin_calculation_job.Margin_Calculation_Pipeline_Success",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Margin calculation depends on this pipeline completing successfully.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.pipeline.airflow.margin_calculation_job.Margin_Calculation_Pipeline_Success.validates.object.margin_call",
      "type": "validates",
      "source": "quality.pipeline.airflow.margin_calculation_job.Margin_Calculation_Pipeline_Success",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "The pipeline produces margin call calculation results.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.scenario.booking.uses_term.term.booking",
      "type": "uses_term",
      "source": "scenario.booking",
      "target": "term.booking",
      "properties": {
        "inferred": true,
        "description": "Booking is the business action of creating a booking order.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.booking.consumes.object.margin_call",
      "type": "consumes",
      "source": "scenario.booking",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "Booking starts from an eligible margin call.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.booking.produces.object.booking_order",
      "type": "produces",
      "source": "scenario.booking",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Booking produces booking orders.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.booking.related_to.table.margin.margin_calculation",
      "type": "related_to",
      "source": "scenario.booking",
      "target": "table.margin.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Source table for eligible booking candidates.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.booking.related_to.api.margin.get_margin_booking_candidates",
      "type": "related_to",
      "source": "scenario.booking",
      "target": "api.margin.get_margin_booking_candidates",
      "properties": {
        "inferred": true,
        "description": "API serves booking candidates from margin calculation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.booking.related_to.table.booking.booking_order",
      "type": "related_to",
      "source": "scenario.booking",
      "target": "table.booking.booking_order",
      "properties": {
        "inferred": true,
        "description": "Table stores booking orders.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.related_to.term.mtm",
      "type": "related_to",
      "source": "scenario.margin_booking_settlement",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "MTM is the valuation concept used by this flow.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.related_to.term.margin",
      "type": "related_to",
      "source": "scenario.margin_booking_settlement",
      "target": "term.margin",
      "properties": {
        "inferred": true,
        "description": "Margin is calculated from valuation and collateral context.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.related_to.object.margin_call",
      "type": "related_to",
      "source": "scenario.margin_booking_settlement",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "Margin calls are produced by margin calculation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.related_to.object.booking_order",
      "type": "related_to",
      "source": "scenario.margin_booking_settlement",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Booking orders are created from margin calls.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.related_to.object.settlement_instruction",
      "type": "related_to",
      "source": "scenario.margin_booking_settlement",
      "target": "object.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "Settlement instructions are created for undisputed bookings.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.contains_scenario.scenario.mtm_valuation",
      "type": "contains_scenario",
      "source": "scenario.margin_booking_settlement",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Parent scenario contains child scenario.",
        "source_field": "child_scenarios"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.contains_scenario.scenario.margin_calculation",
      "type": "contains_scenario",
      "source": "scenario.margin_booking_settlement",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Parent scenario contains child scenario.",
        "source_field": "child_scenarios"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.contains_scenario.scenario.booking",
      "type": "contains_scenario",
      "source": "scenario.margin_booking_settlement",
      "target": "scenario.booking",
      "properties": {
        "inferred": true,
        "description": "Parent scenario contains child scenario.",
        "source_field": "child_scenarios"
      }
    },
    {
      "id": "edge.scenario.margin_booking_settlement.contains_scenario.scenario.settlement",
      "type": "contains_scenario",
      "source": "scenario.margin_booking_settlement",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "Parent scenario contains child scenario.",
        "source_field": "child_scenarios"
      }
    },
    {
      "id": "edge.scenario.mtm_valuation.enables.scenario.margin_calculation",
      "type": "enables",
      "source": "scenario.mtm_valuation",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "MTM valuation must be available before margin can be calculated.",
        "source_field": "scenario_flow"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.produces_input_for.scenario.booking",
      "type": "produces_input_for",
      "source": "scenario.margin_calculation",
      "target": "scenario.booking",
      "properties": {
        "inferred": true,
        "description": "Booking is created from calculated margin results.",
        "source_field": "scenario_flow"
      }
    },
    {
      "id": "edge.scenario.booking.enables_when_undisputed.scenario.settlement",
      "type": "enables_when_undisputed",
      "source": "scenario.booking",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "Undisputed bookings proceed to settlement.",
        "source_field": "scenario_flow"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.uses_term.term.margin",
      "type": "uses_term",
      "source": "scenario.margin_calculation",
      "target": "term.margin",
      "properties": {
        "inferred": true,
        "description": "Margin is the primary calculation output.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.uses_term.term.mtm",
      "type": "uses_term",
      "source": "scenario.margin_calculation",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "MTM valuation is an input to margin calculation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.produces.object.margin_call",
      "type": "produces",
      "source": "scenario.margin_calculation",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "Margin calculation produces margin calls.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.related_to.table.risk.mtm_valuation",
      "type": "related_to",
      "source": "scenario.margin_calculation",
      "target": "table.risk.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Source table for MTM values.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.related_to.table.collateral.collateral_balance",
      "type": "related_to",
      "source": "scenario.margin_calculation",
      "target": "table.collateral.collateral_balance",
      "properties": {
        "inferred": true,
        "description": "Source table for available collateral.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.related_to.table.margin.margin_calculation",
      "type": "related_to",
      "source": "scenario.margin_calculation",
      "target": "table.margin.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Output table for margin calculation results.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.margin_calculation.related_to.pipeline.airflow.margin_calculation_job",
      "type": "related_to",
      "source": "scenario.margin_calculation",
      "target": "pipeline.airflow.margin_calculation_job",
      "properties": {
        "inferred": true,
        "description": "Pipeline that computes margin.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.mtm_valuation.uses_term.term.mtm",
      "type": "uses_term",
      "source": "scenario.mtm_valuation",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "MTM is the core valuation concept in this scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.mtm_valuation.values.object.position",
      "type": "values",
      "source": "scenario.mtm_valuation",
      "target": "object.position",
      "properties": {
        "inferred": true,
        "description": "Positions are valued during MTM valuation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.mtm_valuation.produces.object.mtm_valuation",
      "type": "produces",
      "source": "scenario.mtm_valuation",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "MTM valuation records are produced for positions.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.mtm_valuation.related_to.feedfile.s3.counterparty_mtm_feed",
      "type": "related_to",
      "source": "scenario.mtm_valuation",
      "target": "feedfile.s3.counterparty_mtm_feed",
      "properties": {
        "inferred": true,
        "description": "External MTM feed provides input valuation values.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.mtm_valuation.related_to.pipeline.airflow.daily_mtm_valuation",
      "type": "related_to",
      "source": "scenario.mtm_valuation",
      "target": "pipeline.airflow.daily_mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Pipeline loads and normalizes MTM valuation data.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.mtm_valuation.related_to.table.risk.mtm_valuation",
      "type": "related_to",
      "source": "scenario.mtm_valuation",
      "target": "table.risk.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Table stores normalized MTM valuation records.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.uses_term.term.settlement",
      "type": "uses_term",
      "source": "scenario.settlement",
      "target": "term.settlement",
      "properties": {
        "inferred": true,
        "description": "Settlement is the process of creating settlement instructions.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.uses_term.term.undisputed",
      "type": "uses_term",
      "source": "scenario.settlement",
      "target": "term.undisputed",
      "properties": {
        "inferred": true,
        "description": "Undisputed status is required before settlement can proceed.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.consumes.object.booking_order",
      "type": "consumes",
      "source": "scenario.settlement",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Settlement depends on booking order status.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.produces.object.settlement_instruction",
      "type": "produces",
      "source": "scenario.settlement",
      "target": "object.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "Settlement produces settlement instructions.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.related_to.table.booking.booking_order",
      "type": "related_to",
      "source": "scenario.settlement",
      "target": "table.booking.booking_order",
      "properties": {
        "inferred": true,
        "description": "Source table for booking order status.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.related_to.table.settlement.settlement_instruction",
      "type": "related_to",
      "source": "scenario.settlement",
      "target": "table.settlement.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "Table stores settlement instructions.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.related_to.view.settlement.v_margin_settlement_summary",
      "type": "related_to",
      "source": "scenario.settlement",
      "target": "view.settlement.v_margin_settlement_summary",
      "properties": {
        "inferred": true,
        "description": "View combines settlement, booking, and margin status for serving.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.related_to.api.margin.get_margin_settlement_summary",
      "type": "related_to",
      "source": "scenario.settlement",
      "target": "api.margin.get_margin_settlement_summary",
      "properties": {
        "inferred": true,
        "description": "API serves settlement summary data to consumers.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.scenario.settlement.related_to.dashboard.powerbi.margin_operations",
      "type": "related_to",
      "source": "scenario.settlement",
      "target": "dashboard.powerbi.margin_operations",
      "properties": {
        "inferred": true,
        "description": "Dashboard monitors booking and settlement status.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.booking.booking_order.related_to.object.booking_order",
      "type": "related_to",
      "source": "table.booking.booking_order",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "This table stores booking orders.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.booking.booking_order.related_to.scenario.booking",
      "type": "related_to",
      "source": "table.booking.booking_order",
      "target": "scenario.booking",
      "properties": {
        "inferred": true,
        "description": "This table supports booking.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.booking.booking_order.contains.column.booking.booking_order.booking_id",
      "type": "contains",
      "source": "table.booking.booking_order",
      "target": "column.booking.booking_order.booking_id",
      "properties": {
        "inferred": true,
        "description": "booking_order contains column booking_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.booking.booking_order.contains.column.booking.booking_order.margin_call_id",
      "type": "contains",
      "source": "table.booking.booking_order",
      "target": "column.booking.booking_order.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "booking_order contains column margin_call_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.booking.booking_order.contains.column.booking.booking_order.booking_amount",
      "type": "contains",
      "source": "table.booking.booking_order",
      "target": "column.booking.booking_order.booking_amount",
      "properties": {
        "inferred": true,
        "description": "booking_order contains column booking_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.booking.booking_order.contains.column.booking.booking_order.dispute_status",
      "type": "contains",
      "source": "table.booking.booking_order",
      "target": "column.booking.booking_order.dispute_status",
      "properties": {
        "inferred": true,
        "description": "booking_order contains column dispute_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.booking.booking_order.dispute_status.related_to.term.undisputed",
      "type": "related_to",
      "source": "column.booking.booking_order.dispute_status",
      "target": "term.undisputed",
      "properties": {
        "inferred": true,
        "description": "Undisputed status allows settlement to proceed.",
        "source_field": "columns.related_nodes"
      }
    },
    {
      "id": "edge.column.booking.booking_order.dispute_status.related_to.object.booking_order.dispute_status",
      "type": "related_to",
      "source": "column.booking.booking_order.dispute_status",
      "target": "object.booking_order.dispute_status",
      "properties": {
        "inferred": true,
        "description": "This column maps to booking order dispute status.",
        "source_field": "columns.related_nodes"
      }
    },
    {
      "id": "edge.quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled.checks.table.booking.booking_order",
      "type": "checks",
      "source": "quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled",
      "target": "table.booking.booking_order",
      "properties": {
        "inferred": true,
        "description": "settlement can proceed only when dispute_status == \"undisputed\"",
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled.validates.object.booking_order",
      "type": "validates",
      "source": "quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Booking order status must control whether settlement can proceed.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled.validates.term.undisputed",
      "type": "validates",
      "source": "quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled",
      "target": "term.undisputed",
      "properties": {
        "inferred": true,
        "description": "The undisputed status is required before settlement.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled.validates.scenario.settlement",
      "type": "validates",
      "source": "quality.table.booking.booking_order.Disputed_Booking_Must_Not_Be_Settled",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "Settlement should only process undisputed bookings.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.table.collateral.collateral_balance.related_to.scenario.margin_calculation",
      "type": "related_to",
      "source": "table.collateral.collateral_balance",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Collateral balance is used in margin calculation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.collateral.collateral_balance.contains.column.collateral.collateral_balance.account_id",
      "type": "contains",
      "source": "table.collateral.collateral_balance",
      "target": "column.collateral.collateral_balance.account_id",
      "properties": {
        "inferred": true,
        "description": "collateral_balance contains column account_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.collateral.collateral_balance.contains.column.collateral.collateral_balance.available_collateral",
      "type": "contains",
      "source": "table.collateral.collateral_balance",
      "target": "column.collateral.collateral_balance.available_collateral",
      "properties": {
        "inferred": true,
        "description": "collateral_balance contains column available_collateral.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.collateral.collateral_balance.contains.column.collateral.collateral_balance.business_date",
      "type": "contains",
      "source": "table.collateral.collateral_balance",
      "target": "column.collateral.collateral_balance.business_date",
      "properties": {
        "inferred": true,
        "description": "collateral_balance contains column business_date.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.quality.table.collateral.collateral_balance.Available_Collateral_Non_Negative.checks.table.collateral.collateral_balance",
      "type": "checks",
      "source": "quality.table.collateral.collateral_balance.Available_Collateral_Non_Negative",
      "target": "table.collateral.collateral_balance",
      "properties": {
        "inferred": true,
        "description": "available_collateral >= 0",
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.table.collateral.collateral_balance.Available_Collateral_Non_Negative.validates.scenario.margin_calculation",
      "type": "validates",
      "source": "quality.table.collateral.collateral_balance.Available_Collateral_Non_Negative",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Margin calculation depends on valid collateral inputs.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.collateral.collateral_balance.Available_Collateral_Non_Negative.validates.term.margin",
      "type": "validates",
      "source": "quality.table.collateral.collateral_balance.Available_Collateral_Non_Negative",
      "target": "term.margin",
      "properties": {
        "inferred": true,
        "description": "Available collateral contributes to margin requirement calculation.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.related_to.object.margin_call",
      "type": "related_to",
      "source": "table.margin.margin_calculation",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "This table stores margin call calculation results.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.related_to.scenario.margin_calculation",
      "type": "related_to",
      "source": "table.margin.margin_calculation",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "This table supports margin calculation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.contains.column.margin.margin_calculation.margin_call_id",
      "type": "contains",
      "source": "table.margin.margin_calculation",
      "target": "column.margin.margin_calculation.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "margin_calculation contains column margin_call_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.contains.column.margin.margin_calculation.valuation_id",
      "type": "contains",
      "source": "table.margin.margin_calculation",
      "target": "column.margin.margin_calculation.valuation_id",
      "properties": {
        "inferred": true,
        "description": "margin_calculation contains column valuation_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.contains.column.margin.margin_calculation.margin_requirement",
      "type": "contains",
      "source": "table.margin.margin_calculation",
      "target": "column.margin.margin_calculation.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "margin_calculation contains column margin_requirement.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.margin.margin_calculation.margin_requirement.related_to.term.margin",
      "type": "related_to",
      "source": "column.margin.margin_calculation.margin_requirement",
      "target": "term.margin",
      "properties": {
        "inferred": true,
        "description": "This column stores the calculated margin requirement.",
        "source_field": "columns.related_nodes"
      }
    },
    {
      "id": "edge.column.margin.margin_calculation.margin_requirement.related_to.object.margin_call.margin_requirement",
      "type": "related_to",
      "source": "column.margin.margin_calculation.margin_requirement",
      "target": "object.margin_call.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "This column maps to the margin requirement property.",
        "source_field": "columns.related_nodes"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.contains.column.margin.margin_calculation.booking_eligible",
      "type": "contains",
      "source": "table.margin.margin_calculation",
      "target": "column.margin.margin_calculation.booking_eligible",
      "properties": {
        "inferred": true,
        "description": "margin_calculation contains column booking_eligible.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative.checks.table.margin.margin_calculation",
      "type": "checks",
      "source": "quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative",
      "target": "table.margin.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "margin_requirement >= 0",
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative.validates.term.margin",
      "type": "validates",
      "source": "quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative",
      "target": "term.margin",
      "properties": {
        "inferred": true,
        "description": "Margin requirement should not be negative.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative.validates.object.margin_call",
      "type": "validates",
      "source": "quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "Margin call records require a valid required margin amount.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative.validates.scenario.margin_calculation",
      "type": "validates",
      "source": "quality.table.margin.margin_calculation.Margin_Requirement_Non_Negative",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "Margin calculation output must satisfy this rule.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.table.risk.mtm_valuation.related_to.object.mtm_valuation",
      "type": "related_to",
      "source": "table.risk.mtm_valuation",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "This table stores MTM valuation records.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.risk.mtm_valuation.related_to.scenario.mtm_valuation",
      "type": "related_to",
      "source": "table.risk.mtm_valuation",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "This table supports MTM valuation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.risk.mtm_valuation.contains.column.risk.mtm_valuation.valuation_id",
      "type": "contains",
      "source": "table.risk.mtm_valuation",
      "target": "column.risk.mtm_valuation.valuation_id",
      "properties": {
        "inferred": true,
        "description": "mtm_valuation contains column valuation_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.risk.mtm_valuation.contains.column.risk.mtm_valuation.position_id",
      "type": "contains",
      "source": "table.risk.mtm_valuation",
      "target": "column.risk.mtm_valuation.position_id",
      "properties": {
        "inferred": true,
        "description": "mtm_valuation contains column position_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.risk.mtm_valuation.contains.column.risk.mtm_valuation.mtm_value",
      "type": "contains",
      "source": "table.risk.mtm_valuation",
      "target": "column.risk.mtm_valuation.mtm_value",
      "properties": {
        "inferred": true,
        "description": "mtm_valuation contains column mtm_value.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.risk.mtm_valuation.contains.column.risk.mtm_valuation.valuation_date",
      "type": "contains",
      "source": "table.risk.mtm_valuation",
      "target": "column.risk.mtm_valuation.valuation_date",
      "properties": {
        "inferred": true,
        "description": "mtm_valuation contains column valuation_date.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.quality.table.risk.mtm_valuation.MTM_Value_Not_Null.checks.table.risk.mtm_valuation",
      "type": "checks",
      "source": "quality.table.risk.mtm_valuation.MTM_Value_Not_Null",
      "target": "table.risk.mtm_valuation",
      "properties": {
        "inferred": true,
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.table.risk.mtm_valuation.MTM_Value_Not_Null.validates.term.mtm",
      "type": "validates",
      "source": "quality.table.risk.mtm_valuation.MTM_Value_Not_Null",
      "target": "term.mtm",
      "properties": {
        "inferred": true,
        "description": "MTM values must be present for valuation meaning.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.risk.mtm_valuation.MTM_Value_Not_Null.validates.object.mtm_valuation",
      "type": "validates",
      "source": "quality.table.risk.mtm_valuation.MTM_Value_Not_Null",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "MTM valuation records require a valuation amount.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.risk.mtm_valuation.Valuation_Date_Not_Null.checks.table.risk.mtm_valuation",
      "type": "checks",
      "source": "quality.table.risk.mtm_valuation.Valuation_Date_Not_Null",
      "target": "table.risk.mtm_valuation",
      "properties": {
        "inferred": true,
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.table.risk.mtm_valuation.Valuation_Date_Not_Null.validates.scenario.mtm_valuation",
      "type": "validates",
      "source": "quality.table.risk.mtm_valuation.Valuation_Date_Not_Null",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "Valuation records must be tied to a valuation date.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.risk.mtm_valuation.Valuation_Date_Not_Null.validates.object.mtm_valuation",
      "type": "validates",
      "source": "quality.table.risk.mtm_valuation.Valuation_Date_Not_Null",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "MTM valuation records require the valuation date.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.table.settlement.settlement_instruction.related_to.object.settlement_instruction",
      "type": "related_to",
      "source": "table.settlement.settlement_instruction",
      "target": "object.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "This table stores settlement instructions.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.settlement.settlement_instruction.related_to.scenario.settlement",
      "type": "related_to",
      "source": "table.settlement.settlement_instruction",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "This table supports settlement.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.booking.booking_order.derived_from.table.settlement.settlement_instruction",
      "type": "derived_from",
      "source": "table.booking.booking_order",
      "target": "table.settlement.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "Settlement instructions are created from undisputed booking orders.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.table.settlement.settlement_instruction.contains.column.settlement.settlement_instruction.settlement_id",
      "type": "contains",
      "source": "table.settlement.settlement_instruction",
      "target": "column.settlement.settlement_instruction.settlement_id",
      "properties": {
        "inferred": true,
        "description": "settlement_instruction contains column settlement_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.settlement.settlement_instruction.contains.column.settlement.settlement_instruction.booking_id",
      "type": "contains",
      "source": "table.settlement.settlement_instruction",
      "target": "column.settlement.settlement_instruction.booking_id",
      "properties": {
        "inferred": true,
        "description": "settlement_instruction contains column booking_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.settlement.settlement_instruction.contains.column.settlement.settlement_instruction.settlement_amount",
      "type": "contains",
      "source": "table.settlement.settlement_instruction",
      "target": "column.settlement.settlement_instruction.settlement_amount",
      "properties": {
        "inferred": true,
        "description": "settlement_instruction contains column settlement_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.settlement.settlement_instruction.contains.column.settlement.settlement_instruction.settlement_status",
      "type": "contains",
      "source": "table.settlement.settlement_instruction",
      "target": "column.settlement.settlement_instruction.settlement_status",
      "properties": {
        "inferred": true,
        "description": "settlement_instruction contains column settlement_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative.checks.table.settlement.settlement_instruction",
      "type": "checks",
      "source": "quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative",
      "target": "table.settlement.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "settlement_amount >= 0",
        "source_field": "quality_checks"
      }
    },
    {
      "id": "edge.quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative.validates.term.settlement",
      "type": "validates",
      "source": "quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative",
      "target": "term.settlement",
      "properties": {
        "inferred": true,
        "description": "Settlement amounts should be valid non-negative amounts.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative.validates.object.settlement_instruction",
      "type": "validates",
      "source": "quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative",
      "target": "object.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "Settlement instructions require valid settlement amounts.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative.validates.scenario.settlement",
      "type": "validates",
      "source": "quality.table.settlement.settlement_instruction.Settlement_Amount_Non_Negative",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "Settlement outputs must satisfy this rule.",
        "source_field": "quality_checks.validates"
      }
    },
    {
      "id": "edge.term.booking.defines.object.booking_order",
      "type": "defines",
      "source": "term.booking",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Booking Order is the object created by booking.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.booking.explains.scenario.booking",
      "type": "explains",
      "source": "term.booking",
      "target": "scenario.booking",
      "properties": {
        "inferred": true,
        "description": "This scenario describes how booking orders are created.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.margin.defines.object.margin_call",
      "type": "defines",
      "source": "term.margin",
      "target": "object.margin_call",
      "properties": {
        "inferred": true,
        "description": "Margin calls are created when a margin requirement must be booked.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.margin.related_to.column.margin.margin_calculation.margin_requirement",
      "type": "related_to",
      "source": "term.margin",
      "target": "column.margin.margin_calculation.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "This column stores the calculated margin requirement.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.margin.explains.scenario.margin_calculation",
      "type": "explains",
      "source": "term.margin",
      "target": "scenario.margin_calculation",
      "properties": {
        "inferred": true,
        "description": "This scenario calculates margin.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.mtm.specializes.term.valuation",
      "type": "specializes",
      "source": "term.mtm",
      "target": "term.valuation",
      "properties": {
        "inferred": true,
        "description": "MTM is a specific type of valuation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.mtm.defines.object.mtm_valuation",
      "type": "defines",
      "source": "term.mtm",
      "target": "object.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "MTM Valuation is the business object that records this valuation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.mtm.related_to.column.risk.mtm_valuation.mtm_value",
      "type": "related_to",
      "source": "term.mtm",
      "target": "column.risk.mtm_valuation.mtm_value",
      "properties": {
        "inferred": true,
        "description": "This column stores the MTM value used by margin calculation.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.mtm.explains.scenario.mtm_valuation",
      "type": "explains",
      "source": "term.mtm",
      "target": "scenario.mtm_valuation",
      "properties": {
        "inferred": true,
        "description": "This scenario defines how MTM values are loaded and normalized.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.settlement.defines.object.settlement_instruction",
      "type": "defines",
      "source": "term.settlement",
      "target": "object.settlement_instruction",
      "properties": {
        "inferred": true,
        "description": "Settlement Instruction is the object produced by settlement.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.settlement.explains.scenario.settlement",
      "type": "explains",
      "source": "term.settlement",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "This scenario describes settlement after booking.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.undisputed.qualifies.object.booking_order",
      "type": "qualifies",
      "source": "term.undisputed",
      "target": "object.booking_order",
      "properties": {
        "inferred": true,
        "description": "Booking orders must be undisputed before settlement.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.term.undisputed.explains.scenario.settlement",
      "type": "explains",
      "source": "term.undisputed",
      "target": "scenario.settlement",
      "properties": {
        "inferred": true,
        "description": "Settlement uses undisputed status as an eligibility condition.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.view.settlement.v_margin_settlement_summary.related_to.scenario.margin_booking_settlement",
      "type": "related_to",
      "source": "view.settlement.v_margin_settlement_summary",
      "target": "scenario.margin_booking_settlement",
      "properties": {
        "inferred": true,
        "description": "This view summarizes the parent margin booking settlement scenario.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.table.margin.margin_calculation.reads.view.settlement.v_margin_settlement_summary",
      "type": "reads",
      "source": "table.margin.margin_calculation",
      "target": "view.settlement.v_margin_settlement_summary",
      "properties": {
        "inferred": true,
        "description": "View reads margin calculation results.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.table.booking.booking_order.reads.view.settlement.v_margin_settlement_summary",
      "type": "reads",
      "source": "table.booking.booking_order",
      "target": "view.settlement.v_margin_settlement_summary",
      "properties": {
        "inferred": true,
        "description": "View reads booking status.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.table.settlement.settlement_instruction.reads.view.settlement.v_margin_settlement_summary",
      "type": "reads",
      "source": "table.settlement.settlement_instruction",
      "target": "view.settlement.v_margin_settlement_summary",
      "properties": {
        "inferred": true,
        "description": "View reads settlement status.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.view.settlement.v_margin_settlement_summary.contains.column.settlement.v_margin_settlement_summary.margin_call_id",
      "type": "contains",
      "source": "view.settlement.v_margin_settlement_summary",
      "target": "column.settlement.v_margin_settlement_summary.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "v_margin_settlement_summary contains column margin_call_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.margin.margin_calculation.margin_call_id.field_lineage.column.settlement.v_margin_settlement_summary.margin_call_id",
      "type": "field_lineage",
      "source": "column.margin.margin_calculation.margin_call_id",
      "target": "column.settlement.v_margin_settlement_summary.margin_call_id",
      "properties": {
        "inferred": true,
        "description": "Directly selected from margin_calculation.margin_call_id.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.view.settlement.v_margin_settlement_summary.contains.column.settlement.v_margin_settlement_summary.margin_requirement",
      "type": "contains",
      "source": "view.settlement.v_margin_settlement_summary",
      "target": "column.settlement.v_margin_settlement_summary.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "v_margin_settlement_summary contains column margin_requirement.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.margin.margin_calculation.margin_requirement.field_lineage.column.settlement.v_margin_settlement_summary.margin_requirement",
      "type": "field_lineage",
      "source": "column.margin.margin_calculation.margin_requirement",
      "target": "column.settlement.v_margin_settlement_summary.margin_requirement",
      "properties": {
        "inferred": true,
        "description": "Directly selected from margin_calculation.margin_requirement.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.view.settlement.v_margin_settlement_summary.contains.column.settlement.v_margin_settlement_summary.booking_id",
      "type": "contains",
      "source": "view.settlement.v_margin_settlement_summary",
      "target": "column.settlement.v_margin_settlement_summary.booking_id",
      "properties": {
        "inferred": true,
        "description": "v_margin_settlement_summary contains column booking_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.booking.booking_order.booking_id.field_lineage.column.settlement.v_margin_settlement_summary.booking_id",
      "type": "field_lineage",
      "source": "column.booking.booking_order.booking_id",
      "target": "column.settlement.v_margin_settlement_summary.booking_id",
      "properties": {
        "inferred": true,
        "description": "Joined from booking_order by margin_call_id.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.view.settlement.v_margin_settlement_summary.contains.column.settlement.v_margin_settlement_summary.dispute_status",
      "type": "contains",
      "source": "view.settlement.v_margin_settlement_summary",
      "target": "column.settlement.v_margin_settlement_summary.dispute_status",
      "properties": {
        "inferred": true,
        "description": "v_margin_settlement_summary contains column dispute_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.booking.booking_order.dispute_status.field_lineage.column.settlement.v_margin_settlement_summary.dispute_status",
      "type": "field_lineage",
      "source": "column.booking.booking_order.dispute_status",
      "target": "column.settlement.v_margin_settlement_summary.dispute_status",
      "properties": {
        "inferred": true,
        "description": "Joined from booking_order by margin_call_id.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.view.settlement.v_margin_settlement_summary.contains.column.settlement.v_margin_settlement_summary.settlement_status",
      "type": "contains",
      "source": "view.settlement.v_margin_settlement_summary",
      "target": "column.settlement.v_margin_settlement_summary.settlement_status",
      "properties": {
        "inferred": true,
        "description": "v_margin_settlement_summary contains column settlement_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.settlement.settlement_instruction.settlement_status.field_lineage.column.settlement.v_margin_settlement_summary.settlement_status",
      "type": "field_lineage",
      "source": "column.settlement.settlement_instruction.settlement_status",
      "target": "column.settlement.v_margin_settlement_summary.settlement_status",
      "properties": {
        "inferred": true,
        "description": "Joined from settlement_instruction by booking_id.",
        "source_field": "columns.lineage"
      }
    }
  ]
};

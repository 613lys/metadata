window.GRAPH_DATA = {
  "nodes": [
    {
      "id": "business_entity.customer_order",
      "type": "business_entity",
      "label": "Customer Order",
      "properties": {
        "description": "Confirmed customer purchase that can later be refunded.",
        "source_file": "knowledge/nodes/business_entities/business_entity.customer_order.yaml",
        "term": "term.order_identifier",
        "tags": [
          "domain.commerce",
          "lifecycle.order"
        ],
        "constraints": [
          {
            "type": "identity",
            "severity": "critical",
            "description": "Each customer order must have a stable order identifier.",
            "expression": "customer_order.order_id is not null"
          }
        ]
      }
    },
    {
      "id": "business_entity.payment_refund",
      "type": "business_entity",
      "label": "Payment Refund",
      "properties": {
        "description": "Payment processor refund transaction created after approval.",
        "source_file": "knowledge/nodes/business_entities/business_entity.payment_refund.yaml",
        "term": "term.payment_refund",
        "tags": [
          "domain.payments",
          "lifecycle.payment"
        ],
        "constraints": [
          {
            "type": "reconciliation",
            "severity": "critical",
            "description": "Refunded amount should reconcile to the approved amount for the decision.",
            "expression": "payment_refund.refunded_amount = refund_decision.approved_amount"
          }
        ]
      }
    },
    {
      "id": "business_entity.refund_decision",
      "type": "business_entity",
      "label": "Refund Decision",
      "properties": {
        "description": "Business decision that approves or rejects a refund request.",
        "source_file": "knowledge/nodes/business_entities/business_entity.refund_decision.yaml",
        "term": "term.approval_status",
        "tags": [
          "domain.commerce",
          "lifecycle.review"
        ],
        "constraints": [
          {
            "type": "state_transition",
            "severity": "critical",
            "description": "Payment refund can be created only for approved decisions.",
            "expression": "refund_decision.decision_status = 'approved'"
          }
        ]
      }
    },
    {
      "id": "business_entity.refund_request",
      "type": "business_entity",
      "label": "Refund Request",
      "properties": {
        "description": "Customer request for a refund against an existing order.",
        "source_file": "knowledge/nodes/business_entities/business_entity.refund_request.yaml",
        "term": "term.refund_request",
        "tags": [
          "domain.commerce",
          "lifecycle.refund"
        ],
        "constraints": [
          {
            "type": "relationship_required",
            "severity": "critical",
            "description": "A refund request must reference an existing customer order.",
            "expression": "refund_request.order_id exists in customer_order.order_id"
          }
        ]
      }
    },
    {
      "id": "table.payments.payment_refund",
      "type": "table",
      "label": "payment_refund",
      "properties": {
        "description": "Stores refund transactions submitted to the payment processor.",
        "source_file": "knowledge/nodes/tables/table.payments.payment_refund.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "table.sales.order_header",
      "type": "table",
      "label": "order_header",
      "properties": {
        "description": "Stores one row per confirmed customer order.",
        "source_file": "knowledge/nodes/tables/table.sales.order_header.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "table.support.refund_decision",
      "type": "table",
      "label": "refund_decision",
      "properties": {
        "description": "Stores review outcomes for refund requests.",
        "source_file": "knowledge/nodes/tables/table.support.refund_decision.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "table.support.refund_request",
      "type": "table",
      "label": "refund_request",
      "properties": {
        "description": "Stores customer-submitted refund requests and request status.",
        "source_file": "knowledge/nodes/tables/table.support.refund_request.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "term.approval_status",
      "type": "term",
      "label": "Approval Status",
      "properties": {
        "description": "Review state of a refund request or refund decision.",
        "source_file": "knowledge/nodes/terms/term.approval_status.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "term.order_identifier",
      "type": "term",
      "label": "Order Identifier",
      "properties": {
        "description": "Stable identifier assigned to a customer order.",
        "source_file": "knowledge/nodes/terms/term.order_identifier.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "term.payment_refund",
      "type": "term",
      "label": "Payment Refund",
      "properties": {
        "description": "Payment processor transaction that returns funds to the customer.",
        "source_file": "knowledge/nodes/terms/term.payment_refund.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "term.refund_amount",
      "type": "term",
      "label": "Refund Amount",
      "properties": {
        "description": "Monetary amount requested or approved for refund.",
        "source_file": "knowledge/nodes/terms/term.refund_amount.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "term.refund_request",
      "type": "term",
      "label": "Refund Request",
      "properties": {
        "description": "Customer request to return money for an order or order item.",
        "source_file": "knowledge/nodes/terms/term.refund_request.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "view.analytics.v_refund_lifecycle",
      "type": "view",
      "label": "v_refund_lifecycle",
      "properties": {
        "description": "Analytics view joining refund requests, review decisions, and payment refund status.",
        "source_file": "knowledge/nodes/views/view.analytics.v_refund_lifecycle.yaml",
        "term": null,
        "tags": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.customer_order.order_id",
      "type": "business_entity_property",
      "label": "order_id",
      "properties": {
        "description": "Stable identifier for the customer order.",
        "parent": "business_entity.customer_order",
        "semantic_role": "identifier",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.customer_order.customer_id",
      "type": "business_entity_property",
      "label": "customer_id",
      "properties": {
        "description": "Customer who placed the order.",
        "parent": "business_entity.customer_order",
        "semantic_role": "dimension",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.customer_order.order_total_amount",
      "type": "business_entity_property",
      "label": "order_total_amount",
      "properties": {
        "description": "Gross order value before any later refund.",
        "parent": "business_entity.customer_order",
        "semantic_role": "measure",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.customer_order.order_created_at",
      "type": "business_entity_property",
      "label": "order_created_at",
      "properties": {
        "description": "Timestamp when the order was created.",
        "parent": "business_entity.customer_order",
        "semantic_role": "time_dimension",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.payment_refund.payment_refund_id",
      "type": "business_entity_property",
      "label": "payment_refund_id",
      "properties": {
        "description": "Stable identifier for the payment refund transaction.",
        "parent": "business_entity.payment_refund",
        "semantic_role": "identifier",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.payment_refund.decision_id",
      "type": "business_entity_property",
      "label": "decision_id",
      "properties": {
        "description": "Refund decision that authorized the payment refund.",
        "parent": "business_entity.payment_refund",
        "semantic_role": "identifier",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.payment_refund.refunded_amount",
      "type": "business_entity_property",
      "label": "refunded_amount",
      "properties": {
        "description": "Amount sent to the payment provider for refund.",
        "parent": "business_entity.payment_refund",
        "semantic_role": "measure",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.payment_refund.payment_status",
      "type": "business_entity_property",
      "label": "payment_status",
      "properties": {
        "description": "Processor status of the refund transaction.",
        "parent": "business_entity.payment_refund",
        "semantic_role": "status",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.refund_decision.decision_id",
      "type": "business_entity_property",
      "label": "decision_id",
      "properties": {
        "description": "Stable identifier for the refund decision.",
        "parent": "business_entity.refund_decision",
        "semantic_role": "identifier",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.refund_decision.refund_request_id",
      "type": "business_entity_property",
      "label": "refund_request_id",
      "properties": {
        "description": "Refund request being reviewed.",
        "parent": "business_entity.refund_decision",
        "semantic_role": "identifier",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.refund_decision.approved_amount",
      "type": "business_entity_property",
      "label": "approved_amount",
      "properties": {
        "description": "Amount approved for payment refund.",
        "parent": "business_entity.refund_decision",
        "semantic_role": "measure",
        "allowed_values": null,
        "constraints": [
          {
            "type": "comparison",
            "severity": "high",
            "description": "Approved amount cannot exceed the originally requested amount.",
            "expression": "approved_amount <= refund_request.requested_amount"
          }
        ]
      }
    },
    {
      "id": "business_entity.refund_decision.decision_status",
      "type": "business_entity_property",
      "label": "decision_status",
      "properties": {
        "description": "Approved or rejected decision state.",
        "parent": "business_entity.refund_decision",
        "semantic_role": "status",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.refund_request.refund_request_id",
      "type": "business_entity_property",
      "label": "refund_request_id",
      "properties": {
        "description": "Stable identifier for the refund request.",
        "parent": "business_entity.refund_request",
        "semantic_role": "identifier",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.refund_request.order_id",
      "type": "business_entity_property",
      "label": "order_id",
      "properties": {
        "description": "Customer order that the refund request belongs to.",
        "parent": "business_entity.refund_request",
        "semantic_role": "identifier",
        "allowed_values": null,
        "constraints": null
      }
    },
    {
      "id": "business_entity.refund_request.requested_amount",
      "type": "business_entity_property",
      "label": "requested_amount",
      "properties": {
        "description": "Amount requested by the customer.",
        "parent": "business_entity.refund_request",
        "semantic_role": "measure",
        "allowed_values": null,
        "constraints": [
          {
            "type": "range",
            "severity": "high",
            "description": "Requested amount should be greater than zero.",
            "expression": "requested_amount > 0"
          }
        ]
      }
    },
    {
      "id": "business_entity.refund_request.request_status",
      "type": "business_entity_property",
      "label": "request_status",
      "properties": {
        "description": "Current lifecycle status of the request.",
        "parent": "business_entity.refund_request",
        "semantic_role": "status",
        "allowed_values": null,
        "constraints": [
          {
            "type": "accepted_values",
            "severity": "high",
            "description": "Refund request status must use the controlled status set.",
            "expression": "request_status in ('submitted', 'approved', 'rejected', 'cancelled')"
          }
        ]
      }
    },
    {
      "id": "column.payments.payment_refund.payment_refund_id",
      "type": "column",
      "label": "payment_refund_id",
      "properties": {
        "description": "Primary key for the payment refund transaction.",
        "data_type": "varchar",
        "parent": "table.payments.payment_refund"
      }
    },
    {
      "id": "column.payments.payment_refund.decision_id",
      "type": "column",
      "label": "decision_id",
      "properties": {
        "description": "Refund decision that authorized the transaction.",
        "data_type": "varchar",
        "parent": "table.payments.payment_refund"
      }
    },
    {
      "id": "column.payments.payment_refund.refunded_amount",
      "type": "column",
      "label": "refunded_amount",
      "properties": {
        "description": "Amount sent to the payment processor.",
        "data_type": "decimal",
        "parent": "table.payments.payment_refund"
      }
    },
    {
      "id": "column.payments.payment_refund.payment_status",
      "type": "column",
      "label": "payment_status",
      "properties": {
        "description": "Processor status for the refund transaction.",
        "data_type": "varchar",
        "parent": "table.payments.payment_refund"
      }
    },
    {
      "id": "column.sales.order_header.order_id",
      "type": "column",
      "label": "order_id",
      "properties": {
        "description": "Primary key for the customer order.",
        "data_type": "varchar",
        "parent": "table.sales.order_header"
      }
    },
    {
      "id": "column.sales.order_header.customer_id",
      "type": "column",
      "label": "customer_id",
      "properties": {
        "description": "Customer identifier on the order.",
        "data_type": "varchar",
        "parent": "table.sales.order_header"
      }
    },
    {
      "id": "column.sales.order_header.order_total_amount",
      "type": "column",
      "label": "order_total_amount",
      "properties": {
        "description": "Gross order amount at checkout.",
        "data_type": "decimal",
        "parent": "table.sales.order_header"
      }
    },
    {
      "id": "column.sales.order_header.order_created_at",
      "type": "column",
      "label": "order_created_at",
      "properties": {
        "description": "Timestamp when the order was confirmed.",
        "data_type": "timestamp",
        "parent": "table.sales.order_header"
      }
    },
    {
      "id": "column.support.refund_decision.decision_id",
      "type": "column",
      "label": "decision_id",
      "properties": {
        "description": "Primary key for the refund decision.",
        "data_type": "varchar",
        "parent": "table.support.refund_decision"
      }
    },
    {
      "id": "column.support.refund_decision.refund_request_id",
      "type": "column",
      "label": "refund_request_id",
      "properties": {
        "description": "Refund request reviewed by this decision.",
        "data_type": "varchar",
        "parent": "table.support.refund_decision"
      }
    },
    {
      "id": "column.support.refund_decision.approved_amount",
      "type": "column",
      "label": "approved_amount",
      "properties": {
        "description": "Approved refund amount when the decision is approved.",
        "data_type": "decimal",
        "parent": "table.support.refund_decision"
      }
    },
    {
      "id": "column.support.refund_decision.decision_status",
      "type": "column",
      "label": "decision_status",
      "properties": {
        "description": "Review outcome status.",
        "data_type": "varchar",
        "parent": "table.support.refund_decision"
      }
    },
    {
      "id": "column.support.refund_request.refund_request_id",
      "type": "column",
      "label": "refund_request_id",
      "properties": {
        "description": "Primary key for the refund request.",
        "data_type": "varchar",
        "parent": "table.support.refund_request"
      }
    },
    {
      "id": "column.support.refund_request.order_id",
      "type": "column",
      "label": "order_id",
      "properties": {
        "description": "Customer order referenced by the refund request.",
        "data_type": "varchar",
        "parent": "table.support.refund_request"
      }
    },
    {
      "id": "column.support.refund_request.requested_amount",
      "type": "column",
      "label": "requested_amount",
      "properties": {
        "description": "Amount requested by the customer.",
        "data_type": "decimal",
        "parent": "table.support.refund_request"
      }
    },
    {
      "id": "column.support.refund_request.request_status",
      "type": "column",
      "label": "request_status",
      "properties": {
        "description": "Current request status.",
        "data_type": "varchar",
        "parent": "table.support.refund_request"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.refund_request_id",
      "type": "column",
      "label": "refund_request_id",
      "properties": {
        "description": "Refund request identifier selected from refund_request.",
        "data_type": "varchar",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.order_id",
      "type": "column",
      "label": "order_id",
      "properties": {
        "description": "Order identifier selected from refund_request.",
        "data_type": "varchar",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.requested_amount",
      "type": "column",
      "label": "requested_amount",
      "properties": {
        "description": "Requested amount selected from refund_request.",
        "data_type": "decimal",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.request_status",
      "type": "column",
      "label": "request_status",
      "properties": {
        "description": "Request status selected from refund_request.",
        "data_type": "varchar",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.decision_status",
      "type": "column",
      "label": "decision_status",
      "properties": {
        "description": "Decision status selected from refund_decision.",
        "data_type": "varchar",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.approved_amount",
      "type": "column",
      "label": "approved_amount",
      "properties": {
        "description": "Approved amount selected from refund_decision.",
        "data_type": "decimal",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.refunded_amount",
      "type": "column",
      "label": "refunded_amount",
      "properties": {
        "description": "Refunded amount selected from payment_refund.",
        "data_type": "decimal",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    },
    {
      "id": "column.analytics.v_refund_lifecycle.payment_status",
      "type": "column",
      "label": "payment_status",
      "properties": {
        "description": "Payment processor status selected from payment_refund.",
        "data_type": "varchar",
        "parent": "view.analytics.v_refund_lifecycle"
      }
    }
  ],
  "edges": [
    {
      "id": "edge.business_entity.customer_order.HAS_TERM.term.order_identifier",
      "type": "HAS_TERM",
      "source": "business_entity.customer_order",
      "target": "term.order_identifier",
      "properties": {
        "inferred": true,
        "description": "Customer Order is defined by term.order_identifier.",
        "source_field": "term"
      }
    },
    {
      "id": "edge.business_entity.customer_order.IMPLEMENTED_BY.table.sales.order_header",
      "type": "IMPLEMENTED_BY",
      "source": "business_entity.customer_order",
      "target": "table.sales.order_header",
      "properties": {
        "inferred": true,
        "description": "Order header table is the primary physical representation of customer orders.",
        "source_field": "mapped_assets"
      }
    },
    {
      "id": "edge.business_entity.customer_order.CONTAINS.business_entity.customer_order.order_id",
      "type": "CONTAINS",
      "source": "business_entity.customer_order",
      "target": "business_entity.customer_order.order_id",
      "properties": {
        "inferred": true,
        "description": "Customer Order has property order_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.customer_order.order_id.HAS_TERM.term.order_identifier",
      "type": "HAS_TERM",
      "source": "business_entity.customer_order.order_id",
      "target": "term.order_identifier",
      "properties": {
        "inferred": true,
        "description": "order_id is defined by term.order_identifier.",
        "source_field": "properties.term"
      }
    },
    {
      "id": "edge.business_entity.customer_order.order_id.MAPS_TO.column.sales.order_header.order_id",
      "type": "MAPS_TO",
      "source": "business_entity.customer_order.order_id",
      "target": "column.sales.order_header.order_id",
      "properties": {
        "inferred": true,
        "description": "order_id maps to column.sales.order_header.order_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.customer_order.CONTAINS.business_entity.customer_order.customer_id",
      "type": "CONTAINS",
      "source": "business_entity.customer_order",
      "target": "business_entity.customer_order.customer_id",
      "properties": {
        "inferred": true,
        "description": "Customer Order has property customer_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.customer_order.customer_id.MAPS_TO.column.sales.order_header.customer_id",
      "type": "MAPS_TO",
      "source": "business_entity.customer_order.customer_id",
      "target": "column.sales.order_header.customer_id",
      "properties": {
        "inferred": true,
        "description": "customer_id maps to column.sales.order_header.customer_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.customer_order.CONTAINS.business_entity.customer_order.order_total_amount",
      "type": "CONTAINS",
      "source": "business_entity.customer_order",
      "target": "business_entity.customer_order.order_total_amount",
      "properties": {
        "inferred": true,
        "description": "Customer Order has property order_total_amount.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.customer_order.order_total_amount.MAPS_TO.column.sales.order_header.order_total_amount",
      "type": "MAPS_TO",
      "source": "business_entity.customer_order.order_total_amount",
      "target": "column.sales.order_header.order_total_amount",
      "properties": {
        "inferred": true,
        "description": "order_total_amount maps to column.sales.order_header.order_total_amount.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.customer_order.CONTAINS.business_entity.customer_order.order_created_at",
      "type": "CONTAINS",
      "source": "business_entity.customer_order",
      "target": "business_entity.customer_order.order_created_at",
      "properties": {
        "inferred": true,
        "description": "Customer Order has property order_created_at.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.customer_order.order_created_at.MAPS_TO.column.sales.order_header.order_created_at",
      "type": "MAPS_TO",
      "source": "business_entity.customer_order.order_created_at",
      "target": "column.sales.order_header.order_created_at",
      "properties": {
        "inferred": true,
        "description": "order_created_at maps to column.sales.order_header.order_created_at.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.DERIVES_FROM.business_entity.refund_decision",
      "type": "DERIVES_FROM",
      "source": "business_entity.payment_refund",
      "target": "business_entity.refund_decision",
      "properties": {
        "inferred": true,
        "description": "Payment refund is created from an approved refund decision.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.HAS_TERM.term.payment_refund",
      "type": "HAS_TERM",
      "source": "business_entity.payment_refund",
      "target": "term.payment_refund",
      "properties": {
        "inferred": true,
        "description": "Payment Refund is defined by term.payment_refund.",
        "source_field": "term"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.IMPLEMENTED_BY.table.payments.payment_refund",
      "type": "IMPLEMENTED_BY",
      "source": "business_entity.payment_refund",
      "target": "table.payments.payment_refund",
      "properties": {
        "inferred": true,
        "description": "Payment refund table stores processor refund transactions.",
        "source_field": "mapped_assets"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.CONTAINS.business_entity.payment_refund.payment_refund_id",
      "type": "CONTAINS",
      "source": "business_entity.payment_refund",
      "target": "business_entity.payment_refund.payment_refund_id",
      "properties": {
        "inferred": true,
        "description": "Payment Refund has property payment_refund_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.payment_refund_id.MAPS_TO.column.payments.payment_refund.payment_refund_id",
      "type": "MAPS_TO",
      "source": "business_entity.payment_refund.payment_refund_id",
      "target": "column.payments.payment_refund.payment_refund_id",
      "properties": {
        "inferred": true,
        "description": "payment_refund_id maps to column.payments.payment_refund.payment_refund_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.CONTAINS.business_entity.payment_refund.decision_id",
      "type": "CONTAINS",
      "source": "business_entity.payment_refund",
      "target": "business_entity.payment_refund.decision_id",
      "properties": {
        "inferred": true,
        "description": "Payment Refund has property decision_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.decision_id.MAPS_TO.column.payments.payment_refund.decision_id",
      "type": "MAPS_TO",
      "source": "business_entity.payment_refund.decision_id",
      "target": "column.payments.payment_refund.decision_id",
      "properties": {
        "inferred": true,
        "description": "decision_id maps to column.payments.payment_refund.decision_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.decision_id.REFERENCES.business_entity.refund_decision.decision_id",
      "type": "REFERENCES",
      "source": "business_entity.payment_refund.decision_id",
      "target": "business_entity.refund_decision.decision_id",
      "properties": {
        "inferred": true,
        "description": "Payment Refund decision_id references the approved Refund Decision.",
        "source_field": "properties.related_nodes"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.CONTAINS.business_entity.payment_refund.refunded_amount",
      "type": "CONTAINS",
      "source": "business_entity.payment_refund",
      "target": "business_entity.payment_refund.refunded_amount",
      "properties": {
        "inferred": true,
        "description": "Payment Refund has property refunded_amount.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.refunded_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "business_entity.payment_refund.refunded_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "refunded_amount is defined by term.refund_amount.",
        "source_field": "properties.term"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.refunded_amount.MAPS_TO.column.payments.payment_refund.refunded_amount",
      "type": "MAPS_TO",
      "source": "business_entity.payment_refund.refunded_amount",
      "target": "column.payments.payment_refund.refunded_amount",
      "properties": {
        "inferred": true,
        "description": "refunded_amount maps to column.payments.payment_refund.refunded_amount.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.refunded_amount.RECONCILES_WITH.business_entity.refund_decision.approved_amount",
      "type": "RECONCILES_WITH",
      "source": "business_entity.payment_refund.refunded_amount",
      "target": "business_entity.refund_decision.approved_amount",
      "properties": {
        "inferred": true,
        "description": "Refunded amount should reconcile with the approved refund amount.",
        "source_field": "properties.related_nodes"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.CONTAINS.business_entity.payment_refund.payment_status",
      "type": "CONTAINS",
      "source": "business_entity.payment_refund",
      "target": "business_entity.payment_refund.payment_status",
      "properties": {
        "inferred": true,
        "description": "Payment Refund has property payment_status.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.payment_refund.payment_status.MAPS_TO.column.payments.payment_refund.payment_status",
      "type": "MAPS_TO",
      "source": "business_entity.payment_refund.payment_status",
      "target": "column.payments.payment_refund.payment_status",
      "properties": {
        "inferred": true,
        "description": "payment_status maps to column.payments.payment_refund.payment_status.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.DERIVES_FROM.business_entity.refund_request",
      "type": "DERIVES_FROM",
      "source": "business_entity.refund_decision",
      "target": "business_entity.refund_request",
      "properties": {
        "inferred": true,
        "description": "Refund decision is derived from review of the refund request and policy checks.",
        "source_field": "related_nodes"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.HAS_TERM.term.approval_status",
      "type": "HAS_TERM",
      "source": "business_entity.refund_decision",
      "target": "term.approval_status",
      "properties": {
        "inferred": true,
        "description": "Refund Decision is defined by term.approval_status.",
        "source_field": "term"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.IMPLEMENTED_BY.table.support.refund_decision",
      "type": "IMPLEMENTED_BY",
      "source": "business_entity.refund_decision",
      "target": "table.support.refund_decision",
      "properties": {
        "inferred": true,
        "description": "Refund decision table stores manual and automated review outcomes.",
        "source_field": "mapped_assets"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.CONTAINS.business_entity.refund_decision.decision_id",
      "type": "CONTAINS",
      "source": "business_entity.refund_decision",
      "target": "business_entity.refund_decision.decision_id",
      "properties": {
        "inferred": true,
        "description": "Refund Decision has property decision_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.decision_id.MAPS_TO.column.support.refund_decision.decision_id",
      "type": "MAPS_TO",
      "source": "business_entity.refund_decision.decision_id",
      "target": "column.support.refund_decision.decision_id",
      "properties": {
        "inferred": true,
        "description": "decision_id maps to column.support.refund_decision.decision_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.CONTAINS.business_entity.refund_decision.refund_request_id",
      "type": "CONTAINS",
      "source": "business_entity.refund_decision",
      "target": "business_entity.refund_decision.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "Refund Decision has property refund_request_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.refund_request_id.MAPS_TO.column.support.refund_decision.refund_request_id",
      "type": "MAPS_TO",
      "source": "business_entity.refund_decision.refund_request_id",
      "target": "column.support.refund_decision.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "refund_request_id maps to column.support.refund_decision.refund_request_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.refund_request_id.REFERENCES.business_entity.refund_request.refund_request_id",
      "type": "REFERENCES",
      "source": "business_entity.refund_decision.refund_request_id",
      "target": "business_entity.refund_request.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "Refund Decision refund_request_id references the reviewed Refund Request.",
        "source_field": "properties.related_nodes"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.CONTAINS.business_entity.refund_decision.approved_amount",
      "type": "CONTAINS",
      "source": "business_entity.refund_decision",
      "target": "business_entity.refund_decision.approved_amount",
      "properties": {
        "inferred": true,
        "description": "Refund Decision has property approved_amount.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.approved_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "business_entity.refund_decision.approved_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "approved_amount is defined by term.refund_amount.",
        "source_field": "properties.term"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.approved_amount.MAPS_TO.column.support.refund_decision.approved_amount",
      "type": "MAPS_TO",
      "source": "business_entity.refund_decision.approved_amount",
      "target": "column.support.refund_decision.approved_amount",
      "properties": {
        "inferred": true,
        "description": "approved_amount maps to column.support.refund_decision.approved_amount.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.approved_amount.DEPENDS_ON.business_entity.refund_request.requested_amount",
      "type": "DEPENDS_ON",
      "source": "business_entity.refund_decision.approved_amount",
      "target": "business_entity.refund_request.requested_amount",
      "properties": {
        "inferred": true,
        "description": "Approved amount is evaluated against the requested refund amount.",
        "source_field": "properties.related_nodes"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.CONTAINS.business_entity.refund_decision.decision_status",
      "type": "CONTAINS",
      "source": "business_entity.refund_decision",
      "target": "business_entity.refund_decision.decision_status",
      "properties": {
        "inferred": true,
        "description": "Refund Decision has property decision_status.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.decision_status.HAS_TERM.term.approval_status",
      "type": "HAS_TERM",
      "source": "business_entity.refund_decision.decision_status",
      "target": "term.approval_status",
      "properties": {
        "inferred": true,
        "description": "decision_status is defined by term.approval_status.",
        "source_field": "properties.term"
      }
    },
    {
      "id": "edge.business_entity.refund_decision.decision_status.MAPS_TO.column.support.refund_decision.decision_status",
      "type": "MAPS_TO",
      "source": "business_entity.refund_decision.decision_status",
      "target": "column.support.refund_decision.decision_status",
      "properties": {
        "inferred": true,
        "description": "decision_status maps to column.support.refund_decision.decision_status.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_request.REFERENCES.business_entity.customer_order",
      "type": "REFERENCES",
      "source": "business_entity.refund_request",
      "target": "business_entity.customer_order",
      "properties": {
        "inferred": true,
        "description": "A refund request references exactly one customer order.",
        "source_field": "related_nodes",
        "constraints": [
          {
            "type": "relationship_required",
            "severity": "critical",
            "description": "A refund request must reference an existing customer order.",
            "expression": "refund_request.order_id exists in customer_order.order_id"
          }
        ]
      }
    },
    {
      "id": "edge.business_entity.refund_request.HAS_TERM.term.refund_request",
      "type": "HAS_TERM",
      "source": "business_entity.refund_request",
      "target": "term.refund_request",
      "properties": {
        "inferred": true,
        "description": "Refund Request is defined by term.refund_request.",
        "source_field": "term"
      }
    },
    {
      "id": "edge.business_entity.refund_request.IMPLEMENTED_BY.table.support.refund_request",
      "type": "IMPLEMENTED_BY",
      "source": "business_entity.refund_request",
      "target": "table.support.refund_request",
      "properties": {
        "inferred": true,
        "description": "Refund request table stores customer-submitted refund cases.",
        "source_field": "mapped_assets"
      }
    },
    {
      "id": "edge.business_entity.refund_request.CONTAINS.business_entity.refund_request.refund_request_id",
      "type": "CONTAINS",
      "source": "business_entity.refund_request",
      "target": "business_entity.refund_request.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "Refund Request has property refund_request_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_request.refund_request_id.MAPS_TO.column.support.refund_request.refund_request_id",
      "type": "MAPS_TO",
      "source": "business_entity.refund_request.refund_request_id",
      "target": "column.support.refund_request.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "refund_request_id maps to column.support.refund_request.refund_request_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_request.CONTAINS.business_entity.refund_request.order_id",
      "type": "CONTAINS",
      "source": "business_entity.refund_request",
      "target": "business_entity.refund_request.order_id",
      "properties": {
        "inferred": true,
        "description": "Refund Request has property order_id.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_request.order_id.HAS_TERM.term.order_identifier",
      "type": "HAS_TERM",
      "source": "business_entity.refund_request.order_id",
      "target": "term.order_identifier",
      "properties": {
        "inferred": true,
        "description": "order_id is defined by term.order_identifier.",
        "source_field": "properties.term"
      }
    },
    {
      "id": "edge.business_entity.refund_request.order_id.MAPS_TO.column.support.refund_request.order_id",
      "type": "MAPS_TO",
      "source": "business_entity.refund_request.order_id",
      "target": "column.support.refund_request.order_id",
      "properties": {
        "inferred": true,
        "description": "order_id maps to column.support.refund_request.order_id.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_request.order_id.REFERENCES.business_entity.customer_order.order_id",
      "type": "REFERENCES",
      "source": "business_entity.refund_request.order_id",
      "target": "business_entity.customer_order.order_id",
      "properties": {
        "inferred": true,
        "description": "Refund Request order_id references the Customer Order order_id.",
        "source_field": "properties.related_nodes"
      }
    },
    {
      "id": "edge.business_entity.refund_request.CONTAINS.business_entity.refund_request.requested_amount",
      "type": "CONTAINS",
      "source": "business_entity.refund_request",
      "target": "business_entity.refund_request.requested_amount",
      "properties": {
        "inferred": true,
        "description": "Refund Request has property requested_amount.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_request.requested_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "business_entity.refund_request.requested_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "requested_amount is defined by term.refund_amount.",
        "source_field": "properties.term"
      }
    },
    {
      "id": "edge.business_entity.refund_request.requested_amount.MAPS_TO.column.support.refund_request.requested_amount",
      "type": "MAPS_TO",
      "source": "business_entity.refund_request.requested_amount",
      "target": "column.support.refund_request.requested_amount",
      "properties": {
        "inferred": true,
        "description": "requested_amount maps to column.support.refund_request.requested_amount.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.business_entity.refund_request.CONTAINS.business_entity.refund_request.request_status",
      "type": "CONTAINS",
      "source": "business_entity.refund_request",
      "target": "business_entity.refund_request.request_status",
      "properties": {
        "inferred": true,
        "description": "Refund Request has property request_status.",
        "source_field": "properties"
      }
    },
    {
      "id": "edge.business_entity.refund_request.request_status.HAS_TERM.term.approval_status",
      "type": "HAS_TERM",
      "source": "business_entity.refund_request.request_status",
      "target": "term.approval_status",
      "properties": {
        "inferred": true,
        "description": "request_status is defined by term.approval_status.",
        "source_field": "properties.term"
      }
    },
    {
      "id": "edge.business_entity.refund_request.request_status.MAPS_TO.column.support.refund_request.request_status",
      "type": "MAPS_TO",
      "source": "business_entity.refund_request.request_status",
      "target": "column.support.refund_request.request_status",
      "properties": {
        "inferred": true,
        "description": "request_status maps to column.support.refund_request.request_status.",
        "source_field": "properties.maps_to"
      }
    },
    {
      "id": "edge.table.payments.payment_refund.READS_FROM.table.support.refund_decision",
      "type": "READS_FROM",
      "source": "table.payments.payment_refund",
      "target": "table.support.refund_decision",
      "properties": {
        "inferred": true,
        "description": "Payment refunds read approved refund decisions.",
        "source_field": "lineage.downstream"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.READS_FROM.table.payments.payment_refund",
      "type": "READS_FROM",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "table.payments.payment_refund",
      "properties": {
        "inferred": true,
        "description": "View reads payment refund data.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.table.payments.payment_refund.CONTAINS.column.payments.payment_refund.payment_refund_id",
      "type": "CONTAINS",
      "source": "table.payments.payment_refund",
      "target": "column.payments.payment_refund.payment_refund_id",
      "properties": {
        "inferred": true,
        "description": "payment_refund contains column payment_refund_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.payments.payment_refund.CONTAINS.column.payments.payment_refund.decision_id",
      "type": "CONTAINS",
      "source": "table.payments.payment_refund",
      "target": "column.payments.payment_refund.decision_id",
      "properties": {
        "inferred": true,
        "description": "payment_refund contains column decision_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.payments.payment_refund.decision_id.DERIVES_FROM.column.support.refund_decision.decision_id",
      "type": "DERIVES_FROM",
      "source": "column.payments.payment_refund.decision_id",
      "target": "column.support.refund_decision.decision_id",
      "properties": {
        "inferred": true,
        "description": "Payment refund references the approved decision.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.payments.payment_refund.CONTAINS.column.payments.payment_refund.refunded_amount",
      "type": "CONTAINS",
      "source": "table.payments.payment_refund",
      "target": "column.payments.payment_refund.refunded_amount",
      "properties": {
        "inferred": true,
        "description": "payment_refund contains column refunded_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.payments.payment_refund.refunded_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "column.payments.payment_refund.refunded_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "refunded_amount is defined by term.refund_amount.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.column.payments.payment_refund.refunded_amount.DERIVES_FROM.column.support.refund_decision.approved_amount",
      "type": "DERIVES_FROM",
      "source": "column.payments.payment_refund.refunded_amount",
      "target": "column.support.refund_decision.approved_amount",
      "properties": {
        "inferred": true,
        "description": "Payment refund amount is based on approved amount.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.refunded_amount.DERIVES_FROM.column.payments.payment_refund.refunded_amount",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.refunded_amount",
      "target": "column.payments.payment_refund.refunded_amount",
      "properties": {
        "inferred": true,
        "description": "Selected from payment_refund.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.payments.payment_refund.CONTAINS.column.payments.payment_refund.payment_status",
      "type": "CONTAINS",
      "source": "table.payments.payment_refund",
      "target": "column.payments.payment_refund.payment_status",
      "properties": {
        "inferred": true,
        "description": "payment_refund contains column payment_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.payment_status.DERIVES_FROM.column.payments.payment_refund.payment_status",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.payment_status",
      "target": "column.payments.payment_refund.payment_status",
      "properties": {
        "inferred": true,
        "description": "Selected from payment_refund.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.sales.order_header.CONTAINS.column.sales.order_header.order_id",
      "type": "CONTAINS",
      "source": "table.sales.order_header",
      "target": "column.sales.order_header.order_id",
      "properties": {
        "inferred": true,
        "description": "order_header contains column order_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.sales.order_header.order_id.HAS_TERM.term.order_identifier",
      "type": "HAS_TERM",
      "source": "column.sales.order_header.order_id",
      "target": "term.order_identifier",
      "properties": {
        "inferred": true,
        "description": "order_id is defined by term.order_identifier.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.column.support.refund_request.order_id.DERIVES_FROM.column.sales.order_header.order_id",
      "type": "DERIVES_FROM",
      "source": "column.support.refund_request.order_id",
      "target": "column.sales.order_header.order_id",
      "properties": {
        "inferred": true,
        "description": "Refund request stores the order identifier from order header.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.sales.order_header.CONTAINS.column.sales.order_header.customer_id",
      "type": "CONTAINS",
      "source": "table.sales.order_header",
      "target": "column.sales.order_header.customer_id",
      "properties": {
        "inferred": true,
        "description": "order_header contains column customer_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.sales.order_header.CONTAINS.column.sales.order_header.order_total_amount",
      "type": "CONTAINS",
      "source": "table.sales.order_header",
      "target": "column.sales.order_header.order_total_amount",
      "properties": {
        "inferred": true,
        "description": "order_header contains column order_total_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.sales.order_header.CONTAINS.column.sales.order_header.order_created_at",
      "type": "CONTAINS",
      "source": "table.sales.order_header",
      "target": "column.sales.order_header.order_created_at",
      "properties": {
        "inferred": true,
        "description": "order_header contains column order_created_at.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.support.refund_decision.READS_FROM.table.support.refund_request",
      "type": "READS_FROM",
      "source": "table.support.refund_decision",
      "target": "table.support.refund_request",
      "properties": {
        "inferred": true,
        "description": "Refund decisions read refund request records.",
        "source_field": "lineage.downstream"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.READS_FROM.table.support.refund_decision",
      "type": "READS_FROM",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "table.support.refund_decision",
      "properties": {
        "inferred": true,
        "description": "View reads refund decision data.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.table.support.refund_decision.CONTAINS.column.support.refund_decision.decision_id",
      "type": "CONTAINS",
      "source": "table.support.refund_decision",
      "target": "column.support.refund_decision.decision_id",
      "properties": {
        "inferred": true,
        "description": "refund_decision contains column decision_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.support.refund_decision.CONTAINS.column.support.refund_decision.refund_request_id",
      "type": "CONTAINS",
      "source": "table.support.refund_decision",
      "target": "column.support.refund_decision.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "refund_decision contains column refund_request_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.support.refund_decision.refund_request_id.DERIVES_FROM.column.support.refund_request.refund_request_id",
      "type": "DERIVES_FROM",
      "source": "column.support.refund_decision.refund_request_id",
      "target": "column.support.refund_request.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "Decision references the reviewed refund request.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.support.refund_decision.CONTAINS.column.support.refund_decision.approved_amount",
      "type": "CONTAINS",
      "source": "table.support.refund_decision",
      "target": "column.support.refund_decision.approved_amount",
      "properties": {
        "inferred": true,
        "description": "refund_decision contains column approved_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.support.refund_decision.approved_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "column.support.refund_decision.approved_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "approved_amount is defined by term.refund_amount.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.column.support.refund_decision.approved_amount.DERIVES_FROM.column.support.refund_request.requested_amount",
      "type": "DERIVES_FROM",
      "source": "column.support.refund_decision.approved_amount",
      "target": "column.support.refund_request.requested_amount",
      "properties": {
        "inferred": true,
        "description": "Decision approved amount is reviewed against requested amount.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.approved_amount.DERIVES_FROM.column.support.refund_decision.approved_amount",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.approved_amount",
      "target": "column.support.refund_decision.approved_amount",
      "properties": {
        "inferred": true,
        "description": "Selected from refund_decision.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.support.refund_decision.CONTAINS.column.support.refund_decision.decision_status",
      "type": "CONTAINS",
      "source": "table.support.refund_decision",
      "target": "column.support.refund_decision.decision_status",
      "properties": {
        "inferred": true,
        "description": "refund_decision contains column decision_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.support.refund_decision.decision_status.HAS_TERM.term.approval_status",
      "type": "HAS_TERM",
      "source": "column.support.refund_decision.decision_status",
      "target": "term.approval_status",
      "properties": {
        "inferred": true,
        "description": "decision_status is defined by term.approval_status.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.decision_status.DERIVES_FROM.column.support.refund_decision.decision_status",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.decision_status",
      "target": "column.support.refund_decision.decision_status",
      "properties": {
        "inferred": true,
        "description": "Selected from refund_decision.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.support.refund_request.READS_FROM.table.sales.order_header",
      "type": "READS_FROM",
      "source": "table.support.refund_request",
      "target": "table.sales.order_header",
      "properties": {
        "inferred": true,
        "description": "Refund request records reference source orders.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.READS_FROM.table.support.refund_request",
      "type": "READS_FROM",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "table.support.refund_request",
      "properties": {
        "inferred": true,
        "description": "View reads refund request data.",
        "source_field": "lineage.upstream"
      }
    },
    {
      "id": "edge.table.support.refund_request.CONTAINS.column.support.refund_request.refund_request_id",
      "type": "CONTAINS",
      "source": "table.support.refund_request",
      "target": "column.support.refund_request.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "refund_request contains column refund_request_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.table.support.refund_request.CONTAINS.column.support.refund_request.order_id",
      "type": "CONTAINS",
      "source": "table.support.refund_request",
      "target": "column.support.refund_request.order_id",
      "properties": {
        "inferred": true,
        "description": "refund_request contains column order_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.support.refund_request.order_id.HAS_TERM.term.order_identifier",
      "type": "HAS_TERM",
      "source": "column.support.refund_request.order_id",
      "target": "term.order_identifier",
      "properties": {
        "inferred": true,
        "description": "order_id is defined by term.order_identifier.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.order_id.DERIVES_FROM.column.support.refund_request.order_id",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.order_id",
      "target": "column.support.refund_request.order_id",
      "properties": {
        "inferred": true,
        "description": "Selected from refund_request.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.support.refund_request.CONTAINS.column.support.refund_request.requested_amount",
      "type": "CONTAINS",
      "source": "table.support.refund_request",
      "target": "column.support.refund_request.requested_amount",
      "properties": {
        "inferred": true,
        "description": "refund_request contains column requested_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.support.refund_request.requested_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "column.support.refund_request.requested_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "requested_amount is defined by term.refund_amount.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.requested_amount.DERIVES_FROM.column.support.refund_request.requested_amount",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.requested_amount",
      "target": "column.support.refund_request.requested_amount",
      "properties": {
        "inferred": true,
        "description": "Selected from refund_request.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.table.support.refund_request.CONTAINS.column.support.refund_request.request_status",
      "type": "CONTAINS",
      "source": "table.support.refund_request",
      "target": "column.support.refund_request.request_status",
      "properties": {
        "inferred": true,
        "description": "refund_request contains column request_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.support.refund_request.request_status.HAS_TERM.term.approval_status",
      "type": "HAS_TERM",
      "source": "column.support.refund_request.request_status",
      "target": "term.approval_status",
      "properties": {
        "inferred": true,
        "description": "request_status is defined by term.approval_status.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.request_status.DERIVES_FROM.column.support.refund_request.request_status",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.request_status",
      "target": "column.support.refund_request.request_status",
      "properties": {
        "inferred": true,
        "description": "Selected from refund_request.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.refund_request_id",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column refund_request_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.refund_request_id.DERIVES_FROM.column.support.refund_request.refund_request_id",
      "type": "DERIVES_FROM",
      "source": "column.analytics.v_refund_lifecycle.refund_request_id",
      "target": "column.support.refund_request.refund_request_id",
      "properties": {
        "inferred": true,
        "description": "Selected from refund_request.",
        "source_field": "columns.lineage"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.order_id",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.order_id",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column order_id.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.order_id.HAS_TERM.term.order_identifier",
      "type": "HAS_TERM",
      "source": "column.analytics.v_refund_lifecycle.order_id",
      "target": "term.order_identifier",
      "properties": {
        "inferred": true,
        "description": "order_id is defined by term.order_identifier.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.requested_amount",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.requested_amount",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column requested_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.requested_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "column.analytics.v_refund_lifecycle.requested_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "requested_amount is defined by term.refund_amount.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.request_status",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.request_status",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column request_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.request_status.HAS_TERM.term.approval_status",
      "type": "HAS_TERM",
      "source": "column.analytics.v_refund_lifecycle.request_status",
      "target": "term.approval_status",
      "properties": {
        "inferred": true,
        "description": "request_status is defined by term.approval_status.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.decision_status",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.decision_status",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column decision_status.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.decision_status.HAS_TERM.term.approval_status",
      "type": "HAS_TERM",
      "source": "column.analytics.v_refund_lifecycle.decision_status",
      "target": "term.approval_status",
      "properties": {
        "inferred": true,
        "description": "decision_status is defined by term.approval_status.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.approved_amount",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.approved_amount",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column approved_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.approved_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "column.analytics.v_refund_lifecycle.approved_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "approved_amount is defined by term.refund_amount.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.refunded_amount",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.refunded_amount",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column refunded_amount.",
        "source_field": "columns"
      }
    },
    {
      "id": "edge.column.analytics.v_refund_lifecycle.refunded_amount.HAS_TERM.term.refund_amount",
      "type": "HAS_TERM",
      "source": "column.analytics.v_refund_lifecycle.refunded_amount",
      "target": "term.refund_amount",
      "properties": {
        "inferred": true,
        "description": "refunded_amount is defined by term.refund_amount.",
        "source_field": "columns.term"
      }
    },
    {
      "id": "edge.view.analytics.v_refund_lifecycle.CONTAINS.column.analytics.v_refund_lifecycle.payment_status",
      "type": "CONTAINS",
      "source": "view.analytics.v_refund_lifecycle",
      "target": "column.analytics.v_refund_lifecycle.payment_status",
      "properties": {
        "inferred": true,
        "description": "v_refund_lifecycle contains column payment_status.",
        "source_field": "columns"
      }
    }
  ]
};

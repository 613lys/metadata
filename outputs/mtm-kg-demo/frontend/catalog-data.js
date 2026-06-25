window.CATALOG_DATA = {
  "business_entity.customer_order": {
    "id": "business_entity.customer_order",
    "type": "business_entity",
    "name": "Customer Order",
    "description": "Confirmed customer purchase that can later be refunded.",
    "term": "term.order_identifier",
    "owner": "Commerce Operations",
    "tags": [
      "domain.commerce",
      "lifecycle.order"
    ],
    "properties": [
      {
        "name": "order_id",
        "description": "Stable identifier for the customer order.",
        "semantic_role": "identifier",
        "term": "term.order_identifier",
        "maps_to": [
          "column.sales.order_header.order_id"
        ]
      },
      {
        "name": "customer_id",
        "description": "Customer who placed the order.",
        "semantic_role": "dimension",
        "maps_to": [
          "column.sales.order_header.customer_id"
        ]
      },
      {
        "name": "order_total_amount",
        "description": "Gross order value before any later refund.",
        "semantic_role": "measure",
        "maps_to": [
          "column.sales.order_header.order_total_amount"
        ]
      },
      {
        "name": "order_created_at",
        "description": "Timestamp when the order was created.",
        "semantic_role": "time_dimension",
        "maps_to": [
          "column.sales.order_header.order_created_at"
        ]
      }
    ],
    "mapped_assets": [
      {
        "id": "table.sales.order_header",
        "relation": "IMPLEMENTED_BY",
        "description": "Order header table is the primary physical representation of customer orders."
      }
    ],
    "constraints": [
      {
        "type": "identity",
        "severity": "critical",
        "description": "Each customer order must have a stable order identifier.",
        "expression": "customer_order.order_id is not null"
      }
    ],
    "evidence": [
      {
        "kind": "schema",
        "ref": "evidence/schema_snapshots/sales_order_header.json"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/business_entities/business_entity.customer_order.yaml"
  },
  "business_entity.payment_refund": {
    "id": "business_entity.payment_refund",
    "type": "business_entity",
    "name": "Payment Refund",
    "description": "Payment processor refund transaction created after approval.",
    "term": "term.payment_refund",
    "owner": "Payments Operations",
    "tags": [
      "domain.payments",
      "lifecycle.payment"
    ],
    "properties": [
      {
        "name": "payment_refund_id",
        "description": "Stable identifier for the payment refund transaction.",
        "semantic_role": "identifier",
        "maps_to": [
          "column.payments.payment_refund.payment_refund_id"
        ]
      },
      {
        "name": "decision_id",
        "description": "Refund decision that authorized the payment refund.",
        "semantic_role": "identifier",
        "maps_to": [
          "column.payments.payment_refund.decision_id"
        ],
        "related_nodes": [
          {
            "id": "business_entity.refund_decision.decision_id",
            "relation": "REFERENCES",
            "description": "Payment Refund decision_id references the approved Refund Decision."
          }
        ]
      },
      {
        "name": "refunded_amount",
        "description": "Amount sent to the payment provider for refund.",
        "semantic_role": "measure",
        "term": "term.refund_amount",
        "maps_to": [
          "column.payments.payment_refund.refunded_amount"
        ],
        "related_nodes": [
          {
            "id": "business_entity.refund_decision.approved_amount",
            "relation": "RECONCILES_WITH",
            "description": "Refunded amount should reconcile with the approved refund amount."
          }
        ]
      },
      {
        "name": "payment_status",
        "description": "Processor status of the refund transaction.",
        "semantic_role": "status",
        "maps_to": [
          "column.payments.payment_refund.payment_status"
        ]
      }
    ],
    "mapped_assets": [
      {
        "id": "table.payments.payment_refund",
        "relation": "IMPLEMENTED_BY",
        "description": "Payment refund table stores processor refund transactions."
      }
    ],
    "related_nodes": [
      {
        "id": "business_entity.refund_decision",
        "relation": "DERIVES_FROM",
        "description": "Payment refund is created from an approved refund decision."
      }
    ],
    "constraints": [
      {
        "type": "reconciliation",
        "severity": "critical",
        "description": "Refunded amount should reconcile to the approved amount for the decision.",
        "expression": "payment_refund.refunded_amount = refund_decision.approved_amount"
      }
    ],
    "evidence": [
      {
        "kind": "api_contract",
        "ref": "services/payments/openapi.yaml#/refunds"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/business_entities/business_entity.payment_refund.yaml"
  },
  "business_entity.refund_decision": {
    "id": "business_entity.refund_decision",
    "type": "business_entity",
    "name": "Refund Decision",
    "description": "Business decision that approves or rejects a refund request.",
    "term": "term.approval_status",
    "owner": "Refund Review Team",
    "tags": [
      "domain.commerce",
      "lifecycle.review"
    ],
    "properties": [
      {
        "name": "decision_id",
        "description": "Stable identifier for the refund decision.",
        "semantic_role": "identifier",
        "maps_to": [
          "column.support.refund_decision.decision_id"
        ]
      },
      {
        "name": "refund_request_id",
        "description": "Refund request being reviewed.",
        "semantic_role": "identifier",
        "maps_to": [
          "column.support.refund_decision.refund_request_id"
        ],
        "related_nodes": [
          {
            "id": "business_entity.refund_request.refund_request_id",
            "relation": "REFERENCES",
            "description": "Refund Decision refund_request_id references the reviewed Refund Request."
          }
        ]
      },
      {
        "name": "approved_amount",
        "description": "Amount approved for payment refund.",
        "semantic_role": "measure",
        "term": "term.refund_amount",
        "maps_to": [
          "column.support.refund_decision.approved_amount"
        ],
        "related_nodes": [
          {
            "id": "business_entity.refund_request.requested_amount",
            "relation": "DEPENDS_ON",
            "description": "Approved amount is evaluated against the requested refund amount."
          }
        ],
        "constraints": [
          {
            "type": "comparison",
            "severity": "high",
            "description": "Approved amount cannot exceed the originally requested amount.",
            "expression": "approved_amount <= refund_request.requested_amount"
          }
        ]
      },
      {
        "name": "decision_status",
        "description": "Approved or rejected decision state.",
        "semantic_role": "status",
        "term": "term.approval_status",
        "maps_to": [
          "column.support.refund_decision.decision_status"
        ]
      }
    ],
    "mapped_assets": [
      {
        "id": "table.support.refund_decision",
        "relation": "IMPLEMENTED_BY",
        "description": "Refund decision table stores manual and automated review outcomes."
      }
    ],
    "related_nodes": [
      {
        "id": "business_entity.refund_request",
        "relation": "DERIVES_FROM",
        "description": "Refund decision is derived from review of the refund request and policy checks."
      }
    ],
    "constraints": [
      {
        "type": "state_transition",
        "severity": "critical",
        "description": "Payment refund can be created only for approved decisions.",
        "expression": "refund_decision.decision_status = 'approved'"
      }
    ],
    "evidence": [
      {
        "kind": "source_code",
        "ref": "services/refunds/review_workflow.py"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/business_entities/business_entity.refund_decision.yaml"
  },
  "business_entity.refund_request": {
    "id": "business_entity.refund_request",
    "type": "business_entity",
    "name": "Refund Request",
    "description": "Customer request for a refund against an existing order.",
    "term": "term.refund_request",
    "owner": "Commerce Operations",
    "tags": [
      "domain.commerce",
      "lifecycle.refund"
    ],
    "properties": [
      {
        "name": "refund_request_id",
        "description": "Stable identifier for the refund request.",
        "semantic_role": "identifier",
        "maps_to": [
          "column.support.refund_request.refund_request_id"
        ]
      },
      {
        "name": "order_id",
        "description": "Customer order that the refund request belongs to.",
        "semantic_role": "identifier",
        "term": "term.order_identifier",
        "maps_to": [
          "column.support.refund_request.order_id"
        ],
        "related_nodes": [
          {
            "id": "business_entity.customer_order.order_id",
            "relation": "REFERENCES",
            "description": "Refund Request order_id references the Customer Order order_id."
          }
        ]
      },
      {
        "name": "requested_amount",
        "description": "Amount requested by the customer.",
        "semantic_role": "measure",
        "term": "term.refund_amount",
        "maps_to": [
          "column.support.refund_request.requested_amount"
        ],
        "constraints": [
          {
            "type": "range",
            "severity": "high",
            "description": "Requested amount should be greater than zero.",
            "expression": "requested_amount > 0"
          }
        ]
      },
      {
        "name": "request_status",
        "description": "Current lifecycle status of the request.",
        "semantic_role": "status",
        "term": "term.approval_status",
        "maps_to": [
          "column.support.refund_request.request_status"
        ],
        "constraints": [
          {
            "type": "accepted_values",
            "severity": "high",
            "description": "Refund request status must use the controlled status set.",
            "expression": "request_status in ('submitted', 'approved', 'rejected', 'cancelled')"
          }
        ]
      }
    ],
    "mapped_assets": [
      {
        "id": "table.support.refund_request",
        "relation": "IMPLEMENTED_BY",
        "description": "Refund request table stores customer-submitted refund cases."
      }
    ],
    "related_nodes": [
      {
        "id": "business_entity.customer_order",
        "relation": "REFERENCES",
        "description": "A refund request references exactly one customer order.",
        "constraints": [
          {
            "type": "relationship_required",
            "severity": "critical",
            "description": "A refund request must reference an existing customer order.",
            "expression": "refund_request.order_id exists in customer_order.order_id"
          }
        ]
      }
    ],
    "constraints": [
      {
        "type": "relationship_required",
        "severity": "critical",
        "description": "A refund request must reference an existing customer order.",
        "expression": "refund_request.order_id exists in customer_order.order_id"
      }
    ],
    "evidence": [
      {
        "kind": "policy",
        "ref": "evidence/refund_policy.md"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/business_entities/business_entity.refund_request.yaml"
  },
  "table.payments.payment_refund": {
    "id": "table.payments.payment_refund",
    "type": "table",
    "name": "payment_refund",
    "description": "Stores refund transactions submitted to the payment processor.",
    "owner": "Payments Data Engineering",
    "schema": "payments",
    "columns": [
      {
        "name": "payment_refund_id",
        "data_type": "varchar",
        "nullable": false,
        "description": "Primary key for the payment refund transaction."
      },
      {
        "name": "decision_id",
        "data_type": "varchar",
        "nullable": false,
        "description": "Refund decision that authorized the transaction.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_decision.decision_id",
              "description": "Payment refund references the approved decision."
            }
          ]
        }
      },
      {
        "name": "refunded_amount",
        "data_type": "decimal",
        "nullable": false,
        "term": "term.refund_amount",
        "description": "Amount sent to the payment processor.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_decision.approved_amount",
              "description": "Refunded amount is based on approved amount."
            }
          ],
          "downstream": [
            {
              "id": "column.analytics.v_refund_lifecycle.refunded_amount",
              "description": "Refund lifecycle view exposes refunded amount."
            }
          ]
        }
      },
      {
        "name": "payment_status",
        "data_type": "varchar",
        "nullable": false,
        "description": "Processor status for the refund transaction.",
        "lineage": {
          "downstream": [
            {
              "id": "column.analytics.v_refund_lifecycle.payment_status",
              "description": "Refund lifecycle view exposes payment status."
            }
          ]
        }
      }
    ],
    "primary_key": [
      "payment_refund_id"
    ],
    "lineage": {
      "upstream": [
        {
          "id": "table.support.refund_decision",
          "relation": "READS_FROM",
          "description": "Payment refund records are created from approved decisions."
        }
      ],
      "downstream": [
        {
          "id": "view.analytics.v_refund_lifecycle",
          "relation": "READS_FROM",
          "description": "Refund lifecycle view reads payment refund status."
        }
      ]
    },
    "evidence": [
      {
        "kind": "db_schema",
        "ref": "evidence/schema_snapshots/payments_payment_refund.json"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/tables/table.payments.payment_refund.yaml"
  },
  "table.sales.order_header": {
    "id": "table.sales.order_header",
    "type": "table",
    "name": "order_header",
    "description": "Stores one row per confirmed customer order.",
    "owner": "Sales Data Engineering",
    "schema": "sales",
    "columns": [
      {
        "name": "order_id",
        "data_type": "varchar",
        "nullable": false,
        "term": "term.order_identifier",
        "description": "Primary key for the customer order.",
        "lineage": {
          "downstream": [
            {
              "id": "column.support.refund_request.order_id",
              "description": "Refund requests carry the source order identifier."
            }
          ]
        }
      },
      {
        "name": "customer_id",
        "data_type": "varchar",
        "nullable": false,
        "description": "Customer identifier on the order."
      },
      {
        "name": "order_total_amount",
        "data_type": "decimal",
        "nullable": false,
        "description": "Gross order amount at checkout."
      },
      {
        "name": "order_created_at",
        "data_type": "timestamp",
        "nullable": false,
        "description": "Timestamp when the order was confirmed."
      }
    ],
    "primary_key": [
      "order_id"
    ],
    "evidence": [
      {
        "kind": "db_schema",
        "ref": "evidence/schema_snapshots/sales_order_header.json"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/tables/table.sales.order_header.yaml"
  },
  "table.support.refund_decision": {
    "id": "table.support.refund_decision",
    "type": "table",
    "name": "refund_decision",
    "description": "Stores review outcomes for refund requests.",
    "owner": "Support Data Engineering",
    "schema": "support",
    "columns": [
      {
        "name": "decision_id",
        "data_type": "varchar",
        "nullable": false,
        "description": "Primary key for the refund decision."
      },
      {
        "name": "refund_request_id",
        "data_type": "varchar",
        "nullable": false,
        "description": "Refund request reviewed by this decision.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_request.refund_request_id",
              "description": "Decision references the reviewed refund request."
            }
          ]
        }
      },
      {
        "name": "approved_amount",
        "data_type": "decimal",
        "nullable": true,
        "term": "term.refund_amount",
        "description": "Approved refund amount when the decision is approved.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_request.requested_amount",
              "description": "Approved amount is determined from the requested amount and policy checks."
            }
          ],
          "downstream": [
            {
              "id": "column.payments.payment_refund.refunded_amount",
              "description": "Payment refund amount is based on approved amount."
            },
            {
              "id": "column.analytics.v_refund_lifecycle.approved_amount",
              "description": "Refund lifecycle view exposes approved amount."
            }
          ]
        }
      },
      {
        "name": "decision_status",
        "data_type": "varchar",
        "nullable": false,
        "term": "term.approval_status",
        "description": "Review outcome status.",
        "lineage": {
          "downstream": [
            {
              "id": "column.analytics.v_refund_lifecycle.decision_status",
              "description": "Refund lifecycle view exposes decision status."
            }
          ]
        }
      }
    ],
    "primary_key": [
      "decision_id"
    ],
    "lineage": {
      "upstream": [
        {
          "id": "table.support.refund_request",
          "relation": "READS_FROM",
          "description": "Refund decision reads the refund request being reviewed."
        }
      ],
      "downstream": [
        {
          "id": "table.payments.payment_refund",
          "relation": "READS_FROM",
          "description": "Payment refunds read approved refund decisions."
        },
        {
          "id": "view.analytics.v_refund_lifecycle",
          "relation": "READS_FROM",
          "description": "Refund lifecycle view reads decision outcomes."
        }
      ]
    },
    "evidence": [
      {
        "kind": "db_schema",
        "ref": "evidence/schema_snapshots/support_refund_decision.json"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/tables/table.support.refund_decision.yaml"
  },
  "table.support.refund_request": {
    "id": "table.support.refund_request",
    "type": "table",
    "name": "refund_request",
    "description": "Stores customer-submitted refund requests and request status.",
    "owner": "Support Data Engineering",
    "schema": "support",
    "columns": [
      {
        "name": "refund_request_id",
        "data_type": "varchar",
        "nullable": false,
        "description": "Primary key for the refund request."
      },
      {
        "name": "order_id",
        "data_type": "varchar",
        "nullable": false,
        "term": "term.order_identifier",
        "description": "Customer order referenced by the refund request.",
        "lineage": {
          "upstream": [
            {
              "id": "column.sales.order_header.order_id",
              "description": "Refund request stores the order identifier from order header."
            }
          ],
          "downstream": [
            {
              "id": "column.analytics.v_refund_lifecycle.order_id",
              "description": "Refund lifecycle view exposes order id for reporting."
            }
          ]
        }
      },
      {
        "name": "requested_amount",
        "data_type": "decimal",
        "nullable": false,
        "term": "term.refund_amount",
        "description": "Amount requested by the customer.",
        "lineage": {
          "downstream": [
            {
              "id": "column.support.refund_decision.approved_amount",
              "description": "Decision approved amount is reviewed against requested amount."
            },
            {
              "id": "column.analytics.v_refund_lifecycle.requested_amount",
              "description": "Refund lifecycle view exposes requested amount."
            }
          ]
        }
      },
      {
        "name": "request_status",
        "data_type": "varchar",
        "nullable": false,
        "term": "term.approval_status",
        "description": "Current request status.",
        "lineage": {
          "downstream": [
            {
              "id": "column.analytics.v_refund_lifecycle.request_status",
              "description": "Refund lifecycle view exposes request status."
            }
          ]
        }
      }
    ],
    "primary_key": [
      "refund_request_id"
    ],
    "lineage": {
      "upstream": [
        {
          "id": "table.sales.order_header",
          "relation": "READS_FROM",
          "description": "Refund request records reference source orders."
        }
      ],
      "downstream": [
        {
          "id": "table.support.refund_decision",
          "relation": "READS_FROM",
          "description": "Refund decisions read refund request records."
        },
        {
          "id": "view.analytics.v_refund_lifecycle",
          "relation": "READS_FROM",
          "description": "Refund lifecycle view reads refund requests."
        }
      ]
    },
    "evidence": [
      {
        "kind": "db_schema",
        "ref": "evidence/schema_snapshots/support_refund_request.json"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/tables/table.support.refund_request.yaml"
  },
  "term.approval_status": {
    "id": "term.approval_status",
    "type": "term",
    "name": "Approval Status",
    "description": "Review state of a refund request or refund decision.",
    "definition": "Approval status indicates whether a refund is pending review, approved, rejected, or cancelled.",
    "aliases": [
      "review status"
    ],
    "owner": "Commerce Operations",
    "evidence": [
      {
        "kind": "source_code",
        "ref": "services/refunds/status_codes.py"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_expected_status_model"
    },
    "_source_file": "knowledge/nodes/terms/term.approval_status.yaml"
  },
  "term.order_identifier": {
    "id": "term.order_identifier",
    "type": "term",
    "name": "Order Identifier",
    "description": "Stable identifier assigned to a customer order.",
    "definition": "A unique business key used to identify and join records that refer to the same customer order.",
    "aliases": [
      "order id",
      "order number"
    ],
    "owner": "Commerce Data Steward",
    "evidence": [
      {
        "kind": "data_dictionary",
        "ref": "evidence/commerce_data_dictionary.md#order_identifier"
      }
    ],
    "verified": {
      "status": false,
      "reason": "demo_yaml_generated_for_skill_example"
    },
    "_source_file": "knowledge/nodes/terms/term.order_identifier.yaml"
  },
  "term.payment_refund": {
    "id": "term.payment_refund",
    "type": "term",
    "name": "Payment Refund",
    "description": "Payment processor transaction that returns funds to the customer.",
    "definition": "A payment refund is the financial transaction sent to the payment provider after a refund decision is approved.",
    "aliases": [
      "refund transaction"
    ],
    "owner": "Payments Data Steward",
    "evidence": [
      {
        "kind": "api_contract",
        "ref": "services/payments/openapi.yaml#/refunds"
      }
    ],
    "verified": {
      "status": false,
      "reason": "needs_payment_owner_confirmation"
    },
    "_source_file": "knowledge/nodes/terms/term.payment_refund.yaml"
  },
  "term.refund_amount": {
    "id": "term.refund_amount",
    "type": "term",
    "name": "Refund Amount",
    "description": "Monetary amount requested or approved for refund.",
    "definition": "Refund amount is the currency value that may be returned to the customer after review and payment processing.",
    "aliases": [
      "refund value"
    ],
    "owner": "Finance Data Steward",
    "evidence": [
      {
        "kind": "data_dictionary",
        "ref": "evidence/finance_metrics.md#refund_amount"
      }
    ],
    "verified": {
      "status": false,
      "reason": "needs_finance_confirmation"
    },
    "_source_file": "knowledge/nodes/terms/term.refund_amount.yaml"
  },
  "term.refund_request": {
    "id": "term.refund_request",
    "type": "term",
    "name": "Refund Request",
    "description": "Customer request to return money for an order or order item.",
    "definition": "A refund request records the customer's intent, requested amount, reason, and current review status.",
    "aliases": [
      "return request",
      "refund case"
    ],
    "owner": "Commerce Operations",
    "evidence": [
      {
        "kind": "policy",
        "ref": "evidence/refund_policy.md"
      }
    ],
    "verified": {
      "status": false,
      "reason": "needs_domain_owner_confirmation"
    },
    "_source_file": "knowledge/nodes/terms/term.refund_request.yaml"
  },
  "view.analytics.v_refund_lifecycle": {
    "id": "view.analytics.v_refund_lifecycle",
    "type": "view",
    "name": "v_refund_lifecycle",
    "description": "Analytics view joining refund requests, review decisions, and payment refund status.",
    "owner": "Analytics Engineering",
    "schema": "analytics",
    "definition": "Joins refund_request to refund_decision and payment_refund to show end-to-end refund lifecycle state.",
    "sql": "select\n  rr.refund_request_id,\n  rr.order_id,\n  rr.requested_amount,\n  rr.request_status,\n  rd.decision_status,\n  rd.approved_amount,\n  pr.refunded_amount,\n  pr.payment_status\nfrom support.refund_request rr\nleft join support.refund_decision rd\n  on rr.refund_request_id = rd.refund_request_id\nleft join payments.payment_refund pr\n  on rd.decision_id = pr.decision_id\n",
    "columns": [
      {
        "name": "refund_request_id",
        "data_type": "varchar",
        "description": "Refund request identifier selected from refund_request.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_request.refund_request_id",
              "description": "Selected from refund_request."
            }
          ]
        }
      },
      {
        "name": "order_id",
        "data_type": "varchar",
        "term": "term.order_identifier",
        "description": "Order identifier selected from refund_request.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_request.order_id",
              "description": "Selected from refund_request."
            }
          ]
        }
      },
      {
        "name": "requested_amount",
        "data_type": "decimal",
        "term": "term.refund_amount",
        "description": "Requested amount selected from refund_request.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_request.requested_amount",
              "description": "Selected from refund_request."
            }
          ]
        }
      },
      {
        "name": "request_status",
        "data_type": "varchar",
        "term": "term.approval_status",
        "description": "Request status selected from refund_request.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_request.request_status",
              "description": "Selected from refund_request."
            }
          ]
        }
      },
      {
        "name": "decision_status",
        "data_type": "varchar",
        "term": "term.approval_status",
        "description": "Decision status selected from refund_decision.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_decision.decision_status",
              "description": "Selected from refund_decision."
            }
          ]
        }
      },
      {
        "name": "approved_amount",
        "data_type": "decimal",
        "term": "term.refund_amount",
        "description": "Approved amount selected from refund_decision.",
        "lineage": {
          "upstream": [
            {
              "id": "column.support.refund_decision.approved_amount",
              "description": "Selected from refund_decision."
            }
          ]
        }
      },
      {
        "name": "refunded_amount",
        "data_type": "decimal",
        "term": "term.refund_amount",
        "description": "Refunded amount selected from payment_refund.",
        "lineage": {
          "upstream": [
            {
              "id": "column.payments.payment_refund.refunded_amount",
              "description": "Selected from payment_refund."
            }
          ]
        }
      },
      {
        "name": "payment_status",
        "data_type": "varchar",
        "description": "Payment processor status selected from payment_refund.",
        "lineage": {
          "upstream": [
            {
              "id": "column.payments.payment_refund.payment_status",
              "description": "Selected from payment_refund."
            }
          ]
        }
      }
    ],
    "lineage": {
      "upstream": [
        {
          "id": "table.support.refund_request",
          "relation": "READS_FROM",
          "description": "View reads refund request data."
        },
        {
          "id": "table.support.refund_decision",
          "relation": "READS_FROM",
          "description": "View reads refund decision data."
        },
        {
          "id": "table.payments.payment_refund",
          "relation": "READS_FROM",
          "description": "View reads payment refund data."
        }
      ]
    },
    "evidence": [
      {
        "kind": "sql",
        "ref": "analytics/views/v_refund_lifecycle.sql"
      }
    ],
    "verified": {
      "status": false,
      "reason": "generated_from_skill_demo"
    },
    "_source_file": "knowledge/nodes/views/view.analytics.v_refund_lifecycle.yaml"
  }
};

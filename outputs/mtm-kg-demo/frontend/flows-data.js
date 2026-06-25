window.FLOW_DATA = {
  "flows": [
    {
      "id": "flow.refund_lifecycle",
      "type": "flow",
      "name": "Refund Lifecycle",
      "description": "Business flow from an existing customer order through refund request review and payment refund issuance.",
      "owner": "Commerce Operations",
      "tags": [
        "domain.commerce",
        "flow.refund"
      ],
      "nodes": [
        "business_entity.refund_request",
        "business_entity.customer_order",
        "business_entity.refund_decision",
        "business_entity.payment_refund"
      ],
      "edges": [
        {
          "id": "flow.refund_lifecycle.edge.1",
          "base_edge": "edge.business_entity.refund_request.REFERENCES.business_entity.customer_order",
          "type": "INITIATES",
          "source": "business_entity.customer_order",
          "target": "business_entity.refund_request",
          "step": 1,
          "label": "Request refund",
          "description": "A confirmed customer order can initiate a customer refund request.",
          "lifecycle": "request",
          "dependency": "business_required",
          "sla": "PT5M",
          "condition": "customer_order exists and is eligible for refund",
          "constraints": [],
          "raw": {
            "base_edge": "edge.business_entity.refund_request.REFERENCES.business_entity.customer_order",
            "flow_edge_id": "flow.refund_lifecycle.edge.1",
            "step": 1,
            "relation": "INITIATES",
            "source": "business_entity.customer_order",
            "target": "business_entity.refund_request",
            "label": "Request refund",
            "description": "A confirmed customer order can initiate a customer refund request.",
            "lifecycle": "request",
            "dependency": "business_required",
            "sla": "PT5M",
            "condition": "customer_order exists and is eligible for refund"
          },
          "base_raw": {
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
          }
        },
        {
          "id": "flow.refund_lifecycle.edge.2",
          "base_edge": "edge.business_entity.refund_decision.DERIVES_FROM.business_entity.refund_request",
          "type": "PRODUCES",
          "source": "business_entity.refund_request",
          "target": "business_entity.refund_decision",
          "step": 2,
          "label": "Review request",
          "description": "The refund request is reviewed and produces an approval or rejection decision.",
          "lifecycle": "review",
          "dependency": "operational_review",
          "sla": "P1D",
          "condition": "refund request status is submitted",
          "constraints": [],
          "raw": {
            "base_edge": "edge.business_entity.refund_decision.DERIVES_FROM.business_entity.refund_request",
            "flow_edge_id": "flow.refund_lifecycle.edge.2",
            "step": 2,
            "relation": "PRODUCES",
            "source": "business_entity.refund_request",
            "target": "business_entity.refund_decision",
            "label": "Review request",
            "description": "The refund request is reviewed and produces an approval or rejection decision.",
            "lifecycle": "review",
            "dependency": "operational_review",
            "sla": "P1D",
            "condition": "refund request status is submitted"
          },
          "base_raw": {
            "id": "edge.business_entity.refund_decision.DERIVES_FROM.business_entity.refund_request",
            "type": "DERIVES_FROM",
            "source": "business_entity.refund_decision",
            "target": "business_entity.refund_request",
            "properties": {
              "inferred": true,
              "description": "Refund decision is derived from review of the refund request and policy checks.",
              "source_field": "related_nodes"
            }
          }
        },
        {
          "id": "flow.refund_lifecycle.edge.3",
          "base_edge": "edge.business_entity.payment_refund.DERIVES_FROM.business_entity.refund_decision",
          "type": "ENABLES",
          "source": "business_entity.refund_decision",
          "target": "business_entity.payment_refund",
          "step": 3,
          "label": "Issue refund",
          "description": "An approved refund decision enables a payment refund transaction.",
          "lifecycle": "payment",
          "dependency": "approval_required",
          "sla": "PT2H",
          "condition": "decision_status = approved",
          "constraints": [],
          "raw": {
            "base_edge": "edge.business_entity.payment_refund.DERIVES_FROM.business_entity.refund_decision",
            "flow_edge_id": "flow.refund_lifecycle.edge.3",
            "step": 3,
            "relation": "ENABLES",
            "source": "business_entity.refund_decision",
            "target": "business_entity.payment_refund",
            "label": "Issue refund",
            "description": "An approved refund decision enables a payment refund transaction.",
            "lifecycle": "payment",
            "dependency": "approval_required",
            "sla": "PT2H",
            "condition": "decision_status = approved"
          },
          "base_raw": {
            "id": "edge.business_entity.payment_refund.DERIVES_FROM.business_entity.refund_decision",
            "type": "DERIVES_FROM",
            "source": "business_entity.payment_refund",
            "target": "business_entity.refund_decision",
            "properties": {
              "inferred": true,
              "description": "Payment refund is created from an approved refund decision.",
              "source_field": "related_nodes"
            }
          }
        }
      ],
      "edge_dependencies": [
        {
          "from": "flow.refund_lifecycle.edge.1",
          "to": "flow.refund_lifecycle.edge.2",
          "type": "PRECEDES",
          "description": "A refund request can only be reviewed after the refund request exists.",
          "condition": ""
        },
        {
          "from": "flow.refund_lifecycle.edge.2",
          "to": "flow.refund_lifecycle.edge.3",
          "type": "ENABLES",
          "description": "Only an approved refund decision can enable issuing a payment refund.",
          "condition": "decision_status = approved"
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
      "source_file": "knowledge/flows/flow.refund_lifecycle.yaml",
      "raw": {
        "id": "flow.refund_lifecycle",
        "type": "flow",
        "name": "Refund Lifecycle",
        "description": "Business flow from an existing customer order through refund request review and payment refund issuance.",
        "owner": "Commerce Operations",
        "tags": [
          "domain.commerce",
          "flow.refund"
        ],
        "nodes": [
          "business_entity.customer_order",
          "business_entity.refund_request",
          "business_entity.refund_decision",
          "business_entity.payment_refund"
        ],
        "edges": [
          {
            "base_edge": "edge.business_entity.refund_request.REFERENCES.business_entity.customer_order",
            "flow_edge_id": "flow.refund_lifecycle.edge.1",
            "step": 1,
            "relation": "INITIATES",
            "source": "business_entity.customer_order",
            "target": "business_entity.refund_request",
            "label": "Request refund",
            "description": "A confirmed customer order can initiate a customer refund request.",
            "lifecycle": "request",
            "dependency": "business_required",
            "sla": "PT5M",
            "condition": "customer_order exists and is eligible for refund"
          },
          {
            "base_edge": "edge.business_entity.refund_decision.DERIVES_FROM.business_entity.refund_request",
            "flow_edge_id": "flow.refund_lifecycle.edge.2",
            "step": 2,
            "relation": "PRODUCES",
            "source": "business_entity.refund_request",
            "target": "business_entity.refund_decision",
            "label": "Review request",
            "description": "The refund request is reviewed and produces an approval or rejection decision.",
            "lifecycle": "review",
            "dependency": "operational_review",
            "sla": "P1D",
            "condition": "refund request status is submitted"
          },
          {
            "base_edge": "edge.business_entity.payment_refund.DERIVES_FROM.business_entity.refund_decision",
            "flow_edge_id": "flow.refund_lifecycle.edge.3",
            "step": 3,
            "relation": "ENABLES",
            "source": "business_entity.refund_decision",
            "target": "business_entity.payment_refund",
            "label": "Issue refund",
            "description": "An approved refund decision enables a payment refund transaction.",
            "lifecycle": "payment",
            "dependency": "approval_required",
            "sla": "PT2H",
            "condition": "decision_status = approved"
          }
        ],
        "edge_dependencies": [
          {
            "from": "flow.refund_lifecycle.edge.1",
            "to": "flow.refund_lifecycle.edge.2",
            "type": "PRECEDES",
            "description": "A refund request can only be reviewed after the refund request exists."
          },
          {
            "from": "flow.refund_lifecycle.edge.2",
            "to": "flow.refund_lifecycle.edge.3",
            "type": "ENABLES",
            "condition": "decision_status = approved",
            "description": "Only an approved refund decision can enable issuing a payment refund."
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
        "_source_file": "knowledge/flows/flow.refund_lifecycle.yaml"
      }
    }
  ]
};

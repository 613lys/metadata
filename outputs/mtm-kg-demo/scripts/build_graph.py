from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

try:
    import yaml
except ImportError as exc:
    raise SystemExit("PyYAML is required. Install with: pip install pyyaml") from exc


ROOT = Path(__file__).resolve().parents[1]
NODES_DIR = ROOT / "knowledge" / "nodes"
INDEX_DIR = ROOT / "knowledge" / "indexes"
FRONTEND_DIR = ROOT / "frontend"


def slug(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9_.-]+", "_", value.strip())
    return value.strip("_") or "edge"


def load_yaml_files() -> list[dict[str, Any]]:
    nodes: list[dict[str, Any]] = []
    for path in sorted(NODES_DIR.rglob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not data:
            continue
        if not all(k in data for k in ("id", "type", "name", "description")):
            raise ValueError(f"{path} must include id, type, name, description")
        data["_source_file"] = str(path.relative_to(ROOT)).replace("\\", "/")
        nodes.append(data)
    return nodes


def add_node(nodes: dict[str, dict[str, Any]], node_id: str, node_type: str, label: str, properties: dict[str, Any] | None = None) -> None:
    if node_id in nodes:
        nodes[node_id]["properties"].update(properties or {})
        return
    nodes[node_id] = {
        "id": node_id,
        "type": node_type,
        "label": label,
        "properties": properties or {},
    }


def add_edge(
    edges: dict[str, dict[str, Any]],
    source: str,
    target: str,
    edge_type: str,
    description: str = "",
    source_field: str = "",
) -> None:
    if not source or not target:
        return
    edge_id = f"edge.{slug(source)}.{slug(edge_type)}.{slug(target)}"
    properties: dict[str, Any] = {
        "inferred": True,
    }
    if description:
        properties["description"] = description
    if source_field:
        properties["source_field"] = source_field
    edges[edge_id] = {
        "id": edge_id,
        "type": edge_type or "related_to",
        "source": source,
        "target": target,
        "properties": properties,
    }


def column_id_for(parent_id: str, column_name: str) -> str:
    if parent_id.startswith("table."):
        return f"column.{parent_id[len('table.'): ]}.{column_name}"
    if parent_id.startswith("view."):
        return f"column.{parent_id[len('view.'): ]}.{column_name}"
    return f"{parent_id}.{column_name}"


def search_text_for(item: dict[str, Any]) -> str:
    parts: list[str] = [item.get("id", ""), item.get("name", ""), item.get("description", "")]
    for logic in item.get("business_logic") or []:
        if isinstance(logic, str):
            parts.append(logic)
        else:
            parts.extend([logic.get("name", ""), logic.get("description", "")])
    for rel in item.get("related_nodes") or []:
        parts.extend([rel.get("id", ""), rel.get("relation", ""), rel.get("description", "")])
    for qc in item.get("quality_checks") or []:
        parts.extend([qc.get("name", ""), qc.get("check_type", ""), str(qc.get("expectation", ""))])
        for target in qc.get("validates") or []:
            if isinstance(target, str):
                parts.append(target)
            else:
                parts.extend([target.get("id", ""), target.get("description", "")])
    return " ".join(str(part) for part in parts if part)


def compile_graph(raw_nodes: list[dict[str, Any]]) -> tuple[dict[str, Any], dict[str, Any], dict[str, Any]]:
    graph_nodes: dict[str, dict[str, Any]] = {}
    graph_edges: dict[str, dict[str, Any]] = {}
    catalog: dict[str, dict[str, Any]] = {}

    for item in raw_nodes:
        node_id = item["id"]
        catalog[node_id] = item
        add_node(
            graph_nodes,
            node_id,
            item["type"],
            item["name"],
            {
                "description": item.get("description", ""),
                "source_file": item.get("_source_file"),
            },
        )

    for item in raw_nodes:
        node_id = item["id"]

        for rel in item.get("related_nodes") or []:
            add_edge(
                graph_edges,
                node_id,
                rel.get("id"),
                rel.get("relation") or "related_to",
                rel.get("description", ""),
                "related_nodes",
            )

        for child in item.get("child_scenarios") or []:
            add_edge(graph_edges, node_id, child, "contains_scenario", "Parent scenario contains child scenario.", "child_scenarios")

        for flow in item.get("scenario_flow") or []:
            add_edge(
                graph_edges,
                flow.get("source"),
                flow.get("target"),
                flow.get("relation") or "precedes",
                flow.get("description", ""),
                "scenario_flow",
            )

        for direction, default_type, reverse in (("upstream", "lineage", True), ("downstream", "lineage", False)):
            for rel in (item.get("lineage") or {}).get(direction) or []:
                other = rel.get("id")
                if reverse:
                    add_edge(graph_edges, other, node_id, rel.get("relation") or default_type, rel.get("description", ""), f"lineage.{direction}")
                else:
                    add_edge(graph_edges, node_id, other, rel.get("relation") or default_type, rel.get("description", ""), f"lineage.{direction}")

        for column in item.get("columns") or []:
            col_name = column.get("name")
            if not col_name:
                continue
            col_id = column.get("id") or column_id_for(node_id, col_name)
            add_node(
                graph_nodes,
                col_id,
                "column",
                col_name,
                {
                    "description": column.get("description", ""),
                    "data_type": column.get("data_type"),
                    "parent": node_id,
                },
            )
            add_edge(graph_edges, node_id, col_id, "contains", f"{item['name']} contains column {col_name}.", "columns")
            for rel in column.get("related_nodes") or []:
                add_edge(graph_edges, col_id, rel.get("id"), rel.get("relation") or "related_to", rel.get("description", ""), "columns.related_nodes")
            for lineage in column.get("lineage") or []:
                src = lineage.get("source")
                add_edge(graph_edges, src, col_id, "field_lineage", lineage.get("description", ""), "columns.lineage")

        for field_group in ("fields", "request_fields", "response_fields", "returns"):
            for field in item.get(field_group) or []:
                field_id = f"{node_id}.{field.get('name')}"
                add_node(
                    graph_nodes,
                    field_id,
                    f"{item['type']}_field",
                    field.get("name", field_id),
                    {
                        "description": field.get("description", ""),
                        "data_type": field.get("data_type"),
                        "parent": node_id,
                    },
                )
                add_edge(graph_edges, node_id, field_id, "contains", f"{item['name']} contains field {field.get('name')}.", field_group)
                for rel in field.get("related_nodes") or []:
                    add_edge(graph_edges, field_id, rel.get("id"), rel.get("relation") or "related_to", rel.get("description", ""), f"{field_group}.related_nodes")
                for target in field.get("maps_to") or []:
                    add_edge(graph_edges, field_id, target, "maps_to_property", f"{field.get('name')} maps to {target}.", f"{field_group}.maps_to")
                for lin in field.get("lineage") or []:
                    add_edge(graph_edges, lin.get("source"), field_id, "field_lineage", lin.get("description", ""), f"{field_group}.lineage")

        for target in item.get("displays") or []:
            add_edge(graph_edges, node_id, target, "displays", f"{item['name']} displays {target}.", "displays")

        if item.get("type") == "quality_check":
            for target in item.get("targets") or []:
                if isinstance(target, str):
                    target_id = target
                    description = ""
                else:
                    target_id = target.get("id")
                    fields = ", ".join(target.get("fields") or [])
                    description = f"Checks {fields}." if fields else ""
                add_edge(graph_edges, node_id, target_id, "checks", description, "targets")
            for target in item.get("validates") or []:
                if isinstance(target, str):
                    target_id = target
                    description = ""
                else:
                    target_id = target.get("id")
                    description = target.get("description", "")
                add_edge(graph_edges, node_id, target_id, "validates", description, "validates")

        for qc in item.get("quality_checks") or []:
            qc_id = qc.get("id") or f"quality.{slug(node_id)}.{slug(qc.get('name', 'check'))}"
            add_node(
                graph_nodes,
                qc_id,
                "quality_check",
                qc.get("name", qc_id),
                {
                    "description": qc.get("expectation", ""),
                    "check_type": qc.get("check_type"),
                    "parent": node_id,
                },
            )
            add_edge(graph_edges, qc_id, node_id, "checks", qc.get("expectation", ""), "quality_checks")
            for target in qc.get("validates") or []:
                if isinstance(target, str):
                    target_id = target
                    description = ""
                else:
                    target_id = target.get("id")
                    description = target.get("description", "")
                add_edge(graph_edges, qc_id, target_id, "validates", description, "quality_checks.validates")

    graph = {
        "nodes": list(graph_nodes.values()),
        "edges": list(graph_edges.values()),
    }

    lineage = {"upstream": {}, "downstream": {}}
    for edge in graph["edges"]:
        if edge["type"] in {"lineage", "consumes", "produces", "feeds", "reads", "writes", "serves", "derived_from", "field_lineage"}:
            lineage["downstream"].setdefault(edge["source"], []).append(edge["target"])
            lineage["upstream"].setdefault(edge["target"], []).append(edge["source"])

    return graph, catalog, lineage


def build_curated_views(graph: dict[str, Any]) -> dict[str, Any]:
    node_ids = {node["id"] for node in graph["nodes"]}

    def existing(ids: list[str]) -> list[str]:
        return [node_id for node_id in ids if node_id in node_ids]

    return {
        "views": [
            {
                "id": "overview",
                "name": "Overview",
                "description": "Parent scenario and its direct business context.",
                "mode": "all",
                "focus": "scenario.margin_booking_settlement",
                "pinned_nodes": existing(
                    [
                        "scenario.margin_booking_settlement",
                        "scenario.mtm_valuation",
                        "scenario.margin_calculation",
                        "scenario.booking",
                        "scenario.settlement",
                    ]
                ),
            },
            {
                "id": "lineage",
                "name": "Lineage",
                "description": "Operational data flow from feed to dashboard.",
                "mode": "lineage",
                "focus": "scenario.margin_booking_settlement",
                "pinned_nodes": [],
            },
            {
                "id": "mtm_data_mode",
                "name": "MTM Data Mode",
                "description": "Data assets that implement the MTM term.",
                "mode": "data",
                "focus": "term.mtm",
                "pinned_nodes": existing(["term.mtm", "table.risk.mtm_valuation", "column.risk.mtm_valuation.mtm_value"]),
            },
            {
                "id": "settlement_data_mode",
                "name": "Settlement Data Mode",
                "description": "Assets involved in settlement monitoring.",
                "mode": "data",
                "focus": "scenario.settlement",
                "pinned_nodes": existing(
                    [
                        "scenario.settlement",
                        "table.booking.booking_order",
                        "table.settlement.settlement_instruction",
                        "api.margin.get_margin_settlement_summary",
                        "dashboard.powerbi.margin_operations",
                    ]
                ),
            },
        ]
    }


def main() -> None:
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_DIR.mkdir(parents=True, exist_ok=True)
    raw_nodes = load_yaml_files()
    graph, catalog, lineage = compile_graph(raw_nodes)
    curated_views = build_curated_views(graph)

    (INDEX_DIR / "graph.json").write_text(json.dumps(graph, indent=2, ensure_ascii=False), encoding="utf-8")
    (INDEX_DIR / "catalog.json").write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    (INDEX_DIR / "lineage.json").write_text(json.dumps(lineage, indent=2, ensure_ascii=False), encoding="utf-8")
    (INDEX_DIR / "views.json").write_text(json.dumps(curated_views, indent=2, ensure_ascii=False), encoding="utf-8")

    search = [
        {
            "id": node["id"],
            "type": node["type"],
            "text": search_text_for(catalog.get(node["id"], {})) or " ".join([node["id"], node["label"], node["properties"].get("description", "")]),
        }
        for node in graph["nodes"]
    ]
    (INDEX_DIR / "search.json").write_text(json.dumps(search, indent=2, ensure_ascii=False), encoding="utf-8")
    (FRONTEND_DIR / "graph-data.js").write_text(
        "window.GRAPH_DATA = " + json.dumps(graph, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    (FRONTEND_DIR / "catalog-data.js").write_text(
        "window.CATALOG_DATA = " + json.dumps(catalog, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    (FRONTEND_DIR / "views-data.js").write_text(
        "window.CURATED_VIEWS = " + json.dumps(curated_views, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Built {len(graph['nodes'])} nodes and {len(graph['edges'])} edges")


if __name__ == "__main__":
    main()

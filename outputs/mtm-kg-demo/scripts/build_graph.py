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
FLOWS_DIR = ROOT / "knowledge" / "flows"
INDEX_DIR = ROOT / "knowledge" / "indexes"
FRONTEND_DIR = ROOT / "frontend"


def slug(value: str) -> str:
    value = re.sub(r"[^a-zA-Z0-9_.-]+", "_", value.strip())
    return value.strip("_") or "edge"


RELATION_ALIASES = {
    "related_to": "RELATED_TO",
    "uses_term": "HAS_TERM",
    "contains": "CONTAINS",
    "reads": "READS_FROM",
    "read_from": "READS_FROM",
    "derived_from": "DERIVES_FROM",
    "field_lineage": "DERIVES_FROM",
    "maps_to_property": "MAPS_TO",
    "maps_to": "MAPS_TO",
    "represented_by": "REPRESENTED_BY",
    "implemented_by": "IMPLEMENTED_BY",
    "creates": "CREATES",
    "created_from": "DERIVES_FROM",
    "references": "REFERENCES",
    "requires": "DEPENDS_ON",
    "depends_on": "DEPENDS_ON",
    "values": "VALUES",
    "settles": "SETTLES",
    "reconciles_with": "RECONCILES_WITH",
    "aggregates": "AGGREGATES",
    "part_of": "PART_OF",
}


def normalize_relation(edge_type: str | None) -> str:
    if not edge_type:
        return "RELATED_TO"
    key = str(edge_type).strip()
    return RELATION_ALIASES.get(key.lower(), key.upper())


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


def load_flow_files() -> list[dict[str, Any]]:
    flows: list[dict[str, Any]] = []
    if not FLOWS_DIR.exists():
        return flows
    for path in sorted(FLOWS_DIR.rglob("*.yaml")):
        data = yaml.safe_load(path.read_text(encoding="utf-8"))
        if not data:
            continue
        if not all(k in data for k in ("id", "type", "name", "description")):
            raise ValueError(f"{path} must include id, type, name, description")
        if data["type"] != "flow":
            raise ValueError(f"{path} must use type: flow")
        data["_source_file"] = str(path.relative_to(ROOT)).replace("\\", "/")
        flows.append(data)
    return flows


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
    constraints: list[dict[str, Any]] | None = None,
) -> None:
    if not source or not target:
        return
    edge_type = normalize_relation(edge_type)
    edge_id = f"edge.{slug(source)}.{slug(edge_type)}.{slug(target)}"
    properties: dict[str, Any] = {
        "inferred": True,
    }
    if description:
        properties["description"] = description
    if source_field:
        properties["source_field"] = source_field
    if constraints:
        properties["constraints"] = constraints
    edges[edge_id] = {
        "id": edge_id,
        "type": edge_type,
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


def column_lineage_edges(current_column_id: str, lineage: Any) -> list[dict[str, str]]:
    if not lineage:
        return []
    if isinstance(lineage, list):
        return [
            {"source": current_column_id, "target": item["source"], "description": item.get("description", "")}
            for item in lineage
            if item.get("source")
        ]
    rows: list[dict[str, str]] = []
    for item in lineage.get("upstream") or []:
        target = item.get("id") or item.get("source")
        if target:
            rows.append({"source": current_column_id, "target": target, "description": item.get("description", "")})
    for item in lineage.get("downstream") or []:
        source = item.get("id") or item.get("target")
        if source:
            rows.append({"source": source, "target": current_column_id, "description": item.get("description", "")})
    return rows


def search_text_for(item: dict[str, Any]) -> str:
    parts: list[str] = [item.get("id", ""), item.get("name", ""), item.get("description", ""), item.get("term", "")]
    parts.extend(item.get("tags") or [])
    for logic in item.get("business_logic") or []:
        if isinstance(logic, str):
            parts.append(logic)
        else:
            parts.extend([logic.get("name", ""), logic.get("description", "")])
    for rel in item.get("related_nodes") or []:
        parts.extend([rel.get("id", ""), rel.get("relation", ""), rel.get("description", "")])
    for prop in item.get("properties") or []:
        parts.extend([prop.get("name", ""), prop.get("description", ""), prop.get("term", ""), prop.get("semantic_role", "")])
        parts.extend(prop.get("allowed_values") or [])
        parts.extend(prop.get("maps_to") or [])
        for rel in prop.get("related_nodes") or []:
            parts.extend([rel.get("id", ""), rel.get("relation", ""), rel.get("description", "")])
    for qc in item.get("quality_checks") or []:
        parts.extend([qc.get("name", ""), qc.get("check_type", ""), str(qc.get("expectation", ""))])
        for target in qc.get("validates") or []:
            if isinstance(target, str):
                parts.append(target)
            else:
                parts.extend([target.get("id", ""), target.get("description", "")])
    for constraint in item.get("constraints") or []:
        parts.extend([constraint.get("type", ""), constraint.get("description", ""), constraint.get("expression", ""), constraint.get("severity", "")])
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
                "term": item.get("term"),
                "tags": item.get("tags"),
                "constraints": item.get("constraints"),
            },
        )

    for item in raw_nodes:
        node_id = item["id"]

        for rel in item.get("related_nodes") or []:
            add_edge(
                graph_edges,
                node_id,
                rel.get("id"),
                rel.get("relation") or "RELATED_TO",
                rel.get("description", ""),
                "related_nodes",
                rel.get("constraints"),
            )

        if item.get("term"):
            add_edge(graph_edges, node_id, item.get("term"), "HAS_TERM", f"{item['name']} is defined by {item.get('term')}.", "term")

        for asset in item.get("mapped_assets") or []:
            if isinstance(asset, str):
                add_edge(graph_edges, node_id, asset, "REPRESENTED_BY", f"{item['name']} is represented by {asset}.", "mapped_assets")
            else:
                add_edge(
                    graph_edges,
                    node_id,
                    asset.get("id"),
                    asset.get("relation") or "REPRESENTED_BY",
                    asset.get("description", ""),
                    "mapped_assets",
                    asset.get("constraints"),
                )

        if item.get("type") == "business_entity":
            for prop in item.get("properties") or []:
                prop_name = prop.get("name")
                if not prop_name:
                    continue
                prop_id = f"{node_id}.{prop_name}"
                add_node(
                    graph_nodes,
                    prop_id,
                    f"{item['type']}_property",
                    prop_name,
                    {
                        "description": prop.get("description", ""),
                        "parent": node_id,
                        "semantic_role": prop.get("semantic_role"),
                        "allowed_values": prop.get("allowed_values"),
                        "constraints": prop.get("constraints"),
                    },
                )
                add_edge(graph_edges, node_id, prop_id, "CONTAINS", f"{item['name']} has property {prop_name}.", "properties")
                if prop.get("term"):
                    add_edge(graph_edges, prop_id, prop.get("term"), "HAS_TERM", f"{prop_name} is defined by {prop.get('term')}.", "properties.term")
                for target in prop.get("maps_to") or []:
                    add_edge(graph_edges, prop_id, target, "MAPS_TO", f"{prop_name} maps to {target}.", "properties.maps_to")
                for rel in prop.get("related_nodes") or []:
                    add_edge(
                        graph_edges,
                        prop_id,
                        rel.get("id"),
                        rel.get("relation") or "RELATED_TO",
                        rel.get("description", ""),
                        "properties.related_nodes",
                        rel.get("constraints"),
                    )

        for direction, default_type, reverse in (("upstream", "READS_FROM", False), ("downstream", "READS_FROM", True)):
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
            add_edge(graph_edges, node_id, col_id, "CONTAINS", f"{item['name']} contains column {col_name}.", "columns")
            if column.get("term"):
                add_edge(graph_edges, col_id, column.get("term"), "HAS_TERM", f"{col_name} is defined by {column.get('term')}.", "columns.term")
            for lineage in column_lineage_edges(col_id, column.get("lineage")):
                add_edge(graph_edges, lineage["source"], lineage["target"], "DERIVES_FROM", lineage.get("description", ""), "columns.lineage")

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
                        "semantic_role": field.get("semantic_role"),
                        "constraints": field.get("constraints"),
                        "parent": node_id,
                    },
                )
                add_edge(graph_edges, node_id, field_id, "CONTAINS", f"{item['name']} contains field {field.get('name')}.", field_group)
                for rel in field.get("related_nodes") or []:
                    add_edge(graph_edges, field_id, rel.get("id"), rel.get("relation") or "RELATED_TO", rel.get("description", ""), f"{field_group}.related_nodes")
                for target in field.get("maps_to") or []:
                    add_edge(graph_edges, field_id, target, "MAPS_TO", f"{field.get('name')} maps to {target}.", f"{field_group}.maps_to")
                for lin in field.get("lineage") or []:
                    add_edge(graph_edges, field_id, lin.get("source"), "DERIVES_FROM", lin.get("description", ""), f"{field_group}.lineage")

        for target in item.get("displays") or []:
            field_name = target.split(".")[-1]
            field_id = f"{node_id}.{field_name}"
            add_node(
                graph_nodes,
                field_id,
                "dashboard_field",
                field_name,
                {
                    "description": f"Dashboard field displayed from {target}.",
                    "parent": node_id,
                    "source": target,
                },
            )
            add_edge(graph_edges, node_id, field_id, "CONTAINS", f"{item['name']} contains dashboard field {field_name}.", "displays")
            add_edge(graph_edges, field_id, target, "DERIVES_FROM", f"{item['name']} displays {target}.", "displays")
            add_edge(graph_edges, node_id, target, "displays", f"{item['name']} displays {target}.", "displays")

        if item.get("type") == "quality_check":
            for target in item.get("targets") or []:
                if isinstance(target, str):
                    target_id = target
                    description = ""
                    target_fields: list[str] = []
                else:
                    target_id = target.get("id")
                    target_fields = target.get("fields") or []
                    fields = ", ".join(target_fields)
                    description = target.get("description") or (f"Checks {fields}." if fields else "")
                add_edge(graph_edges, node_id, target_id, "checks", description, "targets")
                for field_name in target_fields:
                    field_id = field_name if "." in field_name else column_id_for(target_id, field_name)
                    add_edge(graph_edges, node_id, field_id, "checks", description, "targets.fields")
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
        if edge["type"] in {
            "lineage",
            "consumes",
            "produces",
            "feeds",
            "reads",
            "writes",
            "serves",
            "derived_from",
            "field_lineage",
            "READS_FROM",
            "WRITES_TO",
            "UPSTREAM_OF",
            "DOWNSTREAM_OF",
            "DERIVES_FROM",
        }:
            if edge["type"] in {"READS_FROM", "DERIVES_FROM"}:
                lineage["downstream"].setdefault(edge["target"], []).append(edge["source"])
                lineage["upstream"].setdefault(edge["source"], []).append(edge["target"])
            else:
                lineage["downstream"].setdefault(edge["source"], []).append(edge["target"])
                lineage["upstream"].setdefault(edge["target"], []).append(edge["source"])

    return graph, catalog, lineage


def compile_flows(raw_flows: list[dict[str, Any]], graph: dict[str, Any]) -> dict[str, Any]:
    graph_node_ids = {node["id"] for node in graph["nodes"]}
    graph_edges = {edge["id"]: edge for edge in graph["edges"]}
    compiled: list[dict[str, Any]] = []

    for flow in raw_flows:
        flow_edges: list[dict[str, Any]] = []
        flow_node_ids = set(flow.get("nodes") or [])
        flow_edge_id_map: dict[str, str] = {}

        for index, item in enumerate(flow.get("edges") or [], start=1):
            base_edge_id = item.get("base_edge") or item.get("edge") or item.get("id")
            base_edge = graph_edges.get(base_edge_id, {})
            source = item.get("source") or base_edge.get("source")
            target = item.get("target") or base_edge.get("target")
            if not source or not target:
                continue
            flow_node_ids.update([source, target])
            step = item.get("step") or index
            flow_edge_id = item.get("flow_edge_id") or f"{flow['id']}.edge.{slug(str(step))}"
            flow_edge_id_map[base_edge_id or flow_edge_id] = flow_edge_id
            flow_edges.append({
                "id": flow_edge_id,
                "base_edge": base_edge_id,
                "type": normalize_relation(item.get("relation") or base_edge.get("type") or "RELATED_TO"),
                "source": source,
                "target": target,
                "step": step,
                "label": item.get("label") or item.get("name") or normalize_relation(item.get("relation") or base_edge.get("type") or "RELATED_TO"),
                "description": item.get("description") or base_edge.get("properties", {}).get("description", ""),
                "lifecycle": item.get("lifecycle"),
                "dependency": item.get("dependency"),
                "sla": item.get("sla"),
                "condition": item.get("condition"),
                "constraints": item.get("constraints") or [],
                "raw": item,
                "base_raw": base_edge or None,
            })

        dependencies: list[dict[str, Any]] = []
        for item in flow.get("edge_dependencies") or []:
            dependencies.append({
                "from": flow_edge_id_map.get(item.get("from"), item.get("from")),
                "to": flow_edge_id_map.get(item.get("to"), item.get("to")),
                "type": normalize_relation(item.get("type") or item.get("relation") or "PRECEDES"),
                "description": item.get("description", ""),
                "condition": item.get("condition", ""),
            })

        compiled.append({
            "id": flow["id"],
            "type": "flow",
            "name": flow["name"],
            "description": flow.get("description", ""),
            "owner": flow.get("owner"),
            "tags": flow.get("tags") or [],
            "nodes": [node_id for node_id in flow_node_ids if node_id in graph_node_ids],
            "edges": flow_edges,
            "edge_dependencies": dependencies,
            "evidence": flow.get("evidence") or [],
            "verified": flow.get("verified"),
            "source_file": flow.get("_source_file"),
            "raw": flow,
        })

    return {"flows": compiled}


def build_curated_views(graph: dict[str, Any]) -> dict[str, Any]:
    business_entities = [node["id"] for node in graph["nodes"] if node["type"] == "business_entity"]
    assets = [node["id"] for node in graph["nodes"] if node["type"] in {"table", "view"}]
    terms = [node["id"] for node in graph["nodes"] if node["type"] == "term"]

    return {
        "views": [
            {
                "id": "semantic_overview",
                "name": "Semantic Overview",
                "description": "Business entities, glossary terms, and mapped physical assets.",
                "mode": "all",
                "focus": business_entities[0] if business_entities else None,
                "pinned_nodes": business_entities[:6] + terms[:6],
            },
            {
                "id": "physical_lineage",
                "name": "Physical Lineage",
                "description": "Direct table/view and column dependencies compiled from YAML lineage.",
                "mode": "lineage",
                "focus": assets[0] if assets else None,
                "pinned_nodes": assets[:8],
            },
        ]
    }


def main() -> None:
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    FRONTEND_DIR.mkdir(parents=True, exist_ok=True)
    raw_nodes = load_yaml_files()
    raw_flows = load_flow_files()
    graph, catalog, lineage = compile_graph(raw_nodes)
    flows = compile_flows(raw_flows, graph)
    curated_views = build_curated_views(graph)

    (INDEX_DIR / "graph.json").write_text(json.dumps(graph, indent=2, ensure_ascii=False), encoding="utf-8")
    (INDEX_DIR / "catalog.json").write_text(json.dumps(catalog, indent=2, ensure_ascii=False), encoding="utf-8")
    (INDEX_DIR / "lineage.json").write_text(json.dumps(lineage, indent=2, ensure_ascii=False), encoding="utf-8")
    (INDEX_DIR / "views.json").write_text(json.dumps(curated_views, indent=2, ensure_ascii=False), encoding="utf-8")
    (INDEX_DIR / "flows.json").write_text(json.dumps(flows, indent=2, ensure_ascii=False), encoding="utf-8")

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
    (FRONTEND_DIR / "flows-data.js").write_text(
        "window.FLOW_DATA = " + json.dumps(flows, indent=2, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Built {len(graph['nodes'])} nodes, {len(graph['edges'])} edges, and {len(flows['flows'])} flows")


if __name__ == "__main__":
    main()

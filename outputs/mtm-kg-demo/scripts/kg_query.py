from __future__ import annotations

import argparse
import json
from collections import deque
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
INDEX_DIR = ROOT / "knowledge" / "indexes"


def load_json(name: str) -> Any:
    path = INDEX_DIR / name
    if not path.exists():
        raise SystemExit(f"Missing {path}. Run scripts/build_graph.py first.")
    return json.loads(path.read_text(encoding="utf-8"))


def print_json(value: Any) -> None:
    print(json.dumps(value, indent=2, ensure_ascii=False))


def graph_data() -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    graph = load_json("graph.json")
    return graph.get("nodes", []), graph.get("edges", [])


def node_map() -> dict[str, dict[str, Any]]:
    nodes, _ = graph_data()
    return {node["id"]: node for node in nodes}


def edge_matches(edge: dict[str, Any], node_id: str, edge_type: str | None = None) -> bool:
    if edge_type and edge.get("type") != edge_type:
        return False
    return edge.get("source") == node_id or edge.get("target") == node_id


def search(args: argparse.Namespace) -> None:
    query = args.query.lower()
    search_index = load_json("search.json")
    nodes = node_map()
    results = []
    for item in search_index:
        if args.type and item.get("type") != args.type:
            continue
        if query not in item.get("text", "").lower():
            continue
        node = nodes.get(item["id"], {})
        results.append(
            {
                "id": item["id"],
                "type": item.get("type"),
                "label": node.get("label"),
                "description": node.get("properties", {}).get("description", ""),
            }
        )
    print_json(results[: args.limit])


def get_node(args: argparse.Namespace) -> None:
    catalog = load_json("catalog.json")
    nodes = node_map()
    if args.id in catalog:
        print_json(catalog[args.id])
        return
    if args.id in nodes:
        print_json(nodes[args.id])
        return
    raise SystemExit(f"Node not found: {args.id}")


def neighbors(args: argparse.Namespace) -> None:
    nodes, edges = graph_data()
    nodes_by_id = {node["id"]: node for node in nodes}
    result_edges = [edge for edge in edges if edge_matches(edge, args.id, args.edge_type)]
    neighbor_ids = sorted(
        {
            edge["target"] if edge["source"] == args.id else edge["source"]
            for edge in result_edges
        }
    )
    print_json(
        {
            "node": nodes_by_id.get(args.id),
            "neighbors": [nodes_by_id.get(node_id, {"id": node_id}) for node_id in neighbor_ids],
            "edges": result_edges,
        }
    )


def lineage(args: argparse.Namespace, direction: str) -> None:
    lineage_index = load_json("lineage.json")
    graph_nodes, graph_edges = graph_data()
    nodes_by_id = {node["id"]: node for node in graph_nodes}
    adjacency = lineage_index.get(direction, {})
    visited: set[str] = set()
    queue: deque[tuple[str, int]] = deque([(args.id, 0)])
    ids: list[str] = []
    while queue:
        current, depth = queue.popleft()
        if depth >= args.depth:
            continue
        for next_id in adjacency.get(current, []):
            if next_id in visited:
                continue
            visited.add(next_id)
            ids.append(next_id)
            queue.append((next_id, depth + 1))
    edge_set = set(ids)
    result_edges = [
        edge
        for edge in graph_edges
        if (
            direction == "upstream"
            and edge.get("target") in edge_set | {args.id}
            and edge.get("source") in edge_set | {args.id}
        )
        or (
            direction == "downstream"
            and edge.get("source") in edge_set | {args.id}
            and edge.get("target") in edge_set | {args.id}
        )
    ]
    print_json(
        {
            "node": args.id,
            direction: [nodes_by_id.get(node_id, {"id": node_id}) for node_id in ids],
            "edges": result_edges,
        }
    )


def quality(args: argparse.Namespace) -> None:
    nodes, edges = graph_data()
    nodes_by_id = {node["id"]: node for node in nodes}
    check_edges = [
        edge
        for edge in edges
        if edge.get("type") == "checks"
        and (edge.get("target") == args.id or edge.get("source") == args.id)
    ]
    check_ids = sorted({edge["source"] if edge["target"] == args.id else edge["target"] for edge in check_edges})
    print_json(
        {
            "node": args.id,
            "quality_checks": [nodes_by_id.get(check_id, {"id": check_id}) for check_id in check_ids],
            "edges": check_edges,
        }
    )


def fields_for_term(args: argparse.Namespace) -> None:
    nodes, edges = graph_data()
    nodes_by_id = {node["id"]: node for node in nodes}
    matches: dict[str, dict[str, Any]] = {}
    for edge in edges:
        if edge.get("target") != args.id and edge.get("source") != args.id:
            continue
        other_id = edge["source"] if edge["target"] == args.id else edge["target"]
        other = nodes_by_id.get(other_id)
        if other and ("field" in other.get("type", "") or other.get("type") == "column"):
            item = matches.setdefault(other_id, {"field": other, "edges": []})
            item["edges"].append(edge)
    print_json(list(matches.values()))


def assets_for(args: argparse.Namespace, target_type: str) -> None:
    nodes, edges = graph_data()
    nodes_by_id = {node["id"]: node for node in nodes}
    asset_types = {"table", "view", "feedfile", "api", "dashboard", "pipeline"}
    matches: dict[str, dict[str, Any]] = {}
    for edge in edges:
        if edge.get("target") != args.id and edge.get("source") != args.id:
            continue
        other_id = edge["source"] if edge["target"] == args.id else edge["target"]
        other = nodes_by_id.get(other_id)
        if other and other.get("type") in asset_types:
            item = matches.setdefault(other_id, {"asset": other, "edges": []})
            item["edges"].append(edge)
    print_json({"node_type": target_type, "node": args.id, "assets": list(matches.values())})


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Query generated data-governance KG indexes.")
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("search", help="Search nodes by keyword.")
    p.add_argument("query")
    p.add_argument("--type")
    p.add_argument("--limit", type=int, default=20)
    p.set_defaults(func=search)

    p = sub.add_parser("get", help="Get full node detail by id.")
    p.add_argument("id")
    p.set_defaults(func=get_node)

    p = sub.add_parser("neighbors", help="Get one-hop graph around a node.")
    p.add_argument("id")
    p.add_argument("--edge-type")
    p.set_defaults(func=neighbors)

    p = sub.add_parser("upstream", help="Get lineage upstream nodes.")
    p.add_argument("id")
    p.add_argument("--depth", type=int, default=1)
    p.set_defaults(func=lambda args: lineage(args, "upstream"))

    p = sub.add_parser("downstream", help="Get lineage downstream nodes.")
    p.add_argument("id")
    p.add_argument("--depth", type=int, default=1)
    p.set_defaults(func=lambda args: lineage(args, "downstream"))

    p = sub.add_parser("quality", help="Get quality checks for an asset or field.")
    p.add_argument("id")
    p.set_defaults(func=quality)

    p = sub.add_parser("fields-for-term", help="Find fields mapped to a term.")
    p.add_argument("id")
    p.set_defaults(func=fields_for_term)

    p = sub.add_parser("assets-for-scenario", help="Find assets linked to a scenario.")
    p.add_argument("id")
    p.set_defaults(func=lambda args: assets_for(args, "scenario"))

    p = sub.add_parser("assets-for-object", help="Find assets linked to an object.")
    p.add_argument("id")
    p.set_defaults(func=lambda args: assets_for(args, "object"))

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()

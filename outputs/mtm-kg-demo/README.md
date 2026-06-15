# MTM Data Governance KG Demo

This demo shows a lightweight data-governance knowledge graph for:

```text
MTM valuation -> margin calculation -> booking -> settlement
```

Run the builder:

```powershell
python -m pip install -r requirements.txt
python scripts/build_graph.py
```

Outputs:

```text
knowledge/indexes/graph.json
knowledge/indexes/catalog.json
knowledge/indexes/search.json
knowledge/indexes/lineage.json
frontend/graph-data.js
```

Open the frontend:

```text
frontend/index.html
```

Tables are stored one node per YAML file under `knowledge/nodes/tables/`. This is preferred because each table can be updated, reviewed, and diffed independently. Inline columns come from database schema metadata; important columns may also have standalone YAML files under `knowledge/nodes/columns/`.

# MTM Data Governance KG Demo

This demo shows a lightweight data-governance knowledge graph for:

```text
MTM valuation -> margin calculation -> booking -> settlement
```

## Run Order

1. Edit or generate YAML under `knowledge/nodes/**`.
2. Run the builder.
3. Open the static frontend.

Run from this folder:

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
knowledge/indexes/views.json
frontend/graph-data.js
frontend/catalog-data.js
frontend/views-data.js
```

The UI loads `frontend/graph-data.js`, `frontend/catalog-data.js`, and `frontend/views-data.js` directly. If YAML changes, rerun `python scripts/build_graph.py` and refresh the browser.

Open directly:

```text
frontend/index.html
```

Or serve it locally:

```powershell
python -m http.server 8765 -d frontend
```

Then open:

```text
http://127.0.0.1:8765/index.html
```

Tables are stored one node per YAML file under `knowledge/nodes/tables/`. This is preferred because each table can be updated, reviewed, and diffed independently. Inline columns come from database schema metadata; important columns may also have standalone YAML files under `knowledge/nodes/columns/`.

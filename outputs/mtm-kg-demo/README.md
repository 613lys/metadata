# Data Governance KG Demo

This demo shows a lightweight data-governance semantic graph generated from YAML source files for:

```text
customer order -> refund request -> refund decision -> payment refund
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

The UI loads `frontend/graph-data.js`, `frontend/catalog-data.js`, and `frontend/views-data.js` directly. `frontend/index.html` is a committed static shell; `scripts/build_graph.py` does not generate or overwrite it. If YAML changes, rerun `python scripts/build_graph.py` and refresh the browser. If `index.html`, `app.js`, or `style.css` changes, edit those files directly and bump the query-string asset version in `index.html` when browser cache may matter.

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

Top-level YAML node files live under:

```text
knowledge/nodes/business_entities/
knowledge/nodes/terms/
knowledge/nodes/tables/
knowledge/nodes/views/
```

`business_entity_property` and `column` nodes are generated from inline YAML fields. They are not separate YAML files in this demo.

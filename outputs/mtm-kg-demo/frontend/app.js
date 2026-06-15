const graph = window.GRAPH_DATA || { nodes: [], edges: [] };
const catalog = window.CATALOG_DATA || {};

const pageEl = document.getElementById("page");
const searchEl = document.getElementById("search");
const filtersEl = document.getElementById("typeFilters");
const assetListEl = document.getElementById("assetList");
const statsEl = document.getElementById("stats");
const profileBodyEl = document.getElementById("profileBody");
const titleEl = document.getElementById("detailTitle");
const badgeEl = document.getElementById("detailBadge");
const descEl = document.getElementById("detailDescription");

const nodeMap = new Map(graph.nodes.map(node => [node.id, node]));
const childTypes = new Set(["column", "api_field", "feedfile_field", "dashboard_field", "quality_check"]);
const datasetTypes = new Set(["table", "view"]);
const dataAssetTypes = new Set(["feedfile", "pipeline", "table", "view", "column", "api", "dashboard"]);
const semanticTypes = new Set(["scenario", "term", "object"]);
const lineageTypes = new Set(["lineage", "feeds", "reads", "writes", "field_lineage", "produces", "consumes", "serves", "derived_from"]);

let page = "catalog";
let selected = "scenario.margin_booking_settlement";
let selectedEdge = null;
let selectedLogic = null;
let expanded = new Set();
let activeTypes = new Set(graph.nodes.filter(node => !childTypes.has(node.type)).map(node => node.type));
let browseTypes = new Set(graph.nodes.map(node => node.type));
let currentBusinessEdges = [];

const color = {
  scenario: "#2563eb",
  term: "#0891b2",
  object: "#9333ea",
  business_logic: "#334155",
  feedfile: "#475569",
  pipeline: "#7c3aed",
  table: "#159947",
  view: "#22a35a",
  column: "#65a30d",
  api: "#f97316",
  dashboard: "#dc2626",
  quality_check: "#b7791f",
  api_field: "#fb923c",
  feedfile_field: "#64748b",
  dashboard_field: "#dc2626",
};

const typeLabel = {
  scenario: "Scenario",
  term: "Term",
  object: "Object",
  business_logic: "Scenario Logic",
  feedfile: "Feed File",
  pipeline: "Pipeline",
  table: "Table",
  view: "View",
  column: "Column",
  api: "API",
  dashboard: "Dashboard",
  quality_check: "Quality",
  api_field: "API Field",
  feedfile_field: "Feed Field",
  dashboard_field: "Dashboard Field",
};

const lanes = [
  { title: "Source", types: ["feedfile"] },
  { title: "Pipeline", types: ["pipeline"] },
  { title: "Dataset", types: ["table", "view", "column"] },
  { title: "Serving", types: ["api"] },
  { title: "Consumer", types: ["dashboard"] },
];

const catalogStages = [
  { key: "feedfile", title: "Feed File", subtitle: "External files" },
  { key: "pipeline", title: "Pipeline", subtitle: "Jobs and loads" },
  { key: "table", title: "Table", subtitle: "Stored datasets" },
  { key: "view", title: "View", subtitle: "Modeled queries" },
  { key: "api", title: "API", subtitle: "Query services" },
  { key: "dashboard", title: "Dashboard", subtitle: "Consumption" },
];

function nodeById(id) {
  return nodeMap.get(id);
}

function raw(id) {
  return catalog[id] || {};
}

function parentOf(id) {
  const node = nodeById(id);
  if (node?.properties?.parent) return node.properties.parent;
  const data = raw(id);
  if (data.parent) return data.parent;
  if (id?.startsWith("column.")) {
    const parts = id.split(".");
    if (parts.length >= 4) return `table.${parts[1]}.${parts[2]}`;
  }
  if (id?.includes(".request_fields.") || id?.includes(".response_fields.") || id?.includes(".returns.")) {
    return id.split(".").slice(0, -1).join(".");
  }
  return id;
}

function labelOf(id) {
  const node = nodeById(id);
  return node?.label || raw(id).name || id;
}

function typeOf(id) {
  return nodeById(id)?.type || raw(id).type || "node";
}

function descOf(id) {
  const node = nodeById(id);
  return node?.properties?.description || raw(id).description || "";
}

function isVisibleByQuery(node) {
  const q = searchEl.value.trim().toLowerCase();
  if (!q) return true;
  return `${node.id} ${node.label} ${node.type} ${node.properties?.description || ""}`.toLowerCase().includes(q);
}

function visibleCatalogNodes() {
  return graph.nodes
    .filter(node => !childTypes.has(node.type))
    .filter(node => activeTypes.has(node.type))
    .filter(isVisibleByQuery)
    .sort((a, b) => `${a.type}:${a.label}`.localeCompare(`${b.type}:${b.label}`));
}

function setPage(next, nextSelected = selected) {
  page = next;
  selected = nextSelected;
  selectedEdge = null;
  selectedLogic = null;
  render();
}

function selectNode(id, nextPage = page) {
  selected = id;
  selectedEdge = null;
  selectedLogic = null;
  page = nextPage;
  render();
}

function selectEdge(edge) {
  selectedEdge = edge;
  selectedLogic = null;
  selected = edge.target;
  render();
}

function render() {
  statsEl.textContent = `${graph.nodes.filter(node => !childTypes.has(node.type)).length} catalog nodes · ${graph.edges.length} relationships`;
  renderNav();
  renderFilters();
  renderSidebarResults();
  renderPage();
  renderProfile();
  wireClicks(pageEl);
  wireClicks(profileBodyEl);
}

function renderNav() {
  document.querySelectorAll(".primary-nav button").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
    button.onclick = () => {
      page = button.dataset.page;
      render();
    };
  });
}

function renderFilters() {
  filtersEl.innerHTML = "";
  [...new Set(graph.nodes.filter(node => !childTypes.has(node.type)).map(node => node.type))].sort().forEach(type => {
    const button = document.createElement("button");
    button.textContent = typeLabel[type] || type;
    button.className = activeTypes.has(type) ? "active" : "";
    button.onclick = () => {
      activeTypes.has(type) ? activeTypes.delete(type) : activeTypes.add(type);
      render();
    };
    filtersEl.appendChild(button);
  });
}

function renderSidebarResults() {
  const items = visibleCatalogNodes();
  assetListEl.innerHTML = items.map(node => `
    <div class="asset-item ${node.id === selected ? "selected" : ""}" data-id="${escapeAttr(node.id)}">
      <div class="asset-icon" style="background:${color[node.type] || "#64748b"}">${escapeHtml((typeLabel[node.type] || node.type).slice(0, 1))}</div>
      <div>
        <div class="asset-name">${escapeHtml(node.label)}</div>
        <div class="asset-meta">${escapeHtml(typeLabel[node.type] || node.type)} · ${escapeHtml(node.id)}</div>
      </div>
    </div>
  `).join("");
  wireClicks(assetListEl);
}

function renderPage() {
  if (page === "browse") return renderBrowsePage();
  if (page === "scenario") return renderScenarioPage();
  if (page === "fields") return renderFieldsPage();
  if (page === "asset") return renderAssetPage();
  if (page === "lineage") return renderLineagePage();
  if (page === "ontology") return renderOntologyPage();
  if (page === "quality") return renderQualityPage();
  return renderCatalogPage();
}

function renderBrowsePage() {
  const nodes = visibleBrowseNodes();
  const typeCounts = countByType(graph.nodes);
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  pageEl.innerHTML = `
    ${pageHeader("Browse", "Search and filter every node in the governance graph, including assets, fields, terms, objects, scenarios, quality checks, and generated dashboard fields.", [
      ["Open Catalog", "catalog", selected],
    ])}
    <div class="metrics-grid">
      ${metric("All Nodes", graph.nodes.length)}
      ${metric("Visible", nodes.length)}
      ${metric("Types", Object.keys(typeCounts).length)}
      ${metric("Relationships", graph.edges.length)}
    </div>
    <section class="section">
      <h3>Search</h3>
      <div class="browse-controls">
        <input id="browseSearch" type="search" value="${escapeAttr(searchEl.value)}" placeholder="Search by name, id, type, description..." />
        <button id="browseClear">Clear</button>
      </div>
      <div class="browse-type-grid">
        ${Object.entries(typeCounts).sort((a, b) => a[0].localeCompare(b[0])).map(([type, count]) => `
          <button class="${browseTypes.has(type) ? "active" : ""}" data-browse-type="${escapeAttr(type)}">
            ${escapeHtml(typeLabel[type] || type)} <span>${count}</span>
          </button>
        `).join("")}
      </div>
    </section>
    <section class="section">
      <h3>Node Results</h3>
      <div class="browse-summary">
        ${topTypes.map(([type, count]) => `<span>${escapeHtml(typeLabel[type] || type)} ${count}</span>`).join("")}
      </div>
      <div class="browse-results">
        ${nodes.map(renderBrowseNode).join("") || empty("No nodes match the current search and type filters.")}
      </div>
    </section>
  `;
  wireBrowseControls();
}

function visibleBrowseNodes() {
  return graph.nodes
    .filter(node => browseTypes.has(node.type))
    .filter(isVisibleByQuery)
    .sort((a, b) => `${a.type}:${a.label}:${a.id}`.localeCompare(`${b.type}:${b.label}:${b.id}`));
}

function renderBrowseNode(node) {
  const relations = relatedFor(node.id).slice(0, 3);
  return `
    <div class="browse-node ${node.id === selected ? "selected" : ""}" data-id="${escapeAttr(node.id)}">
      <div class="browse-node-main">
        <div class="node-top">
          <span class="node-dot" style="background:${color[node.type] || "#64748b"}"></span>
          <strong>${escapeHtml(node.label)}</strong>
          ${badge(node.type)}
        </div>
        <p>${escapeHtml(node.properties?.description || raw(node.id).description || "No description.")}</p>
        <small>${escapeHtml(node.id)}</small>
      </div>
      <div class="browse-node-side">
        ${parentOf(node.id) !== node.id ? `<span>Parent: ${escapeHtml(labelOf(parentOf(node.id)))}</span>` : ""}
        <span>${relations.length} related shown</span>
        ${relations.map(rel => `<em>${escapeHtml(rel.type)} ${escapeHtml(rel.otherLabel)}</em>`).join("")}
      </div>
    </div>
  `;
}

function wireBrowseControls() {
  const input = document.getElementById("browseSearch");
  if (input) {
    input.oninput = event => {
      searchEl.value = event.target.value;
      render();
    };
  }
  const clear = document.getElementById("browseClear");
  if (clear) {
    clear.onclick = () => {
      searchEl.value = "";
      browseTypes = new Set(graph.nodes.map(node => node.type));
      render();
    };
  }
  pageEl.querySelectorAll("[data-browse-type]").forEach(button => {
    button.onclick = event => {
      const type = button.dataset.browseType;
      browseTypes.has(type) ? browseTypes.delete(type) : browseTypes.add(type);
      render();
      event.stopPropagation();
    };
  });
}

function renderCatalogPage() {
  const mainScenario = nodeById("scenario.margin_booking_settlement") || graph.nodes.find(node => node.type === "scenario");
  const counts = countByType(graph.nodes.filter(node => !childTypes.has(node.type)));
  const assets = graph.nodes.filter(node => dataAssetTypes.has(node.type) && !childTypes.has(node.type));
  const directFlowEdges = graph.edges.filter(edge => lineageTypes.has(edge.type) && dataAssetTypes.has(typeOf(parentOf(edge.source))) && dataAssetTypes.has(typeOf(parentOf(edge.target))));

  pageEl.innerHTML = `
    ${pageHeader("Catalog", "Scenario-level data flow across feed files, pipelines, datasets, APIs, and dashboards.", [
      ["Open Main Scenario", "scenario", mainScenario?.id],
      ["Open Profile", "asset", mainScenario?.id],
    ])}
    <div class="metrics-grid">
      ${metric("Scenarios", counts.scenario || 0)}
      ${metric("Data Assets", assets.length)}
      ${metric("Direct Flow Edges", directFlowEdges.length)}
      ${metric("Quality Checks", countQualityChecks())}
    </div>
    <section class="section">
      <h3>Clustered Overview</h3>
      <div class="cluster-graph-shell">
        <svg id="overviewEdgeLayer" aria-hidden="true"></svg>
        <div id="overviewGraphBoard" class="cluster-graph-board" role="img" aria-label="Catalog clustered knowledge graph"></div>
      </div>
    </section>
  `;
  renderCatalogGraph(mainScenario?.id);
}

function renderScenarioPage() {
  const focus = nodeById(selected) || nodeById("scenario.margin_booking_settlement") || graph.nodes.find(node => node.type === "scenario");
  const mainScenario = raw(focus?.id)?.child_scenarios?.length
    ? focus
    : nodeById(raw(focus?.id)?.parent_scenario) || nodeById("scenario.margin_booking_settlement") || focus;
  selected = focus?.id || selected;
  const model = businessContextModel(mainScenario?.id || selected);

  pageEl.innerHTML = `
    ${pageHeader("Business Context", "Scenario-level business logic, objects, terms, implementation mappings, and quality safeguards.", [
      ["Open Asset Profile", "asset", selected],
    ])}
    <div class="metrics-grid">
      ${metric("Sub-scenarios", model.scenarioPanels.length)}
      ${metric("Business Logic", model.logicCount)}
      ${metric("Objects", model.objectCount)}
      ${metric("Quality Checks", model.qualityCount)}
    </div>
    <section class="section">
      <h3>Semantic Map</h3>
      <div class="cluster-graph-shell business-context-shell">
        <svg id="semanticEdgeLayer" aria-hidden="true"></svg>
        <div id="semanticGraphBoard" class="cluster-graph-board" role="img" aria-label="Business context semantic map"></div>
      </div>
    </section>
  `;
  renderBusinessContextMap(model);
}

function renderAssetPage() {
  const node = nodeById(selected) || graph.nodes[0];
  selected = node.id;
  const data = raw(selected);
  const relations = directRelationsFor(selected);
  const grouped = groupRelationsByType(relations);

  pageEl.innerHTML = `
    ${pageHeader("Asset Profile", "One-hop relationship graph for the selected node.", [
      ["Browse All Nodes", "browse", selected],
      ["Show Semantics", "scenario", selected],
    ])}
    <div class="grid-2">
      <div class="profile-card">
        <h3>Overview</h3>
        ${overviewKv(node, data)}
      </div>
      <div class="profile-card">
        <h3>Direct Connections</h3>
        ${kv("Connected Nodes", relations.length)}
        ${kv("Relationship Types", Object.keys(grouped).length)}
        ${kv("Incoming", relations.filter(rel => rel.direction === "in").length)}
        ${kv("Outgoing", relations.filter(rel => rel.direction === "out").length)}
      </div>
    </div>
    <section class="section">
      <h3>One-Hop Relationship Graph</h3>
      <div class="one-hop-shell">
        <svg id="oneHopEdgeLayer" aria-hidden="true"></svg>
        <div id="oneHopBoard" class="one-hop-board" role="img" aria-label="One-hop relationship graph"></div>
      </div>
    </section>
    <section class="section">
      <h3>Selected Edge</h3>
      ${selectedEdge ? edgeInfo(selectedEdge) : empty("Click a relationship edge label to inspect source, target, and description.")}
    </section>
  `;
  renderOneHopGraph(node, relations);
}

function renderLineagePage() {
  const focus = nodeById(selected) || nodeById("scenario.margin_booking_settlement");
  const nodes = lineageViewNodes(focus.id);
  const edges = visibleGraphEdges(nodes, edge => lineageTypes.has(edge.type));
  const actions = datasetTypes.has(focus.type)
    ? [["Expand Selected Dataset", "toggle-expand", selected], ["Open Asset Profile", "asset", selected]]
    : [["Open Scenario", "scenario", selected], ["Open Asset Profile", "asset", nodes[0]?.id || selected]];

  pageEl.innerHTML = `
    ${pageHeader("Lineage Explorer", "Asset-level lineage is shown first. Columns stay hidden until a dataset is expanded, like OpenMetadata-style exploration.", actions)}
    <section class="graph-shell">
      <svg id="edgeLayer" aria-hidden="true"></svg>
      <div id="graphBoard" class="graph-board" role="img" aria-label="Lineage graph"></div>
    </section>
    <section class="section" style="margin-top:16px">
      <h3>Edge Details</h3>
      ${selectedEdge ? edgeInfo(selectedEdge) : empty("Click a lineage edge label to inspect source, target, and description.")}
    </section>
  `;
  renderGraph(nodes, edges);
}

function renderOntologyPage() {
  return renderScenarioPage();
}

function renderQualityPage() {
  const rows = Object.values(catalog).flatMap(item => {
    const checks = item.quality_checks || [];
    return checks.map(check => ({ item, check }));
  });

  pageEl.innerHTML = `
    ${pageHeader("Quality", "Quality checks live on the node they protect: feed freshness, pipeline success, field validity, or cross-field rules.", [
      ["Open Catalog", "catalog", selected],
    ])}
    <section class="section">
      <h3>Checks</h3>
      ${rows.map(({ item, check }) => `
        <div class="quality-row" data-id="${escapeAttr(item.id)}">
          <strong>${escapeHtml(check.name || check.check_type || "Quality check")}</strong>
          <small>${escapeHtml(typeLabel[item.type] || item.type)} · ${escapeHtml(item.name || item.id)}<br>${escapeHtml(check.expectation || check.check_type || "")}</small>
        </div>
      `).join("") || empty("No quality checks.")}
    </section>
  `;
}

function renderFieldsPage() {
  const model = fieldAssetModel();
  const mappedFields = model.fields.filter(field => fieldSemanticLinks(field.id).length);
  const qualityFields = model.fields.filter(field => fieldQualityLinks(field.id).length);
  const qualityAssets = model.assets.filter(asset => assetQualityLinks(asset.id).length);

  pageEl.innerHTML = `
    ${pageHeader("Field Map", "Field-level meaning and lineage across all assets. Each asset contains its fields like an ER diagram.", [
      ["Open Catalog", "catalog", selected],
    ])}
    <div class="metrics-grid">
      ${metric("Assets With Fields", model.assets.length)}
      ${metric("Fields", model.fields.length)}
      ${metric("Field Lineage Edges", model.edges.length)}
      ${metric("Quality Coverage", `${qualityAssets.length} assets / ${qualityFields.length} fields`)}
    </div>
    <section class="section">
      <h3>Field-Level ER / Lineage Map</h3>
      <div class="field-er-shell">
        <svg id="fieldEdgeLayer" aria-hidden="true"></svg>
        <div id="fieldErBoard" class="field-er-board" role="img" aria-label="Field-level ER and lineage map"></div>
      </div>
    </section>
  `;
  renderFieldErMap(model);
}

function fieldAssetModel() {
  const fieldTypes = new Set(["column", "api_field", "feedfile_field", "dashboard_field"]);
  const assetOrder = ["feedfile", "table", "view", "api", "dashboard"];
  const fields = graph.nodes
    .filter(node => fieldTypes.has(node.type))
    .sort((a, b) => `${assetOrder.indexOf(typeOf(parentOf(a.id)))}:${labelOf(parentOf(a.id))}:${a.label}`.localeCompare(`${assetOrder.indexOf(typeOf(parentOf(b.id)))}:${labelOf(parentOf(b.id))}:${b.label}`));
  const fieldIds = new Set(fields.map(field => field.id));
  const assetIds = new Set(fields.map(field => parentOf(field.id)));
  const assets = [...assetIds]
    .map(nodeById)
    .filter(Boolean)
    .sort((a, b) => {
      const laneA = assetOrder.indexOf(a.type);
      const laneB = assetOrder.indexOf(b.type);
      return `${laneA < 0 ? 99 : laneA}:${a.label}`.localeCompare(`${laneB < 0 ? 99 : laneB}:${b.label}`);
    });
  const edges = graph.edges
    .filter(edge => fieldIds.has(edge.source) && fieldIds.has(edge.target))
    .filter(edge => ["field_lineage", "lineage", "derived_from", "maps_to_property"].includes(edge.type))
    .map(edge => ({
      id: edge.id || `${edge.source}|${edge.type}|${edge.target}`,
      source: edge.source,
      target: edge.target,
      sourceOriginal: edge.source,
      targetOriginal: edge.target,
      type: edge.type,
      descriptions: edge.properties?.description ? [edge.properties.description] : [],
    }));
  return { assets, fields, edges, assetOrder };
}

function dedupeFieldLinks(rows) {
  const seen = new Set();
  return rows.filter(row => {
    const key = `${row.id}|${row.relation}|${row.direction || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function fieldSemanticLinks(fieldId) {
  const rows = [];
  graph.edges.forEach(edge => {
    const touchesSource = edge.source === fieldId;
    const touchesTarget = edge.target === fieldId;
    if (!touchesSource && !touchesTarget) return;
    const otherId = touchesSource ? edge.target : edge.source;
    const other = nodeById(otherId);
    if (!other || !["term", "object", "scenario"].includes(other.type)) return;
    rows.push({ id: other.id, label: other.label, type: other.type, relation: edge.type, description: edge.properties?.description || "" });
  });
  return dedupeFieldLinks(rows);
}

function fieldLineageLinks(fieldId) {
  const rows = [];
  graph.edges.forEach(edge => {
    const touchesSource = edge.source === fieldId;
    const touchesTarget = edge.target === fieldId;
    if (!touchesSource && !touchesTarget) return;
    const otherId = touchesSource ? edge.target : edge.source;
    if (!["column", "api_field", "feedfile_field", "dashboard_field"].includes(typeOf(otherId))) return;
    if (!["field_lineage", "lineage", "derived_from", "maps_to_property"].includes(edge.type)) return;
    rows.push({ id: otherId, label: labelOf(otherId), type: typeOf(otherId), relation: edge.type, direction: touchesSource ? "to" : "from", description: edge.properties?.description || "" });
  });
  return dedupeFieldLinks(rows);
}

function fieldQualityLinks(fieldId) {
  const rows = [];
  graph.edges.forEach(edge => {
    const touchesSource = edge.source === fieldId;
    const touchesTarget = edge.target === fieldId;
    if (!touchesSource && !touchesTarget) return;
    const otherId = touchesSource ? edge.target : edge.source;
    if (typeOf(otherId) !== "quality_check" && edge.type !== "checks") return;
    rows.push({ id: otherId, label: labelOf(otherId), type: typeOf(otherId), relation: edge.type, description: edge.properties?.description || "" });
  });
  return dedupeFieldLinks(rows);
}

function assetQualityLinks(assetId) {
  const rows = [];
  graph.edges.forEach(edge => {
    if (edge.type !== "checks") return;
    const targetAsset = parentOf(edge.target);
    if (edge.target !== assetId && targetAsset !== assetId) return;
    const check = nodeById(edge.source);
    if (!check || check.type !== "quality_check") return;
    rows.push({
      id: check.id,
      label: check.label,
      type: check.type,
      relation: edge.type,
      description: edge.properties?.description || check.properties?.description || "",
    });
  });
  return dedupeFieldLinks(rows);
}

function qualityTargetIds(qualityId) {
  const ids = new Set();
  graph.edges.forEach(edge => {
    if (edge.type !== "checks" || edge.source !== qualityId) return;
    ids.add(edge.target);
    ids.add(parentOf(edge.target));
  });
  return ids;
}

function renderFieldErMap(model) {
  const board = document.getElementById("fieldErBoard");
  const edgeLayer = document.getElementById("fieldEdgeLayer");
  if (!board || !edgeLayer) return;
  const layout = fieldErLayout(model);
  board.innerHTML = "";
  edgeLayer.innerHTML = "";
  board.style.width = `${layout.width}px`;
  board.style.height = `${layout.height}px`;
  edgeLayer.style.width = `${layout.width}px`;
  edgeLayer.style.height = `${layout.height}px`;
  edgeLayer.setAttribute("width", layout.width);
  edgeLayer.setAttribute("height", layout.height);

  model.assetOrder.forEach((type, index) => {
    const title = document.createElement("div");
    title.className = "field-lane-title";
    title.style.left = `${layout.left + index * layout.columnGap}px`;
    title.textContent = typeLabel[type] || type;
    board.appendChild(title);
  });

  model.assets.forEach(asset => {
    const assetLayout = layout.assets[asset.id];
    if (!assetLayout) return;
    const box = document.createElement("div");
    box.className = "field-asset-box";
    box.style.left = `${assetLayout.x}px`;
    box.style.top = `${assetLayout.y}px`;
    box.style.width = `${layout.assetWidth}px`;
    box.style.height = `${assetLayout.h}px`;
    box.dataset.id = asset.id;
    const fields = layout.fieldsByAsset[asset.id] || [];
    const quality = assetQualityLinks(asset.id);
    box.innerHTML = `
      <div class="field-asset-header">
        <div>
          <strong>${escapeHtml(asset.label)}</strong>
          <span>${escapeHtml(asset.id)}</span>
        </div>
        ${badge(asset.type)}
      </div>
      <div class="field-list">
        ${fields.map(field => renderFieldErRow(field)).join("")}
      </div>
      ${quality.length ? `
        <div class="asset-quality-strip">
          ${quality.map(check => `
            <button class="quality-chip" data-id="${escapeAttr(check.id)}" title="${escapeAttr(check.description || check.id)}">
              ${escapeHtml(check.label)}
            </button>
          `).join("")}
        </div>
      ` : ""}
    `;
    board.appendChild(box);
  });

  model.edges.forEach(edge => {
    const a = layout.fieldPositions[edge.source];
    const b = layout.fieldPositions[edge.target];
    if (!a || !b) return;
    drawFieldEdge(edgeLayer, edge, a, b);
  });

  updateSelectedClasses();
}

function renderFieldErRow(field) {
  const semantic = fieldSemanticLinks(field.id);
  const quality = fieldQualityLinks(field.id);
  return `
    <div class="field-er-row" data-id="${escapeAttr(field.id)}" data-field-id="${escapeAttr(field.id)}">
      <div>
        <strong>${escapeHtml(field.label)}</strong>
        <span>${escapeHtml(field.properties?.description || "No field description.")}</span>
      </div>
      <small>${escapeHtml(field.properties?.data_type || "")}</small>
      ${semantic.length ? `<em>${escapeHtml(semantic.map(item => item.label).slice(0, 2).join(", "))}</em>` : ""}
      ${quality.length ? `<b title="${escapeAttr(quality.map(item => item.label).join(", "))}">${quality.length}</b>` : ""}
    </div>
  `;
}

function fieldErLayout(model) {
  const left = 28;
  const top = 54;
  const columnGap = 286;
  const assetWidth = 252;
  const headerHeight = 68;
  const rowHeight = 54;
  const qualityHeaderHeight = 14;
  const qualityChipHeight = 27;
  const assetGap = 42;
  const fieldPositions = {};
  const fieldsByAsset = {};
  const assets = {};
  const yByLane = new Map(model.assetOrder.map((type, index) => [type, top]));
  model.assets.forEach(asset => {
    const fields = model.fields.filter(field => parentOf(field.id) === asset.id);
    const qualityCount = assetQualityLinks(asset.id).length;
    fieldsByAsset[asset.id] = fields;
    const laneIndex = Math.max(0, model.assetOrder.indexOf(asset.type));
    const x = left + laneIndex * columnGap;
    const y = yByLane.get(asset.type) || top;
    const qualityHeight = qualityCount ? qualityHeaderHeight + qualityCount * qualityChipHeight : 0;
    const h = headerHeight + fields.length * rowHeight + 12 + qualityHeight;
    assets[asset.id] = { x, y, h };
    fields.forEach((field, index) => {
      fieldPositions[field.id] = {
        x,
        y: y + headerHeight + index * rowHeight + rowHeight / 2,
        right: x + assetWidth,
        left: x,
      };
    });
    yByLane.set(asset.type, y + h + assetGap);
  });
  const height = Math.max(620, Math.max(...[...yByLane.values()]) + 30);
  const width = left + model.assetOrder.length * columnGap + assetWidth + 40;
  return { left, top, columnGap, assetWidth, assets, fieldsByAsset, fieldPositions, width, height };
}

function drawFieldEdge(edgeLayer, edge, a, b) {
  const leftToRight = a.right <= b.left;
  const ax = leftToRight ? a.right : a.left;
  const bx = leftToRight ? b.left : b.right;
  const ay = a.y;
  const by = b.y;
  const mid = Math.max(44, Math.abs(bx - ax) / 2);
  const d = `M ${ax} ${ay} C ${leftToRight ? ax + mid : ax - mid} ${ay}, ${leftToRight ? bx - mid : bx + mid} ${by}, ${bx} ${by}`;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const active = selectedEdge?.id === edge.id || edge.source === selected || edge.target === selected;
  path.setAttribute("class", `field-edge-path ${active ? "selected" : ""}`);
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.dataset.edgeId = edge.id;
  path.addEventListener("click", () => selectEdge(edge));
  edgeLayer.appendChild(path);
}

function pageHeader(title, description, actions = []) {
  return `
    <div class="page-header">
      <div>
        <div class="eyebrow">${escapeHtml(page)}</div>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(description)}</p>
      </div>
      <div class="page-actions">
        ${actions.map(([label, action, id], index) => `<button class="${index === 0 ? "primary" : ""}" data-action="${escapeAttr(action)}" data-id="${escapeAttr(id || selected)}">${escapeHtml(label)}</button>`).join("")}
      </div>
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
}

function tile(node) {
  if (!node) return "";
  return `
    <div class="tile ${node.id === selected ? "selected" : ""}" data-id="${escapeAttr(node.id)}">
      <div class="tile-top">
        <div class="tile-title">${escapeHtml(node.label)}</div>
        ${badge(node.type)}
      </div>
      <div class="tile-desc">${escapeHtml(node.properties?.description || raw(node.id).description || node.id)}</div>
    </div>
  `;
}

function connectedTile(node) {
  if (!node) return "";
  return `
    <div class="tile connected-tile" data-id="${escapeAttr(node.id)}">
      <div class="tile-top">
        <div class="tile-title">${escapeHtml(node.label)}</div>
        ${badge(node.type)}
      </div>
      <div class="tile-desc">${escapeHtml(node.properties?.description || raw(node.id).description || node.id)}</div>
    </div>
  `;
}

function flowCard(id) {
  const node = nodeById(id);
  if (!node) return "";
  return `
    <div class="flow-card ${node.id === selected ? "selected" : ""}" data-id="${escapeAttr(node.id)}">
      ${badge(node.type)}
      <h4>${escapeHtml(node.label)}</h4>
      <p>${escapeHtml(node.properties?.description || raw(node.id).description || "")}</p>
    </div>
  `;
}

function relationRow(rel) {
  const otherType = typeOf(rel.otherId);
  return `
    <div class="relation-row" data-id="${escapeAttr(rel.otherId)}" data-edge-source="${escapeAttr(rel.source || "")}" data-edge-target="${escapeAttr(rel.target || "")}" data-edge-type="${escapeAttr(rel.type || "")}">
      <div class="relation-top">
        ${badge(otherType)}
        <span>${escapeHtml(rel.type)}</span>
      </div>
      <strong>${escapeHtml(rel.otherLabel || labelOf(rel.otherId))}</strong>
      <small>${rel.description ? escapeHtml(rel.description) : escapeHtml(rel.otherId)}</small>
    </div>
  `;
}

function directRelationsFor(id) {
  return graph.edges
    .filter(edge => edge.source === id || edge.target === id)
    .map(edge => {
      const direction = edge.source === id ? "out" : "in";
      const otherId = direction === "out" ? edge.target : edge.source;
      return {
        id: edge.id,
        edge,
        type: edge.type,
        direction,
        source: edge.source,
        target: edge.target,
        otherId,
        otherLabel: labelOf(otherId),
        otherType: typeOf(otherId),
        description: edge.properties?.description || "",
      };
    })
    .sort((a, b) => `${a.type}:${a.direction}:${a.otherLabel}`.localeCompare(`${b.type}:${b.direction}:${b.otherLabel}`));
}

function groupRelationsByType(relations) {
  return relations.reduce((acc, rel) => {
    acc[rel.type] ||= [];
    acc[rel.type].push(rel);
    return acc;
  }, {});
}

function directRelationCard(rel) {
  return `
    <div class="direct-relation-card" data-id="${escapeAttr(rel.otherId)}">
      <div class="relation-top">
        ${badge(rel.otherType)}
        <span>${escapeHtml(rel.direction === "out" ? "outgoing" : "incoming")}</span>
      </div>
      <strong>${escapeHtml(rel.otherLabel)}</strong>
      <small>${escapeHtml(rel.otherId)}</small>
      <div class="edge-pill">${escapeHtml(rel.direction === "out" ? `${labelOf(rel.source)} -> ${rel.type} -> ${labelOf(rel.target)}` : `${labelOf(rel.source)} -> ${rel.type} -> ${labelOf(rel.target)}`)}</div>
      ${rel.description ? `<p>${escapeHtml(rel.description)}</p>` : ""}
    </div>
  `;
}

function directRelationMini(rel) {
  return `
    <div class="relation-row" data-id="${escapeAttr(rel.otherId)}">
      <div class="relation-top">
        ${badge(rel.otherType)}
        <span>${escapeHtml(rel.direction)}</span>
      </div>
      <strong>${escapeHtml(rel.otherLabel)}</strong>
      <small>${escapeHtml(rel.description || rel.otherId)}</small>
    </div>
  `;
}

function renderOneHopGraph(centerNode, relations) {
  const board = document.getElementById("oneHopBoard");
  const edgeLayer = document.getElementById("oneHopEdgeLayer");
  if (!board || !edgeLayer) return;

  const width = 1040;
  const height = 620;
  const center = { x: width / 2 - 92, y: height / 2 - 38 };
  const positions = { [centerNode.id]: center };
  const neighborIds = [...new Set(relations.map(rel => rel.otherId))];
  const radiusX = 360;
  const radiusY = 220;

  neighborIds.forEach((id, index) => {
    const angle = (-Math.PI / 2) + (index / Math.max(1, neighborIds.length)) * Math.PI * 2;
    positions[id] = {
      x: width / 2 + Math.cos(angle) * radiusX - 92,
      y: height / 2 + Math.sin(angle) * radiusY - 38,
    };
  });

  board.innerHTML = "";
  edgeLayer.innerHTML = "";
  board.style.width = `${width}px`;
  board.style.height = `${height}px`;
  edgeLayer.style.width = `${width}px`;
  edgeLayer.style.height = `${height}px`;
  edgeLayer.setAttribute("width", width);
  edgeLayer.setAttribute("height", height);

  relations.forEach(rel => {
    const a = positions[rel.source];
    const b = positions[rel.target];
    if (!a || !b) return;
    drawOneHopEdge(edgeLayer, rel, a, b);
  });

  [centerNode.id, ...neighborIds].forEach(id => {
    const node = nodeById(id);
    const pos = positions[id];
    if (!node || !pos) return;
    const card = document.createElement("div");
    card.className = `one-hop-node ${id === centerNode.id ? "center" : ""} ${id === selected ? "selected" : ""}`;
    card.style.left = `${pos.x}px`;
    card.style.top = `${pos.y}px`;
    card.dataset.id = id;
    card.innerHTML = `
      <div class="node-top">
        <span class="node-dot" style="background:${color[node.type] || "#64748b"}"></span>
        <div class="node-label">${escapeHtml(node.label)}</div>
      </div>
      <div class="node-desc">${escapeHtml(typeLabel[node.type] || node.type)}</div>
    `;
    board.appendChild(card);
  });
}

function drawOneHopEdge(edgeLayer, rel, a, b) {
  const ax = a.x + 92;
  const ay = a.y + 38;
  const bx = b.x + 92;
  const by = b.y + 38;
  const midX = (ax + bx) / 2;
  const midY = (ay + by) / 2;
  const edge = {
    id: rel.id,
    source: rel.source,
    target: rel.target,
    sourceOriginal: rel.source,
    targetOriginal: rel.target,
    type: rel.type,
    descriptions: rel.description ? [rel.description] : [],
  };

  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("class", `one-hop-edge ${selectedEdge?.id === rel.id ? "selected" : ""}`);
  line.setAttribute("x1", ax);
  line.setAttribute("y1", ay);
  line.setAttribute("x2", bx);
  line.setAttribute("y2", by);
  line.dataset.edgeId = rel.id;
  line.addEventListener("click", () => {
    selectedEdge = edge;
    render();
  });
  edgeLayer.appendChild(line);

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("class", `one-hop-edge-label ${selectedEdge?.id === rel.id ? "selected" : ""}`);
  label.setAttribute("x", midX);
  label.setAttribute("y", midY - 5);
  label.setAttribute("text-anchor", "middle");
  label.textContent = rel.type;
  label.dataset.edgeId = rel.id;
  label.addEventListener("click", () => {
    selectedEdge = edge;
    render();
  });
  edgeLayer.appendChild(label);
}

function renderProfile() {
  if (selectedLogic) {
    titleEl.textContent = selectedLogic.label;
    badgeEl.textContent = "Scenario Logic";
    badgeEl.style.background = `${color.business_logic}18`;
    badgeEl.style.color = color.business_logic;
    descEl.textContent = selectedLogic.description || "No description.";
    profileBodyEl.innerHTML = `
      <div class="profile-section">
        <h3>Scenario</h3>
        ${kv("Scenario", `${labelOf(selectedLogic.scenarioId)} (${selectedLogic.scenarioId})`)}
        ${kv("Source", "scenario.business_logic")}
      </div>
      <div class="profile-section">
        <h3>Full Description</h3>
        <p class="muted">${escapeHtml(selectedLogic.description || "No description.")}</p>
      </div>
    `;
    return;
  }
  if (selectedEdge) {
    const sourceId = selectedEdge.sourceOriginal || selectedEdge.source;
    const targetId = selectedEdge.targetOriginal || selectedEdge.target;
    titleEl.textContent = selectedEdge.type;
    badgeEl.textContent = "Relationship";
    badgeEl.style.background = `${color.scenario}18`;
    badgeEl.style.color = color.scenario;
    descEl.textContent = selectedEdge.descriptions?.[0] || selectedEdge.properties?.description || "No description.";
    profileBodyEl.innerHTML = `
      <div class="profile-section">
        <h3>Relationship Detail</h3>
        ${edgeInfo(selectedEdge)}
      </div>
      <div class="profile-section">
        <h3>Connected Nodes</h3>
        <div class="connected-node-list">
          ${connectedTile(nodeById(sourceId))}
          ${connectedTile(nodeById(targetId))}
        </div>
      </div>
    `;
    wireClicks(profileBodyEl);
    return;
  }
  const node = nodeById(selected);
  if (!node) return;
  const data = raw(selected);
  titleEl.textContent = node.label;
  badgeEl.textContent = typeLabel[node.type] || node.type;
  badgeEl.style.background = `${color[node.type] || "#2563eb"}18`;
  badgeEl.style.color = color[node.type] || "#2563eb";
  descEl.textContent = node.properties?.description || data.description || "No description.";

  if (["column", "api_field", "feedfile_field", "dashboard_field"].includes(node.type)) {
    renderFieldProfile(node);
    return;
  }

  profileBodyEl.innerHTML = `
    <div class="profile-section">
      <button class="primary" data-action="asset" data-id="${escapeAttr(node.id)}">Open Asset Profile</button>
    </div>
    <div class="profile-section">
      <h3>Overview</h3>
      ${overviewKv(node, data)}
    </div>
    <div class="profile-section">
      <h3>Relationships</h3>
      ${profileRelationsFor(selected).slice(0, 14).map(relationRow).join("") || empty("No relationships.")}
    </div>
    <div class="profile-section">
      <h3>Fields & Checks</h3>
      ${datasetTypes.has(node.type) ? `<button data-action="toggle-expand" data-id="${escapeAttr(node.id)}">${expanded.has(node.id) ? "Hide columns" : "Expand columns"}</button>` : ""}
      ${fieldGroups(data).map(renderFieldGroup).join("") || empty("No fields or checks.")}
    </div>
  `;
  wireClicks(profileBodyEl);
}

function renderFieldProfile(node) {
  const parentId = parentOf(node.id);
  const semantic = fieldSemanticLinks(node.id);
  const lineage = fieldLineageLinks(node.id);
  const quality = fieldQualityLinks(node.id);
  profileBodyEl.innerHTML = `
    <div class="profile-section">
      <button class="primary" data-action="asset" data-id="${escapeAttr(node.id)}">Open Asset Profile</button>
    </div>
    <div class="profile-section">
      <h3>Field Meaning</h3>
      <div class="profile-card">
        ${kv("Field ID", node.id)}
        ${kv("Data Type", node.properties?.data_type || "Unknown")}
        ${kv("Description", node.properties?.description || "No field description.")}
      </div>
    </div>
    <div class="profile-section">
      <h3>Parent Asset</h3>
      ${connectedTile(nodeById(parentId))}
    </div>
    <div class="profile-section">
      <h3>Semantic Mapping</h3>
      ${semantic.map(fieldLinkRow).join("") || empty("No term/object mapping.")}
    </div>
    <div class="profile-section">
      <h3>Field-Level Lineage</h3>
      ${lineage.map(fieldLinkRow).join("") || empty("No field-level lineage.")}
    </div>
    <div class="profile-section">
      <h3>Quality</h3>
      ${quality.map(fieldLinkRow).join("") || empty("No field-level quality checks.")}
    </div>
  `;
  wireClicks(profileBodyEl);
}

function fieldLinkRow(row) {
  return `
    <div class="relation-row" data-id="${escapeAttr(row.id)}">
      <div class="relation-top">
        ${badge(row.type)}
        <span>${escapeHtml(row.direction ? `${row.direction} · ${row.relation}` : row.relation)}</span>
      </div>
      <strong>${escapeHtml(row.label || labelOf(row.id))}</strong>
      <small>${escapeHtml(row.description || row.id)}</small>
    </div>
  `;
}

function overviewKv(node, data) {
  return [
    kv("ID", node.id),
    kv("Type", typeLabel[node.type] || node.type),
    data.schema ? kv("Schema", data.schema) : "",
    data.location ? kv("Location", data.location) : "",
    data.path ? kv("Path", data.path) : "",
    data.platform ? kv("Platform", data.platform) : "",
    data.schedule ? kv("Schedule", data.schedule) : "",
    data._source_file ? kv("YAML", data._source_file) : "",
  ].join("");
}

function governanceKv(data) {
  return [
    kv("Owner", data.owner || "Not assigned"),
    kv("Domain", data.domain || "Not assigned"),
    kv("Verified", data.verified?.status === true ? "Yes" : "Not marked"),
    kv("Tags", Array.isArray(data.tags) ? data.tags.join(", ") : "None"),
  ].join("");
}

function fieldGroups(data) {
  return [
    ["Columns", data.columns],
    ["Parameters", data.parameters],
    ["Returns", data.returns],
    ["Fields", data.fields],
    ["Quality Checks", data.quality_checks],
  ].filter(([, rows]) => Array.isArray(rows) && rows.length);
}

function renderFieldGroup([title, rows]) {
  return `
    <div class="table-box" style="margin-bottom:12px">
      <div class="table-row"><span>${escapeHtml(title)}</span><span>Type</span><span>Rule</span></div>
      ${rows.map(row => `
        <div class="table-row">
          <span>${escapeHtml(row.name || row.id || row.check_type || "item")}</span>
          <span>${escapeHtml(row.data_type || row.check_type || "")}</span>
          <small>${escapeHtml(row.expectation || row.description || (row.nullable === false ? "not nullable" : ""))}</small>
        </div>
      `).join("")}
    </div>
  `;
}

function lineageViewNodes(focusId) {
  const ids = new Set();
  const focus = nodeById(focusId);
  const seedIds = dataAssetTypes.has(focus?.type)
    ? [parentOf(focusId)]
    : collectRelatedByTypes(focusId, dataAssetTypes).map(node => node.id);
  const queue = [...new Set(seedIds)];
  queue.forEach(id => ids.add(id));

  while (queue.length) {
    const current = queue.shift();
    for (const edge of graph.edges) {
      if (!lineageTypes.has(edge.type)) continue;
      const source = parentOf(edge.source);
      const target = parentOf(edge.target);
      if (source !== current && target !== current && edge.source !== current && edge.target !== current) continue;
      [source, target].forEach(id => {
        const node = nodeById(id);
        if (!node || childTypes.has(node.type)) return;
        if (!ids.has(id)) {
          ids.add(id);
          queue.push(id);
        }
      });
    }
  }

  graph.nodes.forEach(node => {
    if (childTypes.has(node.type) && expanded.has(parentOf(node.id))) ids.add(node.id);
  });

  return [...ids].map(nodeById).filter(Boolean).filter(node => dataAssetTypes.has(node.type));
}

function visibleGraphEdges(nodes, predicate) {
  const ids = new Set(nodes.map(node => node.id));
  const grouped = new Map();
  for (const edge of graph.edges) {
    if (!predicate(edge)) continue;
    let source = edge.source;
    let target = edge.target;
    if (!ids.has(source)) source = parentOf(source);
    if (!ids.has(target)) target = parentOf(target);
    if (source === target || !ids.has(source) || !ids.has(target)) continue;
    const key = `${source}|${target}|${edge.type}`;
    const item = grouped.get(key) || { id: key, source, target, type: edge.type, count: 0, descriptions: [] };
    item.count += 1;
    if (edge.properties?.description) item.descriptions.push(edge.properties.description);
    grouped.set(key, item);
  }
  return [...grouped.values()];
}

function renderGraph(nodes, edges) {
  const board = document.getElementById("graphBoard");
  const edgeLayer = document.getElementById("edgeLayer");
  if (!board || !edgeLayer) return;
  const pos = graphLayout(nodes);
  board.innerHTML = "";
  edgeLayer.innerHTML = "";

  lanes.forEach((lane, index) => {
    const title = document.createElement("div");
    title.className = "lane-title";
    title.style.left = `${28 + index * 240}px`;
    title.textContent = lane.title;
    board.appendChild(title);
  });

  edges.forEach(edge => {
    const a = pos[edge.source];
    const b = pos[edge.target];
    if (!a || !b) return;
    const ax = a.x + 178;
    const ay = a.y + 32;
    const bx = b.x;
    const by = b.y + 32;
    const mid = Math.max(36, Math.abs(bx - ax) / 2);
    const d = `M ${ax} ${ay} C ${ax + mid} ${ay}, ${bx - mid} ${by}, ${bx} ${by}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const active = selectedEdge?.id === edge.id || edge.source === selected || edge.target === selected;
    path.setAttribute("class", "edge-path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", active ? "#2563eb" : "#98a2b3");
    path.setAttribute("stroke-width", active ? "2.2" : "1.3");
    path.setAttribute("opacity", active ? ".9" : ".48");
    path.addEventListener("click", () => selectEdge(edge));
    edgeLayer.appendChild(path);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "edge-label");
    label.setAttribute("x", (ax + bx) / 2);
    label.setAttribute("y", (ay + by) / 2 - 4);
    label.setAttribute("text-anchor", "middle");
    label.textContent = edge.count > 1 ? `${edge.type} x${edge.count}` : edge.type;
    label.addEventListener("click", () => selectEdge(edge));
    edgeLayer.appendChild(label);
  });

  nodes.forEach(node => {
    const p = pos[node.id];
    if (!p) return;
    const card = document.createElement("div");
    const child = childTypes.has(node.type);
    card.className = `node-card ${child ? "child-node" : ""} ${node.id === selected ? "selected" : ""}`;
    card.style.left = `${p.x}px`;
    card.style.top = `${p.y}px`;
    card.dataset.id = node.id;
    card.innerHTML = `
      <div class="node-top">
        <span class="node-dot" style="background:${color[node.type] || "#64748b"}"></span>
        <div class="node-label">${escapeHtml(node.label)}</div>
      </div>
      <div class="node-desc">${escapeHtml(node.properties?.description || node.id)}</div>
    `;
    board.appendChild(card);
  });
}

function semanticGraphModel(focusId) {
  const focus = nodeById(focusId) || nodeById("scenario.margin_booking_settlement");
  const ids = new Set();
  const semanticNodeTypes = new Set(["scenario", "term", "object", "quality_check"]);
  const semanticEdgeTypes = new Set(["related_to", "contains_scenario", "checks", "validates"]);

  graph.nodes.forEach(node => {
    if (semanticTypes.has(node.type)) ids.add(node.id);
  });

  if (focus) ids.add(parentOf(focus.id));

  relatedFor(focus?.id || selected).forEach(rel => {
    const node = nodeById(rel.otherId);
    if (!node) return;
    if (semanticNodeTypes.has(node.type) || dataAssetTypes.has(node.type)) ids.add(node.id);
  });

  graph.edges.forEach(edge => {
    if (!semanticEdgeTypes.has(edge.type) && !["reads", "writes", "serves", "consumes"].includes(edge.type)) return;
    const source = parentOf(edge.source);
    const target = parentOf(edge.target);
    if (ids.has(source) || ids.has(target)) {
      if (semanticTypes.has(typeOf(source)) || dataAssetTypes.has(typeOf(source))) ids.add(source);
      if (semanticTypes.has(typeOf(target)) || dataAssetTypes.has(typeOf(target))) ids.add(target);
    }
  });

  graph.edges.forEach(edge => {
    if (edge.type !== "checks") return;
    const checkedAsset = parentOf(edge.target);
    if (ids.has(checkedAsset) || ids.has(edge.target) || focus?.id === checkedAsset || focus?.id === edge.target) {
      ids.add(edge.source);
      ids.add(checkedAsset);
    }
  });

  const nodes = [...ids]
    .map(nodeById)
    .filter(Boolean)
    .filter(node => semanticNodeTypes.has(node.type) || dataAssetTypes.has(node.type))
    .slice(0, 80);
  const nodeIds = new Set(nodes.map(node => node.id));
  const edges = visibleSemanticEdges(nodeIds, semanticEdgeTypes);

  return { nodes, edges };
}

function visibleSemanticEdges(nodeIds, allowedTypes) {
  const grouped = new Map();
  for (const edge of graph.edges) {
    if (!allowedTypes.has(edge.type)) continue;
    const sourceType = typeOf(edge.source);
    const targetType = typeOf(edge.target);
    const source = sourceType === "quality_check" ? edge.source : parentOf(edge.source);
    const target = targetType === "quality_check" ? edge.target : parentOf(edge.target);
    if (source === target || !nodeIds.has(source) || !nodeIds.has(target)) continue;
    const key = `${source}|${target}|${edge.type}`;
    const item = grouped.get(key) || { id: key, source, target, type: edge.type, count: 0, descriptions: [] };
    item.count += 1;
    if (edge.properties?.description) item.descriptions.push(edge.properties.description);
    grouped.set(key, item);
  }
  return [...grouped.values()];
}

function renderSemanticGraph(nodes, edges) {
  const board = document.getElementById("semanticGraphBoard");
  const edgeLayer = document.getElementById("semanticEdgeLayer");
  if (!board || !edgeLayer) return;
  const pos = semanticGraphLayout(nodes);
  board.innerHTML = "";
  edgeLayer.innerHTML = "";

  semanticLanes().forEach((lane, index) => {
    const title = document.createElement("div");
    title.className = "lane-title";
    title.style.left = `${28 + index * 220}px`;
    title.textContent = lane.title;
    board.appendChild(title);
  });

  edges.forEach(edge => {
    const a = pos[edge.source];
    const b = pos[edge.target];
    if (!a || !b) return;
    const ax = a.x + 178;
    const ay = a.y + 32;
    const bx = b.x;
    const by = b.y + 32;
    const mid = Math.max(36, Math.abs(bx - ax) / 2);
    const d = `M ${ax} ${ay} C ${ax + mid} ${ay}, ${bx - mid} ${by}, ${bx} ${by}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const active = selectedEdge?.id === edge.id || edge.source === selected || edge.target === selected;
    path.setAttribute("class", "edge-path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", active ? "#2563eb" : "#98a2b3");
    path.setAttribute("stroke-width", active ? "2.2" : "1.3");
    path.setAttribute("opacity", active ? ".9" : ".52");
    path.addEventListener("click", () => selectEdge(edge));
    edgeLayer.appendChild(path);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("class", "edge-label");
    label.setAttribute("x", (ax + bx) / 2);
    label.setAttribute("y", (ay + by) / 2 - 4);
    label.setAttribute("text-anchor", "middle");
    label.textContent = edge.count > 1 ? `${edge.type} x${edge.count}` : edge.type;
    label.addEventListener("click", () => selectEdge(edge));
    edgeLayer.appendChild(label);
  });

  nodes.forEach(node => {
    const p = pos[node.id];
    if (!p) return;
    const card = document.createElement("div");
    card.className = `node-card semantic-node-card ${node.id === selected ? "selected" : ""}`;
    card.style.left = `${p.x}px`;
    card.style.top = `${p.y}px`;
    card.dataset.id = node.id;
    card.innerHTML = `
      <div class="node-top">
        <span class="node-dot" style="background:${color[node.type] || "#64748b"}"></span>
        <div class="node-label">${escapeHtml(node.label)}</div>
      </div>
      <div class="node-desc">${escapeHtml(typeLabel[node.type] || node.type)}</div>
    `;
    board.appendChild(card);
  });
}

function semanticLanes() {
  return [
    { title: "Scenario", types: ["scenario"] },
    { title: "Term", types: ["term"] },
    { title: "Object", types: ["object"] },
    { title: "Quality", types: ["quality_check"] },
    { title: "Asset", types: ["feedfile", "pipeline", "table", "view", "api", "dashboard"] },
  ];
}

function semanticGraphLayout(nodes) {
  const pos = {};
  semanticLanes().forEach((lane, laneIndex) => {
    const x = 28 + laneIndex * 220;
    const laneNodes = nodes.filter(node => lane.types.includes(node.type));
    laneNodes.sort((a, b) => a.label.localeCompare(b.label));
    laneNodes.forEach((node, itemIndex) => {
      pos[node.id] = { x, y: 62 + itemIndex * 86 };
    });
  });
  return pos;
}

function businessContextModel(mainScenarioId) {
  const mainData = raw(mainScenarioId);
  const flowIds = scenarioFlowIds(mainData).filter(id => id !== mainScenarioId);
  const visualNodes = [];
  const positions = {};
  const groups = [];
  const scenarioPanels = [];
  const innerClusters = [];
  const panelEdges = (mainData.scenario_flow || []).map(flow => ({
    id: `scenario-flow|${flow.source}|${flow.target}|${flow.relation || "precedes"}`,
    sourceScenario: flow.source,
    targetScenario: flow.target,
    type: flow.relation || "precedes",
    description: flow.description || "",
  }));

  const panelWidth = 1168;
  const panelHeight = 470;
  const panelGapY = 40;
  const startX = 46;
  const startY = 96;
  const clusterY = 126;
  const topClusterH = 178;
  const qualityClusterY = 320;
  const qualityClusterH = 112;
  const clusterDefs = [
    { key: "logic", title: "Business Logic", subtitle: "Rules and decisions", x: 18, y: clusterY, w: 258, h: topClusterH },
    { key: "term", title: "Terms", subtitle: "Meaning and status", x: 288, y: clusterY, w: 176, h: topClusterH },
    { key: "object", title: "Objects", subtitle: "Business entities", x: 476, y: clusterY, w: 210, h: topClusterH },
    { key: "asset", title: "Implementation", subtitle: "Assets that realize objects", x: 698, y: clusterY, w: 452, h: topClusterH },
    { key: "quality", title: "Quality Safeguards", subtitle: "Checks that validate business meaning and implementation", x: 18, y: qualityClusterY, w: 1132, h: qualityClusterH },
  ];

  function addVisual(group, originalId, node, x, y) {
    const index = group.items.length;
    const visual = {
      id: `${group.scenarioId}::${originalId}::${index}`,
      originalId,
      scenarioId: group.scenarioId,
      node,
    };
    visualNodes.push(visual);
    group.items.push(visual);
    group.byOriginal[originalId] ||= [];
    group.byOriginal[originalId].push(visual.id);
    positions[visual.id] = { x, y };
  }

  flowIds.forEach((scenarioId, index) => {
    const scenario = nodeById(scenarioId);
    if (!scenario) return;
    const data = raw(scenarioId);
    const x = startX;
    const y = startY + index * (panelHeight + panelGapY);
    const group = { scenarioId, items: [], byOriginal: {}, clusterByKey: {} };
    groups.push(group);
    const scenarioAnchorId = `${scenarioId}::__scenario`;
    group.scenarioAnchor = scenarioAnchorId;
    group.byOriginal[scenarioId] = [scenarioAnchorId];
    positions[scenarioAnchorId] = { x: x + 84, y: y + 74 };

    scenarioPanels.push({
      title: `${index + 1}. ${scenario.label}`,
      subtitle: scenario.properties?.description || data.description || "Sub-scenario",
      nodeId: scenarioId,
      x,
      y,
      w: panelWidth,
      h: panelHeight,
      className: "sub-scenario-cluster",
    });

    clusterDefs.forEach(def => {
      const cluster = {
        title: def.title,
        subtitle: def.subtitle,
        x: x + def.x,
        y: y + def.y,
        w: def.w,
        h: def.h,
        className: "semantic-stage-cluster",
      };
      innerClusters.push(cluster);
      group.clusterByKey[def.key] = cluster;
    });

    const logicItems = (data.business_logic || []).map((item, logicIndex) => ({
      id: `${scenarioId}.logic.${logicIndex + 1}`,
      type: "business_logic",
      label: item.name || item,
      properties: { description: item.description || item.name || item, scenarioId },
    }));
    logicItems.forEach((node, itemIndex) => {
      const cluster = group.clusterByKey.logic;
      addVisual(group, node.id, node, cluster.x + 14, cluster.y + 48 + itemIndex * 58);
    });

    const objects = collectRelatedByTypes(scenarioId, new Set(["object"]));
    const terms = collectRelatedByTypes(scenarioId, new Set(["term"]));
    const assets = collectRelatedByTypes(scenarioId, dataAssetTypes).filter(node => !childTypes.has(node.type));
    const semanticIds = new Set([scenarioId, ...objects.map(node => node.id), ...terms.map(node => node.id)]);
    const qualityIds = new Set();
    graph.edges.forEach(edge => {
      if (edge.type === "validates" && semanticIds.has(edge.target)) qualityIds.add(edge.source);
      if (edge.type === "checks" && assets.some(asset => parentOf(edge.target) === asset.id || edge.target === asset.id)) qualityIds.add(edge.source);
    });
    const qualityNodes = [...qualityIds].map(nodeById).filter(Boolean);

    [
      ["object", objects],
      ["term", terms],
      ["asset", assets],
      ["quality", qualityNodes],
    ].forEach(([key, nodes]) => {
      const cluster = group.clusterByKey[key];
      nodes.slice(0, 5).forEach((node, itemIndex) => {
        const columns = key === "asset" ? 3 : key === "quality" ? 5 : 1;
        const xOffset = (itemIndex % columns) * (key === "asset" ? 144 : 216);
        const yOffset = Math.floor(itemIndex / columns) * 54;
        addVisual(group, node.id, node, cluster.x + 14 + xOffset, cluster.y + 48 + yOffset);
      });
    });
  });

  const width = startX + panelWidth + 66;
  const height = Math.max(620, startY + flowIds.length * (panelHeight + panelGapY) + 40);

  return {
    mainScenarioId,
    visualNodes,
    positions,
    groups,
    scenarioPanels,
    innerClusters,
    panelEdges,
    width,
    height,
    logicCount: visualNodes.filter(visual => visual.node.type === "business_logic").length,
    objectCount: visualNodes.filter(visual => visual.node.type === "object").length,
    qualityCount: visualNodes.filter(visual => visual.node.type === "quality_check").length,
  };
}

function renderBusinessContextMap(model) {
  const board = document.getElementById("semanticGraphBoard");
  const edgeLayer = document.getElementById("semanticEdgeLayer");
  if (!board || !edgeLayer) return;
  board.innerHTML = "";
  edgeLayer.innerHTML = "";
  board.style.width = `${model.width}px`;
  board.style.height = `${model.height}px`;
  edgeLayer.style.width = `${model.width}px`;
  edgeLayer.style.height = `${model.height}px`;
  edgeLayer.setAttribute("width", model.width);
  edgeLayer.setAttribute("height", model.height);

  const clusters = [
    {
      title: labelOf(model.mainScenarioId),
      subtitle: "Parent scenario containing business context for each sub-scenario",
      nodeId: model.mainScenarioId,
      x: 20,
      y: 20,
      w: model.width - 40,
      h: model.height - 60,
      className: "parent-scenario-cluster",
    },
    ...model.scenarioPanels,
    ...model.innerClusters,
  ];

  clusters.forEach(cluster => {
    const box = document.createElement("div");
    const isScenarioFrame = ["parent-scenario-cluster", "sub-scenario-cluster"].includes(cluster.className);
    box.className = `graph-cluster ${cluster.className || ""} ${isScenarioFrame && cluster.nodeId === selected ? "selected" : ""}`;
    box.style.left = `${cluster.x}px`;
    box.style.top = `${cluster.y}px`;
    box.style.width = `${cluster.w}px`;
    box.style.height = `${cluster.h}px`;
    if (cluster.nodeId) box.dataset.id = cluster.nodeId;
    box.innerHTML = cluster.nodeId
      ? `<div class="cluster-hit" data-id="${escapeAttr(cluster.nodeId)}"><strong>${escapeHtml(cluster.title)}</strong><span>${escapeHtml(cluster.subtitle)}</span></div>`
      : `<strong>${escapeHtml(cluster.title)}</strong><span>${escapeHtml(cluster.subtitle)}</span>`;
    board.appendChild(box);
  });

  const panelPos = Object.fromEntries(model.scenarioPanels.map(panel => [panel.nodeId, panel]));
  model.panelEdges.forEach(edge => {
    const a = panelPos[edge.sourceScenario];
    const b = panelPos[edge.targetScenario];
    if (!a || !b) return;
    drawSemanticEdge(edgeLayer, {
      id: edge.id,
      source: edge.sourceScenario,
      target: edge.targetScenario,
      sourceOriginal: edge.sourceScenario,
      targetOriginal: edge.targetScenario,
      type: edge.type,
      descriptions: edge.description ? [edge.description] : [],
    }, { x: a.x + a.w / 2, y: a.y + a.h - 18 }, { x: b.x + b.w / 2, y: b.y + 18 }, true);
  });

  const contextEdges = businessContextEdges(model);
  contextEdges.forEach(edge => {
    const a = model.positions[edge.source];
    const b = model.positions[edge.target];
    if (!a || !b) return;
    drawSemanticEdge(edgeLayer, edge, { x: a.x + 132, y: a.y + 25 }, { x: b.x, y: b.y + 25 }, false);
  });
  currentBusinessEdges = [...model.panelEdges.map(edge => ({
    id: edge.id,
    source: edge.sourceScenario,
    target: edge.targetScenario,
    sourceOriginal: edge.sourceScenario,
    targetOriginal: edge.targetScenario,
    type: edge.type,
    descriptions: edge.description ? [edge.description] : [],
  })), ...contextEdges];

  model.visualNodes.forEach(visual => {
    const p = model.positions[visual.id];
    if (!p) return;
    const node = visual.node;
    const card = document.createElement("div");
    card.className = `overview-node semantic-overview-node ${node.type === "business_logic" ? "logic-item" : ""} ${visual.originalId === selected ? "selected" : ""}`;
    card.style.left = `${p.x}px`;
    card.style.top = `${p.y}px`;
    if (node.type === "business_logic") {
      card.dataset.logicId = visual.originalId;
      card.dataset.scenarioId = visual.scenarioId;
      card.dataset.logicTitle = node.label;
      card.dataset.logicDescription = node.properties?.description || "";
    } else if (nodeById(visual.originalId)) {
      card.dataset.id = visual.originalId;
    }
    card.dataset.visualId = visual.id;
    card.innerHTML = `
      <div class="node-top">
        <span class="node-dot" style="background:${color[node.type] || "#64748b"}"></span>
        <div class="node-label">${escapeHtml(node.label)}</div>
      </div>
      <div class="node-desc">${escapeHtml(node.type === "business_logic" ? node.properties?.description || "" : typeLabel[node.type] || node.type)}</div>
    `;
    board.appendChild(card);
  });
}

function businessContextEdges(model) {
  const grouped = new Map();
  const structuralSourceFields = new Set([
    "columns",
    "fields",
    "request_fields",
    "response_fields",
    "returns",
    "scenario_flow",
  ]);

  function isFieldLike(id) {
    const type = typeOf(id);
    return type === "column" || type === "api_field" || type === "feedfile_field";
  }

  function isAsset(id) {
    const type = typeOf(id);
    return dataAssetTypes.has(type) && type !== "column";
  }

  function isBusinessContextCandidate(edge) {
    const sourceField = edge.properties?.source_field || "";
    if (edge.type === "contains") return false;
    if (structuralSourceFields.has(sourceField)) return false;
    if (sourceField.startsWith("lineage") || sourceField.includes(".lineage")) return false;
    if (isFieldLike(edge.source) || isFieldLike(edge.target)) return false;
    return true;
  }

  model.groups.forEach(group => {
    graph.edges.forEach(edge => {
      if (!isBusinessContextCandidate(edge)) return;
      const sourceOriginal = group.byOriginal[edge.source] ? edge.source : parentOf(edge.source);
      const targetOriginal = group.byOriginal[edge.target] ? edge.target : parentOf(edge.target);
      const sourceVisual = group.byOriginal[sourceOriginal]?.[0];
      const targetVisual = group.byOriginal[targetOriginal]?.[0];
      if (!sourceVisual || !targetVisual || sourceVisual === targetVisual) return;
      if (isAsset(sourceOriginal) && isAsset(targetOriginal)) return;
      const key = `${group.scenarioId}|${sourceVisual}|${targetVisual}|${edge.type}`;
      const item = grouped.get(key) || {
        id: key,
        source: sourceVisual,
        target: targetVisual,
        sourceOriginal,
        targetOriginal,
        type: edge.type,
        count: 0,
        descriptions: [],
      };
      item.count += 1;
      if (edge.properties?.description) item.descriptions.push(edge.properties.description);
      grouped.set(key, item);
    });
  });
  return [...grouped.values()];
}

function drawSemanticEdge(edgeLayer, edge, a, b, isPanelEdge) {
  const mid = Math.max(28, Math.abs(b.x - a.x) / 2);
  const d = isPanelEdge
    ? `M ${a.x} ${a.y} C ${a.x} ${a.y + 34}, ${b.x} ${b.y - 34}, ${b.x} ${b.y}`
    : `M ${a.x} ${a.y} C ${a.x + mid} ${a.y}, ${b.x - mid} ${b.y}, ${b.x} ${b.y}`;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "edge-path");
  path.setAttribute("d", d);
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", isPanelEdge ? "#2563eb" : "#98a2b3");
  path.setAttribute("stroke-width", isPanelEdge ? "1.8" : "1.2");
  path.setAttribute("opacity", isPanelEdge ? ".7" : ".52");
  path.dataset.edgeId = edge.id;
  path.addEventListener("click", () => selectSemanticEdge(edge));
  edgeLayer.appendChild(path);

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("class", "edge-label");
  label.setAttribute("x", (a.x + b.x) / 2);
  label.setAttribute("y", (a.y + b.y) / 2 - 4);
  label.setAttribute("text-anchor", "middle");
  label.textContent = edge.type;
  label.dataset.edgeId = edge.id;
  label.addEventListener("click", () => selectSemanticEdge(edge));
  edgeLayer.appendChild(label);
}

function selectSemanticEdge(edge) {
  selectedEdge = edge;
  selectedLogic = null;
  selected = edge.targetOriginal || edge.target;
  renderProfile();
  updateSelectedClasses();
  highlightSemanticEdge(edge);
}

function highlightSemanticEdge(edge) {
  document.querySelectorAll("#semanticEdgeLayer .edge-path, #semanticEdgeLayer .edge-label").forEach(element => {
    element.classList.toggle("selected", element.dataset.edgeId === edge?.id);
  });
  const sourceId = edge?.source;
  const targetId = edge?.target;
  const sourceOriginal = edge?.sourceOriginal || edge?.source;
  const targetOriginal = edge?.targetOriginal || edge?.target;
  document.querySelectorAll("#semanticGraphBoard .overview-node").forEach(element => {
    const visualId = element.dataset.visualId;
    element.classList.toggle("edge-connected", !!edge && (visualId === sourceId || visualId === targetId));
    if (edge) element.classList.remove("selected");
  });
  document.querySelectorAll("#semanticGraphBoard .graph-cluster.parent-scenario-cluster, #semanticGraphBoard .graph-cluster.sub-scenario-cluster").forEach(element => {
    const id = element.dataset.id;
    element.classList.toggle("edge-connected", !!edge && (id === sourceOriginal || id === targetOriginal));
    if (edge) element.classList.remove("selected");
  });
}

function selectLogicItem(element) {
  selectedEdge = null;
  selectedLogic = {
    id: element.dataset.logicId,
    scenarioId: element.dataset.scenarioId,
    label: element.dataset.logicTitle,
    description: element.dataset.logicDescription,
  };
  selected = selectedLogic.scenarioId;
  highlightSemanticEdge(null);
  renderProfile();
  updateSelectedClasses();
}

function findRenderedBusinessEdge(sourceId, targetId, type) {
  return currentBusinessEdges.find(edge => {
    const source = edge.sourceOriginal || edge.source;
    const target = edge.targetOriginal || edge.target;
    return source === sourceId && target === targetId && (!type || edge.type === type);
  }) || currentBusinessEdges.find(edge => {
    const source = edge.sourceOriginal || edge.source;
    const target = edge.targetOriginal || edge.target;
    return source === targetId && target === sourceId && (!type || edge.type === type);
  });
}

function renderCatalogGraph(mainScenarioId) {
  const board = document.getElementById("overviewGraphBoard");
  const edgeLayer = document.getElementById("overviewEdgeLayer");
  if (!board || !edgeLayer || !mainScenarioId) return;

  const mainData = raw(mainScenarioId);
  const flowIds = scenarioFlowIds(mainData).filter(id => id !== mainScenarioId);
  const model = catalogScenarioModel(mainScenarioId, flowIds);
  const nodes = model.visualNodes;
  const positions = model.positions;
  const edges = catalogOverviewEdges(model, mainScenarioId);

  board.innerHTML = "";
  edgeLayer.innerHTML = "";
  board.style.width = `${model.width}px`;
  board.style.height = `${model.height}px`;
  edgeLayer.style.width = `${model.width}px`;
  edgeLayer.style.height = `${model.height}px`;
  edgeLayer.setAttribute("width", model.width);
  edgeLayer.setAttribute("height", model.height);

  const clusters = [
    {
      title: labelOf(mainScenarioId),
      subtitle: "Parent scenario containing sub-scenarios and their local data flow",
      nodeId: mainScenarioId,
      x: 20,
      y: 20,
      w: model.width - 40,
      h: model.height - 60,
      className: "parent-scenario-cluster",
    },
    ...model.scenarioPanels,
    ...model.innerClusters,
  ];

  clusters.forEach(cluster => {
    const box = document.createElement("div");
    const isScenarioFrame = ["parent-scenario-cluster", "sub-scenario-cluster"].includes(cluster.className);
    box.className = `graph-cluster ${cluster.className || ""} ${isScenarioFrame && cluster.nodeId === selected ? "selected" : ""}`;
    box.style.left = `${cluster.x}px`;
    box.style.top = `${cluster.y}px`;
    box.style.width = `${cluster.w}px`;
    box.style.height = `${cluster.h}px`;
    if (cluster.nodeId) box.dataset.id = cluster.nodeId;
    box.innerHTML = cluster.nodeId
      ? `<div class="cluster-hit" data-id="${escapeAttr(cluster.nodeId)}"><strong>${escapeHtml(cluster.title)}</strong><span>${escapeHtml(cluster.subtitle)}</span></div>`
      : `<strong>${escapeHtml(cluster.title)}</strong><span>${escapeHtml(cluster.subtitle)}</span>`;
    board.appendChild(box);
  });

  edges.forEach(edge => {
    const a = positions[edge.source];
    const b = positions[edge.target];
    if (!a || !b) return;
    const ax = a.x + 132;
    const ay = a.y + 26;
    const bx = b.x;
    const by = b.y + 26;
    const mid = Math.max(28, Math.abs(bx - ax) / 2);
    const d = `M ${ax} ${ay} C ${ax + mid} ${ay}, ${bx - mid} ${by}, ${bx} ${by}`;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const active = selectedEdge?.id === edge.id || edge.sourceOriginal === selected || edge.targetOriginal === selected;
    path.setAttribute("class", "edge-path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", active ? "#2563eb" : "#98a2b3");
    path.setAttribute("stroke-width", active ? "2.2" : "1.2");
    path.setAttribute("opacity", active ? ".9" : ".42");
    path.addEventListener("click", () => {
      selectedEdge = edge;
      selected = edge.targetOriginal;
      render();
    });
    edgeLayer.appendChild(path);

    if (selectedEdge?.id === edge.id || edge.important) {
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("class", "edge-label");
      label.setAttribute("x", (ax + bx) / 2);
      label.setAttribute("y", (ay + by) / 2 - 4);
      label.setAttribute("text-anchor", "middle");
      label.textContent = edge.type;
      label.addEventListener("click", () => {
        selectedEdge = edge;
        selected = edge.targetOriginal;
        render();
      });
      edgeLayer.appendChild(label);
    }
  });

  nodes.forEach(visual => {
    const node = visual.node;
    const p = positions[visual.id];
    if (!p) return;
    const card = document.createElement("div");
    card.className = `overview-node ${visual.originalId === selected ? "selected" : ""}`;
    card.style.left = `${p.x}px`;
    card.style.top = `${p.y}px`;
    card.dataset.id = visual.originalId;
    card.dataset.visualId = visual.id;
    card.innerHTML = `
      <div class="node-top">
        <span class="node-dot" style="background:${color[node.type] || "#64748b"}"></span>
        <div class="node-label">${escapeHtml(node.label)}</div>
      </div>
      <div class="node-desc">${escapeHtml(typeLabel[node.type] || node.type)}</div>
    `;
    board.appendChild(card);
  });
}

function catalogScenarioModel(mainScenarioId, flowIds) {
  const visualNodes = [];
  const pos = {};
  const groups = [];
  const scenarioPanels = [];
  const innerClusters = [];
  const panelWidth = 1168;
  const panelHeight = 340;
  const panelGapY = 36;
  const startX = 46;
  const startY = 96;
  const stageGap = 12;
  const stageWidth = 178;
  const stageHeight = 198;
  const stageStartX = 18;
  const stageStartY = 120;

  function addVisual(scenarioId, nodeId, x, y, group) {
    const node = nodeById(nodeId);
    if (!node) return;
    const index = group.items.length;
    const visual = {
      id: `${scenarioId}::${nodeId}::${index}`,
      originalId: nodeId,
      scenarioId,
      node,
    };
    visualNodes.push(visual);
    group.items.push(visual);
    group.byOriginal[nodeId] ||= [];
    group.byOriginal[nodeId].push(visual.id);
    pos[visual.id] = { x, y };
  }

  flowIds.forEach((scenarioId, index) => {
    const scenario = nodeById(scenarioId);
    if (!scenario) return;

    const x = startX;
    const y = startY + index * (panelHeight + panelGapY);
    const group = { scenarioId, items: [], byOriginal: {} };
    groups.push(group);

    scenarioPanels.push({
      title: `${index + 1}. ${scenario.label}`,
      subtitle: scenario.properties?.description || raw(scenarioId).description || "Sub-scenario",
      nodeId: scenarioId,
      x,
      y,
      w: panelWidth,
      h: panelHeight,
      className: "sub-scenario-cluster",
    });

    const relatedAssetIds = collectRelatedByTypes(scenarioId, dataAssetTypes)
      .filter(node => !childTypes.has(node.type))
      .map(node => node.id);
    const assetIds = [...new Set(relatedAssetIds)]
      .filter(id => catalogStages.some(stage => stage.key === typeOf(id)));

    catalogStages.forEach((stage, stageIndex) => {
      const stageX = x + stageStartX + stageIndex * (stageWidth + stageGap);
      innerClusters.push({
        title: stage.title,
        subtitle: stage.subtitle,
        nodeId: scenarioId,
        x: stageX,
        y: y + stageStartY,
        w: stageWidth,
        h: stageHeight,
        className: "catalog-stage-cluster",
      });

      assetIds
        .filter(id => typeOf(id) === stage.key)
        .sort((a, b) => labelOf(a).localeCompare(labelOf(b)))
        .forEach((id, itemIndex) => {
          addVisual(scenarioId, id, stageX + 16, y + stageStartY + 46 + itemIndex * 56, group);
        });
    });
  });

  const height = Math.max(620, startY + flowIds.length * (panelHeight + panelGapY) + 40);
  const width = startX + panelWidth + 66;

  return {
    visualNodes,
    positions: pos,
    groups,
    scenarioPanels,
    innerClusters,
    width,
    height,
  };
}

function catalogOverviewEdges(model, mainScenarioId) {
  const grouped = new Map();
  const allowed = new Set(["feeds", "writes", "reads", "produces", "consumes", "serves", "derived_from", "lineage"]);

  model.groups.forEach(group => {
    graph.edges.forEach(edge => {
      if (!allowed.has(edge.type)) return;
      const sourceOriginal = group.byOriginal[edge.source] ? edge.source : parentOf(edge.source);
      const targetOriginal = group.byOriginal[edge.target] ? edge.target : parentOf(edge.target);
      const sourceVisual = group.byOriginal[sourceOriginal]?.[0];
      const targetVisual = group.byOriginal[targetOriginal]?.[0];
      if (!sourceVisual || !targetVisual || sourceVisual === targetVisual) return;
      const key = `${group.scenarioId}|${sourceVisual}|${targetVisual}|${edge.type}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          source: sourceVisual,
          target: targetVisual,
          sourceOriginal,
          targetOriginal,
          type: edge.type,
          important: ["feeds", "writes", "reads", "produces", "consumes", "serves"].includes(edge.type),
          descriptions: edge.properties?.description ? [edge.properties.description] : [],
        });
      }
    });
  });

  return [...grouped.values()];
}

function graphLayout(nodes) {
  const pos = {};
  lanes.forEach((lane, laneIndex) => {
    const x = 28 + laneIndex * 240;
    const laneNodes = nodes.filter(node => lane.types.includes(node.type));
    laneNodes.sort((a, b) => a.label.localeCompare(b.label));
    laneNodes.forEach((node, itemIndex) => {
      pos[node.id] = { x: x + (childTypes.has(node.type) ? 12 : 0), y: 62 + itemIndex * (childTypes.has(node.type) ? 68 : 96) };
    });
  });
  return pos;
}

function scenarioFlowIds(data) {
  if (Array.isArray(data.scenario_flow) && data.scenario_flow.length) {
    const ids = [];
    data.scenario_flow.forEach(edge => {
      if (!ids.includes(edge.source)) ids.push(edge.source);
      if (!ids.includes(edge.target)) ids.push(edge.target);
    });
    return ids;
  }
  const children = graph.edges
    .filter(edge => edge.type === "contains_scenario" && edge.source === selected)
    .map(edge => edge.target);
  return children.length ? children : [selected];
}

function relatedFor(id) {
  const rows = [];
  graph.edges.forEach(edge => {
    const sourceParent = parentOf(edge.source);
    const targetParent = parentOf(edge.target);
    const fromSelected = edge.source === id || sourceParent === id;
    const toSelected = edge.target === id || targetParent === id;
    if (!fromSelected && !toSelected) return;
    const otherId = fromSelected ? targetParent : sourceParent;
    if (otherId === id) return;
    rows.push({
      type: edge.type,
      otherId,
      otherLabel: labelOf(otherId),
      description: edge.properties?.description || "",
      source: sourceParent,
      target: targetParent,
    });
  });
  return dedupeRelations(rows).slice(0, 40);
}

function profileRelationsFor(id) {
  const rows = relatedFor(id);
  if (page !== "scenario") return rows;
  return rows.sort((a, b) => {
    const edgeA = findRenderedBusinessEdge(a.source, a.target, a.type) ? 0 : 1;
    const edgeB = findRenderedBusinessEdge(b.source, b.target, b.type) ? 0 : 1;
    return edgeA - edgeB;
  });
}

function dedupeRelations(rows) {
  const seen = new Set();
  return rows.filter(row => {
    const key = `${row.type}|${row.otherId}|${row.description}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function collectRelatedByTypes(id, types) {
  const ids = new Set();
  relatedFor(id).forEach(rel => {
    const node = nodeById(rel.otherId);
    if (node && types.has(node.type)) ids.add(node.id);
  });
  return [...ids].map(nodeById).filter(Boolean).sort((a, b) => `${a.type}:${a.label}`.localeCompare(`${b.type}:${b.label}`));
}

function ensureType(id, type) {
  const node = nodeById(id);
  if (node?.type === type) return node;
  return graph.nodes.find(item => item.type === type);
}

function countByType(nodes) {
  return nodes.reduce((acc, node) => {
    acc[node.type] = (acc[node.type] || 0) + 1;
    return acc;
  }, {});
}

function countQualityChecks() {
  return Object.values(catalog).reduce((total, item) => total + (Array.isArray(item.quality_checks) ? item.quality_checks.length : 0), 0);
}

function edgeInfo(edge) {
  const sourceId = edge.sourceOriginal || edge.source;
  const targetId = edge.targetOriginal || edge.target;
  return `
    <div class="profile-card">
      ${kv("Type", edge.type)}
      ${kv("Source", `${labelOf(sourceId)} (${sourceId})`)}
      ${kv("Target", `${labelOf(targetId)} (${targetId})`)}
      ${edge.count > 1 ? kv("Grouped", `${edge.count} relationships`) : ""}
      ${kv("Description", edge.descriptions?.[0] || edge.properties?.description || "No description")}
    </div>
  `;
}

function badge(type) {
  return `<span class="type-badge" style="background:${color[type] || "#2563eb"}18;color:${color[type] || "#2563eb"}">${escapeHtml(typeLabel[type] || type)}</span>`;
}

function kv(key, value) {
  return `<div class="kv"><span>${escapeHtml(key)}</span><strong>${escapeHtml(String(value || ""))}</strong></div>`;
}

function empty(text) {
  return `<p class="muted">${escapeHtml(text)}</p>`;
}

function wireClicks(root) {
  if (root === profileBodyEl) {
    root.onclick = event => {
      const row = event.target.closest?.(".relation-row");
      if (!row || page !== "scenario") return;
      const edge = findRenderedBusinessEdge(row.dataset.edgeSource, row.dataset.edgeTarget, row.dataset.edgeType);
      if (edge) {
        selectSemanticEdge(edge);
        event.stopPropagation();
      }
    };
  }

  root.querySelectorAll("[data-logic-id]").forEach(element => {
    element.onclick = event => {
      selectLogicItem(element);
      event.stopPropagation();
    };
  });

  root.querySelectorAll("[data-id]").forEach(element => {
    element.onclick = event => {
      const id = element.dataset.id;
      const action = element.dataset.action;
      if (action === "toggle-expand") {
        expanded.has(id) ? expanded.delete(id) : expanded.add(id);
        page = "lineage";
        selected = id;
        render();
        return;
      }
      if (["catalog", "scenario", "fields", "asset", "lineage", "ontology", "quality"].includes(action)) {
        setPage(action, id);
        return;
      }
      if (nodeById(id)) {
        if (page === "browse") {
          selected = id;
          selectedEdge = null;
          selectedLogic = null;
          renderProfile();
          renderSidebarResults();
          updateSelectedClasses();
          event.stopPropagation();
          return;
        }
        if (page === "fields") {
          selected = id;
          selectedEdge = null;
          selectedLogic = null;
          renderProfile();
          renderSidebarResults();
          updateSelectedClasses();
          event.stopPropagation();
          return;
        }
        if (element.classList.contains("relation-row") && page === "scenario") {
          const edge = findRenderedBusinessEdge(element.dataset.edgeSource, element.dataset.edgeTarget, element.dataset.edgeType);
          if (edge) {
            selectSemanticEdge(edge);
            event.stopPropagation();
            return;
          }
        }
        if (page === "catalog") {
          selected = id;
          selectedEdge = null;
          selectedLogic = null;
          renderProfile();
          renderSidebarResults();
          updateSelectedClasses();
          event.stopPropagation();
          return;
        }
        if (page === "scenario" && typeOf(id) !== "scenario") {
          selected = id;
          selectedEdge = null;
          selectedLogic = null;
          renderProfile();
          renderSidebarResults();
          updateSelectedClasses();
          return;
        }
        selectNode(id, page);
      }
      event.stopPropagation();
    };
  });
}

function updateSelectedClasses() {
  const selectedQualityTargets = typeOf(selected) === "quality_check" ? qualityTargetIds(selected) : new Set();
  document.querySelectorAll(".asset-item, .tile, .flow-card, .relation-row, .quality-row, .node-card, .overview-node, .field-er-row, .field-asset-box, .quality-chip, .browse-node").forEach(element => {
    const canSelect = !element.classList.contains("connected-tile");
    const idSelected = element.dataset.id && element.dataset.id === selected;
    const logicSelected = element.dataset.logicId && element.dataset.logicId === selectedLogic?.id;
    const qualityTargetSelected = element.dataset.id && selectedQualityTargets.has(element.dataset.id);
    element.classList.toggle("selected", Boolean(canSelect && (idSelected || logicSelected || qualityTargetSelected)));
    element.classList.toggle("quality-related", Boolean(qualityTargetSelected && !idSelected));
  });
  document.querySelectorAll(".graph-cluster.parent-scenario-cluster, .graph-cluster.sub-scenario-cluster").forEach(element => {
    element.classList.toggle("selected", element.dataset.id === selected);
  });
  document.querySelectorAll(".graph-cluster.catalog-stage-cluster").forEach(element => {
    element.classList.remove("selected");
  });
  if (selectedEdge) highlightSemanticEdge(selectedEdge);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

const resetEl = document.getElementById("reset");
if (resetEl) {
  resetEl.onclick = () => {
    searchEl.value = "";
    expanded.clear();
    activeTypes = new Set(graph.nodes.filter(node => !childTypes.has(node.type)).map(node => node.type));
    browseTypes = new Set(graph.nodes.map(node => node.type));
    page = "catalog";
    selected = "scenario.margin_booking_settlement";
    selectedEdge = null;
    selectedLogic = null;
    render();
  };
}

searchEl.addEventListener("input", render);
render();

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
const childTypes = new Set(["column", "api_field", "feedfile_field", "quality_check"]);
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
  if (page === "scenario") return renderScenarioPage();
  if (page === "fields") return renderFieldsPage();
  if (page === "asset") return renderAssetPage();
  if (page === "lineage") return renderLineagePage();
  if (page === "ontology") return renderOntologyPage();
  if (page === "quality") return renderQualityPage();
  return renderCatalogPage();
}

function renderCatalogPage() {
  const mainScenario = nodeById("scenario.margin_booking_settlement") || graph.nodes.find(node => node.type === "scenario");
  const counts = countByType(graph.nodes.filter(node => !childTypes.has(node.type)));
  const assets = graph.nodes.filter(node => dataAssetTypes.has(node.type) && !childTypes.has(node.type));
  const directFlowEdges = graph.edges.filter(edge => lineageTypes.has(edge.type) && dataAssetTypes.has(typeOf(parentOf(edge.source))) && dataAssetTypes.has(typeOf(parentOf(edge.target))));

  pageEl.innerHTML = `
    ${pageHeader("Catalog", "Scenario-level data flow across feed files, pipelines, datasets, APIs, and dashboards.", [
      ["Open Main Scenario", "scenario", mainScenario?.id],
      ["Explore Lineage", "lineage", mainScenario?.id],
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
      ["Explore Lineage", "lineage", selected],
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
  const node = nodeById(selected) || graph.nodes.find(item => dataAssetTypes.has(item.type) && !childTypes.has(item.type)) || graph.nodes[0];
  selected = node.id;
  const data = raw(selected);
  const fields = fieldGroups(data);

  pageEl.innerHTML = `
    ${pageHeader("Asset Profile", "A focused page for one table, view, feed, API, dashboard, pipeline, term, object, or scenario.", [
      ["Explore Lineage", "lineage", selected],
      ["Show Semantics", "scenario", selected],
    ])}
    <div class="grid-2">
      <div class="profile-card">
        <h3>Overview</h3>
        ${overviewKv(node, data)}
      </div>
      <div class="profile-card">
        <h3>Governance</h3>
        ${governanceKv(data)}
      </div>
    </div>
    <section class="section">
      <h3>Schema, Parameters, Returns, or Fields</h3>
      ${fields.length ? fields.map(renderFieldGroup).join("") : empty("No field-level data on this node.")}
    </section>
    <section class="section">
      <h3>Lineage and Relationships</h3>
      ${relatedFor(selected).map(relationRow).join("") || empty("No relationships.")}
    </section>
    ${data.logic?.sql || data.sql ? `<section class="section"><h3>Logic</h3><pre class="code-block">${escapeHtml(data.logic?.sql || data.sql)}</pre></section>` : ""}
  `;
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
  const focusScenario = typeOf(selected) === "scenario"
    ? selected
    : "scenario.margin_booking_settlement";
  const groups = fieldMapGroups(focusScenario);
  const allRows = groups.flatMap(group => group.rows);
  const mappedRows = allRows.filter(row => row.semantic.length);
  const lineageRows = allRows.filter(row => row.lineage.length);
  const qualityRows = allRows.filter(row => row.quality.length);

  pageEl.innerHTML = `
    ${pageHeader("Field Map", "Field-level meaning, lineage, and quality without expanding every field inside Catalog or Business Context.", [
      ["Open Semantics", "scenario", focusScenario],
      ["Explore Lineage", "lineage", focusScenario],
    ])}
    <div class="metrics-grid">
      ${metric("Fields", allRows.length)}
      ${metric("Semantic Mappings", mappedRows.length)}
      ${metric("Field Lineage", lineageRows.length)}
      ${metric("Field Quality", qualityRows.length)}
    </div>
    <section class="section">
      <h3>Field Coverage By Scenario</h3>
      <div class="field-map">
        ${groups.map(renderFieldMapGroup).join("") || empty("No field-level nodes for this scenario.")}
      </div>
    </section>
  `;
}

function fieldMapGroups(focusScenario) {
  const mainData = raw(focusScenario);
  const scenarioIds = scenarioFlowIds(mainData).filter(id => typeOf(id) === "scenario");
  const ids = scenarioIds.length ? scenarioIds : [focusScenario];
  return ids.map(scenarioId => {
    const assets = collectRelatedByTypes(scenarioId, dataAssetTypes)
      .filter(node => !childTypes.has(node.type))
      .sort((a, b) => `${a.type}:${a.label}`.localeCompare(`${b.type}:${b.label}`));
    const assetIds = new Set(assets.map(node => node.id));
    const fields = graph.nodes
      .filter(node => ["column", "api_field", "feedfile_field"].includes(node.type))
      .filter(node => assetIds.has(parentOf(node.id)))
      .sort((a, b) => `${typeOf(parentOf(a.id))}:${labelOf(parentOf(a.id))}:${a.label}`.localeCompare(`${typeOf(parentOf(b.id))}:${labelOf(parentOf(b.id))}:${b.label}`));
    return {
      scenarioId,
      rows: fields.map(field => fieldMapRow(field)),
    };
  }).filter(group => group.rows.length);
}

function fieldMapRow(field) {
  const semantic = [];
  const lineage = [];
  const quality = [];
  graph.edges.forEach(edge => {
    const touchesSource = edge.source === field.id;
    const touchesTarget = edge.target === field.id;
    if (!touchesSource && !touchesTarget) return;
    const otherId = touchesSource ? edge.target : edge.source;
    const other = nodeById(otherId);
    const description = edge.properties?.description || "";
    if (other && ["term", "object", "scenario"].includes(other.type)) {
      semantic.push({ id: other.id, label: other.label, type: other.type, relation: edge.type, description });
      return;
    }
    if (other?.type === "quality_check" || edge.type === "checks") {
      quality.push({ id: otherId, label: labelOf(otherId), type: typeOf(otherId), relation: edge.type, description });
      return;
    }
    if (["field_lineage", "lineage", "maps_to_property", "derived_from"].includes(edge.type) || typeOf(otherId) === "column" || typeOf(otherId) === "api_field" || typeOf(otherId) === "feedfile_field") {
      lineage.push({ id: otherId, label: labelOf(otherId), type: typeOf(otherId), relation: edge.type, direction: touchesSource ? "to" : "from", description });
    }
  });
  return {
    field,
    parentId: parentOf(field.id),
    semantic: dedupeFieldLinks(semantic),
    lineage: dedupeFieldLinks(lineage),
    quality: dedupeFieldLinks(quality),
  };
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

function renderFieldMapGroup(group) {
  return `
    <div class="field-group">
      <div class="field-group-header" data-id="${escapeAttr(group.scenarioId)}">
        <div>
          <strong>${escapeHtml(labelOf(group.scenarioId))}</strong>
          <span>${escapeHtml(descOf(group.scenarioId) || group.scenarioId)}</span>
        </div>
        ${badge("scenario")}
      </div>
      <div class="field-table">
        <div class="field-table-row field-table-head">
          <span>Field</span>
          <span>Parent Asset</span>
          <span>Semantic Mapping</span>
          <span>Lineage</span>
          <span>Quality</span>
        </div>
        ${group.rows.map(renderFieldMapRow).join("")}
      </div>
    </div>
  `;
}

function renderFieldMapRow(row) {
  const field = row.field;
  return `
    <div class="field-table-row" data-id="${escapeAttr(field.id)}">
      <span>
        <strong>${escapeHtml(field.label)}</strong>
        <small>${escapeHtml(field.properties?.data_type || "")}</small>
      </span>
      <span>
        ${badge(typeOf(row.parentId))}
        <small>${escapeHtml(labelOf(row.parentId))}</small>
      </span>
      <span>${renderFieldLinks(row.semantic, "No term/object mapping")}</span>
      <span>${renderFieldLinks(row.lineage, "No field lineage")}</span>
      <span>${renderFieldLinks(row.quality, "No field check")}</span>
    </div>
  `;
}

function renderFieldLinks(rows, emptyText) {
  if (!rows.length) return `<small class="muted">${escapeHtml(emptyText)}</small>`;
  return rows.slice(0, 3).map(row => `
    <button class="inline-link" data-id="${escapeAttr(row.id)}" title="${escapeAttr(row.description || row.id)}">
      ${escapeHtml(row.direction ? `${row.direction} ` : "")}${escapeHtml(row.label)}
    </button>
  `).join("");
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

  profileBodyEl.innerHTML = `
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
  document.querySelectorAll(".asset-item, .tile, .flow-card, .relation-row, .quality-row, .node-card, .overview-node").forEach(element => {
    const canSelect = !element.classList.contains("connected-tile");
    element.classList.toggle("selected", canSelect && (element.dataset.id === selected || element.dataset.logicId === selectedLogic?.id));
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

document.getElementById("reset").onclick = () => {
  searchEl.value = "";
  expanded.clear();
  activeTypes = new Set(graph.nodes.filter(node => !childTypes.has(node.type)).map(node => node.type));
  page = "catalog";
  selected = "scenario.margin_booking_settlement";
  selectedEdge = null;
  selectedLogic = null;
  render();
};

searchEl.addEventListener("input", render);
render();

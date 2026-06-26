const graph = window.GRAPH_DATA || { nodes: [], edges: [] };
const catalog = window.CATALOG_DATA || {};
const flowData = window.FLOW_DATA || { flows: [] };
const DEFAULT_GRAPH_SIZE = { width: 1800, height: 1300 };
const GRAPH_PADDING = 90;
const SCENARIO_STORAGE_KEY = "metadata-catalog-explorer:graph-scenarios:v1";
let scenarioMemoryStore = "[]";
const elkLayoutEngine = window.ELK ? new window.ELK() : null;

const els = {
  stats: document.getElementById("stats"),
  catalogTab: document.getElementById("catalogTab"),
  graphTab: document.getElementById("graphTab"),
  catalogPage: document.getElementById("catalogPage"),
  graphPage: document.getElementById("graphPage"),
  scenarioSelect: document.getElementById("scenarioSelect"),
  scenarioName: document.getElementById("scenarioNameInput"),
  saveScenario: document.getElementById("saveScenarioButton"),
  updateScenario: document.getElementById("updateScenarioButton"),
  deleteScenario: document.getElementById("deleteScenarioButton"),
  scenarioHint: document.getElementById("scenarioHint"),

  catalogSearch: document.getElementById("catalogSearchInput"),
  catalogNodeTypes: document.getElementById("catalogNodeTypeFilters"),
  catalogEdgeTypes: document.getElementById("catalogEdgeTypeFilters"),
  catalogTags: document.getElementById("catalogTagFilters"),
  catalogReset: document.getElementById("catalogResetButton"),
  catalogSummary: document.getElementById("catalogResultSummary"),
  nodeResults: document.getElementById("nodeResults"),
  edgeResults: document.getElementById("edgeResults"),
  flowResults: document.getElementById("flowResults"),
  catalogDetailBadge: document.getElementById("catalogDetailBadge"),
  catalogDetailTitle: document.getElementById("catalogDetailTitle"),
  catalogDetailDescription: document.getElementById("catalogDetailDescription"),
  catalogDetailBody: document.getElementById("catalogDetailBody"),
  openGraph: document.getElementById("openGraphButton"),

  backToCatalog: document.getElementById("backToCatalogButton"),
  graphFocusCard: document.getElementById("graphFocusCard"),
  hiddenNodes: document.getElementById("hiddenNodeList"),
  restoreHidden: document.getElementById("restoreHiddenButton"),
  graphNodeTypes: document.getElementById("graphNodeTypeFilters"),
  graphEdgeTypes: document.getElementById("graphEdgeTypeFilters"),
  graphTags: document.getElementById("graphTagFilters"),
  graphReset: document.getElementById("graphResetButton"),
  depth: document.getElementById("depthInput"),
  depthValue: document.getElementById("depthValue"),
  focusType: document.getElementById("focusType"),
  focusTitle: document.getElementById("focusTitle"),
  focusDescription: document.getElementById("focusDescription"),
  fit: document.getElementById("fitButton"),
  expandSelected: document.getElementById("expandSelectedButton"),
  viewport: document.getElementById("graphViewport"),
  board: document.getElementById("graphBoard"),
  edgeLayer: document.getElementById("edgeLayer"),
  fieldEdgeLayer: document.getElementById("fieldEdgeLayer"),
  graphDetailBadge: document.getElementById("graphDetailBadge"),
  graphDetailTitle: document.getElementById("graphDetailTitle"),
  graphDetailDescription: document.getElementById("graphDetailDescription"),
  graphDetailBody: document.getElementById("graphDetailBody"),
};

const nodeMap = new Map(graph.nodes.map(node => [node.id, node]));
const edgeMap = new Map(graph.edges.map(edge => [edge.id, edge]));
const flows = flowData.flows || [];
const flowMap = new Map(flows.map(flow => [flow.id, flow]));
const childTypes = new Set(["column", "business_entity_property"]);
const topLevelNodes = graph.nodes.filter(node => !childTypes.has(node.type));

const typeColors = {
  business_entity: "#2563eb",
  term: "#0284c7",
  table: "#159947",
  view: "#16a34a",
  column: "#65a30d",
  business_entity_property: "#2563eb",
};

const typeLabels = {
  business_entity: "Entity Concept",
  business_entity_property: "Property",
  term: "Value Concept",
  table: "DB Table",
  view: "DB View",
  column: "Column",
};

const typeOrder = {
  business_entity: 1,
  term: 2,
  table: 3,
  view: 4,
};

const catalogState = {
  query: "",
  nodeTypes: new Set(nodeTypes()),
  edgeTypes: new Set(edgeTypes()),
  tags: new Set(allTags()),
  selectedKind: "node",
  selectedId: chooseInitialNode(),
};

const graphState = {
  focusId: catalogState.selectedId,
  selectedEdgeId: null,
  selectedFieldId: null,
  maxDepth: 1,
  nodeTypes: new Set(nodeTypes()),
  edgeTypes: new Set(edgeTypes()),
  tags: new Set(allTags()),
  expanded: new Set(),
  hiddenNodes: new Set(),
  flowId: "",
  manualPositions: new Map(),
  dragging: null,
  suppressNextClick: false,
  layoutRun: 0,
  visible: { nodes: [], edges: [], childEdges: [], depthById: new Map(), positions: new Map(), size: { ...DEFAULT_GRAPH_SIZE } },
};

const scenarioState = {
  selectedId: "",
  dirty: false,
  scenarios: loadSavedScenarios(),
};

function node(id) {
  return nodeMap.get(id);
}

function raw(id) {
  return catalog[id] || {};
}

function graphEdge(id) {
  return edgeMap.get(id);
}

function flow(id) {
  return flowMap.get(id);
}

function selectedFlow() {
  return graphState.flowId ? flow(graphState.flowId) : null;
}

function chooseInitialNode() {
  return (
    topLevelNodes.find(item => item.type === "business_entity")?.id ||
    topLevelNodes[0]?.id ||
    graph.nodes[0]?.id
  );
}

function nodeTypes() {
  return [...new Set(topLevelNodes.map(item => item.type))]
    .sort((a, b) => (typeOrder[a] || 99) - (typeOrder[b] || 99) || typeName(a).localeCompare(typeName(b)));
}

function edgeTypes() {
  return [...new Set(graph.edges.map(edge => normalizeType(edge.type)))].sort();
}

function allTags() {
  return [...new Set(topLevelNodes.flatMap(item => tagsFor(item.id)))].sort();
}

function tagFilterIsActive(selectedTags) {
  const tags = allTags();
  return tags.length > 0 && selectedTags.size < tags.length;
}

function normalizeType(type) {
  const aliases = {
    reads: "READS_FROM",
    derived_from: "DERIVES_FROM",
    field_lineage: "DERIVES_FROM",
    maps_to_property: "MAPS_TO",
    uses_term: "HAS_TERM",
    related_to: "RELATED_TO",
    contains: "CONTAINS",
  };
  return aliases[String(type || "RELATED_TO").toLowerCase()] || String(type || "RELATED_TO").toUpperCase();
}

function typeName(type) {
  return typeLabels[type] || titleCase(type);
}

function titleCase(value) {
  return String(value || "node")
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function colorFor(type) {
  return typeColors[type] || "#64748b";
}

function nodeFamily(type) {
  if (["business_entity", "term"].includes(type)) return "concept";
  if (["table", "view"].includes(type)) return "db";
  return "other";
}

function nodeFamilyLabel(type) {
  const family = nodeFamily(type);
  if (family === "concept") return "Concept";
  if (family === "db") return "DB";
  return "Node";
}

function label(id) {
  return node(id)?.label || raw(id).name || id;
}

function nodeType(id) {
  return node(id)?.type || raw(id).type || "node";
}

function description(id) {
  return node(id)?.properties?.description || raw(id).description || "";
}

function tagsFor(id) {
  const data = raw(id);
  const props = node(id)?.properties || {};
  return [...new Set([...(data.tags || []), ...(props.tags || [])].filter(Boolean))];
}

function parentOf(id) {
  const n = node(id);
  if (n?.properties?.parent) return n.properties.parent;
  if (raw(id).parent) return raw(id).parent;
  if (id?.startsWith("column.")) {
    const parts = id.split(".");
    if (parts.length >= 4) return `table.${parts[1]}.${parts[2]}`;
  }
  if (id?.match(/^business_entity\.[^.]+\.[^.]+$/)) return id.split(".").slice(0, 2).join(".");
  return id;
}

function isChildNode(idOrNode) {
  const n = typeof idOrNode === "string" ? node(idOrNode) : idOrNode;
  return Boolean(n && childTypes.has(n.type));
}

function normalizedEdge(edge, sourceParent = parentOf(edge.source), targetParent = parentOf(edge.target)) {
  return {
    id: edge.id || `${edge.source}|${edge.type}|${edge.target}`,
    type: normalizeType(edge.type),
    source: sourceParent,
    target: targetParent,
    sourceOriginal: edge.source,
    targetOriginal: edge.target,
    description: edge.properties?.description || "",
    sourceField: edge.properties?.source_field || "",
    constraints: edge.properties?.constraints || [],
    isFieldLevel: sourceParent !== edge.source || targetParent !== edge.target,
    raw: edge,
  };
}

function parentEdges() {
  return aggregateVisualEdges(dedupeExactEdges(graph.edges
    .filter(edge => !isChildNode(edge.source) && !isChildNode(edge.target))
    .map(edge => normalizedEdge(edge))
    .filter(edge => edge.source !== edge.target && node(edge.source) && node(edge.target))));
}

function childEdges() {
  return aggregateVisualEdges(dedupeExactEdges(graph.edges
    .filter(edge => isChildNode(edge.source) || isChildNode(edge.target))
    .map(edge => normalizedEdge(edge))
    .filter(edge => edge.source !== edge.target && node(edge.source) && node(edge.target))), true);
}

function dedupeExactEdges(edges) {
  const seen = new Set();
  return edges.filter(edge => {
    const key = `${edge.source}|${edge.target}|${edge.type}|${edge.sourceOriginal}|${edge.targetOriginal}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function aggregateVisualEdges(edges, useOriginalEndpoints = false) {
  const groups = new Map();
  edges.forEach(edge => {
    const key = edgePairKey(edge, useOriginalEndpoints);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(edge);
  });
  return [...groups.entries()].map(([key, group]) => {
    if (group.length === 1) return { ...group[0], relationships: [group[0]], types: [group[0].type], bidirectional: false };
    const primary = group[0];
    const types = [...new Set(group.map(edge => edge.type))];
    const directions = new Set(group.map(edge => `${edge.source}->${edge.target}`));
    return {
      ...primary,
      id: `visual.${key.replace(/[^a-zA-Z0-9_.-]+/g, "_")}`,
      type: primary.type,
      types,
      description: `${group.length} relationships between ${label(primary.source)} and ${label(primary.target)}.`,
      constraints: group.flatMap(edge => edge.constraints || []),
      relationships: group,
      bidirectional: directions.size > 1,
      raw: group.map(edge => edge.raw),
    };
  });
}

function edgePairKey(edge, useOriginalEndpoints = false) {
  const source = useOriginalEndpoints ? edge.sourceOriginal : edge.source;
  const target = useOriginalEndpoints ? edge.targetOriginal : edge.target;
  return [source, target].sort().join("||");
}

function edgeRelationships(edge) {
  return edge.relationships?.length ? edge.relationships : [edge];
}

function focusContextRelationships(edge) {
  const relationships = edgeRelationships(edge);
  const focus = graphState.focusId;
  const outgoing = relationships.filter(item => item.source === focus || item.sourceOriginal === focus);
  if (outgoing.length) return outgoing;
  const incoming = relationships.filter(item => item.target === focus || item.targetOriginal === focus);
  if (incoming.length) return incoming;
  return relationships;
}

function relationshipTypesLabel(relationships) {
  const types = [...new Set(relationships.map(item => item.type).filter(Boolean))];
  if (!types.length) return 'RELATED_TO';
  if (types.length <= 2) return types.join(' / ');
  return `${types.slice(0, 2).join(' / ')} +${types.length - 2}`;
}

function edgePassesTypeFilter(edge, selectedTypes) {
  return edgeRelationships(edge).some(item => selectedTypes.has(item.type));
}

function edgeIsSelected(edge) {
  if (!graphState.selectedEdgeId) return false;
  return edge.id === graphState.selectedEdgeId || edgeRelationships(edge).some(item => item.id === graphState.selectedEdgeId);
}

function searchTextForNode(id) {
  const data = raw(id);
  const n = node(id);
  return [
    id,
    n?.label,
    n?.type,
    n?.properties?.description,
    data.name,
    data.description,
    data.definition,
    data.owner,
    ...(data.aliases || []),
    ...tagsFor(id),
    ...(data.columns || []).flatMap(col => [col.name, col.description, col.term, col.data_type]),
    ...(data.properties || []).flatMap(prop => [prop.name, prop.description, prop.term, prop.semantic_role]),
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchTextForEdge(edge) {
  const normalized = normalizedEdge(edge);
  return [
    edge.id,
    normalized.type,
    normalized.description,
    normalized.sourceOriginal,
    normalized.targetOriginal,
    label(normalized.source),
    label(normalized.target),
    nodeType(normalized.source),
    nodeType(normalized.target),
    ...tagsFor(normalized.source),
    ...tagsFor(normalized.target),
  ].filter(Boolean).join(" ").toLowerCase();
}

function searchTextForFlow(flowItem) {
  return [
    flowItem.id,
    flowItem.name,
    flowItem.description,
    flowItem.owner,
    ...(flowItem.tags || []),
    ...(flowItem.nodes || []),
    ...(flowItem.edges || []).flatMap(edge => [
      edge.id,
      edge.base_edge,
      edge.type,
      edge.label,
      edge.description,
      edge.lifecycle,
      edge.dependency,
      edge.sla,
      edge.condition,
      edge.source,
      edge.target,
    ]),
    ...(flowItem.edge_dependencies || []).flatMap(dep => [dep.from, dep.to, dep.type, dep.description, dep.condition]),
  ].filter(Boolean).join(" ").toLowerCase();
}

function edgePassesCatalogFilters(edge) {
  const normalized = normalizedEdge(edge);
  if (!catalogState.edgeTypes.has(normalized.type)) return false;
  const sourceType = nodeType(normalized.source);
  const targetType = nodeType(normalized.target);
  if (!catalogState.nodeTypes.has(sourceType) && !catalogState.nodeTypes.has(targetType)) return false;
  if (tagFilterIsActive(catalogState.tags)) {
    const edgeTags = [...tagsFor(normalized.source), ...tagsFor(normalized.target)];
    if (![...catalogState.tags].some(tag => edgeTags.includes(tag))) return false;
  }
  if (catalogState.query && !searchTextForEdge(edge).includes(catalogState.query)) return false;
  return true;
}

function flowPassesCatalogFilters(flowItem) {
  if (catalogState.query && !searchTextForFlow(flowItem).includes(catalogState.query)) return false;
  return true;
}

function nodePassesCatalogFilters(item) {
  if (!catalogState.nodeTypes.has(item.type)) return false;
  if (tagFilterIsActive(catalogState.tags) && ![...catalogState.tags].some(tag => tagsFor(item.id).includes(tag))) return false;
  if (catalogState.query && !searchTextForNode(item.id).includes(catalogState.query)) return false;
  return true;
}

function renderAll() {
  renderStats();
  renderCatalog();
  if (!els.graphPage.classList.contains("hidden")) renderGraphPage();
}

function renderStats() {
  els.stats.textContent = `${topLevelNodes.length} catalog nodes · ${graph.edges.length} graph edges · ${flows.length} flows`;
}

function loadSavedScenarios() {
  try {
    const parsed = JSON.parse(readScenarioStorage() || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(item => item && item.id && item.name && item.view)
      .sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  } catch {
    return [];
  }
}

function persistSavedScenarios() {
  writeScenarioStorage(JSON.stringify(scenarioState.scenarios));
}

function readScenarioStorage() {
  try {
    if (typeof localStorage !== "undefined") return localStorage.getItem(SCENARIO_STORAGE_KEY);
  } catch {
    return scenarioMemoryStore;
  }
  return scenarioMemoryStore;
}

function writeScenarioStorage(value) {
  scenarioMemoryStore = value;
  try {
    if (typeof localStorage !== "undefined") localStorage.setItem(SCENARIO_STORAGE_KEY, value);
  } catch {
    // Some embedded browser contexts disable localStorage; keep scenarios for the current page session.
  }
}

function scenarioStorageIsPersistent() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function renderScenarioControls() {
  if (!els.scenarioSelect) return;
  const selected = scenarioState.scenarios.find(item => item.id === scenarioState.selectedId);
  els.scenarioSelect.innerHTML = [
    `<option value=""></option>`,
    ...scenarioState.scenarios.map(item => `<option value="${escapeAttr(item.id)}">${escapeHtml(item.name)}</option>`),
  ].join("");
  els.scenarioSelect.value = selected && !scenarioState.dirty ? selected.id : "";
  if (document.activeElement !== els.scenarioName) {
    els.scenarioName.value = selected?.name || "";
  }
  els.updateScenario.disabled = !selected;
  els.deleteScenario.disabled = !selected;
}

function markScenarioDirty() {
  if (!scenarioState.selectedId || scenarioState.dirty) return;
  scenarioState.dirty = true;
  renderScenarioControls();
}

function markScenarioDirtyForGraph(kind = "") {
  if (kind && !kind.startsWith("graph-")) return;
  markScenarioDirty();
}

function collectScenarioPositions() {
  const positions = new Map(graphState.visible.positions || []);
  graphState.manualPositions.forEach((value, id) => positions.set(id, value));
  return [...positions.entries()]
    .filter(([id]) => node(id))
    .map(([id, value]) => [id, { x: Math.round(value.x || 0), y: Math.round(value.y || 0) }]);
}

function currentScenarioView() {
  return {
    flowId: graphState.flowId,
    focusId: graphState.focusId,
    maxDepth: graphState.maxDepth,
    nodeTypes: [...graphState.nodeTypes],
    edgeTypes: [...graphState.edgeTypes],
    tags: [...graphState.tags],
    expanded: [...graphState.expanded],
    hiddenNodes: [...graphState.hiddenNodes],
    selectedEdgeId: graphState.selectedEdgeId,
    selectedFieldId: graphState.selectedFieldId,
    positions: collectScenarioPositions(),
    scroll: {
      left: Math.round(els.viewport.scrollLeft || 0),
      top: Math.round(els.viewport.scrollTop || 0),
    },
  };
}

function saveNewScenario() {
  const now = new Date().toISOString();
  const name = els.scenarioName.value.trim() || `${label(graphState.focusId)} depth ${graphState.maxDepth}`;
  const scenario = {
    id: `scenario.${Date.now()}`,
    name,
    createdAt: now,
    updatedAt: now,
    view: currentScenarioView(),
  };
  scenarioState.scenarios = [
    scenario,
    ...scenarioState.scenarios,
  ].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  scenarioState.selectedId = scenario.id;
  scenarioState.dirty = false;
  persistSavedScenarios();
  renderScenarioControls();
  setScenarioHint(`Saved new scenario "${name}"${scenarioStorageIsPersistent() ? "." : " for this page session."}`);
}

function updateSelectedScenario() {
  const existing = scenarioState.scenarios.find(item => item.id === scenarioState.selectedId);
  if (!existing) {
    setScenarioHint("Select a saved scenario before updating.");
    return;
  }
  const now = new Date().toISOString();
  const name = els.scenarioName.value.trim() || existing.name;
  const scenario = {
    ...existing,
    name,
    updatedAt: now,
    view: currentScenarioView(),
  };
  scenarioState.scenarios = [
    scenario,
    ...scenarioState.scenarios.filter(item => item.id !== scenario.id),
  ].sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  scenarioState.selectedId = scenario.id;
  scenarioState.dirty = false;
  persistSavedScenarios();
  renderScenarioControls();
  setScenarioHint(`Updated "${name}"${scenarioStorageIsPersistent() ? "." : " for this page session."}`);
}

function applyScenario(id) {
  const scenario = scenarioState.scenarios.find(item => item.id === id);
  if (!scenario) {
    scenarioState.selectedId = "";
    scenarioState.dirty = false;
    renderScenarioControls();
    return;
  }
  const view = scenario.view || {};
  graphState.focusId = node(view.focusId) && !isChildNode(view.focusId) ? view.focusId : chooseInitialNode();
  graphState.flowId = flow(view.flowId) ? view.flowId : "";
  graphState.maxDepth = clamp(Number(view.maxDepth) || 1, Number(els.depth.min) || 1, Number(els.depth.max) || 4);
  graphState.nodeTypes = restoredSet(view.nodeTypes, nodeTypes());
  graphState.edgeTypes = restoredSet(view.edgeTypes, edgeTypes());
  graphState.tags = restoredSet(view.tags, allTags());
  graphState.expanded = new Set((view.expanded || []).filter(id => node(id)));
  graphState.hiddenNodes = new Set((view.hiddenNodes || []).filter(id => node(id) && !isChildNode(id)));
  graphState.selectedEdgeId = view.selectedEdgeId && graphEdge(view.selectedEdgeId) ? view.selectedEdgeId : null;
  graphState.selectedFieldId = view.selectedFieldId && node(view.selectedFieldId) ? view.selectedFieldId : null;
  graphState.manualPositions = restoredPositions(view.positions);
  scenarioState.selectedId = scenario.id;
  scenarioState.dirty = false;
  renderGraphPage({ scrollAfter: view.scroll });
  setScenarioHint(`Loaded "${scenario.name}". Modify the graph, then use Update to overwrite it or Save new to create a copy.`);
}

function deleteSelectedScenario() {
  const selected = scenarioState.scenarios.find(item => item.id === scenarioState.selectedId);
  if (!selected) return;
  scenarioState.scenarios = scenarioState.scenarios.filter(item => item.id !== selected.id);
  scenarioState.selectedId = "";
  scenarioState.dirty = false;
  persistSavedScenarios();
  renderScenarioControls();
  setScenarioHint(`Deleted "${selected.name}".`);
}

function restoredSet(values, allowedValues) {
  if (!Array.isArray(values)) return new Set(allowedValues);
  const allowed = new Set(allowedValues);
  return new Set(values.filter(value => allowed.has(value)));
}

function restoredPositions(rows) {
  const positions = new Map();
  (Array.isArray(rows) ? rows : []).forEach(row => {
    const [id, value] = row;
    if (!node(id) || !value) return;
    positions.set(id, { x: Number(value.x) || 0, y: Number(value.y) || 0 });
  });
  return positions;
}

function setScenarioHint(message) {
  if (!els.scenarioHint) return;
  els.scenarioHint.textContent = message;
}

function renderCatalog() {
  renderCatalogFilters();
  const nodeRows = topLevelNodes
    .filter(nodePassesCatalogFilters)
    .sort((a, b) => scoreNode(b, catalogState.query) - scoreNode(a, catalogState.query) || `${a.type}:${a.label}`.localeCompare(`${b.type}:${b.label}`));
  const edgeRows = graph.edges
    .filter(edgePassesCatalogFilters)
    .sort((a, b) => normalizeType(a.type).localeCompare(normalizeType(b.type)) || a.source.localeCompare(b.source));
  const flowRows = flows
    .filter(flowPassesCatalogFilters)
    .sort((a, b) => scoreFlow(b, catalogState.query) - scoreFlow(a, catalogState.query) || a.name.localeCompare(b.name));

  els.catalogSummary.textContent = `${nodeRows.length} nodes, ${edgeRows.length} edges, and ${flowRows.length} flows match the current filters.`;
  els.nodeResults.innerHTML = nodeRows.length
    ? nodeRows.map(renderNodeResult).join("")
    : `<div class="empty-state">No nodes match the current filters.</div>`;
  els.edgeResults.innerHTML = edgeRows.length
    ? edgeRows.slice(0, 160).map(renderEdgeResult).join("")
    : `<div class="empty-state">No edges match the current filters.</div>`;
  els.flowResults.innerHTML = flowRows.length
    ? flowRows.map(renderFlowResult).join("")
    : `<div class="empty-state">No flows match the current keyword.</div>`;
  renderCatalogDetail();
}

function renderCatalogFilters() {
  els.catalogNodeTypes.innerHTML = nodeTypes()
    .map(type => chip(typeName(type), catalogState.nodeTypes.has(type), "catalog-node-type", type))
    .join("");
  els.catalogEdgeTypes.innerHTML = edgeTypes()
    .length
    ? multiSelect(edgeTypes(), catalogState.edgeTypes, "catalog-edge-type", "Edge types")
    : `<div class="empty-state">No edge types in current data.</div>`;
  const tags = allTags();
  els.catalogTags.innerHTML = tags.length
    ? multiSelect(tags, catalogState.tags, "catalog-tag", "Data type")
    : `<div class="empty-state">No data types in current data.</div>`;
}

function renderNodeResult(item) {
  return `
    <div class="result-item ${catalogState.selectedKind === "node" && catalogState.selectedId === item.id ? "selected" : ""}" data-catalog-node="${escapeAttr(item.id)}">
      <div class="result-row">
        <span class="result-dot" style="background:${colorFor(item.type)}"></span>
        <div>
          <div class="result-name">${escapeHtml(item.label)}</div>
          <div class="result-meta">${escapeHtml(typeName(item.type))} · ${escapeHtml(item.id)}</div>
        </div>
      </div>
      <button class="inline-action" data-open-graph-node="${escapeAttr(item.id)}" type="button">Graph</button>
    </div>
  `;
}

function renderEdgeResult(edge) {
  const normalized = normalizedEdge(edge);
  const selected = catalogState.selectedKind === "edge" && catalogState.selectedId === edge.id;
  return `
    <div class="edge-item ${selected ? "selected" : ""}" data-catalog-edge="${escapeAttr(edge.id)}">
      <div class="edge-line">
        <strong>${escapeHtml(label(normalized.source))}</strong>
        <span class="edge-pill">${escapeHtml(normalized.type)}</span>
        <strong>${escapeHtml(label(normalized.target))}</strong>
      </div>
      <div class="edge-meta">${escapeHtml(normalized.sourceOriginal)} -> ${escapeHtml(normalized.targetOriginal)}</div>
      ${normalized.description ? `<div class="edge-meta">${escapeHtml(normalized.description)}</div>` : ""}
      <button class="inline-action" data-open-graph-edge="${escapeAttr(edge.id)}" type="button">Graph</button>
    </div>
  `;
}

function renderFlowResult(flowItem) {
  const selected = catalogState.selectedKind === "flow" && catalogState.selectedId === flowItem.id;
  return `
    <div class="flow-item ${selected ? "selected" : ""}" data-catalog-flow="${escapeAttr(flowItem.id)}">
      <div class="flow-result-heading">
        <span class="type-pill flow-pill">Flow</span>
        <strong>${escapeHtml(flowItem.name)}</strong>
      </div>
      <div class="edge-meta">${escapeHtml(flowItem.id)}</div>
      <div class="edge-meta">${escapeHtml((flowItem.nodes || []).length)} nodes · ${escapeHtml((flowItem.edges || []).length)} flow edges</div>
      ${flowItem.description ? `<div class="edge-meta">${escapeHtml(flowItem.description)}</div>` : ""}
      <button class="inline-action" data-open-graph-flow="${escapeAttr(flowItem.id)}" type="button">Graph</button>
    </div>
  `;
}

function scoreNode(item, query) {
  if (!query) return 0;
  const name = String(item.label || "").toLowerCase();
  const id = item.id.toLowerCase();
  if (name === query || id === query) return 100;
  if (name.startsWith(query)) return 80;
  if (id.includes(query)) return 50;
  if (searchTextForNode(item.id).includes(query)) return 20;
  return 0;
}

function scoreFlow(flowItem, query) {
  if (!query) return 0;
  const name = String(flowItem.name || "").toLowerCase();
  const id = flowItem.id.toLowerCase();
  if (name === query || id === query) return 100;
  if (name.startsWith(query)) return 80;
  if (id.includes(query)) return 50;
  if (searchTextForFlow(flowItem).includes(query)) return 20;
  return 0;
}

function renderCatalogDetail() {
  const isEdge = catalogState.selectedKind === "edge";
  const isFlow = catalogState.selectedKind === "flow";
  const id = catalogState.selectedId;
  const selectedNode = isEdge ? null : node(id);
  const selectedEdge = isEdge ? graphEdge(id) : null;
  const selectedCatalogFlow = isFlow ? flow(id) : null;

  if (!selectedNode && !selectedEdge && !selectedCatalogFlow) {
    els.catalogDetailBadge.textContent = "Nothing selected";
    els.catalogDetailTitle.textContent = "Select a result";
    els.catalogDetailDescription.textContent = "The raw YAML-derived catalog record, graph edge, or flow will appear here.";
    els.catalogDetailBody.innerHTML = "";
    els.openGraph.disabled = true;
    return;
  }

  els.openGraph.disabled = false;
  if (selectedCatalogFlow) {
    renderFlowCatalogDetail(selectedCatalogFlow);
    return;
  }

  if (selectedEdge) {
    const normalized = normalizedEdge(selectedEdge);
    els.catalogDetailBadge.textContent = "Edge";
    els.catalogDetailBadge.style.background = "#eef2f7";
    els.catalogDetailBadge.style.color = "#475467";
    els.catalogDetailTitle.textContent = normalized.type;
    els.catalogDetailDescription.textContent = normalized.description || "No edge description.";
    els.catalogDetailBody.innerHTML = `
      <section class="detail-section">
        <h3>Edge Metadata</h3>
        ${kv("ID", selectedEdge.id)}
        ${kv("Type", normalized.type)}
        ${kv("Source", `${label(normalized.source)} (${selectedEdge.source})`)}
        ${kv("Target", `${label(normalized.target)} (${selectedEdge.target})`)}
      </section>
      ${renderConstraints(normalized.constraints, "Relationship Constraints")}
      <section class="detail-section">
        <h3>Raw Edge</h3>
        <pre class="raw-block">${escapeHtml(JSON.stringify(selectedEdge, null, 2))}</pre>
      </section>
    `;
    return;
  }

  const data = raw(selectedNode.id);
  els.catalogDetailBadge.textContent = typeName(selectedNode.type);
  els.catalogDetailBadge.style.background = `${colorFor(selectedNode.type)}18`;
  els.catalogDetailBadge.style.color = colorFor(selectedNode.type);
  els.catalogDetailTitle.textContent = selectedNode.label;
  els.catalogDetailDescription.textContent = description(selectedNode.id) || "No description.";
  els.catalogDetailBody.innerHTML = renderNodeDetail(selectedNode, data, true);
}

function renderFlowCatalogDetail(flowItem) {
  els.catalogDetailBadge.textContent = "Flow";
  els.catalogDetailBadge.style.background = "#fff7ed";
  els.catalogDetailBadge.style.color = "#b45309";
  els.catalogDetailTitle.textContent = flowItem.name;
  els.catalogDetailDescription.textContent = flowItem.description || "No flow description.";
  els.catalogDetailBody.innerHTML = `
    <section class="detail-section">
      <h3>Flow Metadata</h3>
      ${kv("ID", flowItem.id)}
      ${flowItem.owner ? kv("Owner", flowItem.owner) : ""}
      ${flowItem.source_file ? kv("Source", flowItem.source_file) : ""}
      ${flowItem.verified ? kv("Verified", [flowItem.verified.status ? "true" : "false", flowItem.verified.reason].filter(Boolean).join(" · ")) : ""}
      ${flowItem.tags?.length ? `<div class="tag-list">${flowItem.tags.map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
    </section>
    <section class="detail-section">
      <h3>Contained Nodes</h3>
      <div class="mini-list">${(flowItem.nodes || []).map(id => `
        <div class="mini-card" data-related-node="${escapeAttr(id)}">
          <span class="type-pill">${escapeHtml(typeName(nodeType(id)))}</span>
          <strong>${escapeHtml(label(id))}</strong>
          <small>${escapeHtml(id)}</small>
        </div>
      `).join("")}</div>
    </section>
    <section class="detail-section">
      <h3>Flow Edges</h3>
      ${renderFlowEdgeList(flowItem.edges || [])}
    </section>
    <section class="detail-section">
      <h3>Edge Dependencies</h3>
      ${renderFlowDependencyList(flowItem.edge_dependencies || [], flowItem)}
    </section>
    <section class="detail-section">
      <h3>Raw Flow</h3>
      <pre class="raw-block">${escapeHtml(JSON.stringify(flowItem.raw || flowItem, null, 2))}</pre>
    </section>
  `;
}

function renderFlowEdgeList(edges) {
  if (!edges.length) return `<div class="empty-state">No flow edges defined.</div>`;
  return `<div class="mini-list">${edges
    .slice()
    .sort((a, b) => Number(a.step || 0) - Number(b.step || 0))
    .map(edge => `
      <div class="mini-card" data-open-graph-flow-edge="${escapeAttr(edge.id)}">
        <span class="step-pill">Step ${escapeHtml(edge.step || "")}</span>
        <strong>${escapeHtml(edge.label || edge.type)}</strong>
        <small>${escapeHtml(label(edge.source))} -> ${escapeHtml(label(edge.target))}</small>
        ${edge.description ? `<p>${escapeHtml(edge.description)}</p>` : ""}
      </div>
    `).join("")}</div>`;
}

function renderFlowDependencyList(dependencies, flowItem) {
  if (!dependencies.length) return `<div class="empty-state">No edge dependencies defined.</div>`;
  const edgeLabels = new Map((flowItem.edges || []).map(edge => [edge.id, `${edge.step}. ${edge.label || edge.type}`]));
  return `<div class="mini-list">${dependencies.map(dep => `
    <div class="mini-card">
      <span class="edge-pill">${escapeHtml(dep.type || "PRECEDES")}</span>
      <strong>${escapeHtml(edgeLabels.get(dep.from) || dep.from)} -> ${escapeHtml(edgeLabels.get(dep.to) || dep.to)}</strong>
      ${dep.condition ? `<small>${escapeHtml(dep.condition)}</small>` : ""}
      ${dep.description ? `<p>${escapeHtml(dep.description)}</p>` : ""}
    </div>
  `).join("")}</div>`;
}

function renderNodeDetail(item, data, includeRaw) {
  const children = childItems(item.id);
  const relationships = parentEdges()
    .filter(edge => edge.source === item.id || edge.target === item.id)
    .slice(0, 100);
  return `
    <section class="detail-section">
      <h3>Overview</h3>
      ${kv("ID", item.id)}
      ${kv("Type", typeName(item.type))}
      ${description(item.id) ? kv("Description", description(item.id)) : ""}
      ${data.term ? kv("Term", data.term) : ""}
      ${data.definition ? kv("Definition", data.definition) : ""}
      ${data.schema ? kv("Schema", data.schema) : ""}
      ${data.owner ? kv("Owner", data.owner) : ""}
      ${data.verified ? kv("Verified", [data.verified.status ? "true" : "false", data.verified.reason].filter(Boolean).join(" · ")) : ""}
      ${item.properties?.source_file ? kv("Source", item.properties.source_file) : ""}
      ${tagsFor(item.id).length ? `<div class="tag-list">${tagsFor(item.id).map(tag => `<span class="tag-pill">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
    </section>
    ${renderConstraints(data.constraints || item.properties?.constraints, "Entity Constraints")}
    <section class="detail-section">
      <h3>Fields / Properties</h3>
      ${children.length ? renderFieldTable(children) : `<div class="empty-state">No generated fields or properties.</div>`}
    </section>
    <section class="detail-section">
      <h3>Direct Relationships</h3>
      ${relationships.length ? `<div class="mini-list">${relationships.map(renderMiniEdgeCard).join("")}</div>` : `<div class="empty-state">No direct node-level relationships.</div>`}
    </section>
    ${includeRaw ? `
      <section class="detail-section">
        <h3>Raw Catalog Record</h3>
        <pre class="raw-block">${escapeHtml(JSON.stringify(data, null, 2))}</pre>
      </section>
    ` : ""}
  `;
}

function renderMiniEdgeCard(edge) {
  const other = edge.source === graphState.focusId ? edge.target : edge.source;
  return `
    <div class="mini-card" data-related-node="${escapeAttr(other)}" data-mini-edge="${escapeAttr(edge.id)}">
      <span class="edge-pill">${escapeHtml(edgeLabel(edge))}</span>
      <strong>${escapeHtml(label(other))}</strong>
      <small>${escapeHtml(typeName(nodeType(other)))} · ${escapeHtml(other)}</small>
      ${edge.description ? `<p>${escapeHtml(edge.description)}</p>` : ""}
    </div>
  `;
}

function renderGraphPage(options = {}) {
  if (graphState.flowId && !flow(graphState.flowId)) graphState.flowId = "";
  if (!graphState.focusId || !node(graphState.focusId)) graphState.focusId = chooseInitialNode();
  ensureVisibleFocus();
  clearHiddenSelections();
  graphState.visible = graphNeighborhood();
  renderScenarioControls();
  renderGraphFilters();
  renderGraphFocus();
  renderHiddenNodes();
  renderGraph(options);
  renderGraphDetail();
}

function renderGraphFilters() {
  els.depth.value = String(graphState.maxDepth);
  els.depthValue.textContent = String(graphState.maxDepth);
  els.graphNodeTypes.innerHTML = nodeTypes()
    .map(type => chip(typeName(type), graphState.nodeTypes.has(type), "graph-node-type", type))
    .join("");
  els.graphEdgeTypes.innerHTML = edgeTypes()
    .length
    ? multiSelect(edgeTypes(), graphState.edgeTypes, "graph-edge-type", "Edge types")
    : `<div class="empty-state">No edge types in current data.</div>`;
  const tags = allTags();
  els.graphTags.innerHTML = tags.length
    ? multiSelect(tags, graphState.tags, "graph-tag", "Data type")
    : `<div class="empty-state">No data types in current data.</div>`;
}

function renderGraphFocus() {
  const activeFlow = selectedFlow();
  if (activeFlow) {
    els.graphFocusCard.innerHTML = `
      <strong>${escapeHtml(activeFlow.name)}</strong>
      <small>Flow · ${escapeHtml(activeFlow.id)}</small>
    `;
    els.focusType.textContent = "Flow";
    els.focusType.style.background = "#fff7ed";
    els.focusType.style.color = "#b45309";
    els.focusTitle.textContent = activeFlow.name;
    els.focusDescription.textContent = activeFlow.description || "Flow graph.";
    els.expandSelected.textContent = allVisibleFieldNodesExpanded() ? "Hide all fields" : "Show all fields";
    return;
  }
  const focus = node(graphState.focusId);
  els.graphFocusCard.innerHTML = `
    <strong>${escapeHtml(label(graphState.focusId))}</strong>
    <small>${escapeHtml(typeName(focus?.type))} · ${escapeHtml(graphState.focusId)}</small>
  `;
  els.focusType.textContent = typeName(focus?.type);
  els.focusType.style.background = `${colorFor(focus?.type)}18`;
  els.focusType.style.color = colorFor(focus?.type);
  els.focusTitle.textContent = label(graphState.focusId);
  els.focusDescription.textContent = description(graphState.focusId) || "No description.";
  els.expandSelected.textContent = allVisibleFieldNodesExpanded() ? "Hide all fields" : "Show all fields";
}

function renderHiddenNodes() {
  const rows = [...graphState.hiddenNodes].filter(id => node(id));
  els.restoreHidden.disabled = rows.length === 0;
  els.hiddenNodes.innerHTML = rows.length
    ? rows.map(id => `
      <div class="hidden-node-row">
        <span>
          <strong>${escapeHtml(label(id))}</strong>
          <small>${escapeHtml(typeName(nodeType(id)))}</small>
        </span>
        <button type="button" data-restore-graph-node="${escapeAttr(id)}">Restore</button>
      </div>
    `).join("")
    : `<div class="empty-state compact">No hidden nodes in this graph.</div>`;
}

function graphNeighborhood() {
  if (selectedFlow()) return flowGraphNeighborhood(selectedFlow());

  const traversalEdges = parentEdges().filter(edge => {
    if (!graphNodeVisible(edge.source) || !graphNodeVisible(edge.target)) return false;
    if (!edgePassesTypeFilter(edge, graphState.edgeTypes)) return false;
    if (!graphNodeTypeAllowed(edge.source) || !graphNodeTypeAllowed(edge.target)) return false;
    if (tagFilterIsActive(graphState.tags)) {
      const tagPool = [...tagsFor(edge.source), ...tagsFor(edge.target)];
      if (![...graphState.tags].some(tag => tagPool.includes(tag))) return false;
    }
    return true;
  });
  const adjacency = new Map();
  traversalEdges.forEach(edge => {
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    if (!adjacency.has(edge.target)) adjacency.set(edge.target, []);
    adjacency.get(edge.source).push(edge);
    adjacency.get(edge.target).push(edge);
  });

  const visited = new Map([[graphState.focusId, 0]]);
  const queue = [graphState.focusId];
  while (queue.length) {
    const current = queue.shift();
    const depth = visited.get(current);
    if (depth >= graphState.maxDepth) continue;
    for (const edge of adjacency.get(current) || []) {
      const next = edge.source === current ? edge.target : edge.source;
      if (visited.has(next)) continue;
      visited.set(next, depth + 1);
      queue.push(next);
    }
  }

  const nodeSet = new Set([...visited.keys()].filter(id => node(id)));
  const selectedChildEdges = selectedFieldEdges().filter(edge => {
    if (!graphNodeVisible(edge.source) || !graphNodeVisible(edge.target)) return false;
    if (!edgePassesTypeFilter(edge, graphState.edgeTypes)) return false;
    if (!graphNodeTypeAllowed(edge.source) || !graphNodeTypeAllowed(edge.target)) return false;
    if (tagFilterIsActive(graphState.tags)) {
      const tagPool = [...tagsFor(edge.source), ...tagsFor(edge.target)];
      if (![...graphState.tags].some(tag => tagPool.includes(tag))) return false;
    }
    return true;
  });

  selectedChildEdges.forEach(edge => {
    [edge.source, edge.target].forEach(id => {
      if (!node(id)) return;
      nodeSet.add(id);
      if (!visited.has(id)) {
        const anchor = nodeSet.has(edge.source) ? edge.source : graphState.focusId;
        visited.set(id, (visited.get(anchor) || 0) + 1);
      }
    });
  });

  const visibleEdges = traversalEdges.filter(edge => {
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) return false;
    return true;
  });
  const visibleChildEdges = selectedChildEdges.filter(edge => {
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) return false;
    return true;
  });
  return {
    nodes: [...nodeSet].map(id => node(id)),
    edges: visibleEdges,
    childEdges: visibleChildEdges,
    depthById: visited,
    positions: new Map(),
    size: { ...DEFAULT_GRAPH_SIZE },
  };
}

function flowGraphNeighborhood(flowItem) {
  const nodeSet = new Set((flowItem.nodes || []).filter(id => node(id) && graphNodeVisible(id)));
  const flowEdges = (flowItem.edges || [])
    .map(normalizedFlowEdge)
    .filter(edge => {
      if (!node(edge.source) || !node(edge.target)) return false;
      if (!graphNodeVisible(edge.source) || !graphNodeVisible(edge.target)) return false;
      nodeSet.add(edge.source);
      nodeSet.add(edge.target);
      return true;
    })
    .filter(edge => nodeSet.has(edge.source) && nodeSet.has(edge.target));
  const flowChildEdges = selectedFieldEdges().filter(edge => {
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) return false;
    if (!graphNodeVisible(edge.source) || !graphNodeVisible(edge.target)) return false;
    return true;
  });
  const depthById = new Map();
  [...nodeSet].forEach((id, index) => depthById.set(id, index));
  return {
    nodes: [...nodeSet].map(id => node(id)).filter(Boolean),
    edges: flowEdges,
    childEdges: flowChildEdges,
    depthById,
    positions: new Map(),
    size: { ...DEFAULT_GRAPH_SIZE },
  };
}

function normalizedFlowEdge(edge) {
  const base = edge.base_edge ? graphEdge(edge.base_edge) : null;
  const baseNormalized = base ? normalizedEdge(base) : null;
  return {
    id: edge.id,
    type: normalizeType(edge.type),
    source: edge.source,
    target: edge.target,
    sourceOriginal: edge.source,
    targetOriginal: edge.target,
    description: edge.description || baseNormalized?.description || "",
    constraints: edge.constraints || [],
    flowId: graphState.flowId,
    flowEdge: edge,
    baseEdgeId: edge.base_edge || "",
    baseEdge: baseNormalized,
    raw: edge.raw || edge,
  };
}

function graphNodeTypeAllowed(id) {
  return id === graphState.focusId || graphState.nodeTypes.has(nodeType(id));
}

function graphNodeVisible(id) {
  return !graphState.hiddenNodes.has(id);
}

function ensureVisibleFocus() {
  if (!graphState.hiddenNodes.has(graphState.focusId)) return;
  const replacement = chooseReplacementFocus(graphState.focusId);
  if (replacement) {
    graphState.focusId = replacement;
    return;
  }
  graphState.hiddenNodes.delete(graphState.focusId);
}

function clearHiddenSelections() {
  if (graphState.selectedFieldId && graphState.hiddenNodes.has(parentOf(graphState.selectedFieldId))) {
    graphState.selectedFieldId = null;
  }
  const selectedEdge = graphState.selectedEdgeId ? selectedGraphEdge() : null;
  if (selectedEdge && (graphState.hiddenNodes.has(selectedEdge.source) || graphState.hiddenNodes.has(selectedEdge.target))) {
    graphState.selectedEdgeId = null;
  }
}

function chooseReplacementFocus(excludedId) {
  const currentNodes = (graphState.visible.nodes || [])
    .map(item => item.id)
    .filter(id => id !== excludedId && node(id) && !isChildNode(id) && !graphState.hiddenNodes.has(id));
  if (currentNodes.length) return currentNodes[0];
  return topLevelNodes.find(item => item.id !== excludedId && !graphState.hiddenNodes.has(item.id))?.id || "";
}

function hideGraphNode(id) {
  if (!node(id) || isChildNode(id)) return;
  markScenarioDirty();
  graphState.hiddenNodes.add(id);
  graphState.expanded.delete(id);
  graphState.manualPositions.delete(id);
  if (graphState.selectedFieldId && parentOf(graphState.selectedFieldId) === id) graphState.selectedFieldId = null;
  const selectedEdge = selectedGraphEdge();
  if (selectedEdge && (selectedEdge.source === id || selectedEdge.target === id)) graphState.selectedEdgeId = null;
  if (graphState.focusId === id) {
    const replacement = chooseReplacementFocus(id);
    if (!replacement) {
      graphState.hiddenNodes.delete(id);
      setScenarioHint("Cannot hide the only visible node.");
      return;
    }
    graphState.focusId = replacement;
  }
  renderGraphPage({ fitAfter: true });
}

function restoreGraphNode(id) {
  markScenarioDirty();
  graphState.hiddenNodes.delete(id);
  renderGraphPage({ fitAfter: true });
}

function restoreAllHiddenNodes() {
  markScenarioDirty();
  graphState.hiddenNodes.clear();
  renderGraphPage({ fitAfter: true });
}

function selectedFieldEdges() {
  if (!graphState.selectedFieldId) return [];
  return childEdges().filter(edge => edge.sourceOriginal === graphState.selectedFieldId || edge.targetOriginal === graphState.selectedFieldId);
}

async function graphLayout(nodes, depthById, edges = [], childEdgesForLayout = []) {
  if (elkLayoutEngine) {
    try {
      return await elkGraphLayout(nodes, edges, childEdgesForLayout);
    } catch (error) {
      console.warn("ELK layout failed, falling back to built-in graph layout.", error);
    }
  }
  return fallbackGraphLayout(nodes, depthById);
}

async function elkGraphLayout(nodes, edges = [], childEdgesForLayout = []) {
  const visibleIds = new Set(nodes.map(item => item.id));
  const elkGraph = {
    id: "metadata-graph",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "SPLINES",
      "elk.spacing.nodeNode": "64",
      "elk.layered.spacing.nodeNodeBetweenLayers": "110",
      "elk.layered.spacing.edgeNodeBetweenLayers": "36",
      "elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
      "elk.layered.layering.strategy": "NETWORK_SIMPLEX",
      "elk.layered.crossingMinimization.strategy": "LAYER_SWEEP",
    },
    children: nodes.map(item => ({
      id: item.id,
      width: estimatedNodeWidth(item.id),
      height: estimatedNodeHeight(item.id),
    })),
    edges: layoutEdgesForElk([...edges, ...childEdgesForLayout], visibleIds),
  };
  const result = await elkLayoutEngine.layout(elkGraph);
  const positions = new Map();
  (result.children || []).forEach(item => {
    positions.set(item.id, {
      x: Math.round((item.x || 0) + GRAPH_PADDING),
      y: Math.round((item.y || 0) + GRAPH_PADDING),
    });
  });
  const width = Math.max(DEFAULT_GRAPH_SIZE.width, Math.ceil((result.width || DEFAULT_GRAPH_SIZE.width) + GRAPH_PADDING * 2));
  const height = Math.max(DEFAULT_GRAPH_SIZE.height, Math.ceil((result.height || DEFAULT_GRAPH_SIZE.height) + GRAPH_PADDING * 2));
  applyManualPositions(positions, width, height);
  return { positions, size: { width, height } };
}

function layoutEdgesForElk(edges, visibleIds) {
  const seen = new Set();
  return edges
    .map(edge => layoutEdgeDirection(edge))
    .filter(edge => edge.source !== edge.target && visibleIds.has(edge.source) && visibleIds.has(edge.target))
    .filter(edge => {
      const key = `${edge.source}|${edge.target}|${edge.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((edge, index) => ({
      id: `layout-edge-${index}`,
      sources: [edge.source],
      targets: [edge.target],
    }));
}

function layoutEdgeDirection(edge) {
  if (["READS_FROM", "DERIVES_FROM", "REFERENCES", "DEPENDS_ON", "HAS_TERM"].includes(edge.type)) {
    return { ...edge, source: edge.target, target: edge.source };
  }
  return edge;
}

function fallbackGraphLayout(nodes, depthById) {
  const positions = new Map();
  const width = DEFAULT_GRAPH_SIZE.width;
  const height = DEFAULT_GRAPH_SIZE.height;
  const lanes = directionalLanes(nodes);
  positions.set(graphState.focusId, { x: 785, y: 560 });

  const expandedLayout = hasExpandedFieldNodes();
  const laneGap = expandedLayout ? 370 : 230;
  const topGap = expandedLayout ? 270 : 230;
  placeLane(lanes.left, 240, 170, laneGap, positions, width, height);
  placeLane(lanes.right, 1280, 170, laneGap, positions, width, height);
  placeLane(lanes.top, 690, 70, topGap, positions, width, height, true);
  placeLane(lanes.bottom, 690, expandedLayout ? 930 : 880, topGap, positions, width, height, true);

  const placed = new Set(positions.keys());
  const fallbackGroups = new Map();
  nodes.forEach(item => {
    if (placed.has(item.id)) return;
    const depth = depthById.get(item.id) || 1;
    if (!fallbackGroups.has(depth)) fallbackGroups.set(depth, []);
    fallbackGroups.get(depth).push(item);
  });

  [...fallbackGroups.entries()].forEach(([depth, group]) => {
    const radiusX = 420 + (depth - 1) * 250;
    const radiusY = 270 + (depth - 1) * 150;
    group.sort((a, b) => `${a.type}:${a.label}`.localeCompare(`${b.type}:${b.label}`));
    group.forEach((item, index) => {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / Math.max(group.length, 1);
      positions.set(item.id, {
        x: clamp(900 + Math.cos(angle) * radiusX - 115, 30, width - 260),
        y: clamp(640 + Math.sin(angle) * radiusY - 58, 30, height - 180),
      });
    });
  });
  applyManualPositions(positions, width, height);
  return { positions, size: { width, height } };
}

function applyManualPositions(positions, width, height) {
  graphState.manualPositions.forEach((manual, id) => {
    if (!positions.has(id)) return;
    const expanded = isExpandedNode(id);
    positions.set(id, {
      x: clamp(manual.x, 20, width - (expanded ? 320 : 260)),
      y: clamp(manual.y, 20, height - estimatedNodeHeight(id)),
    });
  });
}

function directionalLanes(nodes) {
  const visibleIds = new Set(nodes.map(item => item.id));
  const laneById = new Map([[graphState.focusId, "center"]]);
  const scoreById = new Map([[graphState.focusId, 0]]);
  const queue = [graphState.focusId];
  const edges = graphState.visible.edges;

  while (queue.length) {
    const current = queue.shift();
    const currentScore = scoreById.get(current) || 0;
    for (const edge of edges) {
      if (edge.source !== current && edge.target !== current) continue;
      const other = edge.source === current ? edge.target : edge.source;
      if (!visibleIds.has(other) || laneById.has(other)) continue;
      const delta = directionalDelta(edge, current);
      const nextScore = currentScore + delta.score;
      scoreById.set(other, nextScore);
      laneById.set(other, laneFor(other, edge, nextScore));
      queue.push(other);
    }
  }

  const lanes = { left: [], right: [], top: [], bottom: [] };
  nodes.forEach(item => {
    if (item.id === graphState.focusId) return;
    const lane = laneById.get(item.id) || laneFor(item.id, null, scoreById.get(item.id) || 0);
    lanes[lane].push(item);
  });
  Object.values(lanes).forEach(group => {
    group.sort((a, b) => {
      const da = graphState.visible.depthById.get(a.id) || 1;
      const db = graphState.visible.depthById.get(b.id) || 1;
      return da - db || `${a.type}:${a.label}`.localeCompare(`${b.type}:${b.label}`);
    });
  });
  return lanes;
}

function directionalDelta(edge, fromId) {
  const type = edge.type;
  const fromSource = edge.source === fromId;
  if (["READS_FROM", "DERIVES_FROM", "REFERENCES", "DEPENDS_ON"].includes(type)) {
    return { score: fromSource ? -1 : 1 };
  }
  if (["IMPLEMENTED_BY", "REPRESENTED_BY", "MAPS_TO"].includes(type)) {
    return { score: fromSource ? 1 : -1 };
  }
  if (["CREATES", "VALUES", "SETTLES", "AGGREGATES", "WRITES_TO", "INITIATES", "PRODUCES", "ENABLES", "PRECEDES"].includes(type)) {
    return { score: fromSource ? 1 : -1 };
  }
  return { score: 0 };
}

function laneFor(id, edge, score) {
  if (nodeType(id) === "term") return "top";
  if (edge?.type === "HAS_TERM") return "top";
  if (score < 0) return "left";
  if (score > 0) return "right";
  return "bottom";
}

function placeLane(group, startX, startY, gapY, positions, width, height, horizontal = false) {
  if (!group.length) return;
  group.forEach((item, index) => {
    if (horizontal) {
      positions.set(item.id, {
        x: clamp(startX + index * gapY, 30, width - 260),
        y: clamp(startY, 30, height - 180),
      });
      return;
    }
    positions.set(item.id, {
      x: clamp(startX, 30, width - 260),
      y: clamp(startY + index * gapY, 30, height - 180),
    });
  });
}

async function renderGraph(options = {}) {
  const model = graphState.visible;
  const layoutRun = ++graphState.layoutRun;
  const layout = await graphLayout(model.nodes, model.depthById, model.edges, model.childEdges);
  if (layoutRun !== graphState.layoutRun || model !== graphState.visible) return;
  const positions = layout.positions || new Map();
  model.positions = positions;
  model.size = layout.size || { ...DEFAULT_GRAPH_SIZE };
  setGraphCanvasSize(model.size);
  els.board.innerHTML = "";
  els.edgeLayer.innerHTML = "";
  els.fieldEdgeLayer.innerHTML = "";
  ensureArrowDefs(els.edgeLayer, "node");
  ensureArrowDefs(els.fieldEdgeLayer, "field");

  model.nodes.forEach(item => {
    const p = positions.get(item.id);
    if (!p) return;
    const isExpanded = isExpandedNode(item.id);
    const children = isExpanded ? childItems(item.id).slice(0, 18) : [];
    const div = document.createElement("div");
    div.className = `graph-node ${nodeFamily(item.type)}-node ${isExpanded ? "expanded" : ""} ${item.id === graphState.focusId ? "center selected" : ""}`;
    div.dataset.graphNode = item.id;
    div.style.left = `${p.x}px`;
    div.style.top = `${p.y}px`;
    div.innerHTML = `
      <div class="node-main">
        <button
          class="hide-node-button"
          data-hide-graph-node="${escapeAttr(item.id)}"
          type="button"
          aria-label="Hide ${escapeAttr(item.label)} from graph"
          title="Hide node"
        >×</button>
        <div class="node-top">
          <div class="node-title">
            <div class="node-title-text">
              <span class="node-kind-badge ${nodeFamily(item.type)}">${escapeHtml(nodeFamilyLabel(item.type))}</span>
              <strong>${escapeHtml(item.label)}</strong>
              <small>${escapeHtml(typeName(item.type))}</small>
            </div>
          </div>
          <div class="node-actions">
            ${childItems(item.id).length ? `<button class="expand-toggle" data-toggle-node-fields="${escapeAttr(item.id)}" type="button">${isExpanded ? "Hide" : "Show"}</button>` : ""}
          </div>
        </div>
        <div class="node-description">${escapeHtml(description(item.id) || item.id)}</div>
      </div>
      ${children.length ? `<div class="field-list">${children.map(renderChildRow).join("")}</div>` : ""}
    `;
    els.board.appendChild(div);
  });

  requestAnimationFrame(() => {
    drawEdges(model.edges, false, els.edgeLayer);
    drawEdges(model.childEdges, true, els.fieldEdgeLayer);
    if (options.scrollAfter) restoreGraphScroll(options.scrollAfter);
    else if (options.fitAfter) fitGraph();
  });
}

function restoreGraphScroll(scroll) {
  els.viewport.scrollTo({
    left: Math.max(0, Number(scroll?.left) || 0),
    top: Math.max(0, Number(scroll?.top) || 0),
    behavior: "auto",
  });
}

function setGraphCanvasSize(size) {
  const width = Math.max(DEFAULT_GRAPH_SIZE.width, Math.ceil(size?.width || DEFAULT_GRAPH_SIZE.width));
  const height = Math.max(DEFAULT_GRAPH_SIZE.height, Math.ceil(size?.height || DEFAULT_GRAPH_SIZE.height));
  [els.board, els.edgeLayer, els.fieldEdgeLayer].forEach(el => {
    el.style.width = `${width}px`;
    el.style.height = `${height}px`;
  });
}

function renderLaneLabels() {
  [
    { label: "Glossary / Terms", x: 690, y: 34 },
    { label: "Upstream / Dependencies", x: 200, y: 132 },
    { label: "Focus", x: 780, y: 500 },
    { label: "Downstream / Implementation", x: 1240, y: 132 },
    { label: "Related Context", x: 690, y: hasExpandedFieldNodes() ? 885 : 835 },
  ].forEach(item => {
    const div = document.createElement("div");
    div.className = "lane-label";
    div.style.left = `${item.x}px`;
    div.style.top = `${item.y}px`;
    div.textContent = item.label;
    els.board.appendChild(div);
  });
}

function renderChildRow(item) {
  return `
    <div class="field-row ${graphState.selectedFieldId === item.id ? "selected" : ""}" data-child-id="${escapeAttr(item.id)}" title="${escapeAttr(item.description || item.id)}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${escapeHtml(item.description || item.term || "No field description.")}</small>
      </div>
      <em>${escapeHtml(item.semanticRole || item.dataType || typeName(item.type))}</em>
    </div>
  `;
}

function isExpandedNode(id) {
  return graphState.expanded.has(id);
}

function isExpanded(id) {
  return isExpandedNode(id);
}

function visibleExpandableNodeIds() {
  return graphState.visible.nodes
    .map(item => item.id)
    .filter(id => childItems(id).length);
}

function allVisibleFieldNodesExpanded() {
  const ids = visibleExpandableNodeIds();
  return ids.length > 0 && ids.every(id => graphState.expanded.has(id));
}

function hasExpandedFieldNodes() {
  return visibleExpandableNodeIds().some(id => graphState.expanded.has(id));
}

function setAllVisibleFields(open) {
  visibleExpandableNodeIds().forEach(id => {
    if (open) graphState.expanded.add(id);
    else graphState.expanded.delete(id);
  });
}

function drawEdges(edges, fieldLevel, layer) {
  edges.forEach(edge => {
    const points = fieldLevel ? childAnchorPoints(edge) : nodeAnchorPoints(edge);
    if (!points) return;
    const { source, target } = points;
    const pathData = curvedPath(source, target);
    const selected = edgeIsSelected(edge);
    if (!fieldLevel) {
      const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hitPath.setAttribute("d", pathData);
      hitPath.setAttribute("class", `edge-hit ${selected ? "selected" : ""}`);
      hitPath.dataset.graphEdge = edge.id;
      hitPath.addEventListener("click", event => {
        event.stopPropagation();
        selectGraphEdge(edge);
      });
      layer.appendChild(hitPath);
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("class", `edge-path ${fieldLevel ? "field-edge" : ""} ${selected ? "selected" : ""}`);
    path.setAttribute(
      "marker-end",
      selected
        ? fieldLevel ? "url(#arrow-selected-field)" : "url(#arrow-selected-node)"
        : fieldLevel ? "url(#arrow-field)" : "url(#arrow-node)"
    );
    if (edge.bidirectional) {
      path.setAttribute(
        "marker-start",
        selected
          ? fieldLevel ? "url(#arrow-selected-field)" : "url(#arrow-selected-node)"
          : fieldLevel ? "url(#arrow-field)" : "url(#arrow-node)"
      );
    }
    path.dataset.graphEdge = edge.id;
    path.addEventListener("click", event => {
      event.stopPropagation();
      selectGraphEdge(edge);
    });
    layer.appendChild(path);

    if (!fieldLevel) {
      const labelEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
      labelEl.setAttribute("x", (source.x + target.x) / 2);
      labelEl.setAttribute("y", (source.y + target.y) / 2 - 6);
      labelEl.setAttribute("text-anchor", "middle");
      labelEl.setAttribute("class", `edge-label ${selected ? "selected" : ""}`);
      labelEl.dataset.graphEdge = edge.id;
      labelEl.textContent = edgeLabel(edge);
      labelEl.addEventListener("click", event => {
        event.stopPropagation();
        selectGraphEdge(edge);
      });
      layer.appendChild(labelEl);
    }
  });
}

function edgeLabel(edge) {
  if (edge.flowEdge) {
    return [
      edge.flowEdge.step ? `Step ${edge.flowEdge.step}` : "",
      edge.flowEdge.label || edge.type,
    ].filter(Boolean).join(" · ");
  }
  if (edgeRelationships(edge).length > 1) return relationshipTypesLabel(focusContextRelationships(edge));
  return edge.type;
}

function redrawGraphEdges() {
  els.edgeLayer.innerHTML = "";
  els.fieldEdgeLayer.innerHTML = "";
  ensureArrowDefs(els.edgeLayer, "node");
  ensureArrowDefs(els.fieldEdgeLayer, "field");
  drawEdges(graphState.visible.edges, false, els.edgeLayer);
  drawEdges(graphState.visible.childEdges, true, els.fieldEdgeLayer);
}

function ensureArrowDefs(layer, variant) {
  const markerId = variant === "field" ? "arrow-field" : "arrow-node";
  const selectedMarkerId = variant === "field" ? "arrow-selected-field" : "arrow-selected-node";
  const color = variant === "field" ? "#b7791f" : "#98a2b3";
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <marker id="${markerId}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${color}"></path>
    </marker>
    <marker id="${selectedMarkerId}" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f6feb"></path>
    </marker>
  `;
  layer.appendChild(defs);
}

function curvedPath(source, target) {
  return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
}

function nodeAnchorPoints(edge) {
  const sourceBox = graphNodeElement(edge.source);
  const targetBox = graphNodeElement(edge.target);
  if (!sourceBox || !targetBox) return null;
  return anchorPair(sourceBox, targetBox);
}

function childAnchorPoints(edge) {
  const sourceEl = edgeEndpointElement(edge.sourceOriginal, edge.source);
  const targetEl = edgeEndpointElement(edge.targetOriginal, edge.target);
  if (!sourceEl || !targetEl) return null;
  sourceEl.classList.add("connected");
  targetEl.classList.add("connected");
  return anchorPair(sourceEl, targetEl);
}

function edgeEndpointElement(originalId, parentId) {
  if (isChildNode(originalId)) return childElement(originalId);
  return graphNodeElement(originalId) || graphNodeElement(parentId);
}

function anchorPair(sourceEl, targetEl) {
  const s = relativeRect(sourceEl);
  const t = relativeRect(targetEl);
  const sourceCenter = { x: s.left + s.width / 2, y: s.top + s.height / 2 };
  const targetCenter = { x: t.left + t.width / 2, y: t.top + t.height / 2 };
  const dx = targetCenter.x - sourceCenter.x;
  return dx >= 0
    ? { source: { x: s.left + s.width, y: sourceCenter.y }, target: { x: t.left, y: targetCenter.y } }
    : { source: { x: s.left, y: sourceCenter.y }, target: { x: t.left + t.width, y: targetCenter.y } };
}

function graphNodeElement(id) {
  return els.board.querySelector(`[data-graph-node="${cssEscape(id)}"]`);
}

function childElement(id) {
  return els.board.querySelector(`[data-child-id="${cssEscape(id)}"]`);
}

function relativeRect(el) {
  const viewport = els.viewport.getBoundingClientRect();
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left - viewport.left + els.viewport.scrollLeft,
    top: rect.top - viewport.top + els.viewport.scrollTop,
    width: rect.width,
    height: rect.height,
  };
}

function rightMiddle(el) {
  const r = relativeRect(el);
  return { x: r.left + r.width, y: r.top + r.height / 2 };
}

function leftMiddle(el) {
  const r = relativeRect(el);
  return { x: r.left, y: r.top + r.height / 2 };
}

function renderGraphDetail() {
  const selectedField = selectedGraphField();
  if (selectedField) {
    renderFieldProfile(selectedField);
    return;
  }

  const selectedEdge = selectedGraphEdge();
  if (selectedEdge) {
    const relationships = edgeRelationships(selectedEdge);
    els.graphDetailBadge.textContent = "Edge";
    els.graphDetailBadge.style.background = "#eef2f7";
    els.graphDetailBadge.style.color = "#475467";
    els.graphDetailTitle.textContent = edgeLabel(selectedEdge);
    els.graphDetailDescription.textContent = relationships.length > 1
      ? `${relationships.length} relationships between ${label(selectedEdge.source)} and ${label(selectedEdge.target)}.`
      : selectedEdge.description || "No edge description.";
    els.graphDetailBody.innerHTML = `
      ${selectedEdge.flowEdge ? renderFlowEdgeProfile(selectedEdge) : ""}
      ${renderSelectedEdgeRelationships(selectedEdge)}
      ${selectedEdge.baseEdge ? renderBaseEdgeProfile(selectedEdge.baseEdge, selectedEdge.baseEdgeId) : ""}
      <section class="detail-section">
        <h3>${selectedEdge.flowEdge ? "Raw Flow Edge" : "Raw Edge"}</h3>
        <pre class="raw-block">${escapeHtml(JSON.stringify(selectedEdge.raw, null, 2))}</pre>
      </section>
    `;
    return;
  }

  const focus = node(graphState.focusId);
  const data = raw(graphState.focusId);
  els.graphDetailBadge.textContent = typeName(focus?.type);
  els.graphDetailBadge.style.background = `${colorFor(focus?.type)}18`;
  els.graphDetailBadge.style.color = colorFor(focus?.type);
  els.graphDetailTitle.textContent = label(graphState.focusId);
  els.graphDetailDescription.textContent = description(graphState.focusId) || "No description.";
  els.graphDetailBody.innerHTML = renderNodeDetail(focus, data, false);
}

function renderSelectedEdgeRelationships(edge) {
  const relationships = edgeRelationships(edge);
  if (relationships.length === 1) {
    const rel = relationships[0];
    return `
      <section class="detail-section">
        <h3>Relationship</h3>
        ${kv("Type", rel.type)}
        ${kv("Source", `${label(rel.source)} (${rel.sourceOriginal})`)}
        ${kv("Target", `${label(rel.target)} (${rel.targetOriginal})`)}
        ${kv("Description", rel.description || "No description.")}
      </section>
      ${renderConstraints(rel.constraints, "Relationship Constraints")}
    `;
  }
  return `
    <section class="detail-section">
      <h3>Relationships</h3>
      <div class="mini-list">
        ${relationships.map(renderRelationshipDetailCard).join("")}
      </div>
    </section>
  `;
}

function renderRelationshipDetailCard(rel) {
  return `
    <div class="mini-card">
      <span class="edge-pill">${escapeHtml(rel.type)}</span>
      <strong>${escapeHtml(label(rel.source))} -> ${escapeHtml(label(rel.target))}</strong>
      <small>${escapeHtml(rel.sourceOriginal)} -> ${escapeHtml(rel.targetOriginal)}</small>
      ${rel.description ? `<p>${escapeHtml(rel.description)}</p>` : ""}
      ${rel.constraints?.length ? `<div class="mini-list nested">${rel.constraints.map(renderConstraintCard).join("")}</div>` : ""}
    </div>
  `;
}

function renderFlowEdgeProfile(edge) {
  const meta = edge.flowEdge || {};
  const flowItem = selectedFlow();
  const dependencies = (flowItem?.edge_dependencies || []).filter(dep => dep.from === edge.id || dep.to === edge.id);
  return `
    <section class="detail-section flow-edge-profile">
      <h3>Flow Edge</h3>
      ${kv("Flow", flowItem?.name || edge.flowId || "")}
      ${meta.step ? kv("Step", meta.step) : ""}
      ${meta.label ? kv("Label", meta.label) : ""}
      ${meta.lifecycle ? kv("Lifecycle", meta.lifecycle) : ""}
      ${meta.dependency ? kv("Dependency", meta.dependency) : ""}
      ${meta.sla ? kv("SLA", meta.sla) : ""}
      ${meta.condition ? kv("Condition", meta.condition) : ""}
      ${meta.base_edge ? kv("Base Edge", meta.base_edge) : ""}
      ${meta.description ? kv("Flow Description", meta.description) : ""}
      ${dependencies.length ? `
        <div class="mini-list flow-dependencies">${dependencies.map(dep => `
          <div class="mini-card">
            <span class="edge-pill">${escapeHtml(dep.type || "PRECEDES")}</span>
            <strong>${escapeHtml(flowEdgeDependencyLabel(dep, edge.id, flowItem))}</strong>
            ${dep.condition ? `<small>${escapeHtml(dep.condition)}</small>` : ""}
            ${dep.description ? `<p>${escapeHtml(dep.description)}</p>` : ""}
          </div>
        `).join("")}</div>
      ` : ""}
    </section>
  `;
}

function flowEdgeDependencyLabel(dep, edgeId, flowItem) {
  const edgeLabels = new Map((flowItem?.edges || []).map(item => [item.id, `Step ${item.step}: ${item.label || item.type}`]));
  if (dep.from === edgeId) return `Next: ${edgeLabels.get(dep.to) || dep.to}`;
  return `Previous: ${edgeLabels.get(dep.from) || dep.from}`;
}

function renderBaseEdgeProfile(edge, baseEdgeId = "") {
  return `
    <section class="detail-section">
      <h3>Base Edge</h3>
      ${baseEdgeId ? kv("ID", baseEdgeId) : ""}
      ${kv("Type", edge.type)}
      ${kv("Source", `${label(edge.source)} (${edge.sourceOriginal})`)}
      ${kv("Target", `${label(edge.target)} (${edge.targetOriginal})`)}
      ${edge.description ? kv("Description", edge.description) : ""}
      <pre class="raw-block">${escapeHtml(JSON.stringify(edge.raw, null, 2))}</pre>
    </section>
  `;
}

function selectedGraphField() {
  if (!graphState.selectedFieldId) return null;
  const parentId = parentOf(graphState.selectedFieldId);
  const item = childItems(parentId).find(child => child.id === graphState.selectedFieldId);
  return item ? { ...item, parentId } : null;
}

function renderFieldProfile(field) {
  const relationships = [...parentEdges(), ...childEdges()]
    .filter(edge => edge.sourceOriginal === field.id || edge.targetOriginal === field.id || edge.source === field.id || edge.target === field.id);
  els.graphDetailBadge.textContent = typeName(field.type);
  els.graphDetailBadge.style.background = `${colorFor(field.type)}18`;
  els.graphDetailBadge.style.color = colorFor(field.type);
  els.graphDetailTitle.textContent = field.name;
  els.graphDetailDescription.textContent = field.description || field.id;
  els.graphDetailBody.innerHTML = `
    <section class="detail-section">
      <h3>Field / Property</h3>
      ${kv("ID", field.id)}
      ${kv("Parent", `${label(field.parentId)} (${field.parentId})`)}
      ${kv("Type", typeName(field.type))}
      ${field.description ? kv("Description", field.description) : ""}
      ${field.dataType ? kv("Data Type", field.dataType) : ""}
      ${field.nullable !== undefined && field.nullable !== "" ? kv("Nullable", String(field.nullable)) : ""}
      ${field.semanticRole ? kv("Semantic Role", field.semanticRole) : ""}
      ${field.term ? kv("Term", field.term) : ""}
    </section>
    ${field.mapsTo?.length ? `
      <section class="detail-section">
        <h3>Mappings</h3>
        <div class="mini-list">${field.mapsTo.map(target => `<div class="mini-card"><strong>${escapeHtml(target)}</strong></div>`).join("")}</div>
      </section>
    ` : ""}
    ${field.constraints?.length ? `
      <section class="detail-section">
        <h3>Constraints</h3>
        <div class="mini-list">${field.constraints.map(renderConstraintCard).join("")}</div>
      </section>
    ` : ""}
    ${field.lineage ? `
      <section class="detail-section">
        <h3>Lineage</h3>
        <pre class="raw-block">${escapeHtml(JSON.stringify(field.lineage, null, 2))}</pre>
      </section>
    ` : ""}
    <section class="detail-section">
      <h3>Relationships</h3>
      ${relationships.length ? `<div class="mini-list">${relationships.map(renderFieldRelationCard).join("")}</div>` : `<div class="empty-state">No field-level relationships are visible for this field.</div>`}
    </section>
    <section class="detail-section">
      <h3>Raw Field</h3>
      <pre class="raw-block">${escapeHtml(JSON.stringify(field.raw || field, null, 2))}</pre>
    </section>
  `;
}

function renderFieldRelationCard(edge) {
  const other = edge.sourceOriginal === graphState.selectedFieldId || edge.source === graphState.selectedFieldId
    ? edge.targetOriginal
    : edge.sourceOriginal;
  return `
    <div class="mini-card" data-mini-edge="${escapeAttr(edge.id)}">
      <span class="edge-pill">${escapeHtml(edgeLabel(edge))}</span>
      <strong>${escapeHtml(other || "")}</strong>
      ${edge.description ? `<p>${escapeHtml(edge.description)}</p>` : ""}
    </div>
  `;
}

function renderConstraints(constraints, title = "Constraints") {
  const rows = Array.isArray(constraints) ? constraints.filter(Boolean) : [];
  if (!rows.length) return "";
  return `
    <section class="detail-section">
      <h3>${escapeHtml(title)}</h3>
      <div class="mini-list">${rows.map(renderConstraintCard).join("")}</div>
    </section>
  `;
}

function renderConstraintCard(item) {
  return `
    <div class="mini-card constraint-card">
      <strong>${escapeHtml(item.type || "constraint")}</strong>
      ${item.severity ? `<small>${escapeHtml(item.severity)}</small>` : ""}
      ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
      ${item.expression ? `<p><code>${escapeHtml(item.expression)}</code></p>` : ""}
      ${item.fields?.length ? `<p>${escapeHtml(item.fields.join(", "))}</p>` : ""}
    </div>
  `;
}

function selectedGraphEdge() {
  if (!graphState.selectedEdgeId) return null;
  const visible = [...(graphState.visible.edges || []), ...(graphState.visible.childEdges || [])]
    .find(edge => edge.id === graphState.selectedEdgeId || edgeRelationships(edge).some(item => item.id === graphState.selectedEdgeId))
    || [...parentEdges(), ...childEdges()].find(edge => edge.id === graphState.selectedEdgeId || edgeRelationships(edge).some(item => item.id === graphState.selectedEdgeId));
  if (visible) return visible;
  const rawEdge = graphEdge(graphState.selectedEdgeId);
  return rawEdge ? normalizedEdge(rawEdge) : null;
}

function selectGraphEdge(edge) {
  if (graphState.selectedEdgeId !== edge.id || graphState.selectedFieldId) markScenarioDirty();
  graphState.selectedEdgeId = edge.id;
  graphState.selectedFieldId = null;
  renderGraphDetail();
  const selectedIds = new Set([edge.id, ...edgeRelationships(edge).map(item => item.id)]);
  allEdgeElements().forEach(item => {
    item.classList.toggle("selected", selectedIds.has(item.dataset.graphEdge));
  });
}

function selectGraphField(fieldId) {
  if (graphState.selectedFieldId !== fieldId || graphState.selectedEdgeId) markScenarioDirty();
  graphState.selectedFieldId = fieldId;
  graphState.selectedEdgeId = null;
  expandLinkedParentsForField(fieldId);
  renderGraphPage();
}

function allEdgeElements() {
  return [...els.edgeLayer.querySelectorAll(".edge-path, .edge-label, .edge-hit"), ...els.fieldEdgeLayer.querySelectorAll(".edge-path, .edge-label, .edge-hit")];
}

function expandLinkedParentsForField(fieldId) {
  const parentId = parentOf(fieldId);
  if (parentId) graphState.expanded.add(parentId);
  childEdges()
    .filter(edge => edge.sourceOriginal === fieldId || edge.targetOriginal === fieldId)
    .forEach(edge => {
      [edge.source, edge.target].forEach(id => {
        if (["business_entity", "table", "view"].includes(nodeType(id))) graphState.expanded.add(id);
      });
    });
}

function childItems(parentId) {
  const generated = graph.nodes
    .filter(item => parentOf(item.id) === parentId && childTypes.has(item.type))
    .map(item => ({
      id: item.id,
      name: item.label,
      type: item.type,
      dataType: item.properties?.data_type || "",
      description: item.properties?.description || "",
      semanticRole: item.properties?.semantic_role || "",
      term: item.properties?.term || "",
      raw: item.properties || {},
    }));
  const data = raw(parentId);
  const inlineColumns = (data.columns || []).map(col => ({
    id: col.id || columnId(parentId, col.name),
    name: col.name,
    type: "column",
    dataType: col.data_type || "",
    description: col.description || "",
    term: col.term || "",
    nullable: col.nullable,
    lineage: col.lineage,
    raw: col,
  }));
  const inlineProperties = (data.properties || []).map(prop => ({
    id: `${parentId}.${prop.name}`,
    name: prop.name,
    type: "business_entity_property",
    description: prop.description || "",
    semanticRole: prop.semantic_role || "",
    term: prop.term || "",
    mapsTo: prop.maps_to || [],
    constraints: prop.constraints || [],
    raw: prop,
  }));
  const byId = new Map();
  [...generated, ...inlineColumns, ...inlineProperties].forEach(item => {
    if (!item.name) return;
    byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function columnId(parentId, name) {
  if (parentId.startsWith("table.")) return `column.${parentId.slice("table.".length)}.${name}`;
  if (parentId.startsWith("view.")) return `column.${parentId.slice("view.".length)}.${name}`;
  return `${parentId}.${name}`;
}

function renderFieldTable(children) {
  return `
    <div class="field-table">
      ${children.map(item => `
        <div class="field-table-row">
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(item.description || item.term || item.id)}</small>
          </div>
          <span class="muted">${escapeHtml(item.semanticRole || item.dataType || typeName(item.type))}</span>
        </div>
      `).join("")}
    </div>
  `;
}

function chip(labelText, active, kind, value) {
  const tone = kind.endsWith("node-type") ? ` ${nodeTypeTone(value)}` : "";
  return `<button class="filter-chip${tone} ${active ? "active" : ""}" data-filter-kind="${escapeAttr(kind)}" data-filter-value="${escapeAttr(value)}" type="button">${escapeHtml(labelText)}</button>`;
}

function nodeTypeTone(type) {
  if (["business_entity", "term"].includes(type)) return "concept-chip";
  if (["table", "view"].includes(type)) return "physical-chip";
  return "";
}

function multiSelect(values, selected, kind, labelText) {
  const allLabel = labelText === "Data type" ? "data types" : labelText.toLowerCase();
  const countText = selected.size === values.length
    ? `All ${allLabel}`
    : `${selected.size} selected`;
  return `
    <details class="multi-select" data-filter-dropdown="${escapeAttr(kind)}">
      <summary>
        <span>${escapeHtml(countText)}</span>
      </summary>
      <div class="multi-select-menu">
        <div class="multi-actions">
          <button type="button" data-multi-action="select-all" data-multi-filter-kind="${escapeAttr(kind)}">Select all</button>
          <button type="button" data-multi-action="unselect-all" data-multi-filter-kind="${escapeAttr(kind)}">Unselect all</button>
        </div>
        ${values.map(value => `
          <label class="multi-option">
            <input
              type="checkbox"
              data-multi-filter-kind="${escapeAttr(kind)}"
              data-multi-filter-value="${escapeAttr(value)}"
              ${selected.has(value) ? "checked" : ""}
            />
            <span>${escapeHtml(value)}</span>
          </label>
        `).join("")}
      </div>
    </details>
  `;
}

function kv(key, value) {
  return `<div class="kv"><span>${escapeHtml(key)}</span><strong>${escapeHtml(String(value || ""))}</strong></div>`;
}

function openPage(page) {
  const showGraph = page === "graph";
  els.catalogPage.classList.toggle("hidden", showGraph);
  els.graphPage.classList.toggle("hidden", !showGraph);
  els.catalogTab.classList.toggle("active", !showGraph);
  els.graphTab.classList.toggle("active", showGraph);
  if (showGraph) {
    renderGraphPage({ fitAfter: true });
  } else {
    renderCatalog();
  }
}

function applyUrlState() {
  const params = new URLSearchParams(window.location.search);
  const focus = params.get("focus");
  const selectedNode = focus && node(focus) && !isChildNode(focus) ? focus : null;
  if (selectedNode) {
    catalogState.selectedKind = "node";
    catalogState.selectedId = selectedNode;
    graphState.focusId = selectedNode;
  }
  if (params.get("view") === "graph") openPage("graph");
  else renderAll();
}

function openSelectionInGraph() {
  const before = graphViewKey();
  if (catalogState.selectedKind === "flow") {
    openFlowInGraph(catalogState.selectedId);
    return;
  }
  graphState.flowId = "";
  if (catalogState.selectedKind === "edge") {
    const edge = graphEdge(catalogState.selectedId);
    if (edge) {
      const normalized = normalizedEdge(edge);
      graphState.focusId = normalized.source;
      graphState.selectedEdgeId = normalized.id;
      graphState.selectedFieldId = null;
      graphState.edgeTypes.add(normalized.type);
      if (isChildNode(edge.source)) graphState.expanded.add(normalized.source);
      if (isChildNode(edge.target)) graphState.expanded.add(normalized.target);
    }
  } else {
    graphState.focusId = catalogState.selectedId;
    graphState.selectedEdgeId = null;
    graphState.selectedFieldId = null;
  }
  if (graphViewKey() !== before) markScenarioDirty();
  openPage("graph");
}

function openFlowInGraph(flowId, selectedEdgeId = "") {
  const flowItem = flow(flowId);
  if (!flowItem) return;
  const before = graphViewKey();
  graphState.flowId = flowItem.id;
  graphState.focusId = (flowItem.nodes || []).find(id => node(id) && !isChildNode(id)) || chooseInitialNode();
  graphState.selectedEdgeId = selectedEdgeId;
  graphState.selectedFieldId = null;
  graphState.hiddenNodes.clear();
  graphState.manualPositions.clear();
  if (graphViewKey() !== before) markScenarioDirty();
  openPage("graph");
}

function graphViewKey() {
  return JSON.stringify({
    flowId: graphState.flowId,
    focusId: graphState.focusId,
    selectedEdgeId: graphState.selectedEdgeId,
    selectedFieldId: graphState.selectedFieldId,
    edgeTypes: [...graphState.edgeTypes].sort(),
    expanded: [...graphState.expanded].sort(),
  });
}

function resetCatalogFilters() {
  catalogState.query = "";
  catalogState.nodeTypes = new Set(nodeTypes());
  catalogState.edgeTypes = new Set(edgeTypes());
  catalogState.tags = new Set(allTags());
  els.catalogSearch.value = "";
  renderCatalog();
}

function resetGraphFilters() {
  markScenarioDirty();
  graphState.nodeTypes = new Set(nodeTypes());
  graphState.edgeTypes = new Set(edgeTypes());
  graphState.tags = new Set(allTags());
  graphState.maxDepth = 1;
  graphState.selectedEdgeId = null;
  graphState.selectedFieldId = null;
  graphState.expanded.clear();
  graphState.hiddenNodes.clear();
  graphState.manualPositions.clear();
  renderGraphPage({ fitAfter: true });
}

function toggleSet(set, value) {
  if (set.has(value)) set.delete(value);
  else set.add(value);
}

function updateMultiFilter(kind, value, checked) {
  const config = multiFilterConfig(kind);
  if (!config) return;
  markScenarioDirtyForGraph(kind);
  if (checked) config.set.add(value);
  else config.set.delete(value);
  renderAll();
  reopenFilterDropdown(kind);
}

function applyMultiAction(kind, action) {
  const config = multiFilterConfig(kind);
  if (!config) return;
  markScenarioDirtyForGraph(kind);
  config.set.clear();
  if (action === "select-all") {
    config.values().forEach(item => config.set.add(item));
  }
  renderAll();
  reopenFilterDropdown(kind);
}

function multiFilterConfig(kind) {
  const configs = {
    "catalog-edge-type": { set: catalogState.edgeTypes, values: edgeTypes },
    "catalog-tag": { set: catalogState.tags, values: allTags },
    "graph-edge-type": { set: graphState.edgeTypes, values: edgeTypes },
    "graph-tag": { set: graphState.tags, values: allTags },
  };
  return configs[kind];
}

function reopenFilterDropdown(kind) {
  const dropdown = document.querySelector(`[data-filter-dropdown="${cssEscape(kind)}"]`);
  if (dropdown) dropdown.setAttribute("open", "");
}

function closeFilterDropdowns(except) {
  document.querySelectorAll("[data-filter-dropdown][open]").forEach(dropdown => {
    if (except && dropdown === except) return;
    dropdown.removeAttribute("open");
  });
}

function fitGraph() {
  const bounds = visibleGraphBounds();
  const viewportWidth = Math.max(els.viewport.clientWidth, 320);
  const viewportHeight = Math.max(els.viewport.clientHeight, 260);
  const left = Math.max(0, bounds.left + bounds.width / 2 - viewportWidth / 2);
  const top = Math.max(0, bounds.top + bounds.height / 2 - viewportHeight / 2);
  els.viewport.scrollTo({ left, top, behavior: "smooth" });
}

function visibleGraphBounds() {
  const positions = graphState.visible.positions || new Map();
  const nodeIds = graphState.visible.nodes.map(item => item.id).filter(id => positions.has(id));
  const size = graphState.visible.size || DEFAULT_GRAPH_SIZE;
  if (!nodeIds.length) return { left: 0, top: 0, width: size.width, height: size.height };
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  nodeIds.forEach(id => {
    const p = positions.get(id);
    const expandedHeight = estimatedNodeHeight(id);
    const nodeWidth = estimatedNodeWidth(id);
    left = Math.min(left, p.x);
    top = Math.min(top, p.y);
    right = Math.max(right, p.x + nodeWidth);
    bottom = Math.max(bottom, p.y + expandedHeight);
  });
  const paddedLeft = Math.max(0, left - 120);
  const paddedTop = Math.max(0, top - 100);
  return {
    left: paddedLeft,
    top: paddedTop,
    width: Math.min(size.width, right + 120) - paddedLeft,
    height: Math.min(size.height, bottom + 100) - paddedTop,
  };
}

function estimatedExpandedHeight(id) {
  const rows = childItems(id).slice(0, 18).length;
  return 118 + rows * 68;
}

function estimatedNodeHeight(id) {
  return isExpandedNode(id) ? estimatedExpandedHeight(id) : 120;
}

function estimatedNodeWidth(id) {
  return isExpandedNode(id) ? 280 : 230;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return String(value).replace(/["\\]/g, "\\$&");
}

function startGraphNodeDrag(event) {
  if (graphState.dragging) return;
  if (event.button !== 0) return;
  const graphNode = event.target.closest("[data-graph-node]");
  if (!graphNode) return;
  if (event.target.closest("button, [data-child-id], .field-row, .edge-label, .edge-path")) return;
  const id = graphNode.dataset.graphNode;
  const current = graphState.visible.positions.get(id) || {
    x: Number.parseFloat(graphNode.style.left) || 0,
    y: Number.parseFloat(graphNode.style.top) || 0,
  };
  graphState.dragging = {
    id,
    nodeEl: graphNode,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: current.x,
    startY: current.y,
    moved: false,
  };
}

function dragGraphNode(event) {
  const drag = graphState.dragging;
  if (!drag) return;
  const dx = event.clientX - drag.startClientX;
  const dy = event.clientY - drag.startClientY;
  if (!drag.moved && Math.hypot(dx, dy) < 4) return;
  drag.moved = true;
  markScenarioDirty();
  event.preventDefault();
  const width = drag.nodeEl.offsetWidth || 260;
  const height = drag.nodeEl.offsetHeight || estimatedNodeHeight(drag.id);
  const size = graphState.visible.size || DEFAULT_GRAPH_SIZE;
  const x = clamp(drag.startX + dx, 20, size.width - width - 20);
  const y = clamp(drag.startY + dy, 20, size.height - height - 20);
  drag.nodeEl.classList.add("dragging");
  drag.nodeEl.style.left = `${x}px`;
  drag.nodeEl.style.top = `${y}px`;
  graphState.manualPositions.set(drag.id, { x, y });
  graphState.visible.positions.set(drag.id, { x, y });
  redrawGraphEdges();
}

function endGraphNodeDrag() {
  const drag = graphState.dragging;
  if (!drag) return;
  drag.nodeEl.classList.remove("dragging");
  graphState.suppressNextClick = drag.moved;
  graphState.dragging = null;
}

document.addEventListener("click", event => {
  if (graphState.suppressNextClick) {
    graphState.suppressNextClick = false;
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const dropdown = event.target.closest("[data-filter-dropdown]");
  if (dropdown) {
    closeFilterDropdowns(dropdown);
  } else {
    closeFilterDropdowns();
  }

  const multiAction = event.target.closest("[data-multi-action]");
  if (multiAction) {
    applyMultiAction(multiAction.dataset.multiFilterKind, multiAction.dataset.multiAction);
    event.preventDefault();
    event.stopPropagation();
    return;
  }

  const openNode = event.target.closest("[data-open-graph-node]");
  if (openNode) {
    catalogState.selectedKind = "node";
    catalogState.selectedId = openNode.dataset.openGraphNode;
    graphState.flowId = "";
    if (
      graphState.focusId !== catalogState.selectedId ||
      graphState.selectedEdgeId ||
      graphState.selectedFieldId
    ) {
      markScenarioDirty();
    }
    graphState.focusId = catalogState.selectedId;
    graphState.selectedEdgeId = null;
    graphState.selectedFieldId = null;
    openPage("graph");
    event.stopPropagation();
    return;
  }

  const openEdge = event.target.closest("[data-open-graph-edge]");
  if (openEdge) {
    catalogState.selectedKind = "edge";
    catalogState.selectedId = openEdge.dataset.openGraphEdge;
    openSelectionInGraph();
    event.stopPropagation();
    return;
  }

  const openFlow = event.target.closest("[data-open-graph-flow]");
  if (openFlow) {
    catalogState.selectedKind = "flow";
    catalogState.selectedId = openFlow.dataset.openGraphFlow;
    openSelectionInGraph();
    event.stopPropagation();
    return;
  }

  const openFlowEdge = event.target.closest("[data-open-graph-flow-edge]");
  if (openFlowEdge && catalogState.selectedKind === "flow") {
    openFlowInGraph(catalogState.selectedId, openFlowEdge.dataset.openGraphFlowEdge);
    event.stopPropagation();
    return;
  }

  const childRow = event.target.closest("[data-child-id]");
  if (childRow) {
    selectGraphField(childRow.dataset.childId);
    event.stopPropagation();
    return;
  }

  const hideNode = event.target.closest("[data-hide-graph-node]");
  if (hideNode) {
    hideGraphNode(hideNode.dataset.hideGraphNode);
    event.stopPropagation();
    return;
  }

  const restoreNode = event.target.closest("[data-restore-graph-node]");
  if (restoreNode) {
    restoreGraphNode(restoreNode.dataset.restoreGraphNode);
    event.stopPropagation();
    return;
  }

  const catalogNode = event.target.closest("[data-catalog-node]");
  if (catalogNode) {
    catalogState.selectedKind = "node";
    catalogState.selectedId = catalogNode.dataset.catalogNode;
    renderCatalog();
    return;
  }

  const catalogEdge = event.target.closest("[data-catalog-edge]");
  if (catalogEdge) {
    catalogState.selectedKind = "edge";
    catalogState.selectedId = catalogEdge.dataset.catalogEdge;
    renderCatalog();
    return;
  }

  const catalogFlow = event.target.closest("[data-catalog-flow]");
  if (catalogFlow) {
    catalogState.selectedKind = "flow";
    catalogState.selectedId = catalogFlow.dataset.catalogFlow;
    renderCatalog();
    return;
  }

  const graphNode = event.target.closest("[data-graph-node]");
  if (graphNode && !event.target.closest("[data-toggle-node-fields]")) {
    const nextFocusId = graphNode.dataset.graphNode;
    const wasFlowGraph = Boolean(graphState.flowId);
    if (
      graphState.focusId !== nextFocusId ||
      graphState.flowId ||
      graphState.selectedEdgeId ||
      graphState.selectedFieldId
    ) {
      markScenarioDirty();
    }
    graphState.flowId = "";
    graphState.focusId = nextFocusId;
    graphState.selectedEdgeId = null;
    graphState.selectedFieldId = null;
    if (wasFlowGraph) {
      graphState.hiddenNodes.clear();
      graphState.manualPositions.clear();
    }
    renderGraphPage({ fitAfter: wasFlowGraph });
    return;
  }

  const expand = event.target.closest("[data-toggle-node-fields]");
  if (expand) {
    const id = expand.dataset.toggleNodeFields;
    const willCollapse = graphState.expanded.has(id);
    markScenarioDirty();
    toggleSet(graphState.expanded, id);
    if (willCollapse && graphState.selectedFieldId && parentOf(graphState.selectedFieldId) === id) {
      graphState.selectedFieldId = null;
      graphState.selectedEdgeId = null;
    }
    renderGraphPage();
    return;
  }

  const related = event.target.closest("[data-related-node]");
  if (related) {
    markScenarioDirty();
    graphState.flowId = "";
    graphState.focusId = related.dataset.relatedNode;
    graphState.selectedEdgeId = related.dataset.miniEdge || null;
    graphState.selectedFieldId = null;
    openPage("graph");
    return;
  }

  const filter = event.target.closest("[data-filter-kind]");
  if (!filter) return;
  const kind = filter.dataset.filterKind;
  const value = filter.dataset.filterValue;
  if (kind === "catalog-node-type") toggleSet(catalogState.nodeTypes, value);
  if (kind === "catalog-edge-type") toggleSet(catalogState.edgeTypes, value);
  if (kind === "catalog-tag") toggleSet(catalogState.tags, value);
  if (kind === "graph-node-type") {
    markScenarioDirty();
    toggleSet(graphState.nodeTypes, value);
  }
  if (kind === "graph-edge-type") {
    markScenarioDirty();
    toggleSet(graphState.edgeTypes, value);
  }
  if (kind === "graph-tag") {
    markScenarioDirty();
    toggleSet(graphState.tags, value);
  }
  renderAll();
});

document.addEventListener("change", event => {
  const multi = event.target.closest("[data-multi-filter-kind]");
  if (!multi) return;
  updateMultiFilter(multi.dataset.multiFilterKind, multi.dataset.multiFilterValue, multi.checked);
  event.stopPropagation();
});

els.catalogSearch.addEventListener("input", event => {
  catalogState.query = event.target.value.trim().toLowerCase();
  renderCatalog();
});
els.catalogReset.addEventListener("click", resetCatalogFilters);
els.openGraph.addEventListener("click", openSelectionInGraph);
els.catalogTab.addEventListener("click", () => openPage("catalog"));
els.graphTab.addEventListener("click", () => openPage("graph"));
els.backToCatalog.addEventListener("click", () => openPage("catalog"));
els.scenarioSelect.addEventListener("change", event => applyScenario(event.target.value));
els.saveScenario.addEventListener("click", saveNewScenario);
els.updateScenario.addEventListener("click", updateSelectedScenario);
els.deleteScenario.addEventListener("click", deleteSelectedScenario);
els.restoreHidden.addEventListener("click", restoreAllHiddenNodes);
els.depth.addEventListener("input", event => {
  markScenarioDirty();
  graphState.maxDepth = Number(event.target.value);
  renderGraphPage();
});
els.graphReset.addEventListener("click", resetGraphFilters);
els.fit.addEventListener("click", () => {
  markScenarioDirty();
  fitGraph();
});
els.expandSelected.addEventListener("click", () => {
  markScenarioDirty();
  const open = !allVisibleFieldNodesExpanded();
  setAllVisibleFields(open);
  if (!open) {
    graphState.selectedFieldId = null;
    graphState.selectedEdgeId = null;
  }
  renderGraphPage();
});
document.addEventListener("pointerdown", startGraphNodeDrag);
document.addEventListener("pointermove", dragGraphNode);
document.addEventListener("pointerup", endGraphNodeDrag);
document.addEventListener("pointercancel", endGraphNodeDrag);
document.addEventListener("mousedown", startGraphNodeDrag);
document.addEventListener("mousemove", dragGraphNode);
document.addEventListener("mouseup", endGraphNodeDrag);

applyUrlState();

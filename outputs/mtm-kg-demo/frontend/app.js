const graph = window.GRAPH_DATA || { nodes: [], edges: [] };
const catalog = window.CATALOG_DATA || {};
const DEFAULT_GRAPH_SIZE = { width: 1800, height: 1300 };
const GRAPH_PADDING = 90;
const elkLayoutEngine = window.ELK ? new window.ELK() : null;

const els = {
  stats: document.getElementById("stats"),
  catalogTab: document.getElementById("catalogTab"),
  graphTab: document.getElementById("graphTab"),
  catalogPage: document.getElementById("catalogPage"),
  graphPage: document.getElementById("graphPage"),

  catalogSearch: document.getElementById("catalogSearchInput"),
  catalogNodeTypes: document.getElementById("catalogNodeTypeFilters"),
  catalogEdgeTypes: document.getElementById("catalogEdgeTypeFilters"),
  catalogTags: document.getElementById("catalogTagFilters"),
  catalogReset: document.getElementById("catalogResetButton"),
  catalogSummary: document.getElementById("catalogResultSummary"),
  nodeResults: document.getElementById("nodeResults"),
  edgeResults: document.getElementById("edgeResults"),
  catalogDetailBadge: document.getElementById("catalogDetailBadge"),
  catalogDetailTitle: document.getElementById("catalogDetailTitle"),
  catalogDetailDescription: document.getElementById("catalogDetailDescription"),
  catalogDetailBody: document.getElementById("catalogDetailBody"),
  openGraph: document.getElementById("openGraphButton"),

  backToCatalog: document.getElementById("backToCatalogButton"),
  graphFocusCard: document.getElementById("graphFocusCard"),
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
const childTypes = new Set(["column", "business_entity_property"]);
const topLevelNodes = graph.nodes.filter(node => !childTypes.has(node.type));

const typeColors = {
  business_entity: "#7c3aed",
  term: "#0891b2",
  table: "#159947",
  view: "#22a35a",
  column: "#65a30d",
  business_entity_property: "#9333ea",
};

const typeLabels = {
  business_entity: "Business Entity",
  business_entity_property: "Property",
  term: "Term",
  table: "Table",
  view: "View",
  column: "Column",
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
  manualPositions: new Map(),
  dragging: null,
  suppressNextClick: false,
  layoutRun: 0,
  visible: { nodes: [], edges: [], childEdges: [], depthById: new Map(), positions: new Map(), size: { ...DEFAULT_GRAPH_SIZE } },
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

function chooseInitialNode() {
  return (
    topLevelNodes.find(item => item.type === "business_entity")?.id ||
    topLevelNodes[0]?.id ||
    graph.nodes[0]?.id
  );
}

function nodeTypes() {
  return [...new Set(topLevelNodes.map(item => item.type))].sort();
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
  return dedupeEdges(graph.edges
    .filter(edge => !isChildNode(edge.source) && !isChildNode(edge.target))
    .map(edge => normalizedEdge(edge))
    .filter(edge => edge.source !== edge.target && node(edge.source) && node(edge.target)));
}

function childEdges() {
  return dedupeEdges(graph.edges
    .filter(edge => isChildNode(edge.source) || isChildNode(edge.target))
    .map(edge => normalizedEdge(edge))
    .filter(edge => edge.source !== edge.target && node(edge.source) && node(edge.target)));
}

function dedupeEdges(edges) {
  const seen = new Set();
  return edges.filter(edge => {
    const key = `${edge.source}|${edge.target}|${edge.type}|${edge.sourceOriginal}|${edge.targetOriginal}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
  els.stats.textContent = `${topLevelNodes.length} catalog nodes · ${graph.edges.length} graph edges`;
}

function renderCatalog() {
  renderCatalogFilters();
  const nodeRows = topLevelNodes
    .filter(nodePassesCatalogFilters)
    .sort((a, b) => scoreNode(b, catalogState.query) - scoreNode(a, catalogState.query) || `${a.type}:${a.label}`.localeCompare(`${b.type}:${b.label}`));
  const edgeRows = graph.edges
    .filter(edgePassesCatalogFilters)
    .sort((a, b) => normalizeType(a.type).localeCompare(normalizeType(b.type)) || a.source.localeCompare(b.source));

  els.catalogSummary.textContent = `${nodeRows.length} nodes and ${edgeRows.length} edges match the current filters.`;
  els.nodeResults.innerHTML = nodeRows.length
    ? nodeRows.map(renderNodeResult).join("")
    : `<div class="empty-state">No nodes match the current filters.</div>`;
  els.edgeResults.innerHTML = edgeRows.length
    ? edgeRows.slice(0, 160).map(renderEdgeResult).join("")
    : `<div class="empty-state">No edges match the current filters.</div>`;
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

function renderCatalogDetail() {
  const isEdge = catalogState.selectedKind === "edge";
  const id = catalogState.selectedId;
  const selectedNode = isEdge ? null : node(id);
  const selectedEdge = isEdge ? graphEdge(id) : null;

  if (!selectedNode && !selectedEdge) {
    els.catalogDetailBadge.textContent = "Nothing selected";
    els.catalogDetailTitle.textContent = "Select a result";
    els.catalogDetailDescription.textContent = "The raw YAML-derived catalog record or graph edge will appear here.";
    els.catalogDetailBody.innerHTML = "";
    els.openGraph.disabled = true;
    return;
  }

  els.openGraph.disabled = false;
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
      <span class="edge-pill">${escapeHtml(edge.type)}</span>
      <strong>${escapeHtml(label(other))}</strong>
      <small>${escapeHtml(typeName(nodeType(other)))} · ${escapeHtml(other)}</small>
      ${edge.description ? `<p>${escapeHtml(edge.description)}</p>` : ""}
    </div>
  `;
}

function renderGraphPage(options = {}) {
  if (!graphState.focusId || !node(graphState.focusId)) graphState.focusId = chooseInitialNode();
  graphState.visible = graphNeighborhood();
  renderGraphFilters();
  renderGraphFocus();
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

function graphNeighborhood() {
  const traversalEdges = parentEdges().filter(edge => {
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
    if (!graphState.edgeTypes.has(edge.type)) return false;
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
    if (!graphState.edgeTypes.has(edge.type)) return false;
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

function graphNodeTypeAllowed(id) {
  return id === graphState.focusId || graphState.nodeTypes.has(nodeType(id));
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
  if (["CREATES", "VALUES", "SETTLES", "AGGREGATES", "WRITES_TO"].includes(type)) {
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
    div.className = `graph-node ${isExpanded ? "expanded" : ""} ${item.id === graphState.focusId ? "center selected" : ""}`;
    div.dataset.graphNode = item.id;
    div.style.left = `${p.x}px`;
    div.style.top = `${p.y}px`;
    div.innerHTML = `
      <div class="node-main">
        <div class="node-top">
          <div class="node-title">
            <span class="node-dot" style="background:${colorFor(item.type)}"></span>
            <div>
              <strong>${escapeHtml(item.label)}</strong>
              <small>${escapeHtml(typeName(item.type))}</small>
            </div>
          </div>
      ${childItems(item.id).length ? `<button class="expand-toggle" data-toggle-node-fields="${escapeAttr(item.id)}" type="button">${isExpanded ? "Hide" : "Show"}</button>` : ""}
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
    if (options.fitAfter) fitGraph();
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
    if (!fieldLevel) {
      const hitPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      hitPath.setAttribute("d", pathData);
      hitPath.setAttribute("class", `edge-hit ${edge.id === graphState.selectedEdgeId ? "selected" : ""}`);
      hitPath.dataset.graphEdge = edge.id;
      hitPath.addEventListener("click", event => {
        event.stopPropagation();
        selectGraphEdge(edge);
      });
      layer.appendChild(hitPath);
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", pathData);
    path.setAttribute("class", `edge-path ${fieldLevel ? "field-edge" : ""} ${edge.id === graphState.selectedEdgeId ? "selected" : ""}`);
    path.setAttribute(
      "marker-end",
      edge.id === graphState.selectedEdgeId
        ? fieldLevel ? "url(#arrow-selected-field)" : "url(#arrow-selected-node)"
        : fieldLevel ? "url(#arrow-field)" : "url(#arrow-node)"
    );
    path.dataset.graphEdge = edge.id;
    path.addEventListener("click", event => {
      event.stopPropagation();
      selectGraphEdge(edge);
    });
    layer.appendChild(path);

    const labelEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
    labelEl.setAttribute("x", (source.x + target.x) / 2);
    labelEl.setAttribute("y", (source.y + target.y) / 2 - 6);
    labelEl.setAttribute("text-anchor", "middle");
    labelEl.setAttribute("class", `edge-label ${edge.id === graphState.selectedEdgeId ? "selected" : ""}`);
    labelEl.dataset.graphEdge = edge.id;
    labelEl.textContent = edge.type;
    labelEl.addEventListener("click", event => {
      event.stopPropagation();
      selectGraphEdge(edge);
    });
    layer.appendChild(labelEl);
  });
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
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    const bend = Math.max(60, Math.abs(dx) * 0.45);
    const sign = dx >= 0 ? 1 : -1;
    return `M ${source.x} ${source.y} C ${source.x + bend * sign} ${source.y}, ${target.x - bend * sign} ${target.y}, ${target.x} ${target.y}`;
  }
  const bend = Math.max(60, Math.abs(dy) * 0.45);
  const sign = dy >= 0 ? 1 : -1;
  return `M ${source.x} ${source.y} C ${source.x} ${source.y + bend * sign}, ${target.x} ${target.y - bend * sign}, ${target.x} ${target.y}`;
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
  const dy = targetCenter.y - sourceCenter.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0
      ? { source: { x: s.left + s.width, y: sourceCenter.y }, target: { x: t.left, y: targetCenter.y } }
      : { source: { x: s.left, y: sourceCenter.y }, target: { x: t.left + t.width, y: targetCenter.y } };
  }
  return dy >= 0
    ? { source: { x: sourceCenter.x, y: s.top + s.height }, target: { x: targetCenter.x, y: t.top } }
    : { source: { x: sourceCenter.x, y: s.top }, target: { x: targetCenter.x, y: t.top + t.height } };
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
    els.graphDetailBadge.textContent = "Edge";
    els.graphDetailBadge.style.background = "#eef2f7";
    els.graphDetailBadge.style.color = "#475467";
    els.graphDetailTitle.textContent = selectedEdge.type;
    els.graphDetailDescription.textContent = selectedEdge.description || "No edge description.";
    els.graphDetailBody.innerHTML = `
      <section class="detail-section">
        <h3>Relationship</h3>
        ${kv("Type", selectedEdge.type)}
        ${kv("Source", `${label(selectedEdge.source)} (${selectedEdge.sourceOriginal})`)}
        ${kv("Target", `${label(selectedEdge.target)} (${selectedEdge.targetOriginal})`)}
        ${kv("Description", selectedEdge.description || "No description.")}
      </section>
      ${renderConstraints(selectedEdge.constraints, "Relationship Constraints")}
      <section class="detail-section">
        <h3>Raw Edge</h3>
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
      <span class="edge-pill">${escapeHtml(edge.type)}</span>
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
  const visible = [...parentEdges(), ...childEdges()].find(edge => edge.id === graphState.selectedEdgeId);
  if (visible) return visible;
  const rawEdge = graphEdge(graphState.selectedEdgeId);
  return rawEdge ? normalizedEdge(rawEdge) : null;
}

function selectGraphEdge(edge) {
  graphState.selectedEdgeId = edge.id;
  graphState.selectedFieldId = null;
  renderGraphDetail();
  allEdgeElements().forEach(item => {
    item.classList.toggle("selected", item.dataset.graphEdge === edge.id);
  });
}

function selectGraphField(fieldId) {
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
  return `<button class="filter-chip ${active ? "active" : ""}" data-filter-kind="${escapeAttr(kind)}" data-filter-value="${escapeAttr(value)}" type="button">${escapeHtml(labelText)}</button>`;
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
  openPage("graph");
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
  graphState.nodeTypes = new Set(nodeTypes());
  graphState.edgeTypes = new Set(edgeTypes());
  graphState.tags = new Set(allTags());
  graphState.maxDepth = 1;
  graphState.selectedEdgeId = null;
  graphState.selectedFieldId = null;
  graphState.expanded.clear();
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
  if (checked) config.set.add(value);
  else config.set.delete(value);
  renderAll();
  reopenFilterDropdown(kind);
}

function applyMultiAction(kind, action) {
  const config = multiFilterConfig(kind);
  if (!config) return;
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

  const childRow = event.target.closest("[data-child-id]");
  if (childRow) {
    selectGraphField(childRow.dataset.childId);
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

  const graphNode = event.target.closest("[data-graph-node]");
  if (graphNode && !event.target.closest("[data-toggle-node-fields]")) {
    graphState.focusId = graphNode.dataset.graphNode;
    graphState.selectedEdgeId = null;
    graphState.selectedFieldId = null;
    renderGraphPage();
    return;
  }

  const expand = event.target.closest("[data-toggle-node-fields]");
  if (expand) {
    const id = expand.dataset.toggleNodeFields;
    const willCollapse = graphState.expanded.has(id);
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
  if (kind === "graph-node-type") toggleSet(graphState.nodeTypes, value);
  if (kind === "graph-edge-type") toggleSet(graphState.edgeTypes, value);
  if (kind === "graph-tag") toggleSet(graphState.tags, value);
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
els.depth.addEventListener("input", event => {
  graphState.maxDepth = Number(event.target.value);
  renderGraphPage();
});
els.graphReset.addEventListener("click", resetGraphFilters);
els.fit.addEventListener("click", fitGraph);
els.expandSelected.addEventListener("click", () => {
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

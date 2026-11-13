import React, { useRef, useEffect, useState, useMemo } from "react";
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY } from "d3-force";
import { formatINR } from "../data/mockEngine";
import { ZoomIn, ZoomOut, RotateCcw, Filter, ShieldAlert, Sparkles, Move } from "lucide-react";

export default function GraphCanvas({ graphData, onSelectNode }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterSuspiciousOnly, setFilterSuspiciousOnly] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Dimensions
  const [dimensions, setDimensions] = useState({ width: 960, height: 560 });

  // Dragging state
  const isDraggingCanvas = useRef(false);
  const dragCanvasStart = useRef({ x: 0, y: 0 });
  const draggedNode = useRef(null);

  // D3 simulation references
  const simulationRef = useRef(null);
  const simNodesRef = useRef([]);
  const simEdgesRef = useRef([]);

  // ResizeObserver to dynamically adapt canvas to viewport width
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 200 && height > 200) {
          setDimensions({ width: Math.round(width), height: Math.round(height) });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Filter & prepare graph data: Keep graph clean, legible, and uncrowded
  const { filteredNodes, filteredEdges } = useMemo(() => {
    if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
      return { filteredNodes: [], filteredEdges: [] };
    }

    let nodes = [...graphData.nodes];
    let edges = [...(graphData.edges || [])];

    if (filterSuspiciousOnly) {
      // Keep only high-risk / circular / mule nodes and their direct connections
      const suspiciousIds = new Set(
        nodes
          .filter(n => n.node_type !== "NORMAL" || (n.total_received > 100000 && n.in_degree >= 2))
          .map(n => n.id)
      );

      // Include 1-hop neighbors
      edges.forEach(e => {
        const s = typeof e.source === "object" ? e.source.id : e.source;
        const t = typeof e.target === "object" ? e.target.id : e.target;
        if (suspiciousIds.has(s) || suspiciousIds.has(t)) {
          suspiciousIds.add(s);
          suspiciousIds.add(t);
        }
      });

      nodes = nodes.filter(n => suspiciousIds.has(n.id));
      edges = edges.filter(e => {
        const s = typeof e.source === "object" ? e.source.id : e.source;
        const t = typeof e.target === "object" ? e.target.id : e.target;
        return suspiciousIds.has(s) && suspiciousIds.has(t);
      });
    } else {
      // Cap to the top 18 most active nodes so canvas is NEVER crowded
      if (nodes.length > 18) {
        const ranked = [...nodes].sort((a, b) => {
          const aPriority = (a.node_type !== "NORMAL" ? 1000 : 0) + (a.total_sent + a.total_received);
          const bPriority = (b.node_type !== "NORMAL" ? 1000 : 0) + (b.total_sent + b.total_received);
          return bPriority - aPriority;
        }).slice(0, 18);

        const activeIds = new Set(ranked.map(n => n.id));
        nodes = ranked;
        edges = edges.filter(e => {
          const s = typeof e.source === "object" ? e.source.id : e.source;
          const t = typeof e.target === "object" ? e.target.id : e.target;
          return activeIds.has(s) && activeIds.has(t);
        });
      }
    }

    return { filteredNodes: nodes, filteredEdges: edges };
  }, [graphData, filterSuspiciousOnly]);

  // Initialize and run D3 Force Simulation with strict collision prevention
  useEffect(() => {
    if (filteredNodes.length === 0) return;

    const { width, height } = dimensions;
    const existingNodeMap = new Map(simNodesRef.current.map(n => [n.id, n]));
    const pad = 60;

    // Map nodes with safe initial coordinates in a gentle radial cluster
    const nodes = filteredNodes.map((n, i) => {
      const existing = existingNodeMap.get(n.id);
      const angle = (i / filteredNodes.length) * 2 * Math.PI;
      const dist = 110 + (i % 3) * 35;

      const isCircular = n.node_type === "CIRCULAR_LAUNDERING";
      const isMule = n.node_type === "MULE_AGGREGATOR";
      const radius = isCircular ? 24 : isMule ? 22 : 18;

      const isSafeExisting =
        existing &&
        typeof existing.x === "number" &&
        !isNaN(existing.x) &&
        existing.x > pad &&
        existing.x < width - pad &&
        typeof existing.y === "number" &&
        !isNaN(existing.y) &&
        existing.y > pad &&
        existing.y < height - pad;

      return {
        ...n,
        radius,
        x: isSafeExisting ? existing.x : width / 2 + Math.cos(angle) * dist,
        y: isSafeExisting ? existing.y : height / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0
      };
    });

    const validNodeIds = new Set(nodes.map(n => n.id));

    // Map edges, strictly filtering out any links to non-existent nodes
    const edges = filteredEdges
      .map(e => ({
        ...e,
        source: typeof e.source === "object" ? e.source.id : e.source,
        target: typeof e.target === "object" ? e.target.id : e.target,
        particleT: Math.random()
      }))
      .filter(e => validNodeIds.has(e.source) && validNodeIds.has(e.target));

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    // Battle-tested D3 force simulation:
    // 1. forceManyBody: gentle repulsion so nodes don't crowd
    // 2. forceCollide: STRICT physical boundary guaranteeing zero overlap
    // 3. forceX & forceY: gentle gravity pulling every node towards center
    // 4. forceCenter: centers entire cluster
    // 5. forceLink: springs along edges
    const sim = forceSimulation(nodes)
      .force("link", forceLink(edges).id(d => d.id).distance(130).strength(0.45))
      .force("charge", forceManyBody().strength(-280).distanceMax(450))
      .force("x", forceX(width / 2).strength(0.06))
      .force("y", forceY(height / 2).strength(0.06))
      .force("center", forceCenter(width / 2, height / 2))
      .force(
        "collide",
        forceCollide()
          .radius(d => d.radius + 36) // 36px buffer guarantees labels & circles NEVER collide
          .iterations(4)
      )
      .alpha(0.8)
      .alphaDecay(0.028);

    simNodesRef.current = nodes;
    simEdgesRef.current = edges;
    simulationRef.current = sim;

    return () => sim.stop();
  }, [filteredNodes, filteredEdges, dimensions]);

  // Canvas render animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let isRunning = true;
    let animId = null;

    const render = () => {
      if (!isRunning) return;

      const { width, height } = dimensions;
      const nodes = simNodesRef.current;
      const edges = simEdgesRef.current;

      // Soft clamp inside canvas bounds
      const pad = 50;
      for (const node of nodes) {
        if (!node.fx) {
          node.x = Math.max(pad, Math.min(width - pad, node.x));
          node.y = Math.max(pad, Math.min(height - pad, node.y));
        }
      }

      ctx.clearRect(0, 0, width, height);
      ctx.save();

      // Pan & Zoom transform
      ctx.translate(pan.x + width / 2, pan.y + height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const nodeMap = new Map(nodes.map(n => [n.id, n]));

      // 1. Draw Edges
      for (const edge of edges) {
        const u = typeof edge.source === "object" ? edge.source : nodeMap.get(edge.source);
        const v = typeof edge.target === "object" ? edge.target : nodeMap.get(edge.target);
        if (!u || !v) continue;

        const isCircularEdge = u.node_type === "CIRCULAR_LAUNDERING" && v.node_type === "CIRCULAR_LAUNDERING";
        const isCriticalEdge =
          u.is_frozen || v.is_frozen ||
          u.node_type === "CRITICAL_FRAUD" || v.node_type === "CRITICAL_FRAUD" ||
          (edge.max_risk_score && edge.max_risk_score >= 80) ||
          edge.amount >= 100000;
        const isRiskEdge =
          isCriticalEdge ||
          u.node_type === "MULE_AGGREGATOR" || v.node_type === "MULE_AGGREGATOR" ||
          u.node_type === "HIGH_RISK" || v.node_type === "HIGH_RISK" ||
          (edge.max_risk_score && edge.max_risk_score >= 60);

        let strokeColor = "rgba(148, 163, 184, 0.4)";
        let arrowColor = "#64748b";
        let particleColor = "#475569";
        let lineWidth = 1.2;

        if (isCircularEdge) {
          strokeColor = "rgba(147, 51, 234, 0.75)";
          arrowColor = "#9333ea";
          particleColor = "#9333ea";
          lineWidth = 2.4;
        } else if (isCriticalEdge) {
          strokeColor = "rgba(225, 29, 72, 0.8)";
          arrowColor = "#e11d48";
          particleColor = "#e11d48";
          lineWidth = 2.4;
        } else if (isRiskEdge) {
          strokeColor = "rgba(234, 88, 12, 0.7)";
          arrowColor = "#ea580c";
          particleColor = "#ea580c";
          lineWidth = 1.8;
        }

        // Line
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(v.y - u.y, v.x - u.x);
        const arrowDist = v.radius + 6;
        const ax = v.x - Math.cos(angle) * arrowDist;
        const ay = v.y - Math.sin(angle) * arrowDist;

        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 8 * Math.cos(angle - Math.PI / 6), ay - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ax - 8 * Math.cos(angle + Math.PI / 6), ay - 8 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = arrowColor;
        ctx.fill();

        // Flowing particles along edge
        if (edge.particleT !== undefined) {
          edge.particleT = (edge.particleT + 0.008) % 1;
          const px = u.x + (v.x - u.x) * edge.particleT;
          const py = u.y + (v.y - u.y) * edge.particleT;

          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = particleColor;
          ctx.fill();
        }
      }

      // 2. Draw Nodes
      for (const node of nodes) {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isFrozen = Boolean(node.is_frozen || node.status === "FROZEN");
        const isCritical = isFrozen || node.node_type === "CRITICAL_FRAUD" || (node.max_risk_score && node.max_risk_score >= 80);
        const isCircular = node.node_type === "CIRCULAR_LAUNDERING";
        const isMule = node.node_type === "MULE_AGGREGATOR" || node.node_type === "HIGH_RISK" || (node.max_risk_score && node.max_risk_score >= 60);
        const isMedium = !isCritical && !isCircular && !isMule && (node.max_risk_score && node.max_risk_score >= 35);

        // Visual Theme Settings per category:
        let ringGlow = isHovered ? "rgba(24, 24, 27, 0.08)" : null;
        let circleFill = "#f0fdf4"; // default safe emerald tint
        let circleStroke = "#10b981"; // emerald border
        let centerTextColor = "#047857";
        let badgeBg = "#ffffff";
        let badgeBorder = "#cbd5e1";
        let badgeTextColor = "#334155";
        let badgeTag = null;

        if (isFrozen) {
          ringGlow = "rgba(153, 27, 27, 0.3)";
          circleFill = "#fee2e2";
          circleStroke = "#991b1b";
          centerTextColor = "#7f1d1d";
          badgeBg = "#fef2f2";
          badgeBorder = "#b91c1c";
          badgeTextColor = "#991b1b";
          badgeTag = "FROZEN";
        } else if (isCritical) {
          ringGlow = "rgba(225, 29, 72, 0.25)";
          circleFill = "#ffe4e6";
          circleStroke = "#e11d48";
          centerTextColor = "#9f1239";
          badgeBg = "#fff1f2";
          badgeBorder = "#f43f5e";
          badgeTextColor = "#9f1239";
          badgeTag = "CRITICAL";
        } else if (isCircular) {
          ringGlow = "rgba(147, 51, 234, 0.22)";
          circleFill = "#f3e8ff";
          circleStroke = "#9333ea";
          centerTextColor = "#7e22ce";
          badgeBg = "#faf5ff";
          badgeBorder = "#c084fc";
          badgeTextColor = "#6b21a8";
          badgeTag = "CYCLE";
        } else if (isMule) {
          ringGlow = "rgba(234, 88, 12, 0.22)";
          circleFill = "#ffedd5";
          circleStroke = "#ea580c";
          centerTextColor = "#c2410c";
          badgeBg = "#fff7ed";
          badgeBorder = "#fb923c";
          badgeTextColor = "#9a3412";
          badgeTag = "MULE";
        } else if (isMedium) {
          ringGlow = "rgba(234, 179, 8, 0.15)";
          circleFill = "#fef9c3";
          circleStroke = "#ca8a04";
          centerTextColor = "#a16207";
          badgeBg = "#fefce8";
          badgeBorder = "#facc15";
          badgeTextColor = "#854d0e";
          badgeTag = "MED";
        }

        // Outer Focus Ring
        if (ringGlow || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + (isHovered ? 6 : 4), 0, Math.PI * 2);
          ctx.fillStyle = ringGlow || "rgba(24, 24, 27, 0.08)";
          ctx.fill();
        }

        // Node Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = circleFill;
        ctx.fill();
        ctx.lineWidth = isHovered ? 2.5 : isCritical || isCircular || isMule ? 2.2 : 1.5;
        ctx.strokeStyle = isHovered ? "#18181b" : circleStroke;
        ctx.stroke();

        // Bank Abbreviation in center
        ctx.fillStyle = centerTextColor;
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const bankCode = (node.bank || "BANK").split(" ")[0].slice(0, 4).toUpperCase();
        ctx.fillText(bankCode, node.x, node.y);

        // CLEAN LABEL BADGE: Drawn with its own pill background so it NEVER overlaps or blurs!
        const baseName = node.label ? node.label.split(" ")[0] : node.id.slice(-6);
        const labelText = badgeTag ? `${baseName} [${badgeTag}]` : baseName;
        ctx.font = "500 10px Inter, sans-serif";
        const textWidth = ctx.measureText(labelText).width;
        const badgeW = textWidth + 12;
        const badgeH = 17;
        const badgeX = node.x - badgeW / 2;
        const badgeY = node.y + node.radius + 5;

        // Badge pill background
        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
        ctx.fillStyle = badgeBg;
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = badgeBorder;
        ctx.stroke();

        // Badge text
        ctx.fillStyle = badgeTextColor;
        ctx.fillText(labelText, node.x, badgeY + badgeH / 2);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      isRunning = false;
      if (animId) cancelAnimationFrame(animId);
    };
  }, [dimensions, zoom, pan, hoveredNode]);

  // Mouse event handling: Drag canvas or drag node smoothly
  const getCanvasMousePos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const worldX = (clientX - pan.x - dimensions.width / 2) / zoom + dimensions.width / 2;
    const worldY = (clientY - pan.y - dimensions.height / 2) / zoom + dimensions.height / 2;
    return { clientX, clientY, worldX, worldY };
  };

  const handleMouseDown = (e) => {
    const { clientX, clientY, worldX, worldY } = getCanvasMousePos(e);
    const nodes = simNodesRef.current;

    // Check if clicked on a node to drag it
    const clickedNode = nodes.find(n => Math.hypot(n.x - worldX, n.y - worldY) <= n.radius + 6);

    if (clickedNode) {
      draggedNode.current = clickedNode;
      clickedNode.fx = clickedNode.x;
      clickedNode.fy = clickedNode.y;
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0.3).restart();
      }
    } else {
      isDraggingCanvas.current = true;
      dragCanvasStart.current = { x: clientX - pan.x, y: clientY - pan.y };
    }
  };

  const handleMouseMove = (e) => {
    const { clientX, clientY, worldX, worldY } = getCanvasMousePos(e);

    if (draggedNode.current) {
      draggedNode.current.fx = worldX;
      draggedNode.current.fy = worldY;
      return;
    }

    if (isDraggingCanvas.current) {
      setPan({
        x: clientX - dragCanvasStart.current.x,
        y: clientY - dragCanvasStart.current.y
      });
      return;
    }

    // Hover detection
    const nodes = simNodesRef.current;
    const found = nodes.find(n => Math.hypot(n.x - worldX, n.y - worldY) <= n.radius + 6);
    setHoveredNode(found || null);
  };

  const handleMouseUp = () => {
    if (draggedNode.current) {
      draggedNode.current.fx = null;
      draggedNode.current.fy = null;
      draggedNode.current = null;
      if (simulationRef.current) {
        simulationRef.current.alphaTarget(0);
      }
    }
    isDraggingCanvas.current = false;
  };

  const handleResetLayout = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    if (simulationRef.current) {
      simulationRef.current.alpha(0.8).restart();
    }
  };

  return (
    <div className="surface-card p-5 flex flex-col gap-4">
      {/* Top Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 m-0 flex items-center gap-2">
            <span>AML Entity Fund-Flow Graph</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
              D3 Anti-Collision Layout
            </span>
          </h2>
          <p className="text-xs text-zinc-500 m-0 mt-0.5">
            {filteredNodes.length} active entities • {filteredEdges.length} directed links • Cleanly spaced
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-100 border border-emerald-600" /> Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-100 border border-purple-600" /> Circular Loop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-100 border border-orange-500" /> Mule Hub
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-100 border border-rose-600" /> Critical / Frozen
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              onClick={() => setFilterSuspiciousOnly(!filterSuspiciousOnly)}
              className={`px-2 py-1 text-xs font-medium rounded flex items-center gap-1 cursor-pointer transition-colors ${
                filterSuspiciousOnly
                  ? "bg-rose-600 text-white"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
              title="Show only accounts involved in suspicious activity"
            >
              <Filter className="w-3 h-3" />
              <span>{filterSuspiciousOnly ? "Suspicious Only" : "Filter"}</span>
            </button>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.15, 2.2))}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetLayout}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
              title="Reset Zoom & Pan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative w-full h-[540px] dot-grid rounded-xl border border-zinc-200 overflow-hidden cursor-grab active:cursor-grabbing select-none"
      >
        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full block"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={() => hoveredNode && onSelectNode && onSelectNode(hoveredNode)}
        />

        {/* Tip pill */}
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-md border border-zinc-200 text-[11px] text-zinc-500 pointer-events-none flex items-center gap-1.5">
          <Move className="w-3 h-3 text-zinc-400" />
          <span>Drag nodes to rearrange • Drag canvas to pan</span>
        </div>

        {/* Hover Inspector Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl border border-zinc-200 shadow-xl text-xs max-w-xs pointer-events-none animate-in fade-in duration-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-zinc-900 text-sm">
                {hoveredNode.label || hoveredNode.id}
              </span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                  hoveredNode.node_type === "CIRCULAR_LAUNDERING"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : hoveredNode.node_type === "MULE_AGGREGATOR"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-zinc-100 text-zinc-700 border-zinc-200"
                }`}
              >
                {hoveredNode.node_type}
              </span>
            </div>

            <div className="space-y-1.5 text-zinc-600">
              <div className="flex justify-between gap-4">
                <span>VPA:</span>
                <span className="font-mono text-zinc-900 font-medium">{hoveredNode.vpa || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Bank:</span>
                <span className="text-zinc-900">{hoveredNode.bank}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Total Sent:</span>
                <span className="font-mono text-zinc-900 tabular-nums font-semibold">{formatINR(hoveredNode.total_sent)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Total Recv:</span>
                <span className="font-mono text-emerald-700 tabular-nums font-semibold">{formatINR(hoveredNode.total_received)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Connections:</span>
                <span className="font-mono text-zinc-900">
                  {hoveredNode.in_degree} in • {hoveredNode.out_degree} out
                </span>
              </div>
            </div>

            {hoveredNode.node_type !== "NORMAL" && (
              <div className="mt-2.5 pt-2 border-t border-zinc-100 text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Click to open Explainable AI forensic breakdown</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

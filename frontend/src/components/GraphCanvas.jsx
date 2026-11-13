import React, { useRef, useEffect, useState } from "react";
import { formatINR } from "../data/mockEngine";
import { ZoomIn, ZoomOut, RotateCcw, Filter, Info, ShieldAlert } from "lucide-react";

export default function GraphCanvas({ graphData, onSelectNode }) {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterHighRisk, setFilterHighRisk] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Physics simulation nodes & edges state
  const simNodes = useRef([]);
  const simEdges = useRef([]);
  const animFrameId = useRef(null);

  // Sync with incoming graphData
  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    const width = 800;
    const height = 480;

    // Preserve existing positions if possible
    const existingMap = new Map(simNodes.current.map(n => [n.id, n]));

    simNodes.current = graphData.nodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      const angle = (i / graphData.nodes.length) * 2 * Math.PI;
      const radius = 160 + (i % 3) * 50;

      return {
        ...node,
        x: existing ? existing.x : width / 2 + Math.cos(angle) * radius,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: node.node_type === "CIRCULAR_LAUNDERING" ? 22 : node.node_type === "MULE_AGGREGATOR" ? 20 : 16
      };
    });

    simEdges.current = (graphData.edges || []).map(edge => ({
      ...edge,
      particles: [
        { t: Math.random() },
        { t: Math.random() }
      ]
    }));
  }, [graphData]);

  // Main Canvas Rendering Loop with Force Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const width = canvas.width;
      const height = canvas.height;

      // 1. Force Simulation Step
      const nodes = simNodes.current;
      const edges = simEdges.current;

      // Repulsion between nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 180) {
            const force = (180 - dist) / dist * 0.04;
            nodes[i].vx -= dx * force;
            nodes[i].vy -= dy * force;
            nodes[j].vx += dx * force;
            nodes[j].vy += dy * force;
          }
        }
      }

      // Spring attraction along edges
      const nodeMap = new Map(nodes.map(n => [n.id, n]));
      for (const edge of edges) {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (u && v) {
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 120;
          const force = (dist - targetDist) * 0.008;
          u.vx += dx * force;
          u.vy += dy * force;
          v.vx -= dx * force;
          v.vy -= dy * force;
        }
      }

      // Centering and damping
      const cx = width / 2;
      const cy = height / 2;
      for (const node of nodes) {
        node.vx += (cx - node.x) * 0.002;
        node.vy += (cy - node.y) * 0.002;
        node.vx *= 0.88;
        node.vy *= 0.88;
        node.x += node.vx;
        node.y += node.vy;

        // Boundaries
        node.x = Math.max(40, Math.min(width - 40, node.x));
        node.y = Math.max(40, Math.min(height - 40, node.y));
      }

      // 2. Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Apply Zoom & Pan
      ctx.save();
      ctx.translate(pan.x + width / 2, pan.y + height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // Draw Edges
      for (const edge of edges) {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (!u || !v) continue;

        const isHighRiskEdge = u.node_type !== "NORMAL" || v.node_type !== "NORMAL";
        if (filterHighRisk && !isHighRiskEdge) continue;

        // Line
        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.strokeStyle = isHighRiskEdge ? "rgba(244, 63, 94, 0.45)" : "rgba(99, 102, 241, 0.25)";
        ctx.lineWidth = Math.min(Math.max((edge.amount || 1000) / 40000, 1.2), 4.5);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(v.y - u.y, v.x - u.x);
        const arrowDist = v.radius + 6;
        const arrowX = v.x - Math.cos(angle) * arrowDist;
        const arrowY = v.y - Math.sin(angle) * arrowDist;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(arrowX - 8 * Math.cos(angle - Math.PI / 6), arrowY - 8 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(arrowX - 8 * Math.cos(angle + Math.PI / 6), arrowY - 8 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = isHighRiskEdge ? "rgba(244, 63, 94, 0.8)" : "rgba(129, 140, 248, 0.6)";
        ctx.fill();

        // Flowing particles along edge
        if (edge.particles) {
          for (const p of edge.particles) {
            p.t += 0.012;
            if (p.t > 1) p.t = 0;
            const px = u.x + (v.x - u.x) * p.t;
            const py = u.y + (v.y - u.y) * p.t;

            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fillStyle = isHighRiskEdge ? "#fb7185" : "#38bdf8";
            ctx.shadowColor = isHighRiskEdge ? "#f43f5e" : "#0ea5e9";
            ctx.shadowBlur = 6;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Draw Nodes
      for (const node of nodes) {
        if (filterHighRisk && node.node_type === "NORMAL") continue;

        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isCircular = node.node_type === "CIRCULAR_LAUNDERING";
        const isMule = node.node_type === "MULE_AGGREGATOR";

        // Halo / Glow
        if (isCircular || isMule || isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius + (isHovered ? 8 : 5), 0, Math.PI * 2);
          ctx.fillStyle = isCircular
            ? "rgba(217, 70, 239, 0.25)"
            : isMule
            ? "rgba(239, 68, 68, 0.25)"
            : "rgba(99, 102, 241, 0.3)";
          ctx.fill();
        }

        // Node Circle Body
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isCircular
          ? "#a21caf"
          : isMule
          ? "#b91c1c"
          : isHovered
          ? "#4f46e5"
          : "#1e293b";
        ctx.fill();
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.strokeStyle = isCircular
          ? "#f0abfc"
          : isMule
          ? "#fca5a5"
          : isHovered
          ? "#818cf8"
          : "#475569";
        ctx.stroke();

        // Bank Abbreviation in center
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const bankCode = (node.bank || "").split(" ")[0] || "BANK";
        ctx.fillText(bankCode.slice(0, 4).toUpperCase(), node.x, node.y);

        // Name & VPA Label below node
        ctx.font = "10px sans-serif";
        ctx.fillStyle = isCircular ? "#f5d0fe" : isMule ? "#fecaca" : "#94a3b8";
        ctx.fillText(node.label ? node.label.split(" ")[0] : node.id, node.x, node.y + node.radius + 11);
      }

      ctx.restore();
      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [hoveredNode, filterHighRisk, zoom, pan]);

  // Mouse Interactions for Hover & Pan
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging.current) {
      setPan({
        x: mouseX - dragStart.current.x,
        y: mouseY - dragStart.current.y
      });
      return;
    }

    // Convert screen coordinates to world coordinates
    const worldX = (mouseX - pan.x - canvas.width / 2) / zoom + canvas.width / 2;
    const worldY = (mouseY - pan.y - canvas.height / 2) / zoom + canvas.height / 2;

    const found = simNodes.current.find(n => {
      const dx = n.x - worldX;
      const dy = n.y - worldY;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius + 4;
    });

    setHoveredNode(found || null);
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - rect.left - pan.x,
      y: e.clientY - rect.top - pan.y
    };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleClick = () => {
    if (hoveredNode && onSelectNode) {
      onSelectNode(hoveredNode);
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col h-full relative">
      {/* Graph Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-indigo-500 animate-ping" />
          <h2 className="text-sm font-bold text-white m-0 tracking-wide">
            REAL-TIME FINANCIAL NETWORK TOPOLOGY
          </h2>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {graphData?.nodes?.length || 0} Nodes • {graphData?.edges?.length || 0} Flow Edges
          </span>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-500 inline-block" />
              Standard
            </span>
            <span className="flex items-center gap-1.5 text-rose-300">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 border border-purple-400 inline-block" />
              Circular Cycle
            </span>
            <span className="flex items-center gap-1.5 text-red-300">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-400 inline-block" />
              Mule Aggregator
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setFilterHighRisk(!filterHighRisk)}
              className={`p-1.5 rounded text-xs transition-colors ${
                filterHighRisk ? "bg-red-500/20 text-red-400" : "text-slate-400 hover:text-white"
              }`}
              title="Filter Suspicious Nodes Only"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.min(z + 0.15, 2.5))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(z => Math.max(z - 0.15, 0.6))}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
              className="p-1.5 text-slate-400 hover:text-white rounded"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 w-full min-h-[460px] bg-slate-950/90 rounded-xl overflow-hidden border border-slate-900 cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={880}
          height={500}
          className="w-full h-full block"
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onClick={handleClick}
        />

        {/* Hovered Node Tooltip Overlay */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 glass-panel p-3.5 rounded-xl border border-indigo-500/30 text-xs shadow-2xl max-w-xs animate-in fade-in duration-150 pointer-events-none">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-white text-sm">
                {hoveredNode.label || hoveredNode.id}
              </span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                  hoveredNode.node_type === "CIRCULAR_LAUNDERING"
                    ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                    : hoveredNode.node_type === "MULE_AGGREGATOR"
                    ? "bg-red-500/20 text-red-300 border-red-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                }`}
              >
                {hoveredNode.node_type}
              </span>
            </div>
            <div className="space-y-1 text-slate-300">
              <p className="m-0 text-slate-400 flex items-center justify-between">
                <span>VPA:</span> <span className="font-mono text-indigo-300">{hoveredNode.vpa || "N/A"}</span>
              </p>
              <p className="m-0 text-slate-400 flex items-center justify-between">
                <span>Bank:</span> <span className="text-white font-medium">{hoveredNode.bank}</span>
              </p>
              <p className="m-0 text-slate-400 flex items-center justify-between">
                <span>Total Sent:</span> <span className="text-rose-400 font-mono">{formatINR(hoveredNode.total_sent || 0)}</span>
              </p>
              <p className="m-0 text-slate-400 flex items-center justify-between">
                <span>Total Received:</span> <span className="text-emerald-400 font-mono">{formatINR(hoveredNode.total_received || 0)}</span>
              </p>
              <p className="m-0 text-slate-400 flex items-center justify-between">
                <span>In/Out Degree:</span> <span className="text-white font-mono">{hoveredNode.in_degree || 0} in / {hoveredNode.out_degree || 0} out</span>
              </p>
            </div>
            {hoveredNode.node_type !== "NORMAL" && (
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-amber-300 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                <span>Flagged for AML network scrutiny</span>
              </div>
            )}
          </div>
        )}

        {/* Instructional Watermark */}
        <div className="absolute top-3 left-3 text-[11px] text-slate-500 flex items-center gap-1.5 select-none pointer-events-none">
          <Info className="w-3.5 h-3.5 text-slate-600" />
          <span>Click and drag to pan • Hover node to inspect account balance & flow</span>
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useEffect, useState } from "react";
import { formatINR } from "../data/mockEngine";
import { ZoomIn, ZoomOut, RotateCcw, Filter, ShieldAlert } from "lucide-react";

export default function GraphCanvas({ graphData, onSelectNode }) {
  const canvasRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [filterHighRisk, setFilterHighRisk] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const simNodes = useRef([]);
  const simEdges = useRef([]);
  const animFrameId = useRef(null);

  useEffect(() => {
    if (!graphData || !graphData.nodes) return;

    const width = 920;
    const height = 520;
    const existingMap = new Map(simNodes.current.map((n) => [n.id, n]));

    simNodes.current = graphData.nodes.map((node, i) => {
      const existing = existingMap.get(node.id);
      const angle = (i / Math.max(graphData.nodes.length, 1)) * 2 * Math.PI;
      const radius = 150 + (i % 3) * 45;

      return {
        ...node,
        x: existing ? existing.x : width / 2 + Math.cos(angle) * radius,
        y: existing ? existing.y : height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: node.node_type === "CIRCULAR_LAUNDERING" ? 21 : node.node_type === "MULE_AGGREGATOR" ? 19 : 15
      };
    });

    simEdges.current = (graphData.edges || []).map((edge) => ({
      ...edge,
      particles: [{ t: Math.random() }]
    }));
  }, [graphData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let isRunning = true;

    const render = () => {
      if (!isRunning) return;
      const width = canvas.width;
      const height = canvas.height;
      const nodes = simNodes.current;
      const edges = simEdges.current;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          if (dist < 170) {
            const force = ((170 - dist) / dist) * 0.04;
            nodes[i].vx -= dx * force;
            nodes[i].vy -= dy * force;
            nodes[j].vx += dx * force;
            nodes[j].vy += dy * force;
          }
        }
      }

      const nodeMap = new Map(nodes.map((n) => [n.id, n]));
      for (const edge of edges) {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (u && v) {
          const dx = v.x - u.x;
          const dy = v.y - u.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist - 125) * 0.008;
          u.vx += dx * force;
          u.vy += dy * force;
          v.vx -= dx * force;
          v.vy -= dy * force;
        }
      }

      const cx = width / 2;
      const cy = height / 2;
      for (const node of nodes) {
        node.vx += (cx - node.x) * 0.002;
        node.vy += (cy - node.y) * 0.002;
        node.vx *= 0.88;
        node.vy *= 0.88;
        node.x = Math.max(40, Math.min(width - 40, node.x + node.vx));
        node.y = Math.max(40, Math.min(height - 40, node.y + node.vy));
      }

      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.translate(pan.x + width / 2, pan.y + height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      // Edges
      for (const edge of edges) {
        const u = nodeMap.get(edge.source);
        const v = nodeMap.get(edge.target);
        if (!u || !v) continue;

        const isRisk = u.node_type !== "NORMAL" || v.node_type !== "NORMAL";
        if (filterHighRisk && !isRisk) continue;

        ctx.beginPath();
        ctx.moveTo(u.x, u.y);
        ctx.lineTo(v.x, v.y);
        ctx.strokeStyle = isRisk ? "rgba(225, 29, 72, 0.45)" : "rgba(161, 161, 170, 0.45)";
        ctx.lineWidth = isRisk ? 2 : 1.2;
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(v.y - u.y, v.x - u.x);
        const dist = v.radius + 5;
        const ax = v.x - Math.cos(angle) * dist;
        const ay = v.y - Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax - 7 * Math.cos(angle - Math.PI / 6), ay - 7 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(ax - 7 * Math.cos(angle + Math.PI / 6), ay - 7 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fillStyle = isRisk ? "#e11d48" : "#71717a";
        ctx.fill();

        if (edge.particles) {
          for (const p of edge.particles) {
            p.t = (p.t + 0.01) % 1;
            const px = u.x + (v.x - u.x) * p.t;
            const py = u.y + (v.y - u.y) * p.t;
            ctx.beginPath();
            ctx.arc(px, py, 2.2, 0, Math.PI * 2);
            ctx.fillStyle = isRisk ? "#e11d48" : "#18181b";
            ctx.fill();
          }
        }
      }

      // Nodes
      for (const node of nodes) {
        if (filterHighRisk && node.node_type === "NORMAL") continue;
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const isCircular = node.node_type === "CIRCULAR_LAUNDERING";
        const isMule = node.node_type === "MULE_AGGREGATOR";

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isCircular ? "#f3e8ff" : isMule ? "#ffe4e6" : isHovered ? "#f4f4f5" : "#ffffff";
        ctx.fill();
        ctx.lineWidth = isHovered ? 2.5 : 1.5;
        ctx.strokeStyle = isCircular ? "#9333ea" : isMule ? "#e11d48" : isHovered ? "#18181b" : "#a1a1aa";
        ctx.stroke();

        ctx.fillStyle = isCircular ? "#6b21a8" : isMule ? "#9f1239" : "#27272a";
        ctx.font = "600 9px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const bankCode = (node.bank || "BANK").split(" ")[0].slice(0, 4).toUpperCase();
        ctx.fillText(bankCode, node.x, node.y);

        ctx.font = "500 10px Inter, sans-serif";
        ctx.fillStyle = isCircular ? "#7e22ce" : isMule ? "#be123c" : "#52525b";
        ctx.fillText(node.label ? node.label.split(" ")[0] : node.id, node.x, node.y + node.radius + 12);
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

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDragging.current) {
      setPan({ x: mouseX - dragStart.current.x, y: mouseY - dragStart.current.y });
      return;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const worldX = (mouseX * scaleX - pan.x - canvas.width / 2) / zoom + canvas.width / 2;
    const worldY = (mouseY * scaleY - pan.y - canvas.height / 2) / zoom + canvas.height / 2;

    const found = simNodes.current.find((n) => Math.hypot(n.x - worldX, n.y - worldY) <= n.radius + 5);
    setHoveredNode(found || null);
  };

  return (
    <div className="surface-card p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 m-0">
            Entity Fund-Flow Graph
          </h2>
          <p className="text-xs text-zinc-500 m-0 mt-0.5">
            {graphData?.nodes?.length || 0} accounts • {graphData?.edges?.length || 0} directed edges •{" "}
            {graphData?.summary?.circular_cycles_count || 0} circular rings detected
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-zinc-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-white border border-zinc-400" /> Normal
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-100 border border-purple-600" /> Circular Loop
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-100 border border-rose-600" /> Mule Hub
            </span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200">
            <button
              onClick={() => setFilterHighRisk(!filterHighRisk)}
              className={`p-1.5 rounded cursor-pointer ${
                filterHighRisk ? "bg-rose-600 text-white" : "text-zinc-600 hover:text-zinc-900"
              }`}
              title="Toggle Suspicious Nodes Only"
            >
              <Filter className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))} className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setZoom((z) => Math.max(z - 0.15, 0.6))} className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative w-full h-[520px] dot-grid rounded-xl border border-zinc-200 overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={920}
          height={520}
          className="w-full h-full block"
          onMouseMove={handleMouseMove}
          onMouseDown={(e) => {
            const rect = canvasRef.current.getBoundingClientRect();
            isDragging.current = true;
            dragStart.current = { x: e.clientX - rect.left - pan.x, y: e.clientY - rect.top - pan.y };
          }}
          onMouseUp={() => (isDragging.current = false)}
          onMouseLeave={() => (isDragging.current = false)}
          onClick={() => hoveredNode && onSelectNode && onSelectNode(hoveredNode)}
        />

        {hoveredNode && (
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-3.5 rounded-xl border border-zinc-200 shadow-lg text-xs max-w-xs pointer-events-none">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-semibold text-zinc-900">{hoveredNode.label || hoveredNode.id}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                {hoveredNode.node_type}
              </span>
            </div>
            <div className="space-y-1 text-zinc-600">
              <div className="flex justify-between gap-4">
                <span>VPA</span>
                <span className="font-mono text-zinc-900">{hoveredNode.vpa || "N/A"}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Sent / Recv</span>
                <span className="font-mono text-zinc-900 tabular-nums">
                  {formatINR(hoveredNode.total_sent)} / {formatINR(hoveredNode.total_received)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Degree</span>
                <span className="font-mono text-zinc-900">
                  {hoveredNode.in_degree} in • {hoveredNode.out_degree} out
                </span>
              </div>
            </div>
            {hoveredNode.node_type !== "NORMAL" && (
              <div className="mt-2 pt-2 border-t border-zinc-100 text-[11px] text-rose-700 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span>Click node to inspect flagged transaction</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

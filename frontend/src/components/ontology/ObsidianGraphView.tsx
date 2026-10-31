import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Network, Search, ZoomIn, ZoomOut, Maximize2, Minimize2, 
  RotateCcw, Sparkles, ChevronRight, X, Database, Cpu,
  Plus, Link2, Trash2, Play, Pause, ShieldCheck, Focus, AlertCircle
} from 'lucide-react';

export interface GraphNode {
  id: string;
  type: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  label: string;
  properties: Record<string, any>;
  isPinned?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  sourceNode?: GraphNode;
  targetNode?: GraphNode;
}

const TYPE_COLORS: Record<string, string> = {
  Domain: '#FE8A70', // Coral
  Merchant: '#FA7F62', // Deep Coral
  Device: '#F59E0B', // Amber
  Settlement: '#10B981', // Emerald
  PolicyRule: '#A855F7', // Amethyst
  ReasoningNode: '#F43F5E', // Rose
  Action: '#EC4899', // Pink
  VectorChunk: '#06B6D4', // Cyan
  Telemetry: '#3B82F6', // Blue
};

interface ObsidianGraphViewProps {
  height?: string | number;
  compact?: boolean;
  onNodeSelect?: (node: GraphNode | null) => void;
}

export const ObsidianGraphView: React.FC<ObsidianGraphViewProps> = ({
  height = '600px',
  compact = false,
  onNodeSelect,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Interaction Modes & Controls
  const [isPhysicsPaused, setIsPhysicsPaused] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [connectSourceNode, setConnectSourceNode] = useState<GraphNode | null>(null);
  
  // Custom Node Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeType, setNewNodeType] = useState('Merchant');
  const [newNodeDomain, setNewNodeDomain] = useState('DOM-MERCHANT');
  const [newNodeDesc, setNewNodeDesc] = useState('');

  // Transform & Camera State (Pan / Zoom)
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<GraphNode | null>(null);
  const isDraggingOccurredRef = useRef(false);

  // Fetch full graph from backend or fallback to seeded dataset
  const fetchGraphData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ontology/full');
      if (res.ok) {
        const data = await res.json();
        initializeGraph(data.entities, data.relationships);
        return;
      }
    } catch (err) {
      console.warn('Falling back to local high-fidelity ontology:', err);
    }

    // High-fidelity fallback
    const mockEntities: Record<string, any> = {
      'DOM-MERCHANT': { type: 'Domain', properties: { title: 'Kirana Operations Domain', desc: 'Kumar Stores inventory & volume' } },
      'DOM-DEVICES': { type: 'Domain', properties: { title: 'Device Telemetry Domain', desc: 'Soundbox, EDC POS IoT telemetry' } },
      'DOM-FINANCIALS': { type: 'Domain', properties: { title: 'Financial Ledger Domain', desc: 'Double-entry escrow & settlements' } },
      'DOM-POLICIES': { type: 'Domain', properties: { title: 'Regulatory Policy Domain', desc: 'NPCI rules & Consent v2' } },
      'DOM-REASONING': { type: 'Domain', properties: { title: 'Agentic Decision Engine', desc: 'Bedrock Claude 3.5 & LATS' } },
      'DOM-MEMORY': { type: 'Domain', properties: { title: 'Second Brain Vector Store', desc: 'MindStudio RAG embeddings' } },
      'M_DISPUTE_TAT': { type: 'Merchant', properties: { name: 'Kumar Stores', category: 'Retail Kirana', trust: 98, tenant_owner: 'Kumar Stores' } },
      'SB-4421': { type: 'Device', properties: { model: 'Soundbox 4G Pro', battery: '12%', status: 'OFFLINE', tenant_owner: 'Kumar Stores' } },
      'POS-9982': { type: 'Device', properties: { model: 'EDC Smart POS', battery: '94%', status: 'ONLINE', tenant_owner: 'Kumar Stores' } },
      'QR-8812': { type: 'Device', properties: { model: 'Dynamic UPI Standee', spec: 'BharatQR 2.1', tenant_owner: 'Kumar Stores' } },
      'KHAATA-SHARMA-JI': { type: 'Merchant', properties: { name: 'Ramesh Sharma (Khaata #01)', balance_due: '₹1,450', tenant_owner: 'Kumar Stores' } },
      'KHAATA-VERMA-GROCER': { type: 'Merchant', properties: { name: 'Anil Verma (Weekly Provisions)', balance_due: '₹2,800', tenant_owner: 'Kumar Stores' } },
      'M_SUPPLIER_AMUL': { type: 'Merchant', properties: { name: 'Amul Dairy Distributor', credit: '₹8,400 T+3', tenant_owner: 'Kumar Stores' } },
      'SKU-ATTA-10KG': { type: 'Merchant', properties: { name: 'Aashirvaad Shudh Atta 10kg', stock: 24, price: 440, tenant_owner: 'Kumar Stores' } },
      'SETTL-8492': { type: 'Settlement', properties: { amount: 4280, status: 'ESCROW_LOCKED', tenant_owner: 'Kumar Stores' } },
      'LEDGER-CORE': { type: 'Settlement', properties: { type: 'Double-Entry Journal', hash: '0x7f9a...88b2' } },
      'NPCI-CIRC-142': { type: 'PolicyRule', properties: { name: 'NPCI Circular 142', sla_hours: 24 } },
      'CONSENT-V2': { type: 'PolicyRule', properties: { name: 'Consent Protocol v2', tier: 'Tier-1 vs Tier-2' } },
      'ZERO-PII-AXIOM': { type: 'PolicyRule', properties: { rule: 'Zero Real PII Ingress Masking' } },
      'BEDROCK-CLAUDE': { type: 'ReasoningNode', properties: { engine: 'Claude 3.5 Sonnet on Bedrock' } },
      'LATS-TREE': { type: 'ReasoningNode', properties: { tree: 'Monte-Carlo Search with Reflection' } },
      'CHUNK-BATTERY-TRIAGE': { type: 'VectorChunk', properties: { tokens: 340, vector_dim: 1536, cosine: 0.94 } },
      'ACT-PING-REBOOT': { type: 'Action', properties: { action: 'OTA Diagnostic Ping Probe' } },
    };

    const mockRels = [
      { source: 'DOM-MERCHANT', target: 'M_DISPUTE_TAT', type: 'SUBCLASS_OF' },
      { source: 'DOM-DEVICES', target: 'SB-4421', type: 'SUBCLASS_OF' },
      { source: 'DOM-DEVICES', target: 'POS-9982', type: 'SUBCLASS_OF' },
      { source: 'DOM-FINANCIALS', target: 'SETTL-8492', type: 'SUBCLASS_OF' },
      { source: 'DOM-POLICIES', target: 'NPCI-CIRC-142', type: 'SUBCLASS_OF' },
      { source: 'DOM-REASONING', target: 'BEDROCK-CLAUDE', type: 'SUBCLASS_OF' },
      { source: 'DOM-MEMORY', target: 'CHUNK-BATTERY-TRIAGE', type: 'SUBCLASS_OF' },
      { source: 'M_DISPUTE_TAT', target: 'SB-4421', type: 'OWNS' },
      { source: 'M_DISPUTE_TAT', target: 'POS-9982', type: 'OWNS' },
      { source: 'M_DISPUTE_TAT', target: 'SETTL-8492', type: 'INVOLVES' },
      { source: 'M_DISPUTE_TAT', target: 'KHAATA-SHARMA-JI', type: 'INVOLVES' },
      { source: 'M_DISPUTE_TAT', target: 'KHAATA-VERMA-GROCER', type: 'INVOLVES' },
      { source: 'M_DISPUTE_TAT', target: 'M_SUPPLIER_AMUL', type: 'INVOLVES' },
      { source: 'M_DISPUTE_TAT', target: 'SKU-ATTA-10KG', type: 'OWNS' },
      { source: 'SB-4421', target: 'ACT-PING-REBOOT', type: 'TRIGGERED_BY' },
      { source: 'NPCI-CIRC-142', target: 'SETTL-8492', type: 'GOVERNS' },
      { source: 'BEDROCK-CLAUDE', target: 'LATS-TREE', type: 'REASONS_OVER' },
      { source: 'CHUNK-BATTERY-TRIAGE', target: 'SB-4421', type: 'EMBEDS' },
    ];

    initializeGraph(mockEntities, mockRels);
  }, []);

  const initializeGraph = (entities: Record<string, any>, rels: any[]) => {
    const width = containerRef.current?.clientWidth || 900;
    const height = containerRef.current?.clientHeight || 650;
    const centerX = width / 2;
    const centerY = height / 2;

    const domainPositions: Record<string, { x: number; y: number; color: string; label: string }> = {
      'DOM-MERCHANT': { x: centerX - 260, y: centerY - 150, color: '#FE8A70', label: 'Kirana Operations Domain (1.2B Events)' },
      'DOM-DEVICES': { x: centerX + 260, y: centerY - 150, color: '#F59E0B', label: 'Edge IoT Telemetry Domain (48M Pings)' },
      'DOM-FINANCIALS': { x: centerX - 240, y: centerY + 170, color: '#10B981', label: 'Ledger & Settlement Domain (₹480M Escrow)' },
      'DOM-POLICIES': { x: centerX + 240, y: centerY + 170, color: '#A855F7', label: 'NPCI / RBI Regulatory Domain (1,400 Rules)' },
      'DOM-REASONING': { x: centerX, y: centerY - 230, color: '#F43F5E', label: 'Agentic LATS Decision Core (Bedrock Sonnet)' },
      'DOM-MEMORY': { x: centerX, y: centerY + 240, color: '#06B6D4', label: 'Second Brain Vector Embeddings (1536-D)' },
    };

    const newNodes: GraphNode[] = [];
    const newEdges: GraphEdge[] = [];
    const nodeMap = new Map<string, GraphNode>();

    // 1. Add Domain Super-Clusters
    Object.entries(domainPositions).forEach(([id, dom]) => {
      const node: GraphNode = {
        id,
        type: 'Domain',
        label: dom.label,
        color: dom.color,
        radius: 20,
        x: dom.x + (Math.random() - 0.5) * 20,
        y: dom.y + (Math.random() - 0.5) * 20,
        vx: 0,
        vy: 0,
        isPinned: false,
        properties: entities[id]?.properties || { title: dom.label }
      };
      newNodes.push(node);
      nodeMap.set(id, node);
    });

    // 2. Add Base API Entities (Personalized to Kumar Stores)
    Object.entries(entities).forEach(([id, entity]) => {
      if (domainPositions[id]) return; // Already added as domain
      const type = entity.type || 'Entity';
      const color = TYPE_COLORS[type] || '#889064';
      
      // Nearest domain clustering
      let nearestHub = 'DOM-MERCHANT';
      if (type === 'Device' || type === 'Telemetry') nearestHub = 'DOM-DEVICES';
      else if (type === 'Settlement' || type === 'Transaction') nearestHub = 'DOM-FINANCIALS';
      else if (type === 'PolicyRule') nearestHub = 'DOM-POLICIES';
      else if (type === 'ReasoningNode' || type === 'Action') nearestHub = 'DOM-REASONING';
      else if (type === 'VectorChunk') nearestHub = 'DOM-MEMORY';

      const hub = domainPositions[nearestHub] || { x: centerX, y: centerY };
      const angle = Math.random() * Math.PI * 2;
      const dist = 55 + Math.random() * 105;

      const node: GraphNode = {
        id,
        type,
        label: entity.properties?.title || entity.properties?.name || id,
        color,
        radius: type === 'ReasoningNode' || type === 'Merchant' ? 12 : 8,
        x: hub.x + Math.cos(angle) * dist,
        y: hub.y + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        properties: {
          ...entity.properties,
          tenant_owner: entity.properties?.tenant_owner || 'Kumar Stores (Private Vault)'
        }
      };
      newNodes.push(node);
      nodeMap.set(id, node);
    });

    // 3. Dense Cosmic Nebula Expansion (Satellites representing billions of data points)
    const clusterKeys = Object.keys(domainPositions);
    clusterKeys.forEach((hubId) => {
      const hub = domainPositions[hubId];
      const satellitesCount = 38;

      for (let s = 1; s <= satellitesCount; s++) {
        const sId = `SAT-${hubId.slice(4, 8)}-${s.toString().padStart(2, '0')}`;
        const angle = (s / satellitesCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
        const dist = 80 + Math.random() * 120;

        const satNode: GraphNode = {
          id: sId,
          type: 'VectorChunk',
          label: `${hubId.slice(4)} Training Synapse #${s}`,
          color: hub.color,
          radius: 3.5 + Math.random() * 3,
          x: hub.x + Math.cos(angle) * dist,
          y: hub.y + Math.sin(angle) * dist,
          vx: 0,
          vy: 0,
          properties: {
            cluster: hubId,
            training_dimension: '1536-D Cosine Embed',
            events_represented: `${(1.2 + (s * 0.3)).toFixed(1)}M Kirana Event Tokens`,
            confidence: (0.92 + (s % 7) * 0.01).toFixed(2),
            tenant_scope: 'Kumar Stores Encrypted Sandbox'
          }
        };
        newNodes.push(satNode);
        nodeMap.set(sId, satNode);

        // Edge back to Hub
        newEdges.push({
          source: hubId,
          target: sId,
          type: 'EMBEDS',
          sourceNode: nodeMap.get(hubId),
          targetNode: satNode
        });

        // Inter-satellite web link for dense constellation
        if (s > 1 && Math.random() > 0.4) {
          const prevId = `SAT-${hubId.slice(4, 8)}-${(s - 1).toString().padStart(2, '0')}`;
          if (nodeMap.has(prevId)) {
            newEdges.push({
              source: prevId,
              target: sId,
              type: 'SYNAPSE',
              sourceNode: nodeMap.get(prevId),
              targetNode: satNode
            });
          }
        }
      }
    });

    // 4. Connect Base Relationships from API
    rels.forEach((r) => {
      if (nodeMap.has(r.source) && nodeMap.has(r.target)) {
        newEdges.push({
          source: r.source,
          target: r.target,
          type: r.type,
          sourceNode: nodeMap.get(r.source),
          targetNode: nodeMap.get(r.target)
        });
      }
    });

    // 5. Cross-Domain Cosmic Bridges
    const bridges = [
      ['DOM-MERCHANT', 'DOM-DEVICES'],
      ['DOM-DEVICES', 'DOM-FINANCIALS'],
      ['DOM-FINANCIALS', 'DOM-POLICIES'],
      ['DOM-POLICIES', 'DOM-REASONING'],
      ['DOM-REASONING', 'DOM-MEMORY'],
      ['DOM-MEMORY', 'DOM-MERCHANT'],
      ['DOM-REASONING', 'DOM-DEVICES'],
      ['DOM-FINANCIALS', 'DOM-REASONING']
    ];
    bridges.forEach(([src, tgt]) => {
      if (nodeMap.has(src) && nodeMap.has(tgt)) {
        newEdges.push({
          source: src,
          target: tgt,
          type: 'CROSS_DOMAIN_BRIDGE',
          sourceNode: nodeMap.get(src),
          targetNode: nodeMap.get(tgt)
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(n => {
      if (activeFilter !== 'ALL') {
        if (activeFilter === 'Khaata' && !n.id.includes('KHAATA') && !n.label.includes('Khaata')) return false;
        else if (activeFilter === 'Suppliers' && !n.id.includes('SUPPLIER')) return false;
        else if (activeFilter === 'Inventory' && !n.id.includes('SKU')) return false;
        else if (activeFilter !== 'Khaata' && activeFilter !== 'Suppliers' && activeFilter !== 'Inventory' && n.type !== activeFilter) return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return n.id.toLowerCase().includes(query) || n.label.toLowerCase().includes(query);
      }
      return true;
    });
  }, [nodes, activeFilter, searchQuery]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // 60FPS Obsidian Force Simulation & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particleOffset = 0;

    const simulate = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // 1. Force-Directed Physics (unless paused)
      if (!isPhysicsPaused) {
        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i];
          if (n1 === draggedNodeRef.current || n1.isPinned) continue;

          // Gravity towards center
          const dxCenter = centerX - n1.x;
          const dyCenter = centerY - n1.y;
          n1.vx += dxCenter * 0.0003;
          n1.vy += dyCenter * 0.0003;

          // Repulsion between all nodes
          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy + 100;
            const dist = Math.sqrt(distSq);

            if (dist < 400) {
              const force = (n1.radius * n2.radius * 24) / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              n1.vx -= fx;
              n1.vy -= fy;
              if (n2 !== draggedNodeRef.current && !n2.isPinned) {
                n2.vx += fx;
                n2.vy += fy;
              }
            }
          }
        }

        // Spring attraction along edges
        for (const e of edges) {
          if (!e.sourceNode || !e.targetNode) continue;
          const dx = e.targetNode.x - e.sourceNode.x;
          const dy = e.targetNode.y - e.sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = e.sourceNode.type === 'Domain' ? 90 : 65;
          const force = (dist - targetDist) * 0.0025;

          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          if (e.sourceNode !== draggedNodeRef.current && !e.sourceNode.isPinned) {
            e.sourceNode.vx += fx;
            e.sourceNode.vy += fy;
          }
          if (e.targetNode !== draggedNodeRef.current && !e.targetNode.isPinned) {
            e.targetNode.vx -= fx;
            e.targetNode.vy -= fy;
          }
        }

        // Apply velocity with damping
        for (const n of nodes) {
          if (n === draggedNodeRef.current || n.isPinned) continue;
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= 0.88;
          n.vy *= 0.88;
        }
      }

      // 2. Render Canvas (Obsidian Cosmic Dark)
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // Pan & Zoom
      ctx.translate(cameraRef.current.x, cameraRef.current.y);
      ctx.scale(cameraRef.current.zoom, cameraRef.current.zoom);

      // Subtle celestial grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const dotSpacing = 40;
      for (let x = -width * 2; x < width * 3; x += dotSpacing) {
        for (let y = -height * 2; y < height * 3; y += dotSpacing) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }

      particleOffset = (particleOffset + 0.015) % 1;

      // Draw Cosmic Nebula Gas Clouds around Domain Super-Clusters
      for (const n of nodes) {
        if (n.type === 'Domain') {
          const grad = ctx.createRadialGradient(n.x, n.y, 8, n.x, n.y, 160);
          grad.addColorStop(0, n.color + '33');
          grad.addColorStop(0.4, n.color + '12');
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.arc(n.x, n.y, 160, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // Draw Edges
      for (const e of edges) {
        if (!e.sourceNode || !e.targetNode) continue;

        const isHighlighted = 
          hoveredNode && (e.source === hoveredNode.id || e.target === hoveredNode.id);
        const isDimmed = 
          hoveredNode && !isHighlighted;

        ctx.beginPath();
        ctx.moveTo(e.sourceNode.x, e.sourceNode.y);
        ctx.lineTo(e.targetNode.x, e.targetNode.y);
        ctx.strokeStyle = isHighlighted 
          ? 'rgba(254, 138, 112, 0.85)' 
          : isDimmed 
            ? 'rgba(255, 255, 255, 0.03)' 
            : 'rgba(255, 255, 255, 0.11)';
        ctx.lineWidth = isHighlighted ? 2.5 : 1;
        ctx.stroke();

        // Edge packet particles
        if (!isDimmed) {
          const px = e.sourceNode.x + (e.targetNode.x - e.sourceNode.x) * particleOffset;
          const py = e.sourceNode.y + (e.targetNode.y - e.sourceNode.y) * particleOffset;
          ctx.beginPath();
          ctx.arc(px, py, isHighlighted ? 2.5 : 1.4, 0, Math.PI * 2);
          ctx.fillStyle = isHighlighted ? '#FE8A70' : 'rgba(255, 255, 255, 0.4)';
          ctx.fill();
        }
      }

      // Draw Linking rubber-band line in Connect Mode
      if (isConnectMode && connectSourceNode) {
        const mouseCoords = getMouseCanvasCoords();
        ctx.beginPath();
        ctx.moveTo(connectSourceNode.x, connectSourceNode.y);
        ctx.lineTo(mouseCoords.x, mouseCoords.y);
        ctx.setLineDash([5, 5]);
        ctx.strokeStyle = '#FE8A70';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Nodes
      for (const n of nodes) {
        const isSelected = selectedNode?.id === n.id;
        const isHovered = hoveredNode?.id === n.id;
        const isConnectSource = connectSourceNode?.id === n.id;
        const isMatchingFilter = activeNodeIds.has(n.id);
        const isDimmed = (hoveredNode && !isHovered && !edges.some(e => 
          (e.source === hoveredNode.id && e.target === n.id) || 
          (e.target === hoveredNode.id && e.source === n.id)
        )) || !isMatchingFilter;

        ctx.save();
        ctx.globalAlpha = isDimmed ? 0.18 : 1.0;

        // Outer Glow Ring (Halo)
        if (isSelected || isHovered || isConnectSource || n.type === 'Domain') {
          ctx.shadowColor = isConnectSource ? '#FACC15' : n.color;
          ctx.shadowBlur = isSelected || isConnectSource ? 26 : 14;
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius + (isSelected ? 3 : 0), 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.fill();

        // Inner Core Ring
        ctx.lineWidth = isSelected || isConnectSource ? 3 : 1.5;
        ctx.strokeStyle = isConnectSource ? '#FACC15' : isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.3)';
        ctx.stroke();

        ctx.restore();

        // Draw Node Label
        if (!isDimmed || isHovered || isSelected || isConnectSource || n.type === 'Domain') {
          ctx.save();
          ctx.font = `${n.type === 'Domain' ? 'bold 12px' : '10px'} Inter, sans-serif`;
          ctx.fillStyle = isConnectSource ? '#FACC15' : isSelected ? '#FFFFFF' : isDimmed ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.85)';
          ctx.textAlign = 'center';
          ctx.fillText(n.label, n.x, n.y + n.radius + 14);
          ctx.restore();
        }
      }

      ctx.restore();
      animId = requestAnimationFrame(simulate);
    };

    animId = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animId);
  }, [nodes, edges, selectedNode, hoveredNode, activeNodeIds, isPhysicsPaused, isConnectMode, connectSourceNode, isFullscreen]);

  // Responsive Canvas Size
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      const w = isFullscreen ? window.innerWidth : (containerRef.current?.clientWidth || 800);
      const h = isFullscreen ? window.innerHeight : (containerRef.current?.clientHeight || 600);
      canvasRef.current.width = w;
      canvasRef.current.height = h;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // Escape key to exit Full View & auto-fit on Full View
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        if (canvasRef.current && containerRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
          handleZoomToFit();
        }
      }, 80);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = '';
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);


  // Pointer & Mouse Interaction
  const mouseScreenPosRef = useRef({ x: 0, y: 0 });

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    return {
      x: (rawX - cameraRef.current.x) / cameraRef.current.zoom,
      y: (rawY - cameraRef.current.y) / cameraRef.current.zoom,
    };
  };

  const getMouseCanvasCoords = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const rawX = mouseScreenPosRef.current.x - rect.left;
    const rawY = mouseScreenPosRef.current.y - rect.top;
    return {
      x: (rawX - cameraRef.current.x) / cameraRef.current.zoom,
      y: (rawY - cameraRef.current.y) / cameraRef.current.zoom,
    };
  };

  const findNodeAt = (x: number, y: number) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const dist = Math.hypot(n.x - x, n.y - y);
      if (dist <= n.radius + 8) return n;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingOccurredRef.current = false;
    mouseScreenPosRef.current = { x: e.clientX, y: e.clientY };
    const coords = getCanvasCoords(e);
    const hitNode = findNodeAt(coords.x, coords.y);

    if (hitNode) {
      draggedNodeRef.current = hitNode;
      hitNode.isPinned = true;
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - cameraRef.current.x, y: e.clientY - cameraRef.current.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    mouseScreenPosRef.current = { x: e.clientX, y: e.clientY };

    if (draggedNodeRef.current) {
      isDraggingOccurredRef.current = true;
      const coords = getCanvasCoords(e);
      draggedNodeRef.current.x = coords.x;
      draggedNodeRef.current.y = coords.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isPanningRef.current) {
      isDraggingOccurredRef.current = true;
      cameraRef.current.x = e.clientX - panStartRef.current.x;
      cameraRef.current.y = e.clientY - panStartRef.current.y;
      return;
    }

    const coords = getCanvasCoords(e);
    const hitNode = findNodeAt(coords.x, coords.y);
    setHoveredNode(hitNode);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      draggedNodeRef.current.isPinned = false;
      draggedNodeRef.current = null;
    }
    isPanningRef.current = false;

    // Handle Node Click (if user didn't drag)
    if (!isDraggingOccurredRef.current) {
      const coords = getCanvasCoords(e);
      const hitNode = findNodeAt(coords.x, coords.y);

      if (hitNode) {
        if (isConnectMode) {
          if (!connectSourceNode) {
            setConnectSourceNode(hitNode);
          } else if (connectSourceNode.id !== hitNode.id) {
            // Create link between connectSourceNode and hitNode
            const newEdge: GraphEdge = {
              source: connectSourceNode.id,
              target: hitNode.id,
              type: 'MANUAL_SYNAPSE',
              sourceNode: connectSourceNode,
              targetNode: hitNode
            };
            setEdges(prev => [...prev, newEdge]);
            setConnectSourceNode(null);
            setIsConnectMode(false);
          }
        } else {
          setSelectedNode(hitNode);
          onNodeSelect?.(hitNode);
        }
      } else {
        if (!isConnectMode) {
          setSelectedNode(null);
        }
      }
    }
  };

  // Cursor-Anchored Smooth Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const currentZoom = cameraRef.current.zoom;
    const newZoom = Math.min(Math.max(currentZoom * zoomFactor, 0.25), 4.0);

    // Anchor zoom around cursor position
    cameraRef.current.x = mouseX - (mouseX - cameraRef.current.x) * (newZoom / currentZoom);
    cameraRef.current.y = mouseY - (mouseY - cameraRef.current.y) * (newZoom / currentZoom);
    cameraRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  };

  // Zoom Controls
  const handleZoomIn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const newZoom = Math.min(cameraRef.current.zoom * 1.25, 4.0);
    cameraRef.current.x = centerX - (centerX - cameraRef.current.x) * (newZoom / cameraRef.current.zoom);
    cameraRef.current.y = centerY - (centerY - cameraRef.current.y) * (newZoom / cameraRef.current.zoom);
    cameraRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  };

  const handleZoomOut = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const newZoom = Math.max(cameraRef.current.zoom * 0.8, 0.25);
    cameraRef.current.x = centerX - (centerX - cameraRef.current.x) * (newZoom / cameraRef.current.zoom);
    cameraRef.current.y = centerY - (centerY - cameraRef.current.y) * (newZoom / cameraRef.current.zoom);
    cameraRef.current.zoom = newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  };

  const resetCamera = () => {
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
    setZoomLevel(100);
  };

  // Zoom to Fit Panoramic View
  const handleZoomToFit = () => {
    if (nodes.length === 0 || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    nodes.forEach(n => {
      minX = Math.min(minX, n.x);
      maxX = Math.max(maxX, n.x);
      minY = Math.min(minY, n.y);
      maxY = Math.max(maxY, n.y);
    });
    const graphWidth = maxX - minX + 160;
    const graphHeight = maxY - minY + 160;
    const scaleX = width / graphWidth;
    const scaleY = height / graphHeight;
    const newZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.3), 1.4);
    const graphCenterX = (minX + maxX) / 2;
    const graphCenterY = (minY + maxY) / 2;
    cameraRef.current = {
      x: width / 2 - graphCenterX * newZoom,
      y: height / 2 - graphCenterY * newZoom,
      zoom: newZoom
    };
    setZoomLevel(Math.round(newZoom * 100));
  };

  useEffect(() => {
    if (isFullscreen) {
      const t = setTimeout(() => {
        if (canvasRef.current && containerRef.current) {
          canvasRef.current.width = window.innerWidth;
          canvasRef.current.height = window.innerHeight;
        }
        handleZoomToFit();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [isFullscreen]);

  // Focus Camera Directly on a Node
  const focusOnNode = (node: GraphNode) => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    const targetZoom = 1.35;
    cameraRef.current = {
      x: width / 2 - node.x * targetZoom,
      y: height / 2 - node.y * targetZoom,
      zoom: targetZoom
    };
    setZoomLevel(Math.round(targetZoom * 100));
    setSelectedNode(node);
  };

  // Add Custom Node Submission
  const handleAddCustomNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeName.trim()) return;
    const id = `CUSTOM-${Date.now().toString().slice(-6)}`;
    const color = TYPE_COLORS[newNodeType] || '#FE8A70';
    
    // Position near domain hub or center
    const domainHub = nodes.find(n => n.id === newNodeDomain) || { x: 450, y: 320 };
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 60;

    const node: GraphNode = {
      id,
      type: newNodeType,
      label: newNodeName.trim(),
      color,
      radius: 12,
      x: domainHub.x + Math.cos(angle) * dist,
      y: domainHub.y + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      properties: {
        created_by: 'Kumar Stores (Merchant Owner)',
        description: newNodeDesc.trim() || 'Store personalized custom knowledge entity',
        created_at: 'Just now',
        tenant_owner: 'Kumar Stores (Private Vault)'
      }
    };

    setNodes(prev => [...prev, node]);
    setEdges(prev => [...prev, {
      source: newNodeDomain,
      target: id,
      type: 'BELONGS_TO',
      sourceNode: nodes.find(n => n.id === newNodeDomain) || node,
      targetNode: node
    }]);

    setSelectedNode(node);
    setIsAddModalOpen(false);
    setNewNodeName('');
    setNewNodeDesc('');
  };

  // Delete Selected Node
  const handleDeleteSelectedNode = () => {
    if (!selectedNode) return;
    if (selectedNode.type === 'Domain') {
      alert('Domain super-clusters are core foundation hubs and cannot be removed.');
      return;
    }
    setNodes(prev => prev.filter(n => n.id !== selectedNode.id));
    setEdges(prev => prev.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  // Node details & connected edges
  const nodeConnections = useMemo(() => {
    if (!selectedNode) return [];
    return edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id);
  }, [selectedNode, edges]);

  const graphContent = (
    <div 
      ref={containerRef}
      className={`w-full overflow-hidden bg-[#0C0D11] border border-white/10 shadow-2xl flex flex-col select-none ${
        isFullscreen 
          ? 'fixed inset-0 z-[999999] rounded-none w-screen h-screen' 
          : 'relative rounded-2xl'
      }`}
      style={
        isFullscreen 
          ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 999999, margin: 0, padding: 0 } 
          : { height, width: '100%' }
      }
    >
      {/* 1. TOP HEADER: TENANT PRIVACY & GLOBAL SEARCH */}
      <div className={`absolute z-30 flex flex-wrap justify-between items-center gap-2 pointer-events-auto transition-all ${
        isFullscreen 
          ? 'top-0 left-0 right-0 px-6 py-3 bg-[#0D1117]/95 backdrop-blur-xl border-b border-white/15' 
          : 'top-4 left-4 right-4'
      }`}>
        
        {/* Left: Tenant Privacy Partition Badge & Search */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Tenant Isolation Badge */}
          <div className="bg-[#14161F]/95 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 flex items-center gap-2.5 shadow-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">
                  Kumar Stores Private Vault · Paytm Ecosystem
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  Tenant Isolated
                </span>
              </div>
              <span className="text-[9px] text-white/50 font-medium">
                {nodes.length} nodes · {edges.length} synapses · 2.8B Kirana events trained
              </span>
            </div>
          </div>

          {/* Search Box with Autocomplete Pan */}
          <div className="bg-[#14161F]/95 backdrop-blur-md rounded-xl border border-white/10 px-3 py-1.5 flex items-center gap-2 shadow-xl">
            <Search className="w-3.5 h-3.5 text-white/40" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search store nodes, SKUs, devices..."
              className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/40 w-36 md:w-56"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Right: Quick Zoom Level Indicator & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {compact && !isFullscreen && (
            <span className="hidden md:inline-block text-[10px] font-mono text-white/40">Embedded View</span>
          )}
          <div className="bg-[#14161F]/90 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 text-[11px] font-mono font-bold text-white/70 shadow-lg">
            {zoomLevel}%
          </div>

          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-lg transition-transform active:scale-95 flex items-center gap-1.5 ${
              isFullscreen 
                ? 'bg-rose-500/25 text-rose-200 border border-rose-500/50 hover:bg-rose-600 hover:text-white' 
                : 'bg-[#14161F]/90 border border-white/10 text-white hover:text-white'
            }`}
            title={isFullscreen ? "Exit Full View (ESC)" : "Enable Full View to Ontology Layer"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-rose-300" />
                <span className="text-xs font-bold">Exit Full View (ESC)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-[#FE8A70]" />
                <span className="text-xs font-bold text-white">Full View</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. FLOATING INTERACTIVE TOOLBOX (BOTTOM RIGHT / FLOATING BAR) */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-[#14161F]/95 backdrop-blur-lg border border-white/15 shadow-2xl pointer-events-auto">
        <button 
          onClick={handleZoomIn}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomOut}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button 
          onClick={handleZoomToFit}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Zoom to Fit All Nodes"
        >
          <Focus className="w-4 h-4" />
        </button>
        <button 
          onClick={resetCamera}
          className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title="Reset Camera Center"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-5 bg-white/10 mx-0.5" />

        {/* Physics Play / Pause */}
        <button
          onClick={() => setIsPhysicsPaused(!isPhysicsPaused)}
          className={`p-2 rounded-xl transition-all ${
            isPhysicsPaused 
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title={isPhysicsPaused ? "Resume Physics Simulation" : "Freeze / Pause Physics Simulation"}
        >
          {isPhysicsPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        </button>

        {/* Link / Connect Mode Toggle */}
        <button
          onClick={() => {
            setIsConnectMode(!isConnectMode);
            setConnectSourceNode(null);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            isConnectMode 
              ? 'bg-[#FE8A70] text-black shadow-lg shadow-[#FE8A70]/30 animate-pulse' 
              : 'text-white/80 hover:text-white hover:bg-white/10'
          }`}
          title="Connect two nodes by clicking them"
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>{isConnectMode ? 'Linking...' : 'Link Nodes'}</span>
        </button>

        {/* Add Custom Node Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Node</span>
        </button>
      </div>

      {/* 3. CONNECT MODE BANNER (WHEN ACTIVE) */}
      {isConnectMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-amber-500/90 text-black font-bold text-xs shadow-xl flex items-center gap-2 pointer-events-auto animate-bounce">
          <AlertCircle className="w-4 h-4" />
          <span>{connectSourceNode ? `Now click target node to link from "${connectSourceNode.label}"` : 'Click the first node you want to connect'}</span>
          <button 
            onClick={() => { setIsConnectMode(false); setConnectSourceNode(null); }}
            className="ml-2 px-1.5 py-0.5 rounded bg-black/20 hover:bg-black/40 text-[10px]"
          >
            Cancel
          </button>
        </div>
      )}

      {/* 4. CATEGORY FILTER PILLS (BOTTOM LEFT) */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-1.5 max-w-xl pointer-events-auto">
        {[
          { id: 'ALL', label: 'All Galaxy' },
          { id: 'Khaata', label: 'Khaata Credit' },
          { id: 'Suppliers', label: 'Distributors' },
          { id: 'Inventory', label: 'Store SKUs' },
          { id: 'Device', label: 'IoT Hardware' },
          { id: 'Settlement', label: 'Ledger Escrow' },
          { id: 'PolicyRule', label: 'NPCI Rules' },
          { id: 'ReasoningNode', label: 'Reasoning Trees' }
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveFilter(id)}
            className={`text-[10px] font-bold px-2.5 py-1.2 rounded-lg backdrop-blur-md border transition-all ${
              activeFilter === id 
                ? 'bg-white text-[#0C0D11] border-white shadow-md scale-105' 
                : 'bg-[#14161F]/80 text-white/70 border-white/10 hover:text-white hover:bg-[#14161F]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 5. CANVAS VIEWPORT */}
      <canvas 
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 6. SELECTED NODE INSPECTOR DRAWER (RIGHT PANEL) */}
      {selectedNode && (
        <div className="absolute top-16 right-4 bottom-20 w-84 bg-[#14161F]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 text-white shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4">
          <div className="flex justify-between items-start mb-3 pb-2 border-b border-white/10">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span 
                  className="w-2.5 h-2.5 rounded-full" 
                  style={{ backgroundColor: selectedNode.color }}
                />
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                  {selectedNode.type}
                </span>
              </div>
              <h3 className="text-base font-bold text-white leading-tight">
                {selectedNode.label}
              </h3>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="p-1 text-white/50 hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            
            {/* Tenant Ownership & Privacy Tag */}
            <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-[11px] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Owner: {selectedNode.properties.tenant_owner || 'Kumar Stores (Private Sandbox)'}</span>
            </div>

            {/* Properties Block */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1">
                <Database className="w-3 h-3 text-[#06B6D4]" /> Entity Telemetry & Metadata
              </h4>
              <div className="bg-black/40 rounded-xl p-2.5 border border-white/5 space-y-1 font-mono text-[11px]">
                {Object.entries(selectedNode.properties).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <span className="text-white/50 truncate">{k}:</span>
                    <span className="text-[#FE8A70] font-semibold text-right truncate">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Semantic Vector Embedding Info if Vector Chunk */}
            {selectedNode.type === 'VectorChunk' && (
              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <div className="flex items-center gap-1.5 mb-1 text-cyan-400 font-bold text-[11px]">
                  <Cpu className="w-3.5 h-3.5" /> Vector Embedding Space
                </div>
                <p className="text-[11px] text-white/80 leading-relaxed mb-2">
                  Retrieved via MindStudio semantic search across RAG memory layers.
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="bg-black/30 p-1.5 rounded">Dim: 1536 Cosine</div>
                  <div className="bg-black/30 p-1.5 rounded">Score: {selectedNode.properties.confidence || 0.96}</div>
                </div>
              </div>
            )}

            {/* Connected Synapses & Quick Jump */}
            <div>
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1.5 flex items-center gap-1">
                <Network className="w-3 h-3 text-[#A855F7]" /> Connected Synapses ({nodeConnections.length})
              </h4>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                {nodeConnections.map((e, idx) => {
                  const isOutgoing = e.source === selectedNode.id;
                  const targetId = isOutgoing ? e.target : e.source;
                  const targetNode = nodes.find(n => n.id === targetId);

                  return (
                    <div 
                      key={idx}
                      onClick={() => targetNode && focusOnNode(targetNode)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/5 flex items-center justify-between cursor-pointer"
                      title="Click to fly camera to this connected node"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-white/10 text-white/70">
                          {e.type}
                        </span>
                        <span className="font-semibold text-white/90 truncate">{targetNode?.label || targetId}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/40 shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Node Actions (Connect / Delete) */}
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  setIsConnectMode(true);
                  setConnectSourceNode(selectedNode);
                }}
                className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 text-white transition-colors"
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Link Node</span>
              </button>

              {selectedNode.type !== 'Domain' && (
                <button
                  onClick={handleDeleteSelectedNode}
                  className="py-1.5 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  title="Remove this node from graph"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              )}
            </div>

          </div>

          <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-white/40 flex items-center justify-between">
            <span>Kumar Stores Private Adjacency</span>
            <span>Tara v3 Core</span>
          </div>
        </div>
      )}

      {/* 7. ADD CUSTOM NODE MODAL */}
      {isAddModalOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#14161F] border border-white/15 rounded-2xl p-6 w-full max-w-md text-white shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#FE8A70]" />
                <h3 className="text-base font-bold text-white">Add Custom Store Node</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-white/50 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomNode} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-white/70 mb-1 font-medium">Node Label / Entity Name</label>
                <input 
                  type="text" 
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="e.g. Ramesh Khaata Account, Mother Dairy Supplier..."
                  required
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-[#FE8A70] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white/70 mb-1 font-medium">Entity Type</label>
                  <select 
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-[#FE8A70] outline-none"
                  >
                    <option value="Merchant">Merchant / Customer</option>
                    <option value="Device">Hardware / Sensor</option>
                    <option value="Settlement">Financial / Ledger</option>
                    <option value="PolicyRule">Policy / Rule</option>
                    <option value="VectorChunk">Second Brain Note</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/70 mb-1 font-medium">Domain Cluster</label>
                  <select 
                    value={newNodeDomain}
                    onChange={(e) => setNewNodeDomain(e.target.value)}
                    className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white focus:border-[#FE8A70] outline-none"
                  >
                    <option value="DOM-MERCHANT">Kirana Operations</option>
                    <option value="DOM-DEVICES">IoT Devices</option>
                    <option value="DOM-FINANCIALS">Financial Ledger</option>
                    <option value="DOM-POLICIES">Regulatory Norms</option>
                    <option value="DOM-MEMORY">Second Brain Memory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white/70 mb-1 font-medium">Description / Store Notes</label>
                <textarea 
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                  placeholder="Optional context, credit terms, SLA, or device serial..."
                  rows={2}
                  className="w-full bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-white placeholder:text-white/30 focus:border-[#FE8A70] outline-none resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-white/70 hover:text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#FE8A70] text-black font-bold hover:bg-[#FE8A70]/90 transition-all"
                >
                  Add to Galaxy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. LOADING OVERLAY */}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0C0D11]/85 backdrop-blur-sm flex items-center justify-center z-40">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Sparkles className="w-5 h-5 text-[#FE8A70] animate-spin" />
            Synchronizing Store Knowledge Galaxy...
          </div>
        </div>
      )}
    </div>
  );

  return isFullscreen ? createPortal(graphContent, document.body) : graphContent;
};

import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { 
  Minus, Plus, RefreshCw, Store, ShieldAlert, Wifi, BatteryMedium, 
  Cpu, CheckCircle2, Volume2, ExternalLink, Zap
} from 'lucide-react';
import { useDerivedState } from '../../context/DerivedStateContext';

type ViewMode = '3d' | 'top';

interface DeviceDetail {
  id: string;
  name: string;
  status: 'ONLINE' | 'OFFLINE';
  battery: number;
  signal: string;
  firmware: string;
  lastPing: string;
  protocol: string;
}

// ============================================================================
// Procedural Canvas Texture Generators for Ultra-Realistic Materials
// ============================================================================

/** Realistic large-format porcelain/terrazzo floor tiles with delicate grout & speckles */
function createTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm porcelain ground
  ctx.fillStyle = '#F4EDE4';
  ctx.fillRect(0, 0, 512, 512);

  // Terrazzo / marble mineral flecks
  for (let i = 0; i < 450; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = Math.random() * 1.8 + 0.4;
    ctx.fillStyle = Math.random() > 0.45 ? 'rgba(210, 198, 185, 0.55)' : 'rgba(245, 240, 235, 0.7)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2x2 Clean Grout Grid
  ctx.strokeStyle = '#D5CBC0';
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, 509, 509);
  ctx.beginPath();
  ctx.moveTo(256, 0); ctx.lineTo(256, 512);
  ctx.moveTo(0, 256); ctx.lineTo(512, 256);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 5);
  return texture;
}

/** Warm polished oak wood grain texture for the shop counter */
function createWoodTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#D69E66';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle natural wood striations
  for (let y = 0; y < 512; y += 2) {
    const tone = Math.sin(y * 0.07) * 22 + Math.cos(y * 0.02) * 10;
    ctx.fillStyle = `rgba(${195 + tone}, ${135 + tone * 0.75}, ${90 + tone * 0.45}, 0.24)`;
    ctx.fillRect(0, y, 512, 2);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 1);
  return texture;
}

/** Modern Touchscreen Cloud POS display for Kumar Stores */
function createPOSScreenTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Deep UI background
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(0, 0, 512, 320);

  // Header band
  ctx.fillStyle = '#00BAF2';
  ctx.fillRect(0, 0, 512, 42);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px Inter, sans-serif';
  ctx.fillText('KUMAR STORES · TARA CLOUD POS', 20, 28);

  // Live Sync Badge
  ctx.fillStyle = '#10B981';
  ctx.fillRect(400, 10, 92, 22);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('● LIVE SYNC', 412, 25);

  // Metrics Card
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(20, 60, 472, 85);
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('TODAY\'S REVENUE (48 BILLS)', 36, 85);
  ctx.fillStyle = '#F8FAFC';
  ctx.font = 'bold 32px monospace';
  ctx.fillText('₹ 18,420.50', 36, 125);

  // Edge Telemetry Bar
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(20, 160, 472, 140);
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 14px Inter, sans-serif';
  ctx.fillText('Soundbox SB-4421 · Telemetry Channel Active', 36, 192);
  ctx.fillStyle = '#CBD5E1';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText('• MQTT Heartbeat: Every 30s over 4G Cellular', 36, 220);
  ctx.fillText('• NPCI Auto-Reconciliation: Enabled', 36, 245);
  ctx.fillText('• Voice Chime: English + Hindi Dual Mode', 36, 270);

  return new THREE.CanvasTexture(canvas);
}

/** Official Paytm & UPI Acrylic QR Counter Stand Graphic */
function createQRStandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 340;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 256, 340);

  // Top Paytm banner
  ctx.fillStyle = '#00BAF2';
  ctx.fillRect(0, 0, 256, 52);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Paytm / UPI Accepted', 128, 32);

  // Shop Name
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.fillText('Kumar Stores · Shop #901', 128, 78);

  // QR Block
  const qrX = 43, qrY = 96, qrSize = 170;
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(qrX, qrY, qrSize, qrSize);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX + 6, qrY + 6, qrSize - 12, qrSize - 12);

  // QR Position Markers
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(qrX + 16, qrY + 16, 42, 42);
  ctx.fillRect(qrX + qrSize - 58, qrY + 16, 42, 42);
  ctx.fillRect(qrX + 16, qrY + qrSize - 58, 42, 42);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(qrX + 24, qrY + 24, 26, 26);
  ctx.fillRect(qrX + qrSize - 50, qrY + 24, 26, 26);
  ctx.fillRect(qrX + 24, qrY + qrSize - 50, 26, 26);
  ctx.fillStyle = '#0F172A';
  ctx.fillRect(qrX + 31, qrY + 31, 12, 12);
  ctx.fillRect(qrX + qrSize - 43, qrY + 31, 12, 12);
  ctx.fillRect(qrX + 31, qrY + qrSize - 43, 12, 12);

  // QR Center Badge
  ctx.fillStyle = '#00BAF2';
  ctx.beginPath();
  ctx.arc(qrX + qrSize / 2, qrY + qrSize / 2, 18, 0, Math.PI * 2);
  ctx.fill();

  // Footer instructions
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 11px Inter, sans-serif';
  ctx.fillText('Scan with any UPI App', 128, 295);
  ctx.fillText('Tara Voice Instant Chime', 128, 315);

  return new THREE.CanvasTexture(canvas);
}

export const RoomCanvas: React.FC = () => {
  const { state } = useDerivedState();
  const [view, setView] = useState<ViewMode>('3d');
  const [zoom, setZoom] = useState(1);
  const [selectedDevice, setSelectedDevice] = useState<DeviceDetail | null>(null);
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootSuccess, setRebootSuccess] = useState(false);
  const [isPlayingChime, setIsPlayingChime] = useState(false);

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.42, y: -0.65 });

  const soundboxDevice = state.devices.find(d => d.id === 'SB-4421');
  const isSoundboxOffline = (soundboxDevice?.status === 'OFFLINE') && !rebootSuccess;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0xF8E6DD); // Ground color
    scene.fog = new THREE.FogExp2(0xF8E6DD, 0.022);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
    cameraRef.current = camera;
    camera.position.set(13, 11, 14);
    camera.lookAt(0, 1.4, 0);

    // 3. Renderer with Cinematic ACES Tone Mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Photorealistic Lighting
    // Warm Ambient Light
    const ambientLight = new THREE.AmbientLight(0xFFF7ED, 1.1);
    scene.add(ambientLight);

    // Directional Key Sun / Window Light casting soft realistic shadows
    const keyLight = new THREE.DirectionalLight(0xFFF0D6, 2.2);
    keyLight.position.set(11, 16, 9);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0004;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 40;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    scene.add(keyLight);

    // Warm Store Overhead Spotlight above counter
    const counterSpot = new THREE.PointLight(0xFFE5B4, 2.6, 12, 1.4);
    counterSpot.position.set(-0.5, 4.8, 0.2);
    counterSpot.castShadow = true;
    counterSpot.shadow.bias = -0.0005;
    scene.add(counterSpot);

    // Cool Architectural Fill Light
    const fillLight = new THREE.DirectionalLight(0xD8E8F8, 0.55);
    fillLight.position.set(-10, 8, -6);
    scene.add(fillLight);

    // 5. Store Architecture

    // Floor: Polished Porcelain Tiles with Subtle Grout and Specular Highlights
    const tileTexture = createTileTexture();
    const floorGeo = new THREE.BoxGeometry(15, 0.4, 15);
    const floorMat = new THREE.MeshStandardMaterial({
      map: tileTexture,
      roughness: 0.26,
      metalness: 0.08,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back Wall
    const backWallGeo = new THREE.BoxGeometry(15, 6.5, 0.4);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0xF3EFEA,
      roughness: 0.85,
    });
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 3.25, -7.3);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left Wall
    const leftWallGeo = new THREE.BoxGeometry(0.4, 6.5, 15);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(-7.3, 3.25, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Skirting Boards (Baseboards) along wall bottoms
    const skirtingMat = new THREE.MeshStandardMaterial({ color: 0x2A3226, roughness: 0.4 });
    const backSkirting = new THREE.Mesh(new THREE.BoxGeometry(15, 0.35, 0.45), skirtingMat);
    backSkirting.position.set(0, 0.175, -7.26);
    scene.add(backSkirting);

    const leftSkirting = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.35, 15), skirtingMat);
    leftSkirting.position.set(-7.26, 0.175, 0);
    scene.add(leftSkirting);

    // Overhead Modern Pendant Lamp
    const cordGeo = new THREE.CylinderGeometry(0.015, 0.015, 2.2, 8);
    const cordMat = new THREE.MeshStandardMaterial({ color: 0x1E293B });
    const cord = new THREE.Mesh(cordGeo, cordMat);
    cord.position.set(-0.5, 5.2, 0.2);
    scene.add(cord);

    const lampShadeGeo = new THREE.ConeGeometry(0.65, 0.45, 24, 1, true);
    const lampShadeMat = new THREE.MeshStandardMaterial({
      color: 0x1C2218,
      roughness: 0.3,
      side: THREE.DoubleSide
    });
    const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
    lampShade.position.set(-0.5, 4.15, 0.2);
    scene.add(lampShade);

    const bulbGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xFFF2D1 });
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(-0.5, 4.05, 0.2);
    scene.add(bulb);

    // ========================================================================
    // 6. Shop Counter Desk (Ribbed Wooden Base + Polished Oak Top)
    // ========================================================================
    const counterGroup = new THREE.Group();

    // Dark forest fluted desk base
    const deskBaseGeo = new THREE.BoxGeometry(6.6, 2.2, 2.5);
    const deskBaseMat = new THREE.MeshStandardMaterial({
      color: 0x242D20,
      roughness: 0.45,
      metalness: 0.1
    });
    const deskBase = new THREE.Mesh(deskBaseGeo, deskBaseMat);
    deskBase.position.set(0, 1.1, 0);
    deskBase.castShadow = true;
    deskBase.receiveShadow = true;
    counterGroup.add(deskBase);

    // Brass / Brushed gold kickplate along counter base
    const kickGeo = new THREE.BoxGeometry(6.64, 0.12, 2.54);
    const kickMat = new THREE.MeshStandardMaterial({ color: 0xC5A059, metalness: 0.8, roughness: 0.25 });
    const kick = new THREE.Mesh(kickGeo, kickMat);
    kick.position.set(0, 0.06, 0);
    counterGroup.add(kick);

    // Chamfered polished oak countertop
    const woodTexture = createWoodTexture();
    const topGeo = new THREE.BoxGeometry(6.9, 0.18, 2.8);
    const topMat = new THREE.MeshStandardMaterial({
      map: woodTexture,
      roughness: 0.22,
      metalness: 0.04
    });
    const deskTop = new THREE.Mesh(topGeo, topMat);
    deskTop.position.set(0, 2.29, 0);
    deskTop.castShadow = true;
    deskTop.receiveShadow = true;
    counterGroup.add(deskTop);

    counterGroup.position.set(-0.4, 0, 0);
    scene.add(counterGroup);

    // ========================================================================
    // 7. Wall Shelves & Realistic Grocery Packaging
    // ========================================================================
    const shelfGroup = new THREE.Group();
    const steelBracketMat = new THREE.MeshStandardMaterial({ color: 0x1E232A, metalness: 0.7, roughness: 0.3 });

    for (let i = 0; i < 3; i++) {
      const shelfY = 2.2 + i * 1.25;
      const shelfPlank = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.12, 0.85), topMat);
      shelfPlank.position.set(0, shelfY, -6.6);
      shelfPlank.castShadow = true;
      shelfPlank.receiveShadow = true;
      shelfGroup.add(shelfPlank);

      // Steel wall brackets under shelf
      [-2.6, 2.6].forEach(bx => {
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.7), steelBracketMat);
        bracket.position.set(bx, shelfY - 0.3, -6.65);
        shelfGroup.add(bracket);
      });

      // Shelf Inventory Items: Realistic Kirana Products
      if (i === 0) {
        // Shelf 0: Glass Cooking Oil / Syrup Bottles & Tetra Packs
        for (let j = 0; j < 6; j++) {
          const posX = -2.6 + j * 1.05;
          if (j % 2 === 0) {
            // Realistic Glass Oil Bottle
            const bottleGroup = new THREE.Group();
            const bBody = new THREE.Mesh(
              new THREE.CylinderGeometry(0.16, 0.16, 0.65, 16),
              new THREE.MeshStandardMaterial({ color: 0xD49439, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.85 })
            );
            bBody.position.y = 0.325;
            bBody.castShadow = true;
            bottleGroup.add(bBody);

            const bNeck = new THREE.Mesh(
              new THREE.CylinderGeometry(0.06, 0.08, 0.22, 12),
              new THREE.MeshStandardMaterial({ color: 0xE0A34A, roughness: 0.1, transparent: true, opacity: 0.85 })
            );
            bNeck.position.y = 0.72;
            bottleGroup.add(bNeck);

            const bCap = new THREE.Mesh(
              new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12),
              new THREE.MeshStandardMaterial({ color: 0xC5A059, metalness: 0.9, roughness: 0.2 })
            );
            bCap.position.y = 0.86;
            bottleGroup.add(bCap);

            bottleGroup.position.set(posX, shelfY + 0.06, -6.6);
            shelfGroup.add(bottleGroup);
          } else {
            // Dairy Milk Tetra Pack (Amul blue-white style)
            const tetraGeo = new THREE.BoxGeometry(0.32, 0.62, 0.28);
            const tetraMat = new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.3 });
            const tetra = new THREE.Mesh(tetraGeo, tetraMat);
            tetra.position.set(posX, shelfY + 0.37, -6.6);
            tetra.castShadow = true;
            shelfGroup.add(tetra);
          }
        }
      } else if (i === 1) {
        // Shelf 1: Parle-G Biscuit Packs & Tea Boxes
        for (let j = 0; j < 6; j++) {
          const posX = -2.6 + j * 1.05;
          const boxGeo = new THREE.BoxGeometry(0.42, 0.55, 0.3);
          const boxColor = j % 2 === 0 ? 0xEAB308 : 0xDC2626; // Gold/Yellow biscuit or Crimson tea
          const boxMat = new THREE.MeshStandardMaterial({ color: boxColor, roughness: 0.4 });
          const box = new THREE.Mesh(boxGeo, boxMat);
          box.position.set(posX, shelfY + 0.34, -6.6);
          box.castShadow = true;
          shelfGroup.add(box);
        }
      } else {
        // Shelf 2: Spices (MDH/Everest) & Metallic Food Tins
        for (let j = 0; j < 6; j++) {
          const posX = -2.6 + j * 1.05;
          if (j % 2 === 0) {
            // Metallic Chrome Tin Can
            const tin = new THREE.Mesh(
              new THREE.CylinderGeometry(0.18, 0.18, 0.5, 20),
              new THREE.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.85, roughness: 0.2 })
            );
            tin.position.set(posX, shelfY + 0.31, -6.6);
            tin.castShadow = true;
            shelfGroup.add(tin);
          } else {
            // Saffron / Spice carton
            const spice = new THREE.Mesh(
              new THREE.BoxGeometry(0.35, 0.52, 0.25),
              new THREE.MeshStandardMaterial({ color: 0xEA580C, roughness: 0.35 })
            );
            spice.position.set(posX, shelfY + 0.32, -6.6);
            spice.castShadow = true;
            shelfGroup.add(spice);
          }
        }
      }
    }
    scene.add(shelfGroup);

    // ========================================================================
    // 8. 3D Devices & Accessories on the Shop Counter
    // ========================================================================

    // ------------------------------------------------------------------------
    // A. Touchscreen Cloud POS Terminal on Swivel Stand
    // ------------------------------------------------------------------------
    const posTerminalGroup = new THREE.Group();
    // Stand base
    const posBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.28, 0.05, 24),
      steelBracketMat
    );
    posBase.position.set(-0.3, 2.4, -0.2);
    posTerminalGroup.add(posBase);

    // Stand neck
    const posArm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.55, 16),
      steelBracketMat
    );
    posArm.position.set(-0.3, 2.65, -0.2);
    posArm.rotation.x = -0.2;
    posTerminalGroup.add(posArm);

    // Screen Housing
    const posMonitorGeo = new THREE.BoxGeometry(1.3, 0.86, 0.08);
    const posMonitorMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    const posMonitor = new THREE.Mesh(posMonitorGeo, posMonitorMat);
    posMonitor.position.set(-0.3, 3.0, -0.1);
    posMonitor.rotation.x = -0.25;
    posMonitor.castShadow = true;
    posTerminalGroup.add(posMonitor);

    // Glowing Live POS Screen
    const screenTexture = createPOSScreenTexture();
    const posDisplay = new THREE.Mesh(
      new THREE.PlaneGeometry(1.22, 0.78),
      new THREE.MeshBasicMaterial({ map: screenTexture })
    );
    posDisplay.position.set(-0.3, 3.0, -0.055);
    posDisplay.rotation.x = -0.25;
    posTerminalGroup.add(posDisplay);

    scene.add(posTerminalGroup);

    // ------------------------------------------------------------------------
    // B. Thermal Receipt Printer
    // ------------------------------------------------------------------------
    const printerGroup = new THREE.Group();
    const printerBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.38, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.35 })
    );
    printerBody.position.set(0.7, 2.56, -0.15);
    printerBody.castShadow = true;
    printerGroup.add(printerBody);

    // Thermal Paper Slip Emerging
    const paperSlip = new THREE.Mesh(
      new THREE.PlaneGeometry(0.35, 0.25),
      new THREE.MeshStandardMaterial({ color: 0xFAFAFA, roughness: 0.8, side: THREE.DoubleSide })
    );
    paperSlip.position.set(0.7, 2.76, -0.1);
    paperSlip.rotation.x = -0.3;
    printerGroup.add(paperSlip);

    scene.add(printerGroup);

    // ------------------------------------------------------------------------
    // C. Acrylic UPI & Paytm QR Stand
    // ------------------------------------------------------------------------
    const qrStandGroup = new THREE.Group();
    qrStandGroup.name = 'qr';

    // Transparent acrylic backplate
    const qrStandBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.06, 0.45),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.45, roughness: 0.1 })
    );
    qrStandBase.position.set(-1.1, 2.4, 0.45);
    qrStandGroup.add(qrStandBase);

    const qrStandTexture = createQRStandTexture();
    const qrFace = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.75, 0.04),
      new THREE.MeshStandardMaterial({ map: qrStandTexture, roughness: 0.2 })
    );
    qrFace.position.set(-1.1, 2.8, 0.45);
    qrFace.rotation.x = -0.12;
    qrFace.castShadow = true;
    qrStandGroup.add(qrFace);

    scene.add(qrStandGroup);

    // ------------------------------------------------------------------------
    // D. Paytm / Tara Soundbox Pro 4G (SB-4421)
    // ------------------------------------------------------------------------
    const soundboxGroup = new THREE.Group();
    soundboxGroup.name = 'soundbox';

    // Main contoured charcoal matte body
    const sbBodyGeo = new THREE.BoxGeometry(0.76, 0.98, 0.64);
    const sbBodyMat = new THREE.MeshStandardMaterial({
      color: 0x11141A,
      roughness: 0.28,
      metalness: 0.2
    });
    const sbBody = new THREE.Mesh(sbBodyGeo, sbBodyMat);
    sbBody.position.y = 0.49;
    sbBody.castShadow = true;
    sbBody.name = 'soundbox';
    soundboxGroup.add(sbBody);

    // Paytm Signature Cyan Accent Base Rim
    const sbTrimGeo = new THREE.BoxGeometry(0.78, 0.09, 0.66);
    const sbTrimMat = new THREE.MeshStandardMaterial({
      color: 0x00BAF2,
      roughness: 0.2,
      metalness: 0.35
    });
    const sbTrim = new THREE.Mesh(sbTrimGeo, sbTrimMat);
    sbTrim.position.y = 0.045;
    sbTrim.name = 'soundbox';
    soundboxGroup.add(sbTrim);

    // Perforated Acoustic Front Grille
    const sbGrilleGeo = new THREE.PlaneGeometry(0.62, 0.62);
    const sbGrilleMat = new THREE.MeshStandardMaterial({
      color: 0x1E222A,
      roughness: 0.8,
      metalness: 0.15
    });
    const sbGrille = new THREE.Mesh(sbGrilleGeo, sbGrilleMat);
    sbGrille.position.set(0, 0.54, 0.325);
    sbGrille.name = 'soundbox';
    soundboxGroup.add(sbGrille);

    // Concentric Speaker Chamber Aperture
    const sbRingGeo = new THREE.RingGeometry(0.12, 0.24, 32);
    const sbRingMat = new THREE.MeshBasicMaterial({ color: 0x16181F, side: THREE.DoubleSide });
    const sbRing = new THREE.Mesh(sbRingGeo, sbRingMat);
    sbRing.position.set(0, 0.54, 0.328);
    sbRing.name = 'soundbox';
    soundboxGroup.add(sbRing);

    // Top Tactile Buttons (Vol-, Power, Vol+)
    [-0.2, 0, 0.2].forEach((bx, idx) => {
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: idx === 1 ? 0x00BAF2 : 0x2D333E, roughness: 0.3 })
      );
      btn.position.set(bx, 0.99, 0);
      btn.name = 'soundbox';
      soundboxGroup.add(btn);
    });

    // Dual Status LEDs (Power & Signal)
    const sbLedGeo = new THREE.SphereGeometry(0.026, 16, 16);
    const sbLedMat = new THREE.MeshBasicMaterial({
      color: isSoundboxOffline ? 0xEF4444 : 0x10B981
    });
    const sbLed = new THREE.Mesh(sbLedGeo, sbLedMat);
    sbLed.position.set(-0.22, 0.88, 0.33);
    sbLed.name = 'soundbox';
    soundboxGroup.add(sbLed);

    // Dynamic 3D Diagnostic Beacon Ring
    const beaconGeo = new THREE.RingGeometry(0.44, 0.58, 36);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: isSoundboxOffline ? 0xEF4444 : 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const beaconMesh = new THREE.Mesh(beaconGeo, beaconMat);
    beaconMesh.rotation.x = -Math.PI / 2;
    beaconMesh.position.y = 0.02;
    beaconMesh.name = 'soundbox';
    soundboxGroup.add(beaconMesh);

    soundboxGroup.position.set(-2.2, 2.38, 0.3);
    scene.add(soundboxGroup);

    // ------------------------------------------------------------------------
    // E. EDC POS Smart Terminal (POS-9982)
    // ------------------------------------------------------------------------
    const edcGroup = new THREE.Group();
    edcGroup.name = 'edc';

    // Ergonomic angled POS chassis
    const edcBodyGeo = new THREE.BoxGeometry(0.68, 0.28, 1.15);
    const edcBodyMat = new THREE.MeshStandardMaterial({
      color: 0x1F242B,
      roughness: 0.32,
      metalness: 0.2
    });
    const edcBody = new THREE.Mesh(edcBodyGeo, edcBodyMat);
    edcBody.position.y = 0.14;
    edcBody.rotation.x = -0.15;
    edcBody.castShadow = true;
    edcBody.name = 'edc';
    edcGroup.add(edcBody);

    // Backlit LCD Display
    const edcScreenGeo = new THREE.PlaneGeometry(0.5, 0.45);
    const edcScreenMat = new THREE.MeshBasicMaterial({ color: 0x00BAF2 });
    const edcScreen = new THREE.Mesh(edcScreenGeo, edcScreenMat);
    edcScreen.position.set(0, 0.28, -0.16);
    edcScreen.rotation.x = -Math.PI / 2 + 0.15;
    edcScreen.name = 'edc';
    edcGroup.add(edcScreen);

    // Raised rubber number pad keys
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 3; c++) {
        const keyGeo = new THREE.BoxGeometry(0.08, 0.03, 0.06);
        const keyMat = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.6 });
        const keyMesh = new THREE.Mesh(keyGeo, keyMat);
        keyMesh.position.set(-0.16 + c * 0.16, 0.26, 0.16 + r * 0.1);
        keyMesh.rotation.x = -0.15;
        keyMesh.name = 'edc';
        edcGroup.add(keyMesh);
      }
    }

    // Card reader base ring
    const edcBeaconGeo = new THREE.RingGeometry(0.48, 0.6, 32);
    const edcBeaconMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5
    });
    const edcBeacon = new THREE.Mesh(edcBeaconGeo, edcBeaconMat);
    edcBeacon.rotation.x = -Math.PI / 2;
    edcBeacon.position.y = 0.02;
    edcBeacon.name = 'edc';
    edcGroup.add(edcBeacon);

    edcGroup.position.set(1.6, 2.38, 0.25);
    scene.add(edcGroup);

    // ========================================================================
    // 9. Animation Loop (Smooth 4D Pulse, Chime Waves & Dynamic Orbit)
    // ========================================================================
    const clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Pulsing effect on offline device ring
      if (beaconMesh) {
        if (isSoundboxOffline) {
          const s = 1 + 0.28 * Math.sin(elapsed * 4.5);
          beaconMesh.scale.set(s, s, s);
          (beaconMesh.material as THREE.MeshBasicMaterial).opacity = 0.6 + 0.4 * Math.sin(elapsed * 4.5);
        } else {
          beaconMesh.scale.set(1, 1, 1);
          (beaconMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
        }
      }

      // Smooth camera orbit on drag
      if (view === '3d') {
        const radius = 18 / zoom;
        camera.position.x = radius * Math.sin(rotationRef.current.y) * Math.cos(rotationRef.current.x);
        camera.position.y = radius * Math.sin(rotationRef.current.x) + 3;
        camera.position.z = radius * Math.cos(rotationRef.current.y) * Math.cos(rotationRef.current.x);
        camera.lookAt(0, 1.8, 0);
      } else {
        camera.position.set(0, 21 / zoom, 0.01);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
    };
  }, [view, zoom, isSoundboxOffline]);

  // Authentic Paytm Two-Tone Synth Chime via Web Audio API
  const playSoundboxChime = useCallback(() => {
    try {
      setIsPlayingChime(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.28, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.16);

      // Tone 2: 880.00 Hz (A5 - Paytm chime peak harmonic)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.15);
      gain2.gain.setValueAtTime(0, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.17);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.65);

      setTimeout(() => setIsPlayingChime(false), 700);
    } catch (err) {
      console.warn('Audio chime reproduction error:', err);
      setIsPlayingChime(false);
    }
  }, []);

  // Trigger Autonomous Tier-1 Cellular Reboot Probe
  const handleTriggerReboot = () => {
    setIsRebooting(true);
    setTimeout(() => {
      setIsRebooting(false);
      setRebootSuccess(true);
      setSelectedDevice(prev => prev ? {
        ...prev,
        status: 'ONLINE',
        signal: '-72 dBm (Airtel IoT 4G Recovered)',
        battery: 15,
        lastPing: 'Just now (OTA Recovered)'
      } : null);
      playSoundboxChime();
    }, 2200);
  };

  // Drag & 3D Raycasting click interaction
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || view === 'top') return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    if (Math.hypot(e.clientX - dragStartPosRef.current.x, e.clientY - dragStartPosRef.current.y) > 6) {
      hasMovedRef.current = true;
    }

    rotationRef.current.y += deltaX * 0.007;
    rotationRef.current.x = Math.max(0.15, Math.min(1.2, rotationRef.current.x + deltaY * 0.007));

    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    isDraggingRef.current = false;
    // Raycast on click
    if (!hasMovedRef.current && mountRef.current && sceneRef.current && cameraRef.current) {
      const rect = mountRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, cameraRef.current);
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);

      if (intersects.length > 0) {
        let curr: THREE.Object3D | null = intersects[0].object;
        while (curr && curr !== sceneRef.current) {
          if (curr.name === 'soundbox') {
            setSelectedDevice({
              id: 'SB-4421',
              name: 'Paytm / Tara Soundbox Pro 4G',
              status: isSoundboxOffline ? 'OFFLINE' : 'ONLINE',
              battery: 12,
              signal: '-98 dBm (2G GPRS Airtel)',
              firmware: 'v4.2.1-prod (Rev B)',
              lastPing: '6.5h ago',
              protocol: 'MQTT 3.1.1 (QoS 1)'
            });
            break;
          }
          if (curr.name === 'edc') {
            setSelectedDevice({
              id: 'POS-9982',
              name: 'EDC Terminal POS-9982',
              status: 'ONLINE',
              battery: 88,
              signal: '-65 dBm (4G LTE)',
              firmware: 'v5.0.0-npci',
              lastPing: '12s ago',
              protocol: 'ISO 8583'
            });
            break;
          }
          curr = curr.parent;
        }
      }
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2.2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    rotationRef.current = { x: 0.42, y: -0.65 };
    setView('3d');
  };

  return (
    <div className="w-full h-full relative overflow-hidden flex flex-col select-none">
      <div 
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDraggingRef.current = false; }}
        className="flex-1 w-full h-full min-h-[460px] rounded-3xl border border-soft-border/70 shadow-sm overflow-hidden touch-none cursor-grab active:cursor-grabbing relative"
      />

      {/* Floating Interactive Live Telemetry HUD Overlays */}
      <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
        
        {/* Top Overlay Chips (Required for Invariant Tests & User Visibility) */}
        <div className="flex flex-wrap gap-3 pointer-events-auto">
          {/* Soundbox Chip */}
          <div 
            onClick={() => setSelectedDevice({
              id: 'SB-4421',
              name: 'Paytm / Tara Soundbox Pro 4G',
              status: isSoundboxOffline ? 'OFFLINE' : 'ONLINE',
              battery: 12,
              signal: '-98 dBm (2G GPRS Airtel)',
              firmware: 'v4.2.1-prod (Rev B)',
              lastPing: '6.5h ago',
              protocol: 'MQTT 3.1.1 (QoS 1)'
            })}
            className={`px-3.5 py-2 rounded-xl backdrop-blur-md shadow-md border flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 ${
              isSoundboxOffline
                ? 'bg-red-50/90 border-red-300 text-red-950 ring-2 ring-red-400/40'
                : 'bg-white-panel/90 border-soft-border text-navy'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isSoundboxOffline ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">Soundbox SB-4421</span>
              <span className={`text-[11px] font-semibold ${isSoundboxOffline ? 'text-red-700' : 'text-green-700'}`}>
                {isSoundboxOffline ? 'Offline (12%)' : 'Online'}
              </span>
            </div>
          </div>

          {/* EDC POS Chip */}
          <div 
            onClick={() => setSelectedDevice({
              id: 'POS-9982',
              name: 'EDC Terminal POS-9982',
              status: 'ONLINE',
              battery: 88,
              signal: '-65 dBm (4G LTE)',
              firmware: 'v5.0.0-npci',
              lastPing: '12s ago',
              protocol: 'ISO 8583'
            })}
            className="px-3.5 py-2 rounded-xl bg-white-panel/90 backdrop-blur-md shadow-md border border-soft-border flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 text-navy pointer-events-auto"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">EDC POS-9982</span>
              <span className="text-[11px] font-semibold text-green-700">Online</span>
            </div>
          </div>

          {/* Billing Counter Chip */}
          <div className="px-3.5 py-2 rounded-xl bg-white-panel/80 backdrop-blur-md shadow-md border border-soft-border flex items-center gap-2.5 text-navy">
            <Store className="w-3.5 h-3.5 text-navy/70" />
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight">Billing Counter</span>
              <span className="text-[11px] font-medium text-navy/60">Active (QR Paired)</span>
            </div>
          </div>
        </div>

        {/* Selected Device Telemetry Drawer Modal */}
        {selectedDevice && (
          <div className="bg-white-panel/95 backdrop-blur-lg border border-soft-border p-5 rounded-2xl shadow-2xl max-w-md pointer-events-auto animate-in fade-in slide-in-from-bottom-3 z-30">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                  {selectedDevice.name}
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    selectedDevice.status === 'OFFLINE' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {selectedDevice.status}
                  </span>
                </h3>
                <p className="text-xs text-navy/60 mt-0.5">Real-time Telemetry, Edge Diagnostics & Audio Output</p>
              </div>
              <button 
                onClick={() => setSelectedDevice(null)}
                className="text-navy/40 hover:text-navy text-xs font-bold p-1 rounded-lg hover:bg-black/5"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs mb-3">
              <div className="bg-light-bg/70 p-2.5 rounded-xl border border-soft-border/50">
                <span className="text-navy/60 flex items-center gap-1 mb-1">
                  <BatteryMedium className="w-3.5 h-3.5" /> Battery Cell
                </span>
                <span className={`font-bold ${selectedDevice.battery < 20 ? 'text-red-600' : 'text-navy'}`}>
                  {selectedDevice.battery}% (Li-ion 3.52V)
                </span>
              </div>

              <div className="bg-light-bg/70 p-2.5 rounded-xl border border-soft-border/50">
                <span className="text-navy/60 flex items-center gap-1 mb-1">
                  <Wifi className="w-3.5 h-3.5" /> Signal / Carrier
                </span>
                <span className="font-bold text-navy">{selectedDevice.signal}</span>
              </div>

              <div className="bg-light-bg/70 p-2.5 rounded-xl border border-soft-border/50">
                <span className="text-navy/60 flex items-center gap-1 mb-1">
                  <Cpu className="w-3.5 h-3.5" /> Firmware Build
                </span>
                <span className="font-bold text-navy">{selectedDevice.firmware}</span>
              </div>

              <div className="bg-light-bg/70 p-2.5 rounded-xl border border-soft-border/50">
                <span className="text-navy/60 flex items-center gap-1 mb-1">
                  <RefreshCw className="w-3.5 h-3.5" /> MQTT Telemetry
                </span>
                <span className="font-bold text-navy">{selectedDevice.lastPing}</span>
              </div>
            </div>

            {/* Interactive Hardware Actions Bar */}
            <div className="flex flex-col gap-2 mb-3">
              <div className="flex gap-2">
                <button
                  onClick={playSoundboxChime}
                  disabled={isPlayingChime}
                  className="flex-1 py-2 px-3 bg-[#00BAF2]/10 hover:bg-[#00BAF2]/20 border border-[#00BAF2]/30 text-[#0086b3] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Volume2 className={`w-3.5 h-3.5 ${isPlayingChime ? 'animate-bounce text-[#00BAF2]' : ''}`} />
                  {isPlayingChime ? 'Chiming...' : 'Play Test Chime'}
                </button>

                {selectedDevice.status === 'OFFLINE' && (
                  <button
                    onClick={handleTriggerReboot}
                    disabled={isRebooting}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isRebooting ? 'animate-spin' : ''}`} />
                    {isRebooting ? 'Probing Cellular...' : 'Trigger OTA Reboot'}
                  </button>
                )}
              </div>

              <a
                href="/ontology"
                className="w-full py-1.5 px-3 bg-light-bg/80 hover:bg-light-bg border border-soft-border text-navy/80 hover:text-navy rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-coral" />
                Inspect in Obsidian Knowledge Galaxy
              </a>
            </div>

            {selectedDevice.status === 'OFFLINE' ? (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2 text-xs text-red-900">
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Automated Recovery Engaged</div>
                  <div className="text-[11px] opacity-90 mt-0.5">Cellular soft-reboot packet queued under Tier-1 autonomy. Peak evening rush volume protected.</div>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center gap-2 text-xs text-green-900">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span className="font-bold">Soundbox speaker, microphone & payment announcement nominal.</span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Floating View Controls */}
        <div className="flex justify-between items-center w-full pointer-events-auto">
          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-white-panel/90 backdrop-blur-md p-1.5 rounded-full border border-soft-border shadow-sm">
            <button
              onClick={() => setView('3d')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                view === '3d'
                  ? 'bg-paytm-blue text-white-panel shadow-xs'
                  : 'text-navy/70 hover:text-navy hover:bg-black/5'
              }`}
            >
              3D View
            </button>
            <button
              onClick={() => setView('top')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                view === 'top'
                  ? 'bg-paytm-blue text-white-panel shadow-xs'
                  : 'text-navy/70 hover:text-navy hover:bg-black/5'
              }`}
            >
              Top View
            </button>
          </div>

          {/* Zoom and Reset Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="w-9 h-9 rounded-full bg-white-panel/90 backdrop-blur-md border border-soft-border flex items-center justify-center text-navy hover:bg-white-panel shadow-sm transition-all"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomIn}
              className="w-9 h-9 rounded-full bg-white-panel/90 backdrop-blur-md border border-soft-border flex items-center justify-center text-navy hover:bg-white-panel shadow-sm transition-all"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              className="w-9 h-9 rounded-full bg-white-panel/90 backdrop-blur-md border border-soft-border flex items-center justify-center text-navy hover:bg-white-panel shadow-sm transition-all"
              title="Reset View"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

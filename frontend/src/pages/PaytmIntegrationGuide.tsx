import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Code, ShieldCheck, ArrowLeft, 
  Terminal, ExternalLink, Network, 
  Smartphone, Copy, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TaraLogo } from '../components/common/TaraLogo';

type ActiveTab = 'why_web' | 'architecture' | 'api_contracts' | 'pilot_roadmap';

export const PaytmIntegrationGuide: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>('why_web');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const API_ENDPOINTS = [
    {
      method: 'POST',
      path: '/api/tara/ask',
      desc: 'Conversational reasoning endpoint with PII masking, ontology traversal, and policy RAG citation.',
      sampleRequest: `curl -X POST http://localhost:8000/api/tara/ask \\
  -H "Content-Type: application/json" \\
  -d '{
    "merchantId": "M_DISPUTE_TAT",
    "message": "Check status of transactions today",
    "language": "en"
  }'`,
      sampleResponse: `{
  "status": "RESOLVED_AUTONOMOUSLY",
  "response": "All 68 transactions received today have processed successfully totaling ₹42,500.00.",
  "data": {
    "traceId": "DEC-904CCD9A",
    "guardrailsApplied": ["PII_Masking", "Regulatory_Citation_Validation"]
  }
}`
    },
    {
      method: 'GET',
      path: '/api/devices/{id}/status',
      desc: 'Retrieves live MQTT connection, audio driver health, and battery telemetry for merchant devices.',
      sampleRequest: `curl http://localhost:8000/api/devices/SB-4421/status`,
      sampleResponse: `{
  "device_id": "SB-4421",
  "status": "ONLINE",
  "audio_subsystem_ok": true,
  "signal_dbm": -68,
  "battery_pct": 85,
  "last_ping_ago_sec": 4.2
}`
    },
    {
      method: 'POST',
      path: '/api/approvals/{id}/decision',
      desc: 'Tier-2 ops approval endpoint for financial remedies. Executes only with signed operator token.',
      sampleRequest: `curl -X POST http://localhost:8000/api/approvals/APP-1042/approve \\
  -H "Authorization: Bearer <ops_token>" \\
  -d '{"action": "APPROVE", "reason": "Verified under RBI Circular 142 §4.2"}'`,
      sampleResponse: `{
  "status": "APPROVED",
  "amount_inr": 100.0,
  "signed_token": "ED25519-SIG-8F9B2C...",
  "audit_receipt_id": "RCP-8820"
}`
    },
    {
      method: 'GET',
      path: '/api/sms/history',
      desc: 'Real-time outbox audit stream tracking cellular SMS delivery and simulated fallback states.',
      sampleRequest: `curl http://localhost:8000/api/sms/history`,
      sampleResponse: `{
  "count": 1,
  "history": [
    {
      "status": "DELIVERED_VIA_AWS_SNS",
      "phone": "+916379160962",
      "message": "Tara Alert: ₹500 credited via UPI.",
      "timestamp": 1793426664.45
    }
  ]
}`
    }
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#151615] flex flex-col font-sans">
      
      {/* ── TOP HEADER ──────────────────────────────────────────────── */}
      <header className="h-16 bg-white border-b border-[#2C3426]/10 px-6 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C3426]/5 hover:bg-[#2C3426]/10 text-xs font-semibold text-[#151615] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <TaraLogo size="sm" showSubtitle={true} />
        </div>

        <div className="flex items-center gap-3">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151615] hover:bg-[#252A22] text-[#FAF9F5] text-xs font-bold transition-all shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-[#FE8A70]" />
            <span>Interactive OpenAPI Swagger</span>
            <ExternalLink className="w-3 h-3 text-white/50" />
          </a>

          <button
            onClick={() => navigate('/mobile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FE8A70] hover:bg-[#FA7F62] text-[#151615] text-xs font-bold transition-all shadow-xs"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile PWA Preview</span>
          </button>
        </div>
      </header>

      {/* ── HERO BANNER ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-b from-white to-[#FAF9F5] border-b border-[#2C3426]/10 px-6 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FE8A70]/15 border border-[#FE8A70]/30 text-[#151615] text-xs font-bold mb-3">
            <Layers className="w-3.5 h-3.5 text-[#FE8A70]" />
            Team Cyber_Phantoms • Paytm Hackathon Implementation Blueprint
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#151615] mb-2">
            Headless AI Add-on Layer for Existing Paytm Systems
          </h1>
          <p className="text-sm text-[#5E625A] max-w-3xl leading-relaxed">
            Tara is not a replacement for Paytm's Merchant App or banking rails. It is an autonomous operations intelligence middleware that connects Soundbox IoT telemetry, UPI core switches, settlement engines, and CRM queues into an explainable, self-healing operational loop.
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-[#2C3426]/10 pb-px">
            {[
              { id: 'why_web', label: '1. Why Build a Web App?', icon: Smartphone },
              { id: 'architecture', label: '2. Paytm Add-on Architecture', icon: Network },
              { id: 'api_contracts', label: '3. Headless API Contracts', icon: Code },
              { id: 'pilot_roadmap', label: '4. Paytm Pilot Roadmap', icon: ShieldCheck }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
                    isActive
                      ? 'border-[#FA7F62] text-[#151615]'
                      : 'border-transparent text-[#5E625A] hover:text-[#151615]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FA7F62]' : 'text-[#5E625A]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TAB CONTENT ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 py-8 flex-1 w-full space-y-6">

        {/* ── TAB 1: WHY BUILD A WEB APP? ───────────────────────────── */}
        {activeTab === 'why_web' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-white border border-[#2C3426]/10 shadow-xs">
              <h2 className="text-lg font-black text-[#151615] mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#FA7F62]" />
                The Judge Question: "Why did you build a Web App when Paytm already has an App?"
              </h2>
              <p className="text-xs text-[#5E625A] mb-6">
                Here is the exact architectural and product rationale to present to Paytm engineering judges:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Pillar 1 */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#2C3426]/10 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#151615] text-[#FAF9F5] flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-bold text-xs text-[#151615]">Add-on Intelligence Layer, Not App Replacement</h3>
                  <p className="text-[11px] text-[#5E625A] leading-relaxed">
                    Tara is designed as a headless AI middleware sitting between Paytm's IoT MQTT broker, Core Banking Switch, and Settlement batch engine. All features are pure REST/WebSocket APIs that can be consumed by existing Paytm mobile clients.
                  </p>
                </div>

                {/* Pillar 2 */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#2C3426]/10 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FE8A70] text-[#151615] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-bold text-xs text-[#151615]">Zero-Install Embedded WebView SDK</h3>
                  <p className="text-[11px] text-[#5E625A] leading-relaxed">
                    In production, merchants will not download a secondary 50MB app. Tara is built as a lightweight, zero-dependency PWA that Paytm can drop directly into the <em>Paytm for Business (P4B)</em> app via a single in-app route (<code className="text-[#FA7F62]">paytm://merchant/tara</code>).
                  </p>
                </div>

                {/* Pillar 3 */}
                <div className="p-4 rounded-xl bg-[#FAF9F5] border border-[#2C3426]/10 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2C3426] text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-bold text-xs text-[#151615]">Real-time Dual-Screen Verification Harness</h3>
                  <p className="text-[11px] text-[#5E625A] leading-relaxed">
                    To prove to judges that Tara actually operates across systems, the web platform acts as an interactive evaluation harness. You can pair a secondary phone as a simulated Soundbox, trigger payments, pull the plug, and watch Tara autonomously remediate live.
                  </p>
                </div>

              </div>
            </div>

            {/* Micro-Frontend Integration Code Snippet */}
            <div className="p-5 rounded-2xl bg-[#151615] text-white border border-white/10 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#FE8A70] flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  Embedding Tara into Existing Paytm for Business (React Native / Android SDK)
                </span>
                <button
                  onClick={() => copyCode(`<TaraTeammateView merchantId={mid} language="hi-IN" onAction={handleTaraAction} />`, 'rn_embed')}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold flex items-center gap-1"
                >
                  {copiedSnippet === 'rn_embed' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-black/50 text-[11px] font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`// Example: Paytm for Business App Integration (5 Lines of Code)
import { TaraTeammateView } from '@paytm/tara-sdk';

export function MerchantSupportScreen({ merchantId }) {
  return (
    <TaraTeammateView
      merchantId={merchantId}
      defaultLanguage="hi-IN"
      enableVoiceWakeWord={true}
      onApprovalRequired={(req) => openPaytmApprovalModal(req)}
      endpoint="https://tara-api.paytm.internal/api/v1"
    />
  );
}`}
              </pre>
            </div>
          </div>
        )}

        {/* ── TAB 2: SYSTEM ARCHITECTURE & DATA FLOW ─────────────────── */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-white border border-[#2C3426]/10 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-[#151615] flex items-center gap-2">
                <Network className="w-5 h-5 text-[#FA7F62]" />
                How Tara Integrates with Existing Paytm Enterprise Infrastructure
              </h2>
              <p className="text-xs text-[#5E625A]">
                Tara respects Paytm's existing source-of-truth systems. It listens to telemetry and outbox streams, traces relationships through an adjacency graph, and routes actions back through approved APIs:
              </p>

              {/* Data Flow Mapping Grid */}
              <div className="space-y-3 pt-2">
                {[
                  {
                    system: 'Paytm Soundbox Fleet (Dual-SIM 4G)',
                    protocol: 'MQTT / TCP Heartbeats',
                    taraRole: 'Ingests ping intervals, signal dBm, and audio play ACKs. Detects missing announcements in <150ms.',
                    action: 'Dispatches OTA configuration resync & audio reroute packets.'
                  },
                  {
                    system: 'Paytm UPI Core & Bank Switch',
                    protocol: 'Transactional Outbox / Kafka',
                    taraRole: 'Reconciles payment debited vs. merchant credited states. Verifies 100% intraday success.',
                    action: 'Identifies NPCI switch timeouts and isolates payer vs. merchant discrepancies.'
                  },
                  {
                    system: 'Paytm Settlement Engine',
                    protocol: 'Daily Batch Feeds (T+0 / T+1)',
                    taraRole: 'Itemizes gross volume, MDR interchange, GST, and ₹150 soundbox rental fees.',
                    action: 'Cites exact contract SLA clauses to explain discrepancies to merchants in Indic voice.'
                  },
                  {
                    system: 'Paytm for Business (Merchant Mobile App)',
                    protocol: 'REST / WebSocket / SSE',
                    taraRole: 'Provides conversational AI teammate, voice wake-word ("Hey Tara"), and language preferences.',
                    action: 'Sends proactive alerts and collects merchant consent before altering device behavior.'
                  },
                  {
                    system: 'Paytm Operations & CRM Console',
                    protocol: 'Mutual TLS / Signed Token API',
                    taraRole: 'Presents Tier-2 approval cards with complete evidence brief and RBI regulatory citations.',
                    action: 'Executes financial compensation only after authorized human cryptographic signature.'
                  }
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#2C3426]/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5 max-w-sm">
                      <span className="font-bold text-[#151615] block">{item.system}</span>
                      <span className="font-mono text-[10px] text-[#FA7F62] font-semibold">{item.protocol}</span>
                    </div>
                    <div className="text-[11px] text-[#5E625A] flex-1">
                      <p><strong className="text-[#151615]">Telemetry Ingest:</strong> {item.taraRole}</p>
                      <p><strong className="text-[#151615]">Autonomous Action:</strong> {item.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: HEADLESS API CONTRACTS ─────────────────────────── */}
        {activeTab === 'api_contracts' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-[#151615]">Paytm Enterprise Integration API Suite</h2>
                <p className="text-xs text-[#5E625A]">Standard typed REST endpoints exposed by Tara FastAPI backend</p>
              </div>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-[#FE8A70] hover:bg-[#FA7F62] text-[#151615] font-bold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <span>Live Swagger Docs</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Endpoints List */}
            <div className="space-y-4">
              {API_ENDPOINTS.map((ep, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-[#2C3426]/10 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        ep.method === 'POST' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#151615]">{ep.path}</span>
                    </div>
                    <button
                      onClick={() => copyCode(ep.sampleRequest, `ep_${idx}`)}
                      className="text-[11px] font-bold text-[#5E625A] hover:text-[#151615] flex items-center gap-1"
                    >
                      {copiedSnippet === `ep_${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>Copy cURL</span>
                    </button>
                  </div>
                  <p className="text-xs text-[#5E625A]">{ep.desc}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2.5 rounded-xl bg-[#151615] text-emerald-400 overflow-x-auto">
                      <span className="text-white/40 block mb-1 uppercase font-bold text-[9px]">Sample Request</span>
                      <pre>{ep.sampleRequest}</pre>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#151615] text-white/90 overflow-x-auto">
                      <span className="text-white/40 block mb-1 uppercase font-bold text-[9px]">Sample Response</span>
                      <pre>{ep.sampleResponse}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: PILOT ROADMAP ──────────────────────────────────── */}
        {activeTab === 'pilot_roadmap' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="p-6 rounded-2xl bg-white border border-[#2C3426]/10 shadow-xs space-y-4">
              <h2 className="text-lg font-black text-[#151615] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                Earned Autonomy: 6-Phase Production Rollout Plan
              </h2>
              <p className="text-xs text-[#5E625A]">
                Tara is built on the fintech principle of <em>earned autonomy</em>: actions are enabled incrementally only after passing rigorous accuracy and safety verification gates. Real money movement is strictly reserved for human authority.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  {
                    phase: 'Phase 0: Discovery & Taxonomy',
                    timeline: 'Weeks 1–2',
                    desc: 'Define operational failure modes, MQTT telemetry schemas, and merchant language preferences with Paytm engineering.',
                    gate: 'Approved data dictionary and system ownership matrix.'
                  },
                  {
                    phase: 'Phase 1: Sandbox Adapter Integration',
                    timeline: 'Weeks 3–4',
                    desc: 'Connect Tara adapters to partner-provided UAT bank environments and simulated soundbox clusters.',
                    gate: 'Contract tests pass 100%; end-to-end replay verified.'
                  },
                  {
                    phase: 'Phase 2: Shadow Mode (Read-Only Observation)',
                    timeline: 'Weeks 5–8',
                    desc: 'Tara observes live production event feeds, builds ontology paths, and generates recommendations without executing any actions.',
                    gate: 'Decision agreement >95%; false-positive rate <2%.'
                  },
                  {
                    phase: 'Phase 3: Assisted Mode (Human Operations Copilot)',
                    timeline: 'Weeks 9–12',
                    desc: 'Tara drafts case briefs, diagnoses, and Indic messages. Paytm support agents review and click to execute.',
                    gate: 'Measured 60% reduction in average handling time; positive merchant feedback.'
                  },
                  {
                    phase: 'Phase 4: Tier 1 Autonomous Diagnostics',
                    timeline: 'Weeks 13–16',
                    desc: 'Autonomous execution of narrow, reversible non-monetary actions (soundbox soft-reboots, test chimes, status SMS).',
                    gate: 'Zero unsafe action breaches; SLA violation rate <0.1%.'
                  },
                  {
                    phase: 'Phase 5: Production Governance & Scale',
                    timeline: 'Week 17 onwards',
                    desc: 'Continuous Second Brain procedural learning with human lesson review, VAPT audit, and multi-region deployment.',
                    gate: 'Formal SOC2 / ISO compliance sign-off and enterprise SLAs.'
                  }
                ].map((p, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#FAF9F5] border border-[#2C3426]/10 flex items-start gap-3 text-xs">
                    <span className="w-6 h-6 rounded-full bg-[#151615] text-[#FAF9F5] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx}
                    </span>
                    <div className="space-y-0.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#151615]">{p.phase}</span>
                        <span className="font-mono text-[10px] text-[#FA7F62] font-semibold">{p.timeline}</span>
                      </div>
                      <p className="text-[11px] text-[#5E625A]">{p.desc}</p>
                      <p className="text-[10px] text-emerald-800 font-semibold pt-1">
                        ✓ Exit Criteria: {p.gate}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer className="py-4 border-t border-[#2C3426]/10 text-center text-xs text-[#5E625A] bg-white">
        <p>Tara Autonomous Merchant Operations Teammate • Built for Paytm Hackathon 2026</p>
      </footer>

    </div>
  );
};

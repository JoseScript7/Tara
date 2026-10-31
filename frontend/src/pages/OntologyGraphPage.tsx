import React from 'react';
import { ObsidianGraphView } from '../components/ontology/ObsidianGraphView';
import { 
  Network, Brain, ShieldCheck, 
  ExternalLink, BookOpen, Layers
} from 'lucide-react';

export const OntologyGraphPage: React.FC = () => {

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col pb-12">
      
      {/* PAGE HEADER */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#FE8A70]/20 text-[#151615] border border-[#FE8A70]/30 flex items-center gap-1">
              <Network className="w-3.5 h-3.5 text-[#FE8A70]" /> Obsidian Knowledge Topology
            </span>
            <span className="text-xs font-mono text-[#151615]/50">RAG + Ontology Layer</span>
          </div>
          <h1 className="text-3xl font-bold text-[#151615] tracking-tight">
            Ontology & Second Brain Graph
          </h1>
          <p className="text-[#151615]/70 text-sm max-w-2xl mt-1">
            Visualizing the trained semantic network of Kumar Stores: domain classes, device telemetry, regulatory axioms, vector chunks, and LATS agent reasoning.
          </p>
        </div>

        <div className="flex gap-2">
          <a
            href="https://www.mindstudio.ai/blog/what-is-ai-second-brain"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#2C3426]/10 text-xs font-bold text-[#151615] hover:bg-[#F8E6DD]/40 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#FE8A70]" />
            Second Brain Spec
            <ExternalLink className="w-3 h-3 text-[#151615]/40" />
          </a>
        </div>
      </div>

      {/* OBSIDIAN FORCE-DIRECTED GRAPH VIEWPORT */}
      <div className="mb-8 rounded-2xl overflow-hidden shadow-xl border border-[#2C3426]/15">
        <ObsidianGraphView 
          height="620px" 
        />
      </div>

      {/* DETAILED ARCHITECTURAL PILLARS (MINDSTUDIO + SALESFORCE CONCEPTS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* 1. Classes, Individuals & Axioms */}
        <div className="p-5 rounded-2xl bg-white border border-[#2C3426]/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#FE8A70]/20 text-[#FE8A70] flex items-center justify-center font-bold">
                <Layers className="w-4 h-4 text-[#151615]" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#151615]">1. Ontology Anatomy</h3>
                <p className="text-[11px] text-[#151615]/60">Classes, Individuals & Axioms</p>
              </div>
            </div>
            <p className="text-xs text-[#151615]/75 leading-relaxed mb-3">
              Unlike rigid taxonomies, Tara's ontology models real-world kirana commerce as an interconnected graph.
            </p>
            <ul className="text-[11px] space-y-1.5 text-[#151615]/80">
              <li><strong className="text-[#151615]">Class:</strong> Higher-order types (e.g. `Device`, `Settlement`).</li>
              <li><strong className="text-[#151615]">Individual:</strong> Concrete instances (`Soundbox SB-4421`, `Batch #8492`).</li>
              <li><strong className="text-[#151615]">Axiom:</strong> Domain truths (e.g., *a store has one primary terminal*, *provisional credit must settle within 24h*).</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2C3426]/10 text-[10px] font-mono text-[#151615]/50">
            Ontology Graph Engine v3
          </div>
        </div>

        {/* 2. Vector Embeddings & Second Brain RAG */}
        <div className="p-5 rounded-2xl bg-white border border-[#2C3426]/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#06B6D4]/20 text-[#06B6D4] flex items-center justify-center font-bold">
                <Brain className="w-4 h-4 text-cyan-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#151615]">2. Vector Embeddings (RAG)</h3>
                <p className="text-[11px] text-[#151615]/60">Semantic PKM Memory</p>
              </div>
            </div>
            <p className="text-xs text-[#151615]/75 leading-relaxed mb-3">
              Knowledge is stored as 300–500 token chunks embedded into 1,536-dimensional vectors for semantic similarity search.
            </p>
            <ul className="text-[11px] space-y-1.5 text-[#151615]/80">
              <li><strong className="text-[#151615]">Semantic Retrieval:</strong> Queries match by intent, not just keyword string matching.</li>
              <li><strong className="text-[#151615]">Decisions & Rationale:</strong> Stores *why* ops took actions to prevent recurring errors.</li>
              <li><strong className="text-[#151615]">In-Context Injection:</strong> Chunks ground Claude 3.5 Sonnet before reasoning.</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2C3426]/10 text-[10px] font-mono text-[#151615]/50">
            Vector Store: 1536-dim Cohere/OpenAI
          </div>
        </div>

        {/* 3. Agentic LATS & Cryptographic Consent */}
        <div className="p-5 rounded-2xl bg-white border border-[#2C3426]/10 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-800" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#151615]">3. Autonomous Decisions</h3>
                <p className="text-[11px] text-[#151615]/60">LATS + Consent Protocol v2</p>
              </div>
            </div>
            <p className="text-xs text-[#151615]/75 leading-relaxed mb-3">
              Tara reasons over graph paths using Language Agent Tree Search with reflection and verifiable action tokens.
            </p>
            <ul className="text-[11px] space-y-1.5 text-[#151615]/80">
              <li><strong className="text-[#151615]">Tier-1:</strong> Auto-recovery pings for lost telemetry heartbeats.</li>
              <li><strong className="text-[#151615]">Tier-2:</strong> Signed merchant approval for money movements.</li>
              <li><strong className="text-[#151615]">Adversarial Filter:</strong> Prompt-injection guardrails protect funds.</li>
            </ul>
          </div>
          <div className="mt-4 pt-3 border-t border-[#2C3426]/10 text-[10px] font-mono text-[#151615]/50">
            Security: Ed25519 Token Hash
          </div>
        </div>

      </div>

    </div>
  );
};

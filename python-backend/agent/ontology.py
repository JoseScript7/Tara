"""
Tara — Ontology Module (Prompt 11)

Typed knowledge graph with entity and relationship types.
Uses Postgres adjacency tables (lean profile) with helpers:
- neighborhood(entity, depth)
- explain_path(a, b)
- affected_transactions(device_id, window)
- at_risk_settlements()

Every query returns the graph path it traversed.
"""
from dataclasses import dataclass, field
from typing import Optional, List, Dict, Any, Tuple
from enum import Enum
from datetime import datetime, timedelta
import uuid


# ─── Entity Types ────────────────────────────

class EntityType(str, Enum):
    MERCHANT = "Merchant"
    DEVICE = "Device"
    TELEMETRY = "Telemetry"
    TRANSACTION = "Transaction"
    SETTLEMENT = "Settlement"
    TICKET = "Ticket"
    POLICY_RULE = "PolicyRule"
    ACTION = "Action"
    VECTOR_CHUNK = "VectorChunk"
    REASONING_NODE = "ReasoningNode"
    DOMAIN = "Domain"


class RelationType(str, Enum):
    OWNS = "OWNS"                    # Merchant -> Device
    GENERATES = "GENERATES"          # Device -> Telemetry
    INVOLVES = "INVOLVES"            # Transaction -> Merchant
    SETTLES = "SETTLES"              # Settlement -> Transaction
    REFERENCES = "REFERENCES"        # Ticket -> Transaction/Device
    GOVERNS = "GOVERNS"              # PolicyRule -> Action
    TRIGGERED_BY = "TRIGGERED_BY"    # Action -> Signal/Ticket
    PROCESSED_BY = "PROCESSED_BY"    # Transaction -> Device
    AFFECTS = "AFFECTS"              # Telemetry -> Transaction
    PART_OF = "PART_OF"              # Transaction -> Settlement
    EMBEDS = "EMBEDS"                # VectorChunk -> Domain/Entity
    REASONS_OVER = "REASONS_OVER"    # ReasoningNode -> Entity/Rule
    SUBCLASS_OF = "SUBCLASS_OF"      # Class -> Higher Class


@dataclass
class Entity:
    id: str
    type: EntityType
    properties: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Relationship:
    id: str
    source_id: str
    target_id: str
    type: RelationType
    properties: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class GraphPath:
    """Human-readable path through the graph"""
    nodes: List[str]
    edges: List[str]
    description: str

    def __str__(self) -> str:
        return self.description


# ─── In-Memory Ontology Store (for demo) ─────

class OntologyStore:
    """
    In-memory graph store. In production, this would be backed by
    PostgreSQL adjacency tables (lean) or Neptune (full).
    """

    def __init__(self):
        self.entities: Dict[str, Entity] = {}
        self.relationships: List[Relationship] = []
        self._adjacency: Dict[str, List[Tuple[str, Relationship]]] = {}
        self._seed_default_graph()

    def _seed_default_graph(self):
        # 1. Hub Domains (Central Galaxy Super-Clusters)
        self.add_entity(Entity(id="DOM-MERCHANT", type=EntityType.DOMAIN, properties={"title": "Merchant Domain", "color": "#FE8A70", "desc": "Store Profile, Kirana operations, and volume"}))
        self.add_entity(Entity(id="DOM-DEVICES", type=EntityType.DOMAIN, properties={"title": "Device Telemetry Domain", "color": "#F59E0B", "desc": "Soundbox, EDC POS, and QR IoT telemetry"}))
        self.add_entity(Entity(id="DOM-FINANCIALS", type=EntityType.DOMAIN, properties={"title": "Financial Ledger Domain", "color": "#10B981", "desc": "Double-entry journal, escrow, and settlements"}))
        self.add_entity(Entity(id="DOM-POLICIES", type=EntityType.DOMAIN, properties={"title": "Regulatory Policy Domain", "color": "#A855F7", "desc": "NPCI rules, RBI sandbox, and Consent Protocol v2"}))
        self.add_entity(Entity(id="DOM-REASONING", type=EntityType.DOMAIN, properties={"title": "Agentic Decision Engine", "color": "#F43F5E", "desc": "Bedrock Claude 3.5, LATS Monte-Carlo tree, and guardrails"}))
        self.add_entity(Entity(id="DOM-MEMORY", type=EntityType.DOMAIN, properties={"title": "Second Brain Vector Store", "color": "#06B6D4", "desc": "Semantic embedding chunks, retrieval, and PKM memory"}))

        # 2. Merchant Domain Galaxy Cluster
        self.add_entity(Entity(id="M_DISPUTE_TAT", type=EntityType.MERCHANT, properties={"name": "Kumar Stores", "category": "Retail Groceries", "trust_score": 98, "consent_tier": "TIER_1", "peak_hours": "7:00 PM - 9:00 PM", "tenant_id": "TENANT-KUMAR-DELHI-01"}))
        self.add_entity(Entity(id="M_STORE_FRONT", type=EntityType.MERCHANT, properties={"name": "Billing Counter Main", "location": "Connaught Place, New Delhi", "square_ft": 450, "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_INVENTORY_BAY", type=EntityType.MERCHANT, properties={"name": "Back Storage Bay", "capacity": "1,200 SKUs", "temp": "Nominal 24°C", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_CASH_DRAWER", type=EntityType.MERCHANT, properties={"name": "Till & Cash Drawer #1", "daily_float": "₹5,000", "currency": "INR", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_GSTIN_PORTAL", type=EntityType.MERCHANT, properties={"name": "GSTN E-Invoicing Gateway", "gstin": "07AAAAA0000A1Z5", "status": "ACTIVE", "tenant_owner": "Kumar Stores"}))
        
        # Personalized Store Distributors
        self.add_entity(Entity(id="M_SUPPLIER_AMUL", type=EntityType.MERCHANT, properties={"name": "Amul Dairy Distributor (CP North)", "credit_term": "T+3", "outstanding": "₹8,400", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_SUPPLIER_NESTLE", type=EntityType.MERCHANT, properties={"name": "Nestle FMCG Direct", "credit_term": "T+7", "outstanding": "₹12,150", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_SUPPLIER_ITC", type=EntityType.MERCHANT, properties={"name": "ITC Staples Wholesale", "credit_term": "T+5", "outstanding": "₹16,800", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_SUPPLIER_MDH", type=EntityType.MERCHANT, properties={"name": "MDH Spices Direct Wholesaler", "credit_term": "T+7", "outstanding": "₹4,200", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_SUPPLIER_PARLE", type=EntityType.MERCHANT, properties={"name": "Parle Distributor New Delhi", "credit_term": "T+4", "outstanding": "₹6,100", "tenant_owner": "Kumar Stores"}))

        # Personalized Store Khaata Ledgers (Zero PII, Store-Specific Credit)
        self.add_entity(Entity(id="KHAATA-SHARMA-JI", type=EntityType.MERCHANT, properties={"name": "Ramesh Sharma (Khaata #01)", "balance_due": "₹1,450", "credit_limit": "₹3,000", "reputation": "HIGH_TRUST", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="KHAATA-VERMA-GROCER", type=EntityType.MERCHANT, properties={"name": "Anil Verma (Weekly Provisions)", "balance_due": "₹2,800", "credit_limit": "₹5,000", "reputation": "HIGH_TRUST", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="KHAATA-GUPTA-SWEETS", type=EntityType.MERCHANT, properties={"name": "Gupta Sweets B2B Neighbour", "balance_due": "₹890", "credit_limit": "₹4,000", "reputation": "EXCELLENT", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="KHAATA-SINGH-TEACHER", type=EntityType.MERCHANT, properties={"name": "Harpreet Singh (Daily Kirana)", "balance_due": "₹620", "credit_limit": "₹2,000", "reputation": "HIGH_TRUST", "tenant_owner": "Kumar Stores"}))

        # Personalized Store Customer Rings & Velocity
        self.add_entity(Entity(id="M_CUSTOMER_RING_A", type=EntityType.MERCHANT, properties={"name": "Daily Regulars (Khaata Pool)", "count": 142, "avg_spend": "₹320/day", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="M_CUSTOMER_RING_B", type=EntityType.MERCHANT, properties={"name": "Evening QR Walk-ins", "count": 285, "avg_spend": "₹110/txn", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="PATTERN-EVENING-RUSH", type=EntityType.MERCHANT, properties={"name": "Evening Rush Period (7-9:30 PM)", "avg_velocity": "₹18,400 daily", "upi_share": "78%", "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="SENSOR-DOOR-COUNTER", type=EntityType.TELEMETRY, properties={"name": "Entrance IR Footfall Sensor", "daily_visitors": 340, "peak_rate": "42 visitors/hr", "tenant_owner": "Kumar Stores"}))

        # Personalized Store Inventory SKUs
        self.add_entity(Entity(id="SKU-ATTA-10KG", type=EntityType.MERCHANT, properties={"name": "Aashirvaad Shudh Atta 10kg", "stock": 24, "reorder_point": 8, "price": 440, "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="SKU-MILK-TONED", type=EntityType.MERCHANT, properties={"name": "Amul Taaza 500ml", "stock": 48, "reorder_point": 15, "price": 27, "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="SKU-OIL-1L", type=EntityType.MERCHANT, properties={"name": "Fortune Mustard Oil 1L", "stock": 18, "reorder_point": 6, "price": 145, "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="SKU-CHAI-PATTI", type=EntityType.MERCHANT, properties={"name": "Tata Tea Premium 250g", "stock": 32, "reorder_point": 10, "price": 110, "tenant_owner": "Kumar Stores"}))
        self.add_entity(Entity(id="SKU-RICE-BASMATI", type=EntityType.MERCHANT, properties={"name": "India Gate Basmati 5kg", "stock": 14, "reorder_point": 5, "price": 520, "tenant_owner": "Kumar Stores"}))

        # 3. Device Telemetry & IoT Hardware Cluster
        self.add_entity(Entity(id="SB-4421", type=EntityType.DEVICE, properties={"model": "Soundbox 4G Pro", "battery_pct": 12, "status": "OFFLINE", "sim_network": "2G Airtel", "last_ping": "6.5h ago"}))
        self.add_entity(Entity(id="POS-9982", type=EntityType.DEVICE, properties={"model": "EDC Smart POS", "battery_pct": 94, "status": "ONLINE", "sim_network": "4G Jio", "last_ping": "3s ago"}))
        self.add_entity(Entity(id="QR-8812", type=EntityType.DEVICE, properties={"model": "Dynamic UPI Standee", "status": "ONLINE", "spec": "NPCI BharatQR v2.1"}))
        self.add_entity(Entity(id="MOD-SB-BATT", type=EntityType.TELEMETRY, properties={"component": "Li-ion Battery Cell", "voltage": "3.52V", "capacity": "2600mAh", "health": "DEGRADED_DISCHARGING"}))
        self.add_entity(Entity(id="MOD-SB-SIM", type=EntityType.TELEMETRY, properties={"component": "Airtel IoT eSIM", "imsi": "4044500129841", "rssi_dbm": -98, "status": "WEAK_COVERAGE"}))
        self.add_entity(Entity(id="MOD-SB-AUDIO", type=EntityType.TELEMETRY, properties={"component": "2W Neodymium Audio Driver", "spl_db": 88, "codec": "PCM-16k", "status": "NOMINAL"}))
        self.add_entity(Entity(id="MOD-SB-MIC", type=EntityType.TELEMETRY, properties={"component": "Dual MEMS Microphone", "snr": "64dB", "vad_enabled": True, "status": "STANDBY"}))
        self.add_entity(Entity(id="MOD-POS-PRINTER", type=EntityType.TELEMETRY, properties={"component": "58mm Thermal Printer Head", "paper_sensor": "OK", "platen": "LOCKED"}))
        self.add_entity(Entity(id="MOD-POS-NFC", type=EntityType.TELEMETRY, properties={"component": "NFC ISO 14443 Reader", "frequency": "13.56MHz", "emv_level": "Level 2 Certified"}))
        self.add_entity(Entity(id="NET-TOWER-DEL-404", type=EntityType.TELEMETRY, properties={"tower": "Airtel BTS Connaught North", "lac": 404, "cid": 8912, "load": "HIGH_CONGESTION"}))
        self.add_entity(Entity(id="BROKER-MQTT-IOT", type=EntityType.TELEMETRY, properties={"broker": "ssl://iot.tara-bank.in:8883", "keepalive_sec": 60, "protocol": "MQTT 3.1.1"}))
        self.add_entity(Entity(id="TOPIC-SB-HEARTBEAT", type=EntityType.TELEMETRY, properties={"topic": "tara/device/SB-4421/heartbeat", "qos": 1, "last_msg": "BAT:12;SIG:-98"}))
        self.add_entity(Entity(id="TOPIC-PAYMENT-CHIME", type=EntityType.TELEMETRY, properties={"topic": "tara/device/SB-4421/audio/chime", "format": "TTS_WAV_EN_HI", "payload_cached": True}))
        self.add_entity(Entity(id="TOPIC-OTA-COMMANDS", type=EntityType.TELEMETRY, properties={"topic": "tara/device/SB-4421/cmd/reboot", "auth": "Ed25519 Signed", "tier": "Tier-1 Autonomous"}))

        # 4. Financial Ledger, Double-Entry & Settlements Cluster
        self.add_entity(Entity(id="LEDGER-CORE", type=EntityType.SETTLEMENT, properties={"type": "Immutable Double-Entry Ledger", "audit_hash": "0x7f9a...88b2", "currency": "INR (Play Money)"}))
        self.add_entity(Entity(id="SETTL-8492", type=EntityType.SETTLEMENT, properties={"amount_inr": 4280.0, "status": "ESCROW_LOCKED", "target_bank": "HDFC Bank **9182", "deadline_hours": 18.5}))
        self.add_entity(Entity(id="SETTL-8491", type=EntityType.SETTLEMENT, properties={"amount_inr": 12450.0, "status": "SETTLED_T0", "target_bank": "HDFC Bank **9182", "cleared_at": "Today 14:30"}))
        self.add_entity(Entity(id="SETTL-8490", type=EntityType.SETTLEMENT, properties={"amount_inr": 8920.0, "status": "SETTLED_T0", "target_bank": "HDFC Bank **9182", "cleared_at": "Yesterday 23:59"}))
        self.add_entity(Entity(id="ACC-MERCHANT-CURRENT", type=EntityType.SETTLEMENT, properties={"holder": "Kumar Stores Current A/c", "bank": "HDFC Bank", "balance": "₹34,820", "type": "ASSET"}))
        self.add_entity(Entity(id="ACC-RESERVE-ESCROW", type=EntityType.SETTLEMENT, properties={"holder": "RBI Sandbox Escrow Pool", "custodian": "Tara Escrow", "balance": "₹4,280", "type": "LIABILITY"}))
        self.add_entity(Entity(id="ACC-NPCI-CLEARING", type=EntityType.SETTLEMENT, properties={"holder": "NPCI UPI Immediate Clearing", "member_id": "TARA001", "type": "CLEARING"}))
        self.add_entity(Entity(id="TXN-UPI-98101", type=EntityType.TRANSACTION, properties={"amount": 50.0, "status": "SUCCESS", "payer": "rahul.sharma@okaxis", "device": "SB-4421"}))
        self.add_entity(Entity(id="TXN-UPI-98102", type=EntityType.TRANSACTION, properties={"amount": 420.0, "status": "SUCCESS", "payer": "priya.mehta@okhdfc", "device": "POS-9982"}))
        self.add_entity(Entity(id="TXN-UPI-98103", type=EntityType.TRANSACTION, properties={"amount": 1250.0, "status": "SUCCESS", "payer": "amit.gupta@paytm", "device": "POS-9982"}))
        self.add_entity(Entity(id="TXN-UPI-98104", type=EntityType.TRANSACTION, properties={"amount": 15.0, "status": "SUCCESS", "payer": "sunil.kumar@ybl", "device": "SB-4421"}))
        self.add_entity(Entity(id="TXN-UPI-98105", type=EntityType.TRANSACTION, properties={"amount": 880.0, "status": "SUCCESS", "payer": "deepa.verma@sbi", "device": "QR-8812"}))
        self.add_entity(Entity(id="TXN-DISPUTE-892", type=EntityType.TRANSACTION, properties={"amount": 450.0, "status": "PROVISIONAL_HOLD", "payer": "vikram.singh@icici", "dispute_tat": "24h SLA"}))

        # 5. Regulatory Policy & Compliance Rules Cluster
        self.add_entity(Entity(id="NPCI-CIRC-142", type=EntityType.POLICY_RULE, properties={"name": "NPCI Circular 142", "sla_hours": 24, "zero_penalty": True, "clause": "Provisional credit for UPI pending debit"}))
        self.add_entity(Entity(id="CONSENT-V2", type=EntityType.POLICY_RULE, properties={"name": "Consent Protocol v2", "tier_1": "Autonomous Telemetry Probe", "tier_2": "Merchant-Signed 1-Click Approval"}))
        self.add_entity(Entity(id="ZERO-PII-AXIOM", type=EntityType.POLICY_RULE, properties={"name": "Zero Real PII Axiom", "rule": "Synthetic KYC tokenization; strip PAN/Aadhaar/Mobile at edge"}))
        self.add_entity(Entity(id="RBI-MASTER-DIR-2024", type=EntityType.POLICY_RULE, properties={"name": "RBI Master Direction 2024", "scope": "Payment Aggregators & Escrow Accounts", "audit": "Monthly"}))
        self.add_entity(Entity(id="EMVCO-SRC-V2", type=EntityType.POLICY_RULE, properties={"name": "EMVCo Secure Remote Commerce", "spec": "QR Code Specification for Merchant-Presented Mode"}))
        self.add_entity(Entity(id="ISO-8583-0200", type=EntityType.POLICY_RULE, properties={"name": "ISO 8583 Message Standard", "mti": "0200", "desc": "Point of Service Financial Transaction Request"}))
        self.add_entity(Entity(id="DPDP-ACT-SEC8", type=EntityType.POLICY_RULE, properties={"name": "DPDP Act Section 8", "clause": "Data fiduciary obligation for purpose-limitation & prompt erasure"}))
        self.add_entity(Entity(id="SLA-TAT-DISPUTE", type=EntityType.POLICY_RULE, properties={"name": "Merchant Dispute TAT SLA", "window": "2 Hours Max", "auto_escalate": True}))

        # 6. Agentic Decision & Reasoning Engine Cluster
        self.add_entity(Entity(id="BEDROCK-CLAUDE", type=EntityType.REASONING_NODE, properties={"engine": "Claude 3.5 Sonnet on AWS Bedrock", "temperature": 0.2, "latency_ms": 310}))
        self.add_entity(Entity(id="LATS-TREE", type=EntityType.REASONING_NODE, properties={"algorithm": "Language Agent Tree Search (Monte-Carlo)", "rollouts": 4, "reflection_enabled": True}))
        self.add_entity(Entity(id="LATS-BRANCH-A", type=EntityType.REASONING_NODE, properties={"action_hypothesis": "Wait for device battery drain", "score": 0.12, "rejected": True}))
        self.add_entity(Entity(id="LATS-BRANCH-B", type=EntityType.REASONING_NODE, properties={"action_hypothesis": "Queue cellular soft-reboot packet", "score": 0.94, "chosen": True}))
        self.add_entity(Entity(id="LATS-BRANCH-C", type=EntityType.REASONING_NODE, properties={"action_hypothesis": "Lock escrow & trigger SMS alert", "score": 0.88, "auxiliary": True}))
        self.add_entity(Entity(id="LATS-REFLECTION", type=EntityType.REASONING_NODE, properties={"critique": "Proactive reboot prevents loss of evening rush UPI chimes", "confidence": 0.96}))
        self.add_entity(Entity(id="SARVAM-INDIC", type=EntityType.REASONING_NODE, properties={"models": "Saaras v2 (STT) + Bulbul v1 (TTS)", "dialects": "hi-IN, en-IN, ta-IN, te-IN"}))
        self.add_entity(Entity(id="SARVAM-SAARAS", type=EntityType.REASONING_NODE, properties={"module": "Saaras Hindi ASR", "sample_rate": "16kHz", "noise_reduction": "Active Beamformer"}))
        self.add_entity(Entity(id="SARVAM-BULBUL", type=EntityType.REASONING_NODE, properties={"module": "Bulbul Hindi TTS", "voice": "Friendly Shopkeeper Female Voice", "tempo": 1.05}))
        self.add_entity(Entity(id="GUARDRAIL-PROFANITY", type=EntityType.REASONING_NODE, properties={"filter": "Regex & Embedding Toxicity Guard", "zero_leak": True}))
        self.add_entity(Entity(id="GUARDRAIL-FINANCIAL-CAP", type=EntityType.REASONING_NODE, properties={"limit_inr": 5000, "rule": "Tier-1 auto-actions capped at ₹5,000"}))
        self.add_entity(Entity(id="ED25519-SIGNER", type=EntityType.REASONING_NODE, properties={"algorithm": "Ed25519 Pure", "key_id": "tara-agent-2026", "pubkey": "0x4a9f...c201"}))
        self.add_entity(Entity(id="ACT-PING-REBOOT", type=EntityType.ACTION, properties={"type": "OTA_DIAGNOSTIC_PROBE", "target": "SB-4421", "status": "SCHEDULED", "approval_required": False}))
        self.add_entity(Entity(id="ACT-ESCROW-PROTECT", type=EntityType.ACTION, properties={"type": "PROVISIONAL_ESCROW_LOCK", "target": "SETTL-8492", "status": "ACTIVE", "approval_required": True}))

        # 3b. Paytm Hardware & Dual-SIM Cellular Failover Ecosystem
        self.add_entity(Entity(id="SB-OCTA-901", type=EntityType.DEVICE, properties={"model": "Paytm Soundbox Octa 5G", "bluetooth": "v5.2 Dual-Band", "speaker": "5W High-Volume Neodymium", "languages": "HI, TA, TE, BN, MR, EN", "status": "STANDBY"}))
        self.add_entity(Entity(id="SIM-JIO-FAILOVER", type=EntityType.TELEMETRY, properties={"carrier": "Jio M2M 4G LTE", "apn": "iot.jio.in", "auto_failover_threshold_ms": 800, "status": "BACKUP_ACTIVE"}))
        self.add_entity(Entity(id="PAYTM-LOAN-5LAKH", type=EntityType.SETTLEMENT, properties={"name": "Paytm Merchant Business Loan", "sanctioned_amount": "₹5,00,000", "interest_rate": "1.1% monthly", "daily_edi": "₹150", "status": "PRE_APPROVED"}))
        self.add_entity(Entity(id="ACT-AUDIO-FAILOVER", type=EntityType.ACTION, properties={"name": "Cross-Device Audio Chime Reroute", "source": "SB-4421", "fallback_target": "POS-9982", "status": "READY"}))
        self.add_entity(Entity(id="SMS-CELLULAR-DISPATCH", type=EntityType.ACTION, properties={"name": "Offline Cellular SMS Notification Rail", "provider": "AWS SNS + Twilio Gateway", "retry_count": 3, "status": "ONLINE"}))
        self.add_entity(Entity(id="BEDROCK-GUARDRAIL-PII", type=EntityType.REASONING_NODE, properties={"name": "Bedrock Zero-PII Ingress Guardrail", "masking_rules": "PAN, Aadhaar, Phone, Card CVV", "zero_leak_verified": True}))

        # 7. MindStudio AI Second Brain Vector Embeddings Cluster
        self.add_entity(Entity(id="CHUNK-BATTERY-TRIAGE", type=EntityType.VECTOR_CHUNK, properties={"title": "Soundbox Battery Triage Playbook", "tokens": 340, "vector_dim": 1536, "cosine_sim": 0.94, "category": "Hardware"}))
        self.add_entity(Entity(id="CHUNK-NPCI-PROVISIONAL", type=EntityType.VECTOR_CHUNK, properties={"title": "NPCI 24h Provisional Credit Rule", "tokens": 420, "vector_dim": 1536, "cosine_sim": 0.98, "category": "Regulatory"}))
        self.add_entity(Entity(id="CHUNK-RUSH-HOURS", type=EntityType.VECTOR_CHUNK, properties={"title": "Kirana Evening Rush Footfall Pattern", "tokens": 280, "vector_dim": 1536, "cosine_sim": 0.89, "category": "MerchantMemory"}))
        self.add_entity(Entity(id="CHUNK-ED25519-TOKEN", type=EntityType.VECTOR_CHUNK, properties={"title": "Ed25519 Cryptographic Action Token Spec", "tokens": 390, "vector_dim": 1536, "cosine_sim": 0.96, "category": "Security"}))
        self.add_entity(Entity(id="CHUNK-SIM-SIGNAL-ROAM", type=EntityType.VECTOR_CHUNK, properties={"title": "2G GPRS Tower Handover Recovery", "tokens": 310, "vector_dim": 1536, "cosine_sim": 0.91, "category": "Hardware"}))
        self.add_entity(Entity(id="CHUNK-SOUNDBOX-CHIME-SPEC", type=EntityType.VECTOR_CHUNK, properties={"title": "Paytm/Tara 88dB Split-Second Chime Spec", "tokens": 290, "vector_dim": 1536, "cosine_sim": 0.93, "category": "Audio"}))
        self.add_entity(Entity(id="CHUNK-ESCROW-TAT-CALC", type=EntityType.VECTOR_CHUNK, properties={"title": "Double-Entry Escrow Reconciliation Logic", "tokens": 460, "vector_dim": 1536, "cosine_sim": 0.95, "category": "Finance"}))
        self.add_entity(Entity(id="CHUNK-MERCHANT-CREDIT-PROFILE", type=EntityType.VECTOR_CHUNK, properties={"title": "Kirana Merchant Working Capital Score", "tokens": 370, "vector_dim": 1536, "cosine_sim": 0.88, "category": "Credit"}))

        # Satellite Cosmic Micro-Nodes (Vector Chunks VEC-01 to VEC-24 for galaxy density)
        categories = ["RetailOps", "EdgeIoT", "NPCI_Norms", "LATS_Trees", "VoiceASR", "DisputeCases"]
        for idx in range(1, 25):
            cat = categories[idx % len(categories)]
            v_id = f"VEC-CHUNK-{idx:02d}"
            self.add_entity(Entity(
                id=v_id,
                type=EntityType.VECTOR_CHUNK,
                properties={
                    "title": f"Second Brain Memory Block #{idx:02d} ({cat})",
                    "tokens": 250 + (idx * 17) % 300,
                    "vector_dim": 1536,
                    "cosine_sim": round(0.82 + (idx % 15) * 0.011, 3),
                    "category": cat
                }
            ))

        # 8. Interconnecting Relationships & Galaxy Edges (Hundreds of Cross-Domain Links)
        # Domain Hub Connections
        self.add_relationship(Relationship(id="e1", source_id="DOM-MERCHANT", target_id="M_DISPUTE_TAT", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e2", source_id="DOM-DEVICES", target_id="SB-4421", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e3", source_id="DOM-DEVICES", target_id="POS-9982", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e4", source_id="DOM-DEVICES", target_id="QR-8812", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e5", source_id="DOM-FINANCIALS", target_id="SETTL-8492", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e6", source_id="DOM-FINANCIALS", target_id="LEDGER-CORE", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e7", source_id="DOM-POLICIES", target_id="NPCI-CIRC-142", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e8", source_id="DOM-POLICIES", target_id="CONSENT-V2", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e9", source_id="DOM-POLICIES", target_id="ZERO-PII-AXIOM", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e10", source_id="DOM-REASONING", target_id="BEDROCK-CLAUDE", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e11", source_id="DOM-REASONING", target_id="LATS-TREE", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e12", source_id="DOM-REASONING", target_id="SARVAM-INDIC", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e13", source_id="DOM-MEMORY", target_id="CHUNK-BATTERY-TRIAGE", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e14", source_id="DOM-MEMORY", target_id="CHUNK-NPCI-PROVISIONAL", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e15", source_id="DOM-MEMORY", target_id="CHUNK-RUSH-HOURS", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e16", source_id="DOM-MEMORY", target_id="CHUNK-ED25519-TOKEN", type=RelationType.SUBCLASS_OF))

        # Merchant Sub-Cluster Edges
        self.add_relationship(Relationship(id="m_e1", source_id="M_DISPUTE_TAT", target_id="M_STORE_FRONT", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e2", source_id="M_DISPUTE_TAT", target_id="M_INVENTORY_BAY", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e3", source_id="M_DISPUTE_TAT", target_id="M_CASH_DRAWER", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e4", source_id="M_DISPUTE_TAT", target_id="M_GSTIN_PORTAL", type=RelationType.REFERENCES))
        self.add_relationship(Relationship(id="m_e5", source_id="M_DISPUTE_TAT", target_id="M_SUPPLIER_AMUL", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e6", source_id="M_DISPUTE_TAT", target_id="M_SUPPLIER_NESTLE", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e7", source_id="M_DISPUTE_TAT", target_id="M_SUPPLIER_ITC", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e7b", source_id="M_DISPUTE_TAT", target_id="M_SUPPLIER_MDH", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e7c", source_id="M_DISPUTE_TAT", target_id="M_SUPPLIER_PARLE", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e8", source_id="M_DISPUTE_TAT", target_id="M_CUSTOMER_RING_A", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e9", source_id="M_DISPUTE_TAT", target_id="M_CUSTOMER_RING_B", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e8a", source_id="M_CUSTOMER_RING_A", target_id="KHAATA-SHARMA-JI", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e8b", source_id="M_CUSTOMER_RING_A", target_id="KHAATA-VERMA-GROCER", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e8c", source_id="M_CUSTOMER_RING_A", target_id="KHAATA-GUPTA-SWEETS", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e8d", source_id="M_CUSTOMER_RING_A", target_id="KHAATA-SINGH-TEACHER", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e9a", source_id="M_DISPUTE_TAT", target_id="PATTERN-EVENING-RUSH", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="m_e9b", source_id="M_STORE_FRONT", target_id="SENSOR-DOOR-COUNTER", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e10", source_id="M_INVENTORY_BAY", target_id="SKU-ATTA-10KG", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e11", source_id="M_INVENTORY_BAY", target_id="SKU-MILK-TONED", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e12", source_id="M_INVENTORY_BAY", target_id="SKU-OIL-1L", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e13", source_id="M_INVENTORY_BAY", target_id="SKU-CHAI-PATTI", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="m_e14", source_id="M_INVENTORY_BAY", target_id="SKU-RICE-BASMATI", type=RelationType.OWNS))

        # Device Sub-Cluster Edges
        self.add_relationship(Relationship(id="d_e1", source_id="SB-4421", target_id="MOD-SB-BATT", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="d_e2", source_id="SB-4421", target_id="MOD-SB-SIM", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="d_e3", source_id="SB-4421", target_id="MOD-SB-AUDIO", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="d_e4", source_id="SB-4421", target_id="MOD-SB-MIC", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="d_e5", source_id="POS-9982", target_id="MOD-POS-PRINTER", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="d_e6", source_id="POS-9982", target_id="MOD-POS-NFC", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="d_e7", source_id="MOD-SB-SIM", target_id="NET-TOWER-DEL-404", type=RelationType.AFFECTS))
        self.add_relationship(Relationship(id="d_e8", source_id="SB-4421", target_id="BROKER-MQTT-IOT", type=RelationType.GENERATES))
        self.add_relationship(Relationship(id="d_e9", source_id="BROKER-MQTT-IOT", target_id="TOPIC-SB-HEARTBEAT", type=RelationType.GENERATES))
        self.add_relationship(Relationship(id="d_e10", source_id="BROKER-MQTT-IOT", target_id="TOPIC-PAYMENT-CHIME", type=RelationType.GENERATES))
        self.add_relationship(Relationship(id="d_e11", source_id="BROKER-MQTT-IOT", target_id="TOPIC-OTA-COMMANDS", type=RelationType.GENERATES))

        # Financial & Transaction Sub-Cluster Edges
        self.add_relationship(Relationship(id="f_e1", source_id="LEDGER-CORE", target_id="ACC-MERCHANT-CURRENT", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="f_e2", source_id="LEDGER-CORE", target_id="ACC-RESERVE-ESCROW", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="f_e3", source_id="LEDGER-CORE", target_id="ACC-NPCI-CLEARING", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="f_e4", source_id="ACC-RESERVE-ESCROW", target_id="SETTL-8492", type=RelationType.SETTLES))
        self.add_relationship(Relationship(id="f_e5", source_id="ACC-MERCHANT-CURRENT", target_id="SETTL-8491", type=RelationType.SETTLES))
        self.add_relationship(Relationship(id="f_e6", source_id="ACC-MERCHANT-CURRENT", target_id="SETTL-8490", type=RelationType.SETTLES))
        self.add_relationship(Relationship(id="f_e7", source_id="SETTL-8492", target_id="TXN-DISPUTE-892", type=RelationType.PART_OF))
        self.add_relationship(Relationship(id="f_e8", source_id="SB-4421", target_id="TXN-UPI-98101", type=RelationType.PROCESSED_BY))
        self.add_relationship(Relationship(id="f_e9", source_id="POS-9982", target_id="TXN-UPI-98102", type=RelationType.PROCESSED_BY))
        self.add_relationship(Relationship(id="f_e10", source_id="POS-9982", target_id="TXN-UPI-98103", type=RelationType.PROCESSED_BY))
        self.add_relationship(Relationship(id="f_e11", source_id="SB-4421", target_id="TXN-UPI-98104", type=RelationType.PROCESSED_BY))
        self.add_relationship(Relationship(id="f_e12", source_id="QR-8812", target_id="TXN-UPI-98105", type=RelationType.PROCESSED_BY))

        # Policy & Compliance Sub-Cluster Edges
        self.add_relationship(Relationship(id="p_e1", source_id="DOM-POLICIES", target_id="RBI-MASTER-DIR-2024", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="p_e2", source_id="DOM-POLICIES", target_id="EMVCO-SRC-V2", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="p_e3", source_id="DOM-POLICIES", target_id="ISO-8583-0200", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="p_e4", source_id="DOM-POLICIES", target_id="DPDP-ACT-SEC8", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="p_e5", source_id="DOM-POLICIES", target_id="SLA-TAT-DISPUTE", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="p_e6", source_id="RBI-MASTER-DIR-2024", target_id="ACC-RESERVE-ESCROW", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="p_e7", source_id="EMVCO-SRC-V2", target_id="QR-8812", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="p_e8", source_id="ISO-8583-0200", target_id="POS-9982", type=RelationType.GOVERNS))

        # Reasoning Engine & Decision Tree Edges
        self.add_relationship(Relationship(id="r_e1", source_id="BEDROCK-CLAUDE", target_id="LATS-TREE", type=RelationType.REASONS_OVER))
        self.add_relationship(Relationship(id="r_e2", source_id="LATS-TREE", target_id="LATS-BRANCH-A", type=RelationType.REASONS_OVER))
        self.add_relationship(Relationship(id="r_e3", source_id="LATS-TREE", target_id="LATS-BRANCH-B", type=RelationType.REASONS_OVER))
        self.add_relationship(Relationship(id="r_e4", source_id="LATS-TREE", target_id="LATS-BRANCH-C", type=RelationType.REASONS_OVER))
        self.add_relationship(Relationship(id="r_e5", source_id="LATS-BRANCH-B", target_id="LATS-REFLECTION", type=RelationType.REASONS_OVER))
        self.add_relationship(Relationship(id="r_e6", source_id="LATS-REFLECTION", target_id="ACT-PING-REBOOT", type=RelationType.TRIGGERED_BY))
        self.add_relationship(Relationship(id="r_e7", source_id="SARVAM-INDIC", target_id="SARVAM-SAARAS", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="r_e8", source_id="SARVAM-INDIC", target_id="SARVAM-BULBUL", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="r_e9", source_id="BEDROCK-CLAUDE", target_id="GUARDRAIL-PROFANITY", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="r_e10", source_id="BEDROCK-CLAUDE", target_id="GUARDRAIL-FINANCIAL-CAP", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="r_e11", source_id="ED25519-SIGNER", target_id="ACT-PING-REBOOT", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="r_e12", source_id="ED25519-SIGNER", target_id="ACT-ESCROW-PROTECT", type=RelationType.GOVERNS))

        # Semantic Bridges Between Super-Clusters
        self.add_relationship(Relationship(id="e17", source_id="M_DISPUTE_TAT", target_id="SB-4421", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="e18", source_id="M_DISPUTE_TAT", target_id="POS-9982", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="e19", source_id="M_DISPUTE_TAT", target_id="QR-8812", type=RelationType.OWNS))
        self.add_relationship(Relationship(id="e20", source_id="M_DISPUTE_TAT", target_id="SETTL-8492", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="e21", source_id="SB-4421", target_id="ACT-PING-REBOOT", type=RelationType.TRIGGERED_BY))
        self.add_relationship(Relationship(id="e22", source_id="CONSENT-V2", target_id="ACT-PING-REBOOT", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="e23", source_id="NPCI-CIRC-142", target_id="SETTL-8492", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="e24", source_id="NPCI-CIRC-142", target_id="ACT-ESCROW-PROTECT", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="e25", source_id="LEDGER-CORE", target_id="SETTL-8492", type=RelationType.SETTLES))
        self.add_relationship(Relationship(id="e27", source_id="LATS-TREE", target_id="SB-4421", type=RelationType.REASONS_OVER))
        self.add_relationship(Relationship(id="e29", source_id="CHUNK-BATTERY-TRIAGE", target_id="SB-4421", type=RelationType.EMBEDS))
        self.add_relationship(Relationship(id="e30", source_id="CHUNK-NPCI-PROVISIONAL", target_id="NPCI-CIRC-142", type=RelationType.EMBEDS))
        self.add_relationship(Relationship(id="e31", source_id="CHUNK-RUSH-HOURS", target_id="M_DISPUTE_TAT", type=RelationType.EMBEDS))
        self.add_relationship(Relationship(id="e32", source_id="CHUNK-ED25519-TOKEN", target_id="CONSENT-V2", type=RelationType.EMBEDS))
        self.add_relationship(Relationship(id="e33", source_id="ZERO-PII-AXIOM", target_id="M_DISPUTE_TAT", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="e34", source_id="SARVAM-INDIC", target_id="M_DISPUTE_TAT", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="e35", source_id="DOM-DEVICES", target_id="SB-OCTA-901", type=RelationType.SUBCLASS_OF))
        self.add_relationship(Relationship(id="e36", source_id="SB-4421", target_id="SIM-JIO-FAILOVER", type=RelationType.GENERATES))
        self.add_relationship(Relationship(id="e37", source_id="M_DISPUTE_TAT", target_id="PAYTM-LOAN-5LAKH", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="e38", source_id="SB-4421", target_id="ACT-AUDIO-FAILOVER", type=RelationType.TRIGGERED_BY))
        self.add_relationship(Relationship(id="e39", source_id="ACT-AUDIO-FAILOVER", target_id="POS-9982", type=RelationType.AFFECTS))
        self.add_relationship(Relationship(id="e40", source_id="M_DISPUTE_TAT", target_id="SMS-CELLULAR-DISPATCH", type=RelationType.INVOLVES))
        self.add_relationship(Relationship(id="e41", source_id="BEDROCK-CLAUDE", target_id="BEDROCK-GUARDRAIL-PII", type=RelationType.GOVERNS))
        self.add_relationship(Relationship(id="e42", source_id="BEDROCK-GUARDRAIL-PII", target_id="M_DISPUTE_TAT", type=RelationType.GOVERNS))

        # Connect Satellite Memory Nodes to their Nearest Domain Clusters
        for idx in range(1, 25):
            v_id = f"VEC-CHUNK-{idx:02d}"
            target_hub = ["DOM-MERCHANT", "DOM-DEVICES", "DOM-FINANCIALS", "DOM-POLICIES", "DOM-REASONING", "DOM-MEMORY"][idx % 6]
            self.add_relationship(Relationship(id=f"sat_e_{idx}", source_id=target_hub, target_id=v_id, type=RelationType.SUBCLASS_OF))

    def add_entity(self, entity: Entity) -> Entity:
        self.entities[entity.id] = entity
        if entity.id not in self._adjacency:
            self._adjacency[entity.id] = []
        return entity

    def add_relationship(self, rel: Relationship) -> Relationship:
        self.relationships.append(rel)
        if rel.source_id not in self._adjacency:
            self._adjacency[rel.source_id] = []
        if rel.target_id not in self._adjacency:
            self._adjacency[rel.target_id] = []
        self._adjacency[rel.source_id].append((rel.target_id, rel))
        self._adjacency[rel.target_id].append((rel.source_id, rel))
        return rel

    def get_entity(self, entity_id: str) -> Optional[Entity]:
        return self.entities.get(entity_id)

    def find_entities(self, entity_type: EntityType, **filters) -> List[Entity]:
        results = []
        for e in self.entities.values():
            if e.type != entity_type:
                continue
            match = True
            for k, v in filters.items():
                if e.properties.get(k) != v:
                    match = False
                    break
            if match:
                results.append(e)
        return results

    def neighborhood(self, entity_id: str, depth: int = 2) -> Dict[str, Any]:
        """Get all entities within `depth` hops of `entity_id`."""
        visited = set()
        result = {"center": entity_id, "nodes": [], "edges": [], "path": []}
        queue = [(entity_id, 0)]

        while queue:
            current_id, current_depth = queue.pop(0)
            if current_id in visited or current_depth > depth:
                continue
            visited.add(current_id)

            entity = self.entities.get(current_id)
            if entity:
                result["nodes"].append({
                    "id": entity.id,
                    "type": entity.type.value,
                    "properties": entity.properties,
                    "depth": current_depth,
                })

            for neighbor_id, rel in self._adjacency.get(current_id, []):
                if neighbor_id not in visited:
                    result["edges"].append({
                        "source": rel.source_id,
                        "target": rel.target_id,
                        "type": rel.type.value,
                    })
                    queue.append((neighbor_id, current_depth + 1))

        result["path"] = GraphPath(
            nodes=list(visited),
            edges=[f"{e['source']} --{e['type']}--> {e['target']}" for e in result["edges"]],
            description=f"Neighborhood of {entity_id} (depth={depth}): {len(result['nodes'])} nodes, {len(result['edges'])} edges"
        )
        return result

    def explain_path(self, source_id: str, target_id: str) -> Optional[GraphPath]:
        """Find and explain the shortest path between two entities (BFS)."""
        if source_id == target_id:
            return GraphPath(nodes=[source_id], edges=[], description=f"{source_id} is the same entity")

        visited = {source_id}
        queue = [(source_id, [source_id], [])]

        while queue:
            current, path_nodes, path_edges = queue.pop(0)

            for neighbor_id, rel in self._adjacency.get(current, []):
                if neighbor_id in visited:
                    continue
                visited.add(neighbor_id)

                new_nodes = path_nodes + [neighbor_id]
                edge_desc = f"{rel.source_id} --{rel.type.value}--> {rel.target_id}"
                new_edges = path_edges + [edge_desc]

                if neighbor_id == target_id:
                    source_entity = self.entities.get(source_id)
                    target_entity = self.entities.get(target_id)
                    source_label = f"{source_entity.type.value}({source_id})" if source_entity else source_id
                    target_label = f"{target_entity.type.value}({target_id})" if target_entity else target_id

                    return GraphPath(
                        nodes=new_nodes,
                        edges=new_edges,
                        description=f"Path from {source_label} to {target_label}: {' → '.join(new_edges)}"
                    )

                queue.append((neighbor_id, new_nodes, new_edges))

        return None

    def affected_transactions(self, device_id: str, window_hours: int = 24) -> Dict[str, Any]:
        """Find transactions affected by a device issue within a time window."""
        device = self.entities.get(device_id)
        if not device or device.type != EntityType.DEVICE:
            return {"error": f"Device {device_id} not found", "transactions": [], "path": None}

        cutoff = datetime.utcnow() - timedelta(hours=window_hours)
        affected = []
        paths = []

        for neighbor_id, rel in self._adjacency.get(device_id, []):
            if rel.type == RelationType.PROCESSED_BY:
                txn = self.entities.get(neighbor_id)
                if txn and txn.type == EntityType.TRANSACTION:
                    if txn.created_at >= cutoff:
                        affected.append(txn)
                        paths.append(f"{device_id} --PROCESSED_BY--> {txn.id}")

        path = GraphPath(
            nodes=[device_id] + [t.id for t in affected],
            edges=paths,
            description=f"Device {device_id}: {len(affected)} transactions in last {window_hours}h"
        )

        return {
            "device_id": device_id,
            "window_hours": window_hours,
            "transactions": [
                {"id": t.id, "properties": t.properties} for t in affected
            ],
            "count": len(affected),
            "path": path,
        }

    def at_risk_settlements(self, hours_until_deadline: int = 48) -> Dict[str, Any]:
        """Find settlements at risk of TAT breach."""
        at_risk = []
        now = datetime.utcnow()

        for entity in self.entities.values():
            if entity.type != EntityType.SETTLEMENT:
                continue
            deadline = entity.properties.get("tat_deadline")
            if deadline and isinstance(deadline, datetime):
                remaining = (deadline - now).total_seconds() / 3600
                if 0 < remaining <= hours_until_deadline:
                    at_risk.append({
                        "id": entity.id,
                        "properties": entity.properties,
                        "hours_remaining": round(remaining, 1),
                    })

        path = GraphPath(
            nodes=[s["id"] for s in at_risk],
            edges=[],
            description=f"{len(at_risk)} settlements at risk of TAT breach within {hours_until_deadline}h"
        )

        return {
            "at_risk": at_risk,
            "count": len(at_risk),
            "threshold_hours": hours_until_deadline,
            "path": path,
        }

    def to_dict(self) -> Dict[str, Any]:
        """Serialize the entire graph for inspection."""
        return {
            "entities": {
                eid: {
                    "type": e.type.value,
                    "properties": e.properties,
                }
                for eid, e in self.entities.items()
            },
            "relationships": [
                {
                    "source": r.source_id,
                    "target": r.target_id,
                    "type": r.type.value,
                }
                for r in self.relationships
            ],
            "stats": {
                "entity_count": len(self.entities),
                "relationship_count": len(self.relationships),
                "entity_types": dict(
                    (t.value, sum(1 for e in self.entities.values() if e.type == t))
                    for t in EntityType
                ),
            },
        }


# ─── Global Instance & Accessors ────────────

InMemoryOntologyStore = OntologyStore
ontology = OntologyStore()

def get_ontology_store() -> OntologyStore:
    global ontology
    return ontology


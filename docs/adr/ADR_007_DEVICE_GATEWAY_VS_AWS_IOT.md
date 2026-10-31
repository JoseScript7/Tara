# ADR 007: Custom WebSocket Gateway vs. AWS IoT Core (MQTT) for Demo Soundbox

**Status:** Accepted  
**Date:** 2026-10-31  
**Deciders:** Core Engineering Team, Hackathon Lead  
**Context:** L2 / L10 Architecture Tradeoff Analysis  

---

## 1. Problem Statement
The soundbox telemetry and announcement pipeline requires bidirectional, low-latency communication with demo units running on secondary phones, tablets, or laptops. We must decide between:
1. **Custom WebSocket Gateway (FastAPI `APIRouter.websocket`):** Python-based WebSocket server with custom ping/pong, heartbeat tracking, and presence state machine.
2. **AWS IoT Core (MQTT over WebSockets):** Fully managed AWS IoT broker utilizing SigV4 authentication and device shadow MQTT topics.

---

## 2. Evaluation Criteria

| Criteria | Custom WebSocket Gateway | AWS IoT Core (MQTT) |
| :--- | :--- | :--- |
| **Effort to Implement** | **Low (1 day)**: Integrated into existing FastAPI app; zero client SDK overhead. | **High (3–4 days)**: Requires IAM policies, X.509 certs or SigV4 auth, AWS IoT SDK bundling in browser. |
| **Monthly Cost (FinOps)** | **$0 additional**: Runs in existing container/app server instance. | **$1.00 - $1.50 per million messages** + device shadow update fees. |
| **Browser Support** | **Universal (100%)**: Native `window.WebSocket` supported on all modern mobile & desktop browsers. | **Limited/Complex**: Requires MQTT-over-WebSocket client (e.g. `aws-iot-device-sdk-js` or `paho-mqtt`), adding ~180KB bundle size. |
| **Security Model** | Per-device token rotation, single-use QR pairing tokens, TLS encryption (WSS). | Mutual TLS (mTLS) with X.509 certificates (ideal for embedded hardware, awkward in mobile browser). |
| **Airplane Mode / Flap Detection** | **Immediate control**: Direct server-side timer detection (`OFFLINE_TIMEOUT_SEC = 12s`) with custom jitter debouncing. | Relies on Keep-Alive intervals (minimum 30s) or AWS IoT LWT (Last Will and Testament) lifecycle events. |

---

## 3. Decision & Recommendations

### For the Hackathon / Demo
**Recommend Custom WebSocket Gateway.**
- **Rationale:** The demo runs in standard mobile web browsers without installing native binaries or handling X.509 certificates in browser local storage. It delivers immediate 68ms announcement acknowledgements and predictable 12-second offline detection during physical Airplane Mode demos.

### For Production Physical Hardware
**Recommend AWS IoT Core.**
- **Rationale:** For physical embedded soundbox hardware (ESP32 / Linux SoC with cellular modem), AWS IoT Core provides native hardware secure element integration (ATECC608A), fine-grained device shadows, fleet indexing, and over-the-air (OTA) firmware update orchestration at nationwide scale.

# OneBlood — Visual Companion & Simplified System Guide

This guide provides a highly visual, easy-to-understand breakdown of the **OneBlood** platform's architecture, data flows, and matching logic.

---

## 🗺️ 1. High-Level Architecture (Where things live & how they talk)

OneBlood separates the frontend (user interface) and backend (server logic) to ensure fast load speeds and reliable operations.

```mermaid
graph TD
    %% Define Nodes
    User([Web Browser / User])
    FR[Firebase CDN Frontend]
    RE[Render Cloud Backend]
    DB[(MongoDB Atlas Database)]
    AI[AI Doctor Letter Scanner]
    
    %% Connections
    User -->|1. Opens Page| FR
    User -->|2. Submits Form / Actions| RE
    User <-->|3. Live Instant Chat| RE
    RE <-->|4. Reads & Writes Data| DB
    RE -->|5. Validates Letters| AI
    
    %% Styling
    style FR fill:#f43f5e,stroke:#333,stroke-width:2px,color:#fff
    style RE fill:#3b82f6,stroke:#333,stroke-width:2px,color:#fff
    style DB fill:#10b981,stroke:#333,stroke-width:2px,color:#fff
    style AI fill:#8b5cf6,stroke:#333,stroke-width:2px,color:#fff
```

### Quick Summary:
* **Frontend (React)**: Hosted on **Firebase Hosting**. This handles what the user sees, clicks, and interacts with on the map.
* **Backend (Node.js/Express)**: Hosted on **Render**. It handles routing, authorization tokens, database connections, and coordinates real-time chat sockets.
* **Database (MongoDB)**: Stores data on users, donors, banks, and request statuses.
* **AI OCR engine**: Anthropic Vision and Tesseract read doctor letters to prevent fraud.

---

## 🔄 2. Complete Flow: Request Creation to Delivery

Here is the exact lifecycle of a blood request when a seeker creates one.

```mermaid
flowchart TD
    A[Seeker Uploads Doctor Requisition Slip] --> B[AI OCR Service Extracts Blood Group, Units & Hospital]
    B --> C{Is AI Scan Valid?}
    C -->|Yes| D[Request Approved & Posted on Notice Board]
    C -->|No| E[Sent to Admin Queue for Manual Verification]
    D --> F[WebSocket Broadcasts Alert to Nearby Matching Donors]
    F --> G[Donor Accepts Request from Feed]
    G --> H[Private Chat Room Created for Donor & Seeker]
    H --> I[Donor Guided to Collection Center / Recipient Hospital]
    I --> J[Match Slip PDF Generated with Verification Badges]
    J --> K[Donation Completed & Logged in System]
    
    style C fill:#fcd34d,stroke:#333,stroke-width:1px
    style D fill:#d1fae5,stroke:#333,stroke-width:1px
    style J fill:#dbeafe,stroke:#333,stroke-width:1px
```

---

## 🧬 3. The Proximity Matcher (How nearby donors are found)

To find available donors close to a patient, the system indexes donor coordinates using **MongoDB Geospatial indexing**.

```mermaid
graph LR
    subgraph Target Area
        Seeker(Patient Hospital / Center)
    end
    
    subgraph Search Radius
        D1[Donor 1 - 2KM away: Matched]
        D2[Donor 2 - 4KM away: Matched]
    end
    
    subgraph Out of Bounds
        D3[Donor 3 - 25KM away: Skipped]
    end
    
    Seeker -->|Query: $nearSphere within 10KM| D1
    Seeker -->|Query: $nearSphere within 10KM| D2
    Seeker -.->|Too far| D3
    
    style Seeker fill:#ef4444,stroke:#333,color:#fff
    style D1 fill:#10b981,stroke:#333,color:#fff
    style D2 fill:#10b981,stroke:#333,color:#fff
    style D3 fill:#9ca3af,stroke:#333,color:#fff
```

---

## 🩸 4. Match Grid (Who can donate to whom?)

Clinical rules are programmed directly into the compatibility engine:

| Recipient Blood Group | Compatible Donor Blood Groups |
|:---------------------:|:------------------------------|
| **O-** | O- (Universal Donor) |
| **O+** | O-, O+ |
| **A-** | O-, A- |
| **A+** | O-, O+, A-, A+ |
| **B-** | O-, B- |
| **B+** | O-, O+, B-, B+ |
| **AB-**| O-, A-, B-, AB- |
| **AB+**| O-, O+, A-, A+, B-, B+, AB-, AB+ (Universal Recipient) |

---

## 💬 5. Chat & Routing Coordination

When a match is approved:
1. **Private Chat**: Standard WebSockets establish a connection using a room identifier `chat_[requestId]`. Users send messages instantly without exposing their private phone numbers on the public web feed.
2. **Transit Routing**: Renders map pins showing the donor's location, the transit blood bank (if holding compatible stocks), and the final recipient hospital to coordinate the transport path.
3. **Official PDF Match Slip**: A clean, digital document generated dynamically without QR codes or clutter. Features verification tick checklist marks and security authorization badges to ensure official hospital recognition.

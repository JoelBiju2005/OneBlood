# OneBlood — Complete System Architecture, Codebase & Algorithmic Blueprint

This comprehensive report details the technical implementation, algorithmic logic, execution sequences, and hosting infrastructure of the **OneBlood** real-time emergency blood coordination platform.

---

## 1. 🏢 Deployment & Decoupled Cross-Platform Architecture

The **OneBlood** platform is built on a decoupled, client-server model designed for high availability, low latency, and security.

```mermaid
sequenceDiagram
    participant User as Client Web Browser
    participant FB as Firebase Hosting (Frontend)
    participant Render as Render Cloud (Backend REST & WebSockets)
    participant Mongo as Atlas MongoDB (Database)
    
    User->>FB: Request static page assets
    FB-->>User: Serve React/Vite SPA bundle (HTML, CSS, JS)
    Note over User: App mounts, initialises Zustand & Leaflet Map
    
    User->>Render: REST API: POST /api/auth/login (Credential verification)
    Render->>Mongo: Query user account
    Mongo-->>Render: Return User details
    Render-->>User: Access Token (JSON body) & Refresh Token (localStorage/cookie)
    
    User->>Render: WebSocket connection: io("wss://oneblood-nvg1.onrender.com")
    Render-->>User: Socket Connection established (Real-time communications active)
```

### 🖥️ Frontend Hosting: Firebase Hosting
- **Platform**: Hosted via Google Firebase Hosting.
- **Characteristics**: Fast content delivery network (CDN), SSL configuration out of the box, and cache management rules defined in [firebase.json](file:///c:/Users/JOEL%20BIJU/Documents/OneBlood/firebase.json).
- **Client-Side Routing**: SPA architecture redirects all traffic to `index.html` to let `react-router-dom` control URL states.

### ⚙️ Backend Hosting: Render
- **Platform**: Hosted as a Web Service on Render (`https://oneblood-nvg1.onrender.com`).
- **Characteristics**: Connected to the `master` git branch for automatic rebuilds. Runs node entrypoint `backend/src/server.js` with auto-scaling options.
- **WebSocket Gateway**: Exposes port `10000` to support persistent TCP sockets.

### 🔒 Secure Cross-Platform Interoperability (CORS & Tokens)
Since the frontend and backend are hosted on separate domains, secure cross-origin communication is managed through several mechanisms:
1. **Cross-Origin Resource Sharing (CORS)**:
   The backend Express app (`backend/src/app.js`) configures CORS using strict whitelisting:
   ```javascript
   const allowedOrigins = [
     'https://oneblood-nvg1.web.app',
     'https://oneblood-nvg1.firebaseapp.com',
     'http://localhost:5173'
   ];
   app.use(cors({
     origin: (origin, callback) => {
       if (!origin || allowedOrigins.includes(origin)) {
         callback(null, true);
       } else {
         callback(new Error('Blocked by CORS policy'));
       }
     },
     credentials: true
   }));
   ```
2. **Access Token & Refresh Token Flow**:
   - **Access Token**: Short-lived JWT access tokens are saved solely in-memory within React state via [authStore.js](file:///c:/Users/JOEL%20BIJU/Documents/OneBlood/frontend/src/store/authStore.js).
   - **Refresh Token**: A long-lived token is stored securely. Axios interceptors configured in [api.js](file:///c:/Users/JOEL%20BIJU/Documents/OneBlood/frontend/src/utils/api.js) automatically request a fresh access token from the backend `/api/auth/refresh` endpoint if a request returns `401 Unauthorized`.
3. **WebSocket Handshake Auth**:
   Sockets are initialized with authorization headers passing the token directly. The backend validates this token before joining the client to any socket channels.

---

## 2. 📂 Project Folder Directory Structure Walkthrough

Below is a detailed guide to every core folder in the monorepo workspace:

### 🖥️ Frontend Structure (`/frontend`)
- **`src/main.jsx`**: Bootstraps the React client application and binds it to the root DOM node.
- **`src/App.jsx`**: Mounts client-side routing structures (defining paths for Seekers, Donors, Banks, Map search, Chat, Admin dashboard).
- **`src/pages/`**:
  - `LandingPage.jsx`: Dynamic visual landing with Framer Motion scroll indicators and calls to action.
  - `LoginPage.jsx` / `SignupPage.jsx` / `OTPVerifyPage.jsx`: Renders authentication portals and inputs.
  - `DonorHomePage.jsx` & `SeekerHomePage.jsx`: Displays active requests, donor eligibility warnings (such as the 56-day donation lock), matching statistics, and navigation tools.
  - `SearchPage.jsx`: Provides the Leaflet coordinate-based seeker map tool to search nearby resources.
  - `NewRequestPage.jsx`: The blood request requisition form with AI file upload.
  - `ActiveDonationsPage.jsx`: Keeps track of donor and seeker active matches, current stages, and PDF download keys.
- **`src/store/`**:
  - `authStore.js`: Global Zustand state managing current login profile details, token storage, and active role-toggles.
  - `notificationStore.jsx`: React Context hooks subscribing to real-time notification feeds.
- **`src/utils/api.js`**: Preconfigured HTTP client utilizing interceptors for session refreshing.

### ⚙️ Backend Structure (`/backend`)
- **`src/server.js`**: Starts the HTTP listener, configures port routing, and binds the socket.io listener.
- **`src/app.js`**: Sets up HTTP middlewares (such as security headers and body limiters).
- **`src/config/`**:
  - `db.js`: Mongoose connector managing MongoDB connection pools.
  - `firebase.js`: Firebase Admin application initialiser.
  - `redis.js`: Caching connector falling back to standard RAM memory variables if Redis server is offline.
- **`src/models/`**: Defins schemas for `User.js`, `Donor.js`, `BloodBank.js`, `BloodRequest.js`, `DonationMatch.js`, `Message.js`, and `NoticeBoard.js`.
- **`src/controllers/`**:
  - `authController.js`: Registration, login, session validation, and JWT token rotation.
  - `matchController.js`: Handlers managing donor acceptances, transit detours, state transitions, and PDF downloads.
  - `hospitalController.js`: Direct hospital API handlers.
- **`src/services/`**:
  - `pdfService.js`: Renders professional match slips using `pdfkit`.
  - `aiVerification.js`: Extracts clinical requisition metadata from document uploads.
  - `escalationService.js`: Escalation triggers alert distributions dynamically.
  - `socketService.js`: Controls socket channel logic.

---

## 3. 🧠 Core Algorithms & Technical Logic

The platform relies on several key algorithms to verify credentials, locate nearby matching resources, and generate secure match verification documentation.

### 📍 1. Geospatial Proximity Matcher (MongoDB 2dsphere Indexing)
To identify nearby donors, donor locations are indexed in MongoDB using a GeoJSON `2dsphere` coordinate index. This allows the backend to perform native spherical queries to find donors within a specified radius.

**MongoDB Schema Configuration**:
```javascript
// Location field defined inside Donor.js
location: {
  type: { type: String, default: 'Point' },
  coordinates: { type: [Number], required: true } // [longitude, latitude]
}
donorSchema.index({ location: '2dsphere' });
```

**Geospatial Query API**:
```javascript
// Extract longitude and latitude of seeker
const { lng, lat, radiusInKms } = req.query;

const nearbyDonors = await Donor.find({
  location: {
    $nearSphere: {
      $geometry: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)]
      },
      $maxDistance: parseFloat(radiusInKms) * 1000 // Convert KMs to Meters
    }
  },
  status: 'available'
}).populate('userId');
```

---

### 🩸 2. Blood Group Compatibility Matrix
When blood requests are published or matched, compatibility rules dictate matching options. This matrix is implemented as a programmatic dictionary matching recipient groups to compatible donor groups.

```javascript
/**
 * Resolves compatible donor groups for a given recipient group.
 * Follows clinical rules for whole-blood and red-cell compatibility.
 */
const getCompatibleDonorGroups = (recipientGroup) => {
  const compatibilityMap = {
    'O-':  ['O-'],
    'O+':  ['O-', 'O+'],
    'A-':  ['O-', 'A-'],
    'A+':  ['O-', 'O+', 'A-', 'A+'],
    'B-':  ['O-', 'B-'],
    'B+':  ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] // Universal Recipient
  };
  return compatibilityMap[recipientGroup] || [];
};
```

---

### 📄 3. Dual AI-OCR Verification Pipeline
When a seeker uploads a doctor's letter, the platform passes it to a dual-engine verification pipeline:
1. **Primary (Anthropic Claude 3.5 Sonnet Vision)**: Sends the document image to Claude to parse the doctor's handwriting/letterhead, confirm its validity, extract patient name, required units, blood group, and set an urgency level.
2. **Secondary (Local Tesseract.js / pdf-parse fallback)**: If the API fails or limits are reached, a local fallback performs OCR on the document, running regex string matching for blood groups and medical validation terms.

```javascript
// Extracts key blood groups using regex
const detectBloodGroup = (text) => {
  const match = text.match(/\b(A|B|AB|O)[\s]?[+-](?:\b|Group)/gi);
  return match ? match[0].toUpperCase().replace(/\s+/g, '') : null;
};
```

---

### 🚨 4. Dynamic Escalation Alert Engine
If a critical request is published on the Notice Board but receives no donor responses within a specified time limit, the **Escalation Engine** triggers escalation workflows:
- **First 30 minutes**: Sends push alerts to matching local donors in a 5KM radius.
- **After 1 hour**: Broadcasts alert emails and expands the search radius to 15KM.
- **After 2 hours**: Generates detour bank proposals suggesting redirecting the donor to a transit blood bank holding compatible stock.

---

### 📄 5. Custom PDF Slip Rendering Logic
The PDF generation service utilizes standard vector graphics and coordinates in `pdfkit` to compile data fields into a professional card layout, without the use of pixelated image placeholders or external HTML converters.

```javascript
// Draws a custom vector checkmark in PDFKit
const drawCheckmark = (doc, x, y) => {
  doc.save();
  doc.strokeColor('#10B981').lineWidth(1.8);
  doc.moveTo(x, y + 5)
     .lineTo(x + 3, y + 8)
     .lineTo(x + 8, y + 2)
     .stroke();
  doc.restore();
};
```

---

## 4. 🔄 End-to-End Operational Sequences

The entire matching workflow involves dynamic HTTP API endpoints, database state changes, and live WebSocket broadcasts.

### Sequence: Emergency Request Creation to Full Verification

```mermaid
sequenceDiagram
    autonumber
    actor Seeker as Seeker Client
    participant API as Express API
    participant AI as AI OCR Service
    participant DB as MongoDB / Mongoose
    participant WS as WebSocket Rooms
    actor Donors as Match Donors

    Seeker->>API: POST /api/requests (FormData with medical slip)
    API->>AI: Run OCR / Vision scan on document
    AI-->>API: Return parsed fields (Patient Name, Blood Group, Units, Urgency)
    API->>DB: Save BloodRequest (status: pending, isVerified: true)
    
    API->>WS: Emit broadcast to compatible local donors
    WS-->>Donors: Receive Socket Notification: "Urgent Blood Required!"
    
    Donors->>API: POST /api/matches/accept (match ID)
    API->>DB: Update DonationMatch status: active
    API-->>Seeker: Notify Seeker: "Donor found!"
    API-->>Donors: Redirect Donor to transit routing map page
```

---

## 5. 🗄️ Database Schemas Catalog (MongoDB / Mongoose)

Below are the structured data models implemented on the platform:

### 👤 1. `User` Schema
Tracks identities, core settings, and session refresh tokens.
```javascript
const userSchema = new mongoose.Schema({
  onebloodId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'patient', 'blood_bank', 'admin'], default: 'patient' },
  city: { type: String, required: true },
  refreshToken: { type: String },
  isEmailVerified: { type: Boolean, default: false }
}, { timestamps: true });
```

### 🩸 2. `Donor` Schema
Stores donor-specific medical information and geolocation coordinates.
```javascript
const donorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: { type: String, required: true },
  status: { type: String, enum: ['available', 'unavailable', 'suspended'], default: 'available' },
  lastDonationDate: { type: Date },
  city: { type: String, required: true },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  }
});
donorSchema.index({ location: '2dsphere' });
```

### 🏥 3. `BloodBank` Schema
Manages inventory states and hospital bank validations.
```javascript
const bloodBankSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  inventory: [{
    bloodGroup: { type: String, required: true },
    units: { type: Number, default: 0 }
  }],
  address: { type: String, required: true },
  city: { type: String, required: true },
  verified: { type: Boolean, default: false }
});
```

### 📝 4. `BloodRequest` Schema
Manages requisitions, verify flags, status stages, and candidate match lists.
```javascript
const bloodRequestSchema = new mongoose.Schema({
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  unitsRequired: { type: Number, default: 1 },
  hospitalName: { type: String, required: true },
  address: { type: String },
  reason: { type: String },
  doctorName: { type: String },
  urgency: { type: String, enum: ['critical', 'urgent', 'moderate', 'planned'], default: 'moderate' },
  documentUrl: { type: String },
  isVerified: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'active', 'fulfilled', 'cancelled'], default: 'pending' }
}, { timestamps: true });
```

---

## 6. 🏁 Summary of Platform Readiness

With the codebase cleaned of development testing scripts, unnecessary upload structures, and previous system cache directories, **OneBlood** is ready for production deployment:

1. **Frontend**: The React application builds into a optimized distribution bundle (`frontend/dist/`), hosted securely under global CDNs on Firebase Hosting.
2. **Backend**: Express APIs and WebSocket coordinators run as robust daemons on Render, connected to an Atlas MongoDB cluster and fallback memory managers.
3. **Algorithms**: Geospatial lookups, blood compatibility evaluations, and AI document scanning are fully optimized and operational.
4. **PDF Generator**: Match verification documents generate professional, print-ready coordination slips for hospitals, blood banks, and donors.

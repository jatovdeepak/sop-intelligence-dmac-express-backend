# DMAC: Data Management & Access Control Layer

DMAC is the secure gatekeeper mechanism that governs how Standard Operating Procedure (SOP) data is accessed, shared, and controlled between **SOP Intelligence** (the creators) and **STEM** (the consumers). 

Concretely, this Express.js backend enforces:
- **Who** can access SOPs (JWT Authentication)
- **What** SOPs can be accessed (Role-Based Access Control - RBAC)
- **When** access is allowed (State/Condition validation, e.g., Active vs Draft)
- **How** they are accessed (REST API & PDF File Serving)
- **Audit & Compliance** (Automated MongoDB logging of all access attempts)

---

## 🚀 Tech Stack
- **Node.js & Express.js** – Core API framework
- **MongoDB & Mongoose** – Database and ODM
- **JSON Web Tokens (JWT)** – Stateless authentication
- **Multer** – Multipart/form-data handling for PDF uploads
- **Swagger UI** – Interactive API documentation

---

## 🛠️ Installation & Setup

### 1. Prerequisites
Ensure the following are installed and running:
- Node.js
- MongoDB

---

### 2. Install Dependencies
```bash
npm install
```

---

### 3. Environment Variables
Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/dmac
JWT_SECRET=super_secret_dmac_key_2026
```

---

### 4. Seed the Database (Optional but Recommended)
Populate the database with test users (Creators, Managers, Operators) and sample SOPs:

```bash
node seed.js
```

---

### 5. Start the Server
```bash
node server.js
```

- API Base URL: http://localhost:3000
- Swagger Docs: http://localhost:3000/api-docs

---

## 📖 Deep Dive: Core API Workflow

All endpoints (except login) require a valid JWT token passed in the Authorization header:

```
Authorization: Bearer <YOUR_TOKEN>
```

---

## 🔐 Step 1: Authentication (Login)

**Endpoint**
```
POST /api/auth/login
```

**Request Body**
```json
{
  "username": "sop_creator_1",
  "password": "password123"
}
```

**Response**
Returns a JWT token, system, and role.

---

## 📤 Step 2: Uploading an SOP (With PDF)

**Access Required**
- SOP Intelligence: Creator
- Admin

**Endpoint**
```
POST /api/sops
```

**Headers**
```
Authorization: Bearer <YOUR_TOKEN>
Content-Type: multipart/form-data
```

**Form Fields**
- title (Text): e.g. "Q3 Security Audit"
- content (Text): JSON string
- status (Text): Active | Draft | Archived
- requiredRoles (Text): Manager, Operator, etc
- pdf (File): PDF document

**Response**
Returns the newly created SOP document including `_id` and `pdfPath`.

---

## 📥 Step 3: Retrieving SOPs

### A. Get All Accessible SOPs
```
GET /api/sops
```

**Logic**
- STEM users only see Active SOPs
- SOP must include user's role in `requiredRoles`
- Draft SOPs are hidden from STEM

---

### B. Get a Specific SOP
```
GET /api/sops/:id
```

Returns `403 Forbidden` if unauthorized.

---

## 📄 Step 4: Downloading the SOP PDF
```
GET /api/sops/:id/pdf
```

DMAC performs final gatekeeper validation before streaming the PDF.

---

## 🛡️ Roles & Permissions Matrix

| System | Role | Can Create | Read Draft | Read Active |
|------|------|------------|-----------|-------------|
| SOP Intelligence | Creator | Yes | Yes | Yes |
| STEM | Manager | No | No | Yes (if role matches) |
| STEM | Operator | No | No | Yes (if role matches) |
| Admin | Admin | Yes | Yes | Yes |

---

## 📋 Audit Logging

Every interaction with `/api/sops` endpoints—successful or denied—is logged to the `auditlogs` MongoDB collection, including:
- User identity
- SOP ID
- Action
- Timestamp

This ensures full compliance, traceability, and accountability.

---

## ✅ Summary

DMAC provides a hardened backend enforcement layer ensuring SOP data is:
- Secure
- Role-aware
- State-aware
- Fully auditable

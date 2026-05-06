# QuickChat

Full-stack chat web app: **direct messages**, **groups**, **text / media / voice notes**, **reactions**, **pins**, **mute**, **starred messages**, **read receipts**, and **WebRTC audio/video calls**. Built with **React (Vite)**, **Express**, **MongoDB**, **Socket.IO**, and **Cloudinary** for uploads.

## Features (high level)

| Area | Details |
|------|--------|
| Real-time | Socket.IO for messages, typing, call signaling, presence |
| Groups | Create groups, add members (admins), leave, group pins |
| Calls | 1:1 voice/video only when **both users show online** (see below) |
| Media | Images, files, voice notes via Cloudinary |
| UX | Pinned chats/groups, mute (incl. desktop notifications), star messages, edit text (15 min), copy |

## Prerequisites

- **Node.js** 18+  
- **MongoDB** (local or Atlas URI)  
- **Cloudinary** account (cloud name, API key, API secret) for file uploads  

## Quick start

### 1. Clone and install

```bash
cd chat-app
cd server && npm install
cd ../client && npm install
```

### 2. Server environment

Create `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/quickchat
JWT_SECRET=your-long-random-string

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Optional: production CORS (comma-separated origins). Omit for permissive local dev.
# CORS_ORIGINS=https://your-frontend.com,https://www.your-frontend.com
```

### 3. Client environment (optional)

For **local dev**, the Vite dev server proxies `/api` and `/socket.io` to the backend (default `http://127.0.0.1:5000`), so you often need **no** client `.env`.

If the **phone or another PC** opens the Vite **network** URL (not `localhost`), set **`client/.env`** so the browser can reach the API:

```env
VITE_BACKEND_URL=http://YOUR_PC_LAN_IP:5000
```

Restart the client after changing this.

### 4. Run

**Terminal A — API + WebSocket**

```bash
cd server
npm run dev
```

**Terminal B — Frontend**

```bash
cd client
npm run dev
```

Open the URL Vite prints (e.g. `http://localhost:5173`). **Each browser tab keeps its own login** — open **two tabs** (or a tab + Incognito) and sign in as two different users to chat and call.

Closing a tab ends that tab’s session; open the app again to sign back in.

---

## Voice & video calls — “offline / not connected”

Calls only work when **Socket.IO sees both users connected**.

1. **Both people** must have QuickChat **open in a browser tab**, **logged in**, with the server running.  
2. In the sidebar, the contact should show the **green online** indicator before you call.  
3. If you see an error about being offline or not connected, the other side needs to **refresh the page**, check **Wi‑Fi/VPN**, and ensure **`npm run dev` is running** for both server and client.  
4. **Groups**: calls are **1:1 only** (not group conference).  

For strict NAT networks you may need a **TURN** server (configure in `client` WebRTC / env as you extend the app).

---

## Security notes (production)

- Set a strong **`JWT_SECRET`** and **`CORS_ORIGINS`**.  
- Login/signup are **rate-limited** on the server.  
- **`helmet`** is enabled on the Express app.  
- Message text length is capped server-side; prefer **HTTPS** in production.

---

## Project layout

```
chat-app/
├── client/          # React + Vite SPA
├── server/          # Express API + Socket.IO
└── README.md        # This file
```

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `server/` | `npm run dev` | API + sockets (nodemon) |
| `client/` | `npm run dev` | Vite dev server with proxy |
| `client/` | `npm run build` | Production frontend build |

---

## License

ISC (per `server/package.json`). Adjust for your product as needed.

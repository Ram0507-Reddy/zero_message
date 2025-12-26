# ZERO System - Vercel Hybrid Deployment

You have deployed the Frontend to Vercel. **However, Vercel cannot host the Go Backend** because our security architecture requires persistent memory (RAM) for keys, which Vercel Serverless does not provide.

You must use a **Hybrid Architecture**:

1.  **Frontend:** Hosted on **Vercel** (`zero-s.tech/notes`).
2.  **Backend:** Hosted on a **VPS** or Container Cloud (Railway, Fly.io, DigitalOcean).

---

## Part 1: Configure Vercel (Frontend)

In your Vercel Project Settings:

1.  **Root Directory:** Set to `frontend`.
2.  **Build Command:** `npm run build` (Default is fine).
3.  **Output Directory:** `.next` (Default is fine).
4.  **Environment Variables:**
    *   You **MUST** add this variable so the Frontend can find the Backend.
    *   `NEXT_PUBLIC_API_URL` = `https://api.zero-s.tech/api` (Replace with your actual Backend URL).

*Note: Since you want it at `zero-s.tech/notes`, ensure your Vercel project is connected to `zero-s.tech` and the `next.config.ts` has `basePath: '/notes'` (which we already added).*

---

## Part 2: Deploy Backend (The Security Core)

You need a server to run the Docker container for the backend.

### Option A: Using a VPS (DigitalOcean, AWS, Hetzner)
*Recommended for maximum security control.*

1.  **Upload** the `zero_message` folder to your VPS.
2.  **Run Docker:**
    ```bash
    cd zero_message
    docker-compose up --build -d backend
    ```
    *(This starts ONLY the backend on port 8080).*
3.  **Expose Domain:**
    *   Point a subdomain (e.g., `api.zero-s.tech`) to this server's IP.
    *   Use Nginx to proxy `api.zero-s.tech` -> `localhost:8080`.
    *   **Important:** Install SSL (Certbot) for this subdomain, or the Vercel Frontend (HTTPS) will refuse to talk to it.

### Option B: Cloud Containers (Railway / Fly.io)
*Easier setup, slightly less control.*

1.  **Railway:** Connect your GitHub repo.
2.  **Settings:** Set Root Directory to `backend`.
3.  **Deploy:** It will auto-detect the Dockerfile and launch.
4.  **URL:** structure will be like `zero-backend.up.railway.app`. Use this URL in your Vercel Env Var.

---

## Part 3: Connect Them

1.  Get your **Backend URL** (e.g., `https://api.zero-s.tech` or `https://xyz.railway.app`).
2.  Go to **Vercel Dashboard** -> Project -> Settings -> Environment Variables.
3.  Add `NEXT_PUBLIC_API_URL` = `https://YOUR_BACKEND_URL/api`.
4.  **Redeploy** the Vercel project.

## Summary Checklist
- [ ] Backend running on Server/Cloud.
- [ ] Backend has HTTPS (SSL).
- [ ] Vercel Env Var `NEXT_PUBLIC_API_URL` is set.
- [ ] Vercel Redeployed.

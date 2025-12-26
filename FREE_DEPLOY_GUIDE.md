# The "Free Forever" Deployment Guide (Step-by-Step)

This guide uses **Vercel** (Frontend) and **Render** (Backend). Both have free tiers.

> **⚠️ CRITICAL WARNING FOR FREE TIER:**
> Free servers "go to sleep" if no one visits them for 15 minutes.
> **When they sleep, the ZERO Backend will restart and WIPE all active keys/messages.**
> This is actually good for security (Automatic Burn), but be aware of it.

---

## Step 1: Put Code on GitHub
*(If you already did this to get on Vercel, skip to Step 2)*
1.  Go to [GitHub.com](https://github.com) and create a **New Repository** (e.g., `zero-app`).
2.  Upload your files (or push them using Git Desktop/Terminal) so your entire `zero_message` folder is in the repo.

---

## Step 2: Deploy Backend (Render.com)
We need a place to run the Go server.

1.  Go to [dashboard.render.com](https://dashboard.render.com) and Sign Up/Login.
2.  Click **"New +"** and select **"Web Service"**.
3.  Select **"Build and deploy from a Git repository"**.
4.  Connect your GitHub account and select your `zero-app` repo.
5.  **Configure the Service:**
    *   **Name:** `zero-backend`
    *   **Region:** Choose one close to you.
    *   **Root Directory:** `backend` (Important! Type this exactly).
    *   **Runtime:** `Docker` (Render will auto-detect the Dockerfile).
    *   **Instance Type:** **Free** (Scroll down to find it).
6.  Click **"Create Web Service"**.
7.  **Wait:** It will take a few minutes to build.
8.  **Copy URL:** Once done, look at the top left. You will see a URL like `https://zero-backend-xyz.onrender.com`. **Copy this.**

---

## Step 3: Configure Frontend (Vercel)
Now tell your Website where the Backend is.

1.  Go to your **Vercel Dashboard**.
2.  Select your project (`zero-s-tech` or whatever you named it).
3.  Go to **Settings** -> **Environment Variables**.
4.  Add a new variable:
    *   **Key:** `NEXT_PUBLIC_API_URL`
    *   **Value:** `https://zero-backend-xyz.onrender.com/api`
    *   *(Paste the Render URL you copied, and add `/api` at the end)*.
5.  Click **Save**.

---

## Step 4: Redeploy Frontend
The settings won't apply until you restart.

1.  Go to the **Deployments** tab in Vercel.
2.  Click the **three dots (...)** next to the latest deployment.
3.  Select **"Redeploy"**.
4.  Click **Redeploy** again.

---

## Step 5: Test It
1.  Go to `https://zero-s.tech/notes`.
2.  **Wait 30 Seconds:** The first time you load it, the *Frontend* has to wake up the *Backend* on Render. It might fail the first time.
3.  Refresh the page.
4.  Try creating a Secure Note.

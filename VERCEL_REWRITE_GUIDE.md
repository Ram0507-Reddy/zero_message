# How to Serve `zero-notes` at `zero-s.tech/notes` (Vercel Rewrite)

You are using a customized setup called a **"Reverse Proxy Rewrite"**.

Here is the architecture:
1.  **Main Site (`zero`)**: Lives at `zero-s.tech`.
2.  **Notes App (`zero-notes`)**: Lives at `zero-notes.vercel.app`.
3.  **The Trick**: When a user visits `zero-s.tech/notes`, the Main Site secretly fetches the content from `zero-notes.vercel.app` and shows it.

---

## Phase 1: Deploy the Notes App (`zero-notes`)

1.  **Create Repo:** Create `zero-notes` on GitHub.
2.  **Push Code:**
    ```bash
    # Run in zero_message folder
    git remote add origin https://github.com/Ram0507-Reddy/zero-notes.git
    git branch -M main
    git push -u origin main
    ```
3.  **Deploy to Vercel:**
    *   Import `zero-notes` to Vercel.
    *   **Settings:** Remember to add `NEXT_PUBLIC_API_URL` (pointing to your Render/VPS backend).
    *   **Domain:** Vercel will give it a domain like `zero-notes-ram0507.vercel.app`. **Copy this URL.**

---

## Phase 2: Configure the Main Site (`zero`)

You need to edit the code of your **MAIN** website (the one at `Ram0507-Reddy/zero`).

**If your Main Site is Next.js:**
Open `next.config.js` (or `.ts`) in your **Main Site's code** and add this rewrite:

```javascript
module.exports = {
  async rewrites() {
    return [
      {
        source: '/notes',
        destination: 'https://zero-notes-ram0507.vercel.app/notes', // Your Notes App Vercel URL
      },
      {
        source: '/notes/:path*',
        destination: 'https://zero-notes-ram0507.vercel.app/notes/:path*',
      },
    ]
  },
}
```

**If your Main Site is generic (HTML/Other):**
Add a `vercel.json` to your **Main Site's root**:

```json
{
  "rewrites": [
    { "source": "/notes", "destination": "https://zero-notes-ram0507.vercel.app/notes" },
    { "source": "/notes/:match*", "destination": "https://zero-notes-ram0507.vercel.app/notes/:match*" }
  ]
}
```

---

## Phase 3: The Backend Link

Remember, our Notes App expects to run at `/notes`.
*   We already configured `basePath: '/notes'` in the Notes App.
*   The Main Site rewrites `/notes` -> `Notes App /notes`.
*   This matches perfectly!

**Final Check:**
1.  `zero-notes` deployed on Vercel.
2.  `zero` (Main) deployed with the Rewrite config.
3.  Visit `zero-s.tech/notes`.

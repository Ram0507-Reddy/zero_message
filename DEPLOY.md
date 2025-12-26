# ZERO System - Subdirectory Deployment Guide

To deploy ZERO at `https://zero-s.tech/notes`, follow these steps:

## 1. Build the Frontend
You must build the Next.js app with the new configuration.

```bash
cd frontend
npm run build
npm start
```

*Note: The app is now configured with `basePath: '/notes'` in `next.config.ts`.*

## 2. Configure Nginx
Add the following blocks to your Nginx configuration for `zero-s.tech`:

```nginx
server {
    server_name zero-s.tech;

    # ... existing config ...

    # 1. Frontend (Next.js)
    # Proxies /notes to the specific port Next.js is running on (e.g., 3000)
    location /notes {
        # Passthrough: Next.js handles the /notes prefix via basePath
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 2. Backend API (Go)
    # We expose the API under /notes/api so it falls under the same subdirectory
    # or you can use a separate /api path if you prefer.
    # The frontend is configured to look for NEXT_PUBLIC_API_URL.
    location /notes/api/ {
        # Rewrite /notes/api/foo -> /api/foo
        rewrite ^/notes/api/(.*) /api/$1 break;
        
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 3. Environment Variables
When running the frontend in production, start it with the API URL set to the public endpoint:

```bash
# In c:\Users\Shriram Reddy\.gemini\antigravity\scratch\zero_message\frontend
$env:NEXT_PUBLIC_API_URL="https://zero-s.tech/notes/api"
npm run start
```
(Or use a `.env.production` file)

## 4. Backend CORS
Ensure your Go backend allows requests from `https://zero-s.tech`.
*Currently, `api.go` allows `*` (All Origins), so it will work out of the box.*

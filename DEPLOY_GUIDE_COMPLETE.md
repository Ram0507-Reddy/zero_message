# ZERO System - Production Deployment Guide (Complete)

This guide assumes you are deploying to a Linux server (Ubuntu/Debian) governing `zero-s.tech`.

## Phase 1: Upload Code to Server

You need to get the `zero_message` folder from your local machine to your server.

**Option A: Using Git (Recommended)**
1.  Push your code to a private GitHub/GitLab repo.
2.  SSH into your server.
3.  `git clone <your-repo-url> zero_message`
4.  `cd zero_message`

**Option B: Using SCP (Direct Copy)**
Run this from your *Local Computer* terminal:
```bash
# Replace 'user' and 'your-server-ip' with actual values
scp -r "C:\Users\Shriram Reddy\.gemini\antigravity\scratch\zero_message" user@your-server-ip:~/zero_message
```

---

## Phase 2: Server Setup (One-Time)

SSH into your server and install the necessary tools.

**1. Install Docker & Docker Compose**
```bash
sudo apt update
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker
sudo usermod -aG docker $USER
# (You might need to log out and back in for group changes to take effect)
```

**2. Install Nginx (The Web Server)**
```bash
sudo apt install -y nginx
sudo systemctl enable --now nginx
```

---

## Phase 3: Run the Application

Navigate to the project folder on your server:
```bash
cd ~/zero_message
```

**Launch the System:**
```bash
# This builds the images and starts the containers in background mode
docker-compose up --build -d
```

**Verify:**
Check if containers are running:
```bash
docker ps
```
You should see `zero_message-frontend` (Port 3000) and `zero_message-backend` (Port 8080).

---

## Phase 4: Configure Nginx (The Gateway)

We need to tell Nginx to route `https://zero-s.tech/notes` to our running Docker app.

**1. Create/Edit Site Config**
```bash
sudo nano /etc/nginx/sites-available/zero-s.tech
```
(If you don't have a specific file, you might be using `/etc/nginx/sites-available/default`)

**2. Paste Configuration**
Add this inside your `server { ... }` block:

```nginx
server {
    server_name zero-s.tech;
    # ... your existing SSL/Certbot config ...

    # FRONTEND: Proxies /notes to Next.js container
    location /notes {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # BACKEND: Proxies /notes/api to Go container
    location /notes/api/ {
        # Strips /notes/api prefix before sending to Go
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

**3. Test & Reload**
```bash
sudo nginx -t
# If test is successful:
sudo systemctl reload nginx
```

---

## Phase 5: Success

Open **`https://zero-s.tech/notes`** in your browser.

*   You should see the ZERO interface.
*   The API calls will automatically route through `/notes/api/`.

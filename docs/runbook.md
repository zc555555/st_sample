# Runbook: ST Sample API (Docker Compose) — Cross-platform (Tested on Windows)

## 1. Purpose
This runbook documents how to run the **ST Sample API** and its **MongoDB** dependency using **Docker Compose**,
how to verify the system is working, and how to troubleshoot common issues.

It is written so that a third party (e.g., an auditor/marker) can reproduce the setup and confirm the system is running.

## 2. Tested Platforms
- **Tested on:** Windows (PowerShell) + Docker Desktop
- **Expected to work on (not fully validated):** macOS/Linux with Docker Desktop (macOS) or Docker Engine + Compose (Linux)

> Note: Because this project runs via Docker Compose, the core commands are the same across platforms. Differences are mainly in
> verification commands and port diagnostics.

## 3. System Overview
Docker Compose starts two services:

- **st-sample**: Node.js/Express API  
  - Host port **3000** → Container port **3000**
- **mongo**: MongoDB  
  - Host port **27017** → Container port **27017**

Both services run on an external Docker network called **mynetwork**.

## 4. Prerequisites
### 4.1 All platforms
- Docker installed and running
- A terminal (PowerShell / Terminal)
- This repository cloned locally (folder contains `docker-compose.yml`)

### 4.2 Platform notes
- **Windows/macOS:** Docker Desktop recommended
- **Linux:** Docker Engine + Docker Compose plugin recommended

## 5. Start the System
Open a terminal in the repository root (the directory containing `docker-compose.yml`).

### 5.1 Create the external Docker network (required once)
```sh
docker network create mynetwork
```
If the network already exists, Docker will report that and you can continue.

### 5.2 Build and start containers
```sh
docker compose up --build -d
```

### 5.3 Check container status
```sh
docker compose ps
```
Expected: both `st-sample` and `mongo` show **Up**.

### 5.4 View logs (optional)
```sh
docker compose logs -f st-sample
```
Expected: a line similar to:
- `Server started on port 3000.`

## 6. Verification (Health Check)
The API exposes a basic health endpoint at `GET /`.

### 6.1 Verification in a browser (all platforms)
Open:
- `http://localhost:3000/`

Expected response:
```json
{"message":"OK"}
```

### 6.2 Verification in a terminal
**Windows PowerShell (tested):**
```powershell
Invoke-RestMethod http://localhost:3000/
```

**macOS/Linux (typical):**
```sh
curl http://localhost:3000/
```

Expected output:
```json
{"message":"OK"}
```

## 7. Common Operations
### 7.1 Stop the system
```sh
docker compose down
```

### 7.2 Restart the system
```sh
docker compose up -d
```

### 7.3 Rebuild after code changes
```sh
docker compose up --build -d
```

### 7.4 View logs
```sh
docker compose logs st-sample
docker compose logs mongo
```

### 7.5 Open a shell inside the API container
```sh
docker compose exec st-sample sh
```

## 8. Running the Test Suite
Note: the provided Jest tests are designed to run against a running server.

### 8.1 Recommended: run tests inside the API container (all platforms)
```sh
docker compose exec st-sample npm test
```

### 8.2 Optional: run tests locally (requires local Node.js)
```sh
npm install
npm test
```
Ensure your environment variables (`.env`) match the runtime environment.

## 9. Troubleshooting
### 9.1 Docker Compose warning: “the attribute `version` is obsolete”
Docker Compose may print a warning like:
- `the attribute 'version' is obsolete, it will be ignored`

This is informational; the system should still run. Optionally, remove the `version: "3"` line from `docker-compose.yml` to silence it.

### 9.2 Error: external network not found
Symptom:
- `network mynetwork declared as external, but could not be found`

Fix:
```sh
docker network create mynetwork
docker compose up -d
```

### 9.3 Error: port already in use (3000 or 27017)
Symptom:
- `address already in use`

Fix options:
1) Stop the process using that port, OR
2) Change port mappings in `docker-compose.yml` (e.g., map `3001:3000`) and then verify via `http://localhost:3001/`.

**Find the process using port 3000:**
- Windows (PowerShell):
  ```powershell
  netstat -ano | findstr :3000
  ```
- macOS/Linux:
  ```sh
  lsof -i :3000
  ```

### 9.4 API container starts but cannot connect to MongoDB
Check:
```sh
docker compose ps
docker compose logs mongo
docker compose logs st-sample
```

If Mongo is not healthy, restart:
```sh
docker compose down
docker compose up -d
```

### 9.5 Reset database state (destructive)
WARNING: This deletes the Compose project volumes (Mongo data used by this project).

```sh
docker compose down -v
docker compose up --build -d
```

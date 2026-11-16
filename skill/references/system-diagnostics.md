# AxioDB System Diagnostics & Health Checks

When troubleshooting port conflicts, process conflicts, or service health across AxioDB surfaces, run the following diagnostic commands.

---

## 1. Port Availability Check

Verify if AxioDB default ports are available or already bound by another process:

* **HTTP REST API**: `27018`
* **TCP Remote Server (AxioDBCloud)**: `27019`
* **MCP Server (AI Agent HTTP)**: `27020`

```bash
# Check if ports 27018, 27019, or 27020 are in use
for PORT in 27018 27019 27020; do
  PID=$(lsof -ti :"$PORT" 2>/dev/null || ss -tulpn "sport = :$PORT" 2>/dev/null | grep -o "pid=[0-9]*" | cut -d= -f2 || true)
  if [ -n "$PID" ]; then
    echo "Port $PORT is IN USE by PID: $PID"
  else
    echo "Port $PORT is FREE"
  fi
done
```

---

## 2. Host Process Inspection

Check for active or stale AxioDB processes running on the host:

```bash
# Inspect running AxioDB host processes
pgrep -af "axiodb|AxioDB" 2>/dev/null || echo "No active AxioDB host processes running."
```

If a stale process holds a directory PID lock:
```bash
# Check for active PID lock in your database directory
cat ./data/AppDB/axiodb.pid.lock 2>/dev/null || echo "No lock file."
```

---

## 3. Docker Container Status

Inspect any running or stopped AxioDB Docker containers:

```bash
# List all AxioDB containers
docker ps -a --filter "ancestor=theankansaha/axiodb" --filter "name=axiodb" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"
```

View live container logs:
```bash
docker logs --tail 50 -f axiodb
```

---

## 4. HTTP Health Probe

Test if the HTTP REST server (port 27018) is responsive:

```bash
curl -s -m 2 http://localhost:27018/api/health
```

Expected healthy response:
```json
{"status":"healthy"}
```

---

## 5. TCP Connection Test

Verify connectivity to the TCP remote server (port 27019):

```bash
# Test TCP socket connection using nc (netcat)
nc -zv 127.0.0.1 27019
```

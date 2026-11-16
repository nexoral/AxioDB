# AxioDB System Diagnostics & Health Checks

<port_checks>
## 1. Port Availability Checks

Default surface ports:
* **HTTP REST API**: `27018`
* **TCP Remote Server**: `27019`
* **MCP Server**: `27020`

```bash
# Check if ports 27018, 27019, or 27020 are in use
for PORT in 27018 27019 27020; do
  if command -v lsof >/dev/null 2>&1; then
    PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
    [ -n "$PID" ] && echo "Port $PORT is IN USE by PID: $PID" || echo "Port $PORT is FREE"
  elif command -v ss >/dev/null 2>&1; then
    OUT=$(ss -tulpn "sport = :$PORT" 2>/dev/null | grep ":$PORT" || true)
    [ -n "$OUT" ] && echo "Port $PORT is IN USE" || echo "Port $PORT is FREE"
  else
    echo "Port $PORT status UNKNOWN (neither lsof nor ss available)"
  fi
done
```
</port_checks>

<process_inspection>
## 2. Host Process & Lock Inspection

```bash
# Inspect running AxioDB host processes
pgrep -af "axiodb|AxioDB" 2>/dev/null || echo "No active AxioDB host processes running."

# Check for active PID lock in your database directory
cat ./data/AppDB/axiodb.pid.lock 2>/dev/null || echo "No lock file."
```
</process_inspection>

<container_status>
## 3. Docker Container Status

```bash
# List all AxioDB containers
docker ps -a --filter "ancestor=theankansaha/axiodb" --filter "name=axiodb" --format "table {{.ID}}\t{{.Names}}\t{{.Status}}\t{{.Ports}}"

# View live container logs
docker logs --tail 50 -f axiodb
```
</container_status>

<health_probes>
## 4. HTTP Health Probe & TCP Reachability

```bash
# Probe HTTP REST server health (Port 27018)
curl -s -m 2 http://localhost:27018/api/health
# Expected output:
# {"statusCode":200,"message":"Server is healthy","data":{"status":"ok","timestamp":"...","uptimeSeconds":123}}

# Test TCP socket connection (Port 27019)
nc -zv 127.0.0.1 27019
```
</health_probes>

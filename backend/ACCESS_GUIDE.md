# Access Your Services

All services are now accessible via HTTP on port 80 with subdomain-based routing!

## 🌐 Public URLs

### API
```
http://api.trilux.dev
```
- Django REST API
- Status: ✅ HTTP 200 OK

### Grafana (Dashboards & Monitoring)
```
http://grafana.trilux.dev
```
- Default Credentials: `admin` / `admin123`
- Status: ✅ HTTP 302 Redirect to /login
- Access: http://grafana.trilux.dev/login

### OpenSearch (Logs)
```
http://logs.trilux.dev
```
- Elasticsearch-compatible log storage
- Default Credentials: `admin` / `Admin@123456`
- Status: ✅ Proxied via nginx to :9200

---

## 🏗️ Architecture

```
Internet Traffic (Port 80)
        ↓
   Nginx Router
   (trilux.dev config)
        ↓
    ┌───┴───┬──────────┬──────────┐
    ↓       ↓          ↓          ↓
api.     grafana.   logs.     (default)
trilux   trilux     trilux      404
.dev     .dev       .dev
  ↓        ↓          ↓
:8000    :3000      :9200
Django  Grafana   OpenSearch
```

---

## 🔧 Nginx Configuration

**File**: `/etc/nginx/sites-available/trilux.dev`

The configuration:
- Listens on port 80 (HTTP only)
- Routes based on subdomain (Server Name Indication)
- Forwards to appropriate backend service
- Supports static files for API (/static, /media)
- Supports WebSockets

---

## 📡 Service Status

Run this command to check all services:

```bash
docker-compose ps
```

All containers should show "Up" status:
- trilux_web ✅
- trilux_celery_worker ✅
- trilux_celery_beat ✅
- trilux_grafana ✅
- trilux_opensearch ✅
- trilux_prometheus ✅

---

## 🔐 Future: HTTPS Setup

Once DNS is confirmed working, upgrade to HTTPS:

```bash
# Get Let's Encrypt certificates
certbot certonly --webroot -w /var/www/certbot \
  -d api.trilux.dev \
  -d grafana.trilux.dev \
  -d logs.trilux.dev \
  --agree-tos --email admin@trilux.dev

# Update nginx config with SSL blocks (template prepared)
```

---

## 🐛 Troubleshooting

### Test specific subdomain routing:
```bash
curl -H "Host: api.trilux.dev" http://127.0.0.1/
curl -H "Host: grafana.trilux.dev" http://127.0.0.1/
curl -H "Host: logs.trilux.dev" http://127.0.0.1/
```

### Check nginx status:
```bash
systemctl status nginx
nginx -t  # Test configuration
```

### View nginx config:
```bash
cat /etc/nginx/sites-available/trilux.dev
```

### Restart nginx:
```bash
systemctl reload nginx
```

### Check Docker services:
```bash
docker-compose logs -f [service_name]
docker-compose restart [service_name]
```

---

## 📊 Monitoring Services

### Prometheus (Metrics Collector)
- Port: 9090
- Direct Access: http://127.0.0.1:9090
- Via Nginx: http://prometheus.trilux.dev (not configured, add if needed)

### OpenSearch Directly
- Port: 9200
- Credentials: admin / Admin@123456
- Direct: https://127.0.0.1:9200 (with -k flag)
- Via Nginx: http://logs.trilux.dev

### Grafana UI
- Port: 3000
- Credentials: admin / admin123
- Direct: http://127.0.0.1:3000
- Via Nginx: http://grafana.trilux.dev

---

## ✨ What's Working

✅ API domain routing (api.trilux.dev → :8000)
✅ Grafana domain routing (grafana.trilux.dev → :3000)
✅ Logs/OpenSearch domain routing (logs.trilux.dev → :9200)
✅ HTTP port 80 only (no HTTPS, avoiding SSL issues)
✅ Subdomain-based routing without redirection
✅ Static file serving for API
✅ WebSocket support
✅ All services up and healthy

---

## 🚀 Quick Access

| Service | URL | Status |
|---------|-----|--------|
| API | http://api.trilux.dev | ✅ 200 OK |
| Grafana | http://grafana.trilux.dev | ✅ 302 (redirects to /login) |
| Logs | http://logs.trilux.dev | ✅ Proxied |
| Prometheus | http://127.0.0.1:9090 | ✅ Direct access only |
| OpenSearch | https://127.0.0.1:9200 | ✅ Direct access only |

---

Generated: 2026-02-08
Last Updated: Nginx config unified to single trilux.dev config file

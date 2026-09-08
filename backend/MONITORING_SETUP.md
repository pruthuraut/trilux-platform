# Monitoring Stack Setup Summary

## Services Configured

### 1. **OpenSearch (Logs)**
   - **Container**: trilux_opensearch
   - **Port**: 9200 (internal), 9600 (node communication)
   - **Access**: https://127.0.0.1:9200 (internally)
   - **Credentials**: 
     - Username: `admin`
     - Password: `Admin@123456`
   - **Public Domain**: `logs.trilux.dev` (via nginx)

### 2. **Prometheus (Metrics)**
   - **Container**: trilux_prometheus
   - **Port**: 9090
   - **Access**: http://127.0.0.1:9090
   - **Config**: `/home/the_sanket_dev/server.obsedian/monitoring/prometheus.yml`
   - **Data Storage**: `/prometheus` (volume: prometheus_data)

### 3. **Grafana (Visualization)**
   - **Container**: trilux_grafana
   - **Port**: 3000
   - **Access**: http://127.0.0.1:3000
   - **Credentials**:
     - Username: `admin`
     - Password: `admin123`
   - **Public Domain**: `grafana.trilux.dev` (via nginx)
   - **Data Storage**: `/var/lib/grafana` (volume: grafana_data)

## Network Architecture

```
┌─────────────────────┐
│   Internet Clients  │
└──────────┬──────────┘
           │
    ┌──────▼──────┐
    │   Nginx     │
    │  (Reverse   │
    │   Proxy)    │
    └──┬────┬─────┘
       │    │
   ┌───▼─┐ ┌▼──────────┐
   │ API │ │ Monitoring│
   └─────┘ │  Domains  │
           └┬──────┬───┘
            │      │
    ┌───────▼─┐ ┌──▼──────────┐
    │ Grafana │ │OpenSearch   │
    │ :3000   │ │ :9200       │
    └─────────┘ └─────────────┘
       │
    ┌──▼──────────┐
    │ Prometheus  │
    │ :9090       │
    └─────────────┘
```

## Nginx Configuration

### API Domain
- **Domain**: `api.trilux.dev`
- **Port**: 443 (HTTPS)
- **Target**: Django on :8000
- **Config**: `/etc/nginx/sites-available/api.trilux.dev`

### Logs/OpenSearch Domain
- **Domain**: `logs.trilux.dev`
- **Port**: 443 (HTTPS)
- **Target**: OpenSearch on :9200
- **Config**: `/etc/nginx/sites-available/logs.trilux.dev`

### Grafana Domain
- **Domain**: `grafana.trilux.dev`
- **Port**: 443 (HTTPS)
- **Target**: Grafana on :3000
- **Config**: `/etc/nginx/sites-available/grafana.trilux.dev`

## SSL/HTTPS Configuration

### Certificates
- **Let's Encrypt**: Configured with auto-renewal via Certbot
- **Paths**: `/etc/letsencrypt/live/{domain}/`
- **Current Status**: Self-signed certificates (pending DNS configuration)

### Certificate Renewal
Once DNS is configured, renew certificates with:
```bash
certbot certonly --webroot -w /var/www/certbot \
  -d logs.trilux.dev -d grafana.trilux.dev \
  --non-interactive --agree-tos --email admin@trilux.dev --force-renewal
```

## Docker Volumes

| Volume | Purpose | Mount Path |
|--------|---------|-----------|
| `opensearch_data` | OpenSearch data storage | `/usr/share/opensearch/data` |
| `prometheus_data` | Prometheus time-series database | `/prometheus` |
| `grafana_data` | Grafana dashboards & config | `/var/lib/grafana` |
| `static_volume` | Django static files | `/app/staticfiles` |
| `media_volume` | Django media files | `/app/media` |
| `logs_volume` | Application logs | `/app/logs` |

## Environment Variables

Added to `.env`:
```bash
OPENSEARCH_ADMIN_PASSWORD=Admin@123456
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=admin123
```

## Grafana Datasources

Automatically configured via provisioning:
1. **Prometheus** - For metrics visualization
   - URL: `http://prometheus:9090`
2. **OpenSearch** - For log analysis
   - URL: `https://opensearch:9200`
   - Username: `admin`
   - Password: `Admin@123456`

## Prometheus Scrape Targets

- **Prometheus**: localhost:9090 (self-monitoring)
- **Django**: trilux_web:8000/metrics (if django-prometheus installed)
- **Celery**: trilux_celery_worker:9808 (if celery-exporter installed)
- **OpenSearch**: trilux_opensearch:9200 (cluster metrics)

## System Configuration

### vm.max_map_count
OpenSearch requires increased virtual memory:
```bash
sysctl -w vm.max_map_count=262144
```

To persist across reboots, add to `/etc/sysctl.conf`:
```
vm.max_map_count=262144
```

## Access Points

### Local Development
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090
- OpenSearch: https://localhost:9200 (with -k flag for self-signed cert)

### Production (via nginx)
- Grafana: https://grafana.trilux.dev
- Logs/OpenSearch: https://logs.trilux.dev
- API: https://api.trilux.dev

## Next Steps

1. **DNS Configuration**
   - Point `logs.trilux.dev` to `34.93.238.233`
   - Point `grafana.trilux.dev` to `34.93.238.233`

2. **Obtain Real SSL Certificates**
   ```bash
   certbot certonly --webroot -w /var/www/certbot \
     -d logs.trilux.dev -d grafana.trilux.dev \
     --agree-tos --email admin@trilux.dev
   ```

3. **Configure Prometheus Metrics**
   - Install `django-prometheus` for Django metrics
   - Install `celery-exporter` for Celery metrics
   - Configure OpenSearch exporter if needed

4. **Create Grafana Dashboards**
   - Import pre-built dashboards from grafana.com
   - Create custom dashboards for your specific metrics

5. **Setup Log Shipping**
   - Configure your Django application to ship logs to OpenSearch
   - Use Logstash/Filebeat for log processing

## Container Management

### Start all services
```bash
docker-compose up -d
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f [service_name]
```

### Restart a specific service
```bash
docker-compose restart [service_name]
```

## Security Notes

- ⚠️ Change default passwords in production
- ⚠️ Enable RBAC in OpenSearch for security
- ⚠️ Use strong Grafana admin password
- ⚠️ Restrict network access to monitoring services
- ⚠️ Enable authentication on Prometheus

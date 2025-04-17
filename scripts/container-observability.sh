#!/bin/bash
# Advanced Container Observability
# This script sets up and manages observability for containers

# Default values
OPERATION="monitor"
CONTAINER_NAME=""
METRICS_PORT=9090
TRACING_PORT=4318
LOG_LEVEL="info"
METRICS_ENGINE="prometheus"
TRACING_ENGINE="otel"
DASHBOARD_TYPE="grafana"
DASHBOARD_PORT=3000
MONITOR_INTERVAL=10
OUTPUT_FORMAT="text"
OUTPUT_FILE=""
ALERT_THRESHOLD=90
VERBOSE=false

# Function to display usage
show_usage() {
  echo "Advanced Container Observability"
  echo "Usage: $0 [options]"
  echo ""
  echo "Operations:"
  echo "  --monitor              Monitor container metrics and logs (default)"
  echo "  --setup                Set up observability infrastructure"
  echo "  --dashboard            Launch observability dashboard"
  echo "  --export               Export metrics and traces"
  echo "  --alert                Configure alerting"
  echo "  --analyze              Analyze container behavior"
  echo ""
  echo "Options:"
  echo "  --container <name>     Container name to monitor"
  echo "  --metrics-port <port>  Port for metrics server [default: 9090]"
  echo "  --tracing-port <port>  Port for tracing server [default: 4318]"
  echo "  --log-level <level>    Log level (debug, info, warn, error) [default: info]"
  echo "  --metrics <engine>     Metrics engine (prometheus, statsd) [default: prometheus]"
  echo "  --tracing <engine>     Tracing engine (otel, jaeger) [default: otel]"
  echo "  --dashboard <type>     Dashboard type (grafana, prometheus) [default: grafana]"
  echo "  --dashboard-port <port> Dashboard port [default: 3000]"
  echo "  --interval <seconds>   Monitoring interval in seconds [default: 10]"
  echo "  --output <format>      Output format (text, json) [default: text]"
  echo "  --output-file <file>   Write output to file instead of stdout"
  echo "  --alert-threshold <n>  Alert threshold percentage [default: 90]"
  echo "  --verbose              Enable verbose output"
  echo "  --help                 Show this help message"
  echo ""
  echo "Examples:"
  echo "  # Monitor a specific container"
  echo "  $0 --monitor --container my-app"
  echo ""
  echo "  # Set up observability infrastructure"
  echo "  $0 --setup --metrics prometheus --tracing otel --dashboard grafana"
  echo ""
  echo "  # Launch the dashboard"
  echo "  $0 --dashboard --dashboard-port 3000"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    --monitor)
      OPERATION="monitor"
      shift
      ;;
    --setup)
      OPERATION="setup"
      shift
      ;;
    --dashboard)
      OPERATION="dashboard"
      shift
      ;;
    --export)
      OPERATION="export"
      shift
      ;;
    --alert)
      OPERATION="alert"
      shift
      ;;
    --analyze)
      OPERATION="analyze"
      shift
      ;;
    --container)
      CONTAINER_NAME="$2"
      shift 2
      ;;
    --metrics-port)
      METRICS_PORT="$2"
      shift 2
      ;;
    --tracing-port)
      TRACING_PORT="$2"
      shift 2
      ;;
    --log-level)
      LOG_LEVEL="$2"
      shift 2
      ;;
    --metrics)
      METRICS_ENGINE="$2"
      shift 2
      ;;
    --tracing)
      TRACING_ENGINE="$2"
      shift 2
      ;;
    --dashboard)
      DASHBOARD_TYPE="$2"
      shift 2
      ;;
    --dashboard-port)
      DASHBOARD_PORT="$2"
      shift 2
      ;;
    --interval)
      MONITOR_INTERVAL="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FORMAT="$2"
      shift 2
      ;;
    --output-file)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --alert-threshold)
      ALERT_THRESHOLD="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --help)
      show_usage
      exit 0
      ;;
    *)
      echo "Error: Unknown option: $1"
      show_usage
      exit 1
      ;;
  esac
done

# Create required directories
OBSERVABILITY_DIR="./observability"
mkdir -p "$OBSERVABILITY_DIR/metrics"
mkdir -p "$OBSERVABILITY_DIR/traces"
mkdir -p "$OBSERVABILITY_DIR/logs"
mkdir -p "$OBSERVABILITY_DIR/dashboards"
mkdir -p "$OBSERVABILITY_DIR/alerts"

# Function to check Docker
check_docker() {
  if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
  fi
}

# Function to validate container name
validate_container() {
  local container="$1"
  
  if [[ -z "$container" ]]; then
    echo "Error: Container name is required"
    exit 1
  fi
  
  if ! docker ps --format '{{.Names}}' | grep -q "^$container$"; then
    echo "Error: Container not found: $container"
    exit 1
  fi
}

# Function to create Prometheus configuration
create_prometheus_config() {
  local config_file="$OBSERVABILITY_DIR/prometheus.yml"
  
  cat << EOF > "$config_file"
# Prometheus configuration for container monitoring
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:$METRICS_PORT']

  - job_name: 'containers'
    static_configs:
      - targets: ['localhost:9323']  # Docker metrics endpoint
    
  - job_name: 'node_exporter'
    static_configs:
      - targets: ['localhost:9100']  # Node exporter for host metrics
EOF
  
  echo "Prometheus configuration created: $config_file"
}

# Function to create OpenTelemetry configuration
create_otel_config() {
  local config_file="$OBSERVABILITY_DIR/otel-collector.yaml"
  
  cat << EOF > "$config_file"
# OpenTelemetry Collector configuration
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 10s
    send_batch_size: 1024

exporters:
  prometheus:
    endpoint: 0.0.0.0:$METRICS_PORT
    namespace: cosmic_app
  logging:
    loglevel: $LOG_LEVEL
  file:
    path: /var/tmp/otel-traces.json

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, logging]
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [logging, file]
EOF
  
  echo "OpenTelemetry configuration created: $config_file"
}

# Function to create Grafana dashboard
create_grafana_dashboard() {
  local dashboard_file="$OBSERVABILITY_DIR/dashboards/container-dashboard.json"
  
  cat << EOF > "$dashboard_file"
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": "-- Grafana --",
        "enable": true,
        "hide": true,
        "iconColor": "rgba(0, 211, 255, 1)",
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "gnetId": null,
  "graphTooltip": 0,
  "id": 1,
  "links": [],
  "panels": [
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 2,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.5.5",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "container_cpu_usage_seconds_total{name=\"$container\"}",
          "interval": "",
          "legendFormat": "CPU Usage",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Container CPU Usage",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    },
    {
      "aliasColors": {},
      "bars": false,
      "dashLength": 10,
      "dashes": false,
      "datasource": "Prometheus",
      "fieldConfig": {
        "defaults": {},
        "overrides": []
      },
      "fill": 1,
      "fillGradient": 0,
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 0
      },
      "hiddenSeries": false,
      "id": 3,
      "legend": {
        "avg": false,
        "current": false,
        "max": false,
        "min": false,
        "show": true,
        "total": false,
        "values": false
      },
      "lines": true,
      "linewidth": 1,
      "nullPointMode": "null",
      "options": {
        "alertThreshold": true
      },
      "percentage": false,
      "pluginVersion": "7.5.5",
      "pointradius": 2,
      "points": false,
      "renderer": "flot",
      "seriesOverrides": [],
      "spaceLength": 10,
      "stack": false,
      "steppedLine": false,
      "targets": [
        {
          "expr": "container_memory_usage_bytes{name=\"$container\"}",
          "interval": "",
          "legendFormat": "Memory Usage",
          "refId": "A"
        }
      ],
      "thresholds": [],
      "timeFrom": null,
      "timeRegions": [],
      "timeShift": null,
      "title": "Container Memory Usage",
      "tooltip": {
        "shared": true,
        "sort": 0,
        "value_type": "individual"
      },
      "type": "graph",
      "xaxis": {
        "buckets": null,
        "mode": "time",
        "name": null,
        "show": true,
        "values": []
      },
      "yaxes": [
        {
          "format": "bytes",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        },
        {
          "format": "short",
          "label": null,
          "logBase": 1,
          "max": null,
          "min": null,
          "show": true
        }
      ],
      "yaxis": {
        "align": false,
        "alignLevel": null
      }
    }
  ],
  "schemaVersion": 27,
  "style": "dark",
  "tags": [],
  "templating": {
    "list": [
      {
        "allValue": null,
        "current": {
          "selected": false,
          "text": "$container",
          "value": "$container"
        },
        "datasource": "Prometheus",
        "definition": "label_values(container_cpu_usage_seconds_total, name)",
        "description": null,
        "error": null,
        "hide": 0,
        "includeAll": false,
        "label": "Container",
        "multi": false,
        "name": "container",
        "options": [],
        "query": {
          "query": "label_values(container_cpu_usage_seconds_total, name)",
          "refId": "Prometheus-container-Variable-Query"
        },
        "refresh": 1,
        "regex": "",
        "skipUrlSync": false,
        "sort": 0,
        "tagValuesQuery": "",
        "tags": [],
        "tagsQuery": "",
        "type": "query",
        "useTags": false
      }
    ]
  },
  "time": {
    "from": "now-6h",
    "to": "now"
  },
  "timepicker": {},
  "timezone": "",
  "title": "Container Monitoring",
  "uid": "container-monitoring",
  "version": 1
}
EOF
  
  echo "Grafana dashboard created: $dashboard_file"
}

# Function to create docker-compose file for observability stack
create_docker_compose() {
  local compose_file="$OBSERVABILITY_DIR/docker-compose.yml"
  
  cat << EOF > "$compose_file"
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    restart: unless-stopped
    ports:
      - "$METRICS_PORT:9090"
    volumes:
      - $OBSERVABILITY_DIR/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--path.rootfs=/rootfs'
      - '--collector.filesystem.ignored-mount-points=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    restart: unless-stopped
    ports:
      - "9323:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - monitoring

  otel-collector:
    image: otel/opentelemetry-collector:latest
    container_name: otel-collector
    restart: unless-stopped
    ports:
      - "$TRACING_PORT:4318"  # OTLP HTTP receiver
      - "4317:4317"  # OTLP gRPC receiver
    volumes:
      - $OBSERVABILITY_DIR/otel-collector.yaml:/etc/otel-collector.yaml
      - $OBSERVABILITY_DIR/traces:/var/tmp
    command: ["--config=/etc/otel-collector.yaml"]
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    restart: unless-stopped
    ports:
      - "$DASHBOARD_PORT:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - $OBSERVABILITY_DIR/dashboards:/etc/grafana/provisioning/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin  # Change this in production
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - monitoring
    depends_on:
      - prometheus

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
EOF
  
  echo "Docker Compose configuration created: $compose_file"
}

# Function to create alert rules
create_alert_rules() {
  local rules_file="$OBSERVABILITY_DIR/alerts/alert_rules.yml"
  
  cat << EOF > "$rules_file"
groups:
  - name: container_alerts
    rules:
      - alert: ContainerHighCPU
        expr: container_cpu_usage_seconds_total{name="$CONTAINER_NAME"} / container_spec_cpu_quota{name="$CONTAINER_NAME"} * 100 > $ALERT_THRESHOLD
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected in container $CONTAINER_NAME"
          description: "Container $CONTAINER_NAME CPU usage is above $ALERT_THRESHOLD% for more than 1 minute."

      - alert: ContainerHighMemory
        expr: container_memory_usage_bytes{name="$CONTAINER_NAME"} / container_spec_memory_limit_bytes{name="$CONTAINER_NAME"} * 100 > $ALERT_THRESHOLD
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected in container $CONTAINER_NAME"
          description: "Container $CONTAINER_NAME memory usage is above $ALERT_THRESHOLD% for more than 1 minute."
      
      - alert: ContainerRestarting
        expr: changes(container_start_time_seconds{name="$CONTAINER_NAME"}[5m]) > 2
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "Container $CONTAINER_NAME is restarting frequently"
          description: "Container $CONTAINER_NAME has restarted more than 2 times in the last 5 minutes."
EOF
  
  echo "Alert rules created: $rules_file"
}

# Function to set up observability infrastructure
setup_observability() {
  if [[ "$VERBOSE" == true ]]; then
    echo "Setting up observability infrastructure"
    echo "Metrics engine: $METRICS_ENGINE"
    echo "Tracing engine: $TRACING_ENGINE"
    echo "Dashboard type: $DASHBOARD_TYPE"
  fi
  
  # Create configurations
  create_prometheus_config
  create_otel_config
  create_grafana_dashboard
  create_docker_compose
  create_alert_rules
  
  echo ""
  echo "Observability infrastructure setup complete"
  echo ""
  echo "To start the observability stack, run:"
  echo "cd $OBSERVABILITY_DIR && docker-compose up -d"
  echo ""
  echo "To access dashboards:"
  echo "- Prometheus: http://localhost:$METRICS_PORT"
  echo "- Grafana: http://localhost:$DASHBOARD_PORT (admin/admin)"
  echo ""
  echo "To send metrics to the observability stack:"
  echo "- For Prometheus metrics, expose them on your application and add the endpoint to $OBSERVABILITY_DIR/prometheus.yml"
  echo "- For OpenTelemetry traces, send them to http://localhost:$TRACING_PORT"
}

# Function to monitor container metrics and logs
monitor_container() {
  local container="$1"
  local interval="$2"
  
  # Validate container
  validate_container "$container"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Monitoring container: $container"
    echo "Interval: $interval seconds"
  fi
  
  echo "Starting container monitoring for $container"
  echo "Press Ctrl+C to stop monitoring"
  echo ""
  
  # Create output file
  local timestamp=$(date +%Y%m%d%H%M%S)
  local monitor_file="$OBSERVABILITY_DIR/metrics/$container-$timestamp.txt"
  
  # Monitoring loop
  while true; do
    # Get container stats
    local stats=$(docker stats --no-stream "$container")
    local cpu=$(echo "$stats" | tail -n 1 | awk '{print $3}')
    local memory=$(echo "$stats" | tail -n 1 | awk '{print $4}')
    local memory_percent=$(echo "$stats" | tail -n 1 | awk '{print $7}')
    local network_in=$(echo "$stats" | tail -n 1 | awk '{print $8}')
    local network_out=$(echo "$stats" | tail -n 1 | awk '{print $10}')
    local block_in=$(echo "$stats" | tail -n 1 | awk '{print $11}')
    local block_out=$(echo "$stats" | tail -n 1 | awk '{print $13}')
    local pids=$(echo "$stats" | tail -n 1 | awk '{print $14}')
    
    # Get container logs (last 5 lines)
    local logs=$(docker logs --tail 5 "$container" 2>&1)
    
    # Format the output
    local current_time=$(date "+%Y-%m-%d %H:%M:%S")
    local output=""
    
    if [[ "$OUTPUT_FORMAT" == "json" ]]; then
      output="{
  \"timestamp\": \"$current_time\",
  \"container\": \"$container\",
  \"metrics\": {
    \"cpu\": \"$cpu\",
    \"memory\": \"$memory\",
    \"memory_percent\": \"$memory_percent\",
    \"network_in\": \"$network_in\",
    \"network_out\": \"$network_out\",
    \"block_in\": \"$block_in\",
    \"block_out\": \"$block_out\",
    \"pids\": $pids
  },
  \"logs\": [
$(echo "$logs" | sed 's/^/    "/;s/$/",/' | sed '$ s/,$//')
  ]
}"
    else
      output="=== Container Metrics ($current_time) ===
Container: $container
CPU Usage: $cpu
Memory Usage: $memory ($memory_percent)
Network I/O: $network_in / $network_out
Block I/O: $block_in / $block_out
PIDs: $pids

=== Recent Logs ===
$logs

"
    fi
    
    # Output to file or stdout
    if [[ -n "$OUTPUT_FILE" ]]; then
      echo "$output" >> "$OUTPUT_FILE"
    else
      echo "$output"
      # Add a separator line for readability
      echo "========================================"
    fi
    
    # Save to monitoring file
    echo "$output" >> "$monitor_file"
    
    # Check for alerts
    cpu_number=$(echo "$cpu" | tr -d '%')
    mem_number=$(echo "$memory_percent" | tr -d '%')
    
    if [[ $(echo "$cpu_number > $ALERT_THRESHOLD" | bc -l) -eq 1 ]]; then
      echo "ALERT: High CPU usage detected: $cpu (threshold: $ALERT_THRESHOLD%)"
    fi
    
    if [[ $(echo "$mem_number > $ALERT_THRESHOLD" | bc -l) -eq 1 ]]; then
      echo "ALERT: High memory usage detected: $memory_percent (threshold: $ALERT_THRESHOLD%)"
    fi
    
    # Wait for next interval
    sleep "$interval"
  done
}

# Function to launch observability dashboard
launch_dashboard() {
  local dashboard_type="$1"
  local dashboard_port="$2"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Launching $dashboard_type dashboard on port $dashboard_port"
  fi
  
  echo "Checking if the observability stack is running..."
  
  # Check if the stack is running
  if ! docker ps | grep -q "$dashboard_type"; then
    echo "The observability stack is not running."
    echo "Starting the stack..."
    
    cd "$OBSERVABILITY_DIR" && docker-compose up -d
    
    if [[ $? -ne 0 ]]; then
      echo "Error: Failed to start the observability stack"
      echo "Try starting it manually: cd $OBSERVABILITY_DIR && docker-compose up -d"
      exit 1
    fi
    
    echo "Observability stack started successfully"
  else
    echo "Observability stack is already running"
  fi
  
  # Open the dashboard in a browser
  echo ""
  echo "The $dashboard_type dashboard is available at:"
  
  case "$dashboard_type" in
    grafana)
      echo "http://localhost:$dashboard_port"
      echo "Login with admin/admin"
      ;;
    prometheus)
      echo "http://localhost:$METRICS_PORT"
      ;;
    *)
      echo "http://localhost:$dashboard_port"
      ;;
  esac
  
  echo ""
  echo "To stop the observability stack, run:"
  echo "cd $OBSERVABILITY_DIR && docker-compose down"
}

# Function to export metrics and traces
export_data() {
  local container="$1"
  
  if [[ -z "$container" ]]; then
    echo "Error: Container name is required for export"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Exporting metrics and traces for container: $container"
  fi
  
  echo "Exporting observability data for container: $container"
  
  # Create export directory
  local export_dir="$OBSERVABILITY_DIR/exports"
  mkdir -p "$export_dir"
  
  local timestamp=$(date +%Y%m%d%H%M%S)
  local metrics_file="$export_dir/$container-metrics-$timestamp.json"
  local traces_file="$export_dir/$container-traces-$timestamp.json"
  local logs_file="$export_dir/$container-logs-$timestamp.txt"
  
  echo "Exporting metrics..."
  # In a real implementation, we would query Prometheus API
  # This is a simplified approach
  docker stats --no-stream "$container" | jq -R 'split("\\s+") | {container: .[1], cpu: .[2], memory: .[3], network: .[4]}' > "$metrics_file"
  
  echo "Exporting traces..."
  # In a real implementation, we would query the tracing backend
  # This is a placeholder
  echo '{"traces": []}' > "$traces_file"
  
  echo "Exporting logs..."
  docker logs "$container" > "$logs_file"
  
  echo ""
  echo "Export completed:"
  echo "- Metrics: $metrics_file"
  echo "- Traces: $traces_file"
  echo "- Logs: $logs_file"
}

# Function to configure alerting
configure_alerts() {
  local container="$1"
  local threshold="$2"
  
  if [[ -z "$container" ]]; then
    echo "Error: Container name is required for alerting"
    exit 1
  fi
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Configuring alerts for container: $container"
    echo "Alert threshold: $threshold%"
  fi
  
  echo "Configuring alerts for container: $container"
  
  # Create alert configuration
  local alert_config="$OBSERVABILITY_DIR/alerts/$container-alerts.yml"
  
  create_alert_rules
  
  echo ""
  echo "Alert configuration created: $alert_config"
  echo ""
  echo "To apply these alerts to Prometheus, add the following to your prometheus.yml:"
  echo ""
  echo "rule_files:"
  echo "  - '$alert_config'"
  echo ""
  echo "To receive notifications, configure an alertmanager in your prometheus.yml"
}

# Function to analyze container behavior
analyze_container() {
  local container="$1"
  
  # Validate container
  validate_container "$container"
  
  if [[ "$VERBOSE" == true ]]; then
    echo "Analyzing container behavior: $container"
  fi
  
  echo "Starting container behavior analysis for: $container"
  echo ""
  
  # Collect container information
  local inspect=$(docker inspect "$container")
  local image=$(docker inspect --format '{{.Config.Image}}' "$container")
  local running_since=$(docker inspect --format '{{.State.StartedAt}}' "$container")
  local status=$(docker inspect --format '{{.State.Status}}' "$container")
  local restart_count=$(docker inspect --format '{{.RestartCount}}' "$container")
  local network_mode=$(docker inspect --format '{{.HostConfig.NetworkMode}}' "$container")
  local ip_address=$(docker inspect --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container")
  local ports=$(docker inspect --format '{{range $p, $conf := .NetworkSettings.Ports}}{{$p}} {{end}}' "$container")
  local volumes=$(docker inspect --format '{{range .Mounts}}{{.Source}}:{{.Destination}} {{end}}' "$container")
  local env_vars=$(docker inspect --format '{{range .Config.Env}}{{.}} {{end}}' "$container")
  
  # Collect current stats
  local stats=$(docker stats --no-stream "$container")
  
  # Get process list
  local processes=$(docker top "$container" aux)
  
  # Format the output
  if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    output="{
  \"container\": \"$container\",
  \"analysis\": {
    \"image\": \"$image\",
    \"running_since\": \"$running_since\",
    \"status\": \"$status\",
    \"restart_count\": $restart_count,
    \"network\": {
      \"mode\": \"$network_mode\",
      \"ip_address\": \"$ip_address\",
      \"ports\": \"$ports\"
    },
    \"storage\": {
      \"volumes\": \"$volumes\"
    },
    \"stats\": \"$stats\",
    \"processes\": \"$processes\"
  },
  \"recommendations\": []
}"
  else
    output="=== Container Analysis ===
Container: $container
Image: $image
Running since: $running_since
Status: $status
Restart count: $restart_count

=== Network ===
Mode: $network_mode
IP Address: $ip_address
Ports: $ports

=== Storage ===
Volumes: $volumes

=== Current Stats ===
$stats

=== Processes ===
$processes

=== Recommendations ===
"
  fi
  
  # Add recommendations based on analysis
  local recommendations=""
  
  # Check restart count
  if [[ $restart_count -gt 5 ]]; then
    recommendations+="* Container has restarted $restart_count times. This may indicate instability. Check logs for errors.\n"
  fi
  
  # Check network mode
  if [[ "$network_mode" == "host" ]]; then
    recommendations+="* Container is using host network mode, which reduces isolation. Consider using bridge network with specific port mappings.\n"
  fi
  
  # Check for sensitive volume mounts
  if [[ "$volumes" == *"/var/run/docker.sock"* ]]; then
    recommendations+="* Container has access to Docker socket, which poses a security risk. Remove this mount if possible.\n"
  fi
  
  # Check for environment variables with potential secrets
  if [[ "$env_vars" =~ (PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL) ]]; then
    recommendations+="* Container environment may contain sensitive data. Consider using a secrets management solution.\n"
  fi
  
  # Add recommendations to output
  if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    # Use jq to modify the JSON (simplified approach)
    echo "$output" | sed "s/\"recommendations\": \[\]/\"recommendations\": [$(echo "$recommendations" | sed 's/\*/"/g;s/\n/","/g;s/,"$//')\]/"
  else
    echo -e "$output$recommendations"
  fi
  
  # Save analysis to file
  local timestamp=$(date +%Y%m%d%H%M%S)
  local analysis_file="$OBSERVABILITY_DIR/analysis-$container-$timestamp.txt"
  
  if [[ "$OUTPUT_FORMAT" == "json" ]]; then
    echo "$output" | sed "s/\"recommendations\": \[\]/\"recommendations\": [$(echo "$recommendations" | sed 's/\*/"/g;s/\n/","/g;s/,"$//')\]/" > "$analysis_file"
  else
    echo -e "$output$recommendations" > "$analysis_file"
  fi
  
  echo ""
  echo "Analysis saved to: $analysis_file"
}

# Main function
main() {
  # Check Docker
  check_docker
  
  # Execute the requested operation
  case "$OPERATION" in
    monitor)
      if [[ -z "$CONTAINER_NAME" ]]; then
        echo "Error: Container name is required for monitoring"
        show_usage
        exit 1
      fi
      monitor_container "$CONTAINER_NAME" "$MONITOR_INTERVAL"
      ;;
    setup)
      setup_observability
      ;;
    dashboard)
      launch_dashboard "$DASHBOARD_TYPE" "$DASHBOARD_PORT"
      ;;
    export)
      export_data "$CONTAINER_NAME"
      ;;
    alert)
      configure_alerts "$CONTAINER_NAME" "$ALERT_THRESHOLD"
      ;;
    analyze)
      analyze_container "$CONTAINER_NAME"
      ;;
    *)
      echo "Error: Unknown operation: $OPERATION"
      show_usage
      exit 1
      ;;
  esac
}

# Run the main function
main
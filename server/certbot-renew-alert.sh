#!/bin/bash
set -euo pipefail

# Triggered only when certbot.service fails (systemd OnFailure).
# Do not call from user crontab without sudo.

LOG_FILE="/var/log/certbot-renew.log"
ALERT_EMAIL="2724776621@qq.com"
SERVER_NAME="$(hostname -f 2>/dev/null || hostname)"
CERT_DOMAIN="stonybear.com"
CERT_PATH="/etc/letsencrypt/live/${CERT_DOMAIN}/fullchain.pem"
COOLDOWN_FILE="/var/run/certbot-renew-alert.last"
COOLDOWN_SECONDS=43200

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

mkdir -p "$(dirname "$LOG_FILE")"

if [ -f "$COOLDOWN_FILE" ]; then
  last_sent="$(cat "$COOLDOWN_FILE" 2>/dev/null || echo 0)"
  now="$(date +%s)"
  if [ "$((now - last_sent))" -lt "$COOLDOWN_SECONDS" ]; then
    log "告警冷却中，跳过重复邮件（距上次 $((now - last_sent)) 秒）"
    exit 0
  fi
fi

log "certbot 续期失败，开始收集诊断信息"

EXPIRE_DATE="未知"
DAYS_LEFT="未知"
if [ -f "$CERT_PATH" ]; then
  CERT_EXPIRE="$(openssl x509 -in "$CERT_PATH" -noout -enddate 2>/dev/null | cut -d= -f2 || true)"
  if [ -n "$CERT_EXPIRE" ]; then
    EXPIRE_DATE="$(date -d "$CERT_EXPIRE" '+%Y-%m-%d %H:%M:%S UTC')"
    DAYS_LEFT="$(( ($(date -d "$CERT_EXPIRE" +%s) - $(date +%s)) / 86400 ))"
  fi
fi
log "证书过期时间: ${EXPIRE_DATE} (剩余 ${DAYS_LEFT} 天)"

NGINX_STATUS="$(nginx -t 2>&1 || true)"
if echo "$NGINX_STATUS" | grep -q "syntax is ok"; then
  log "Nginx 配置检查: 正常"
else
  log "Nginx 配置检查: 失败"
  log "$NGINX_STATUS"
fi

LE_LOG_TAIL=""
if [ -f /var/log/letsencrypt/letsencrypt.log ]; then
  LE_LOG_TAIL="$(tail -40 /var/log/letsencrypt/letsencrypt.log)"
fi

if [ -n "$ALERT_EMAIL" ] && command -v mail >/dev/null 2>&1; then
  {
    echo "服务器: $SERVER_NAME"
    echo "域名: $CERT_DOMAIN"
    echo "时间: $(date)"
    echo
    echo "certbot 自动续期失败（由 systemd OnFailure 触发）。"
    echo "证书过期时间: $EXPIRE_DATE"
    echo "剩余天数: $DAYS_LEFT"
    echo
    echo "建议排查:"
    echo "  sudo certbot renew --dry-run"
    echo "  sudo journalctl -u certbot.service -n 50 --no-pager"
    echo "  sudo tail -100 /var/log/letsencrypt/letsencrypt.log"
    echo
    echo "--- Nginx 配置检查 ---"
    echo "$NGINX_STATUS"
    echo
    if [ -n "$LE_LOG_TAIL" ]; then
      echo "--- letsencrypt.log (最近 40 行) ---"
      echo "$LE_LOG_TAIL"
    fi
  } | mail -s "[紧急] ${SERVER_NAME} HTTPS 证书续期失败" "$ALERT_EMAIL"

  date +%s > "$COOLDOWN_FILE"
  log "已发送邮件告警到: $ALERT_EMAIL"
else
  log "未配置告警邮箱或 mail 命令不可用"
  exit 1
fi

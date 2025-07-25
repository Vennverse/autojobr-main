module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max_old_space_size=1024',
    restart_delay: 1000,
    max_restarts: 10,
    min_uptime: '10s',
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    ignore_watch: [
      "node_modules",
      "logs",
      ".git"
    ],
    watch: false,
    autorestart: true,
    cron_restart: '0 2 * * *' // Restart daily at 2 AM
  }]
}
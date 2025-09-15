module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: "max",
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
      // All sensitive environment variables should be loaded from .env file
      // or set as system environment variables, NOT hardcoded here
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
    watch: false
  }]
}

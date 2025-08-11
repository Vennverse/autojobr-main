module.exports = {
 apps: [{
   name: 'autojobr',
   script: './node_modules/.bin/tsx',
   args: 'server/index.ts',
   instances: 1,
   env_file: '.env',
   error_file: './logs/err.log',
   out_file: './logs/out.log',
   log_file: './logs/combined.log',
   time: true,
   max_memory_restart: '1G',
   env: {
     NODE_ENV: 'production'
   },
   watch: false,
   autorestart: true,
   kill_timeout: 5000,
   wait_ready: true,
   listen_timeout: 10000
 }]
}


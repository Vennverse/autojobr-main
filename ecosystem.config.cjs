module.exports = {
 apps: [{
   name: 'autojobr',
   script: 'npx',
   args: 'tsx server/index.ts',
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
   autorestart: true
 }]
}


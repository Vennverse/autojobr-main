module.exports = {
 apps: [{
   name: 'autojobr',
   script: './dist/index.js',
   instances: 1,
   env_file: '.env',
   error_file: './logs/err.log',
   out_file: './logs/out.log',
   log_file: './logs/combined.log',
   time: true,
   max_memory_restart: '1G'
 }]
}


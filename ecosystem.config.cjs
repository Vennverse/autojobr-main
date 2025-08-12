module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://autojobr_user:autojobr123@localhost:5432/autojobr',
      SESSION_SECRET: 'supersecretkey123456789',
      PRODUCTION_DOMAIN: 'https://autojobr.com',
      
      // AI Services
      GROQ_API_KEY: 'your_groq_api_key_here',
      
      // Payment Services
      STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
      STRIPE_PUBLISHABLE_KEY: 'your_stripe_publishable_key_here',
      PAYPAL_CLIENT_ID: 'your_paypal_client_id_here',
      PAYPAL_CLIENT_SECRET: 'your_paypal_client_secret_here',
      
      // Email Service
      RESEND_API_KEY: 'your_resend_api_key_here',
      
      // OAuth (optional)
      GOOGLE_CLIENT_ID: 'your_google_client_id_here',
      GOOGLE_CLIENT_SECRET: 'your_google_client_secret_here'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false
  }]
}

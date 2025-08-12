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
      GROQ_API_KEY: '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',
      
      // Payment Services
      STRIPE_SECRET_KEY: 'your_stripe_secret_key_here',
      STRIPE_PUBLISHABLE_KEY: 'your_stripe_publishable_key_here',
      PAYPAL_CLIENT_ID: 'AXSSrk5jbYkWs0Feb1nFQ-DeB6wcLNjerMynwzQ3zLFrk7pwbBjAwmg4d5Gd268xSIvSx6pUSOJQRBdR',
      PAYPAL_CLIENT_SECRET: 'EMLaBH5IxHzSStsrGYGd-026jDUftyxBpW5vyZosLNsMfwNg-XhMDLtBgBqZc03b3neqRpdb7DC2SdQL',
      
      // Email Service
      RESEND_API_KEY: 're_Tm6vhbwR_MZkjUNCnaeoZpgXQWFZqvwQg',
      
      // OAuth
      GOOGLE_CLIENT_ID: '886940582280-c77j4n2r4mjdss6k9sus58l0qbc1lrh3.apps.googleusercontent.com',
      GOOGLE_CLIENT_SECRET: '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'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    watch: false
  }]
}

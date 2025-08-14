module.exports = {
  apps: [{
    name: 'autojobr',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://autojobr:autojobr123@localhost:5432/autojobr',
      SESSION_SECRET: 'supersecretkey123456789',
      PRODUCTION_DOMAIN: 'https://autojobr.com',
      NEXTAUTH_SECRET: 'autojobr-secret-key-2025-production-vm',

      // AI Services
      GROQ_API_KEY: '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',

      // Payment Services
      PAYPAL_CLIENT_ID: 'AXSSrk5jbYkWs0Feb1nFQ-DeB6wcLNjerMynwzQ3zLFrk7pwbBjAwmg4d5Gd268xSIvSx6pUSOJQRBdR',
      PAYPAL_CLIENT_SECRET: 'EMLaBH5IxHzSStsrGYGd-026jDUftyxBpW5vyZosLNsMfwNg-XhMDLtBgBqZc03b3neqRpdb7DC2SdQL',

      // Email Service
      RESEND_API_KEY: 're_Tm6vhbwR_MZkjUNCnaeoZpgXQWFZqvwQg',

      // OAuth (CORRECTED VALUES)
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
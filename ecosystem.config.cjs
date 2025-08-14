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

      // AI Services - Multiple GROQ API Keys for Rotation
      GROQ_API_KEY: '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',
      GROQ_API_KEY_2: 'your_groq_api_key_2_here',
      GROQ_API_KEY_3: 'your_groq_api_key_3_here',
      GROQ_API_KEY_4: 'your_groq_api_key_4_here',
      GROQ_API_KEY_5: 'your_groq_api_key_5_here',
      GROQ_API_KEY_6: 'your_groq_api_key_6_here',
      GROQ_API_KEY_7: 'your_groq_api_key_7_here',
      GROQ_API_KEY_8: 'your_groq_api_key_8_here',
      GROQ_API_KEY_9: 'your_groq_api_key_9_here',
      GROQ_API_KEY_10: 'your_groq_api_key_10_here',

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
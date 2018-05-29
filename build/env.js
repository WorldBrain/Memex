export default (dev = false) => ({
    PIWIK_SITE_ID: '1',
    NODE_ENV: dev ? 'development' : 'production',
    PIWIK_HOST: dev
        ? 'http://localhost:1234'
        : 'https://analytics.worldbrain.io',
    SENTRY_DSN: dev
        ? ''
        : 'https://205014a0f65e4160a29db2935250b47c@sentry.io/305612',
})

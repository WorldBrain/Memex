export default ({ mode }) => {
    const env = {
        VERSION: process.env.npm_package_version,
        PIWIK_SITE_ID: '1',
        DEBUG_ANALYTICS_EVENTS: '',
        NODE_ENV: mode,
        BACKUP_BACKEND: 'google-drive',
        AUTOMATIC_BACKUP: '',
        AUTOMATIC_BACKUP_PAYMENT_SUCCESS: '',
        MOCK_BACKUP_BACKEND: '',
        STORE_BACKUP_TIME: 'true',
        BACKUP_BATCH_SIZE: '1000',
        BACKUP_START_SCREEN: '',
    }

    if (mode === 'development') {
        env.PIWIK_HOST = 'http://localhost:1234'
        env.SENTRY_DSN = ''
    } else if (mode === 'production') {
        env.PIWIK_HOST = 'https://analytics.worldbrain.io'
        env.SENTRY_DSN =
            'https://205014a0f65e4160a29db2935250b47c@sentry.io/305612'
    }

    return env
}

/* eslint no-console: 0 */
export default ({ mode }) => {
    const env = {
        VERSION: process.env.npm_package_version,
        DEBUG_ANALYTICS_EVENTS: '',
        NODE_ENV: mode,
        BACKUP_BACKEND: '',
        AUTOMATIC_BACKUP: '',
        AUTOMATIC_BACKUP_PAYMENT_SUCCESS: '',
        MOCK_BACKUP_BACKEND: '',
        STORE_BACKUP_TIME: 'true',
        BACKUP_BATCH_SIZE: '500',
        BACKUP_START_SCREEN: '',
        BACKUP_TEST_SIZE_ESTIMATION: '',
        ...process.env,
    }

    if (mode === 'development') {
        if (env.DEV_AUTH_STATE === '' || env.DEV_AUTH_STATE == null) {
            console.warn(
                `AUTH: Firebase auth will use staging credentials. See authentication/readme.md for more auth options.`,
            )
            env.DEV_AUTH_STATE = 'staging'
        } else {
            console.info(
                `AUTH: Firebase auth state set to: ${env.DEV_AUTH_STATE}`,
            )
        }
    }

    // Analytics
    if (mode === 'development' && env.DEV_ANALYTICS !== 'true') {
        console.warn(
            `Turing off analytics for extension development, set DEV_ANALYTICS=true if you're hacking on analytics`,
        )
        env.SENTRY_DSN = ''
        env.COUNTLY_SERVER_URL = 'http://localhost:1234'
        env.COUNTLY_APP_KEY = ''
    } else if (mode === 'production' || env.DEV_ANALYTICS === 'true') {
        if (env.DEV_ANALYTICS === 'true') {
            console.warn(
                `Forcing analytics to be enabled, but BE CAREFUL: this will send events to the production analytics backend`,
            )
        }
        env.SENTRY_DSN =
            'https://205014a0f65e4160a29db2935250b47c@sentry.io/305612'
        env.COUNTLY_SERVER_URL = env.COUNTLY_SERVER_URL
        env.COUNTLY_APP_KEY = env.COUNTLY_APP_KEY
    }

    return env
}

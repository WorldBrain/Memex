const firebase = {
    development: {
        FIREBASE_MEMEX_API_KEY: 'AIzaSyCyxWY7qZSWlncB_JDYOSzeTOfRnYhNcS8',
        FIREBASE_MEMEX_AUTH_DOMAIN: 'worldbrain-staging.firebaseapp.com',
        FIREBASE_MEMEX_DATABSE_URL: 'https://worldbrain-staging.firebaseio.com',
        FIREBASE_MEMEX_PROJECT_ID: 'worldbrain-staging',
        FIREBASE_MEMEX_MESSAGING_SENDER_ID: '840601505816',
        FIREBASE_MEMEX_APP_ID: '1:840601505816:web:69fbb7a789882e399fb36d',
    },
}

export default ({ mode }) => {
    const env = {
        VERSION: process.env.npm_package_version,
        PIWIK_SITE_ID: '1',
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
    }

    // Auth (with Firebase)
    for (const key in firebase.development) {
        // noinspection JSUnfilteredForInLoop
        env[key] =
            mode === 'development' ? firebase[mode][key] : process.env[key]
    }

    // Analytics
    if (mode === 'development' && process.env.DEV_ANALYTICS !== 'true') {
        console.warn(
            `Turing off analytics for extension development, set DEV_ANALYTICS=true if you're hacking on analytics`,
        )
        env.PIWIK_HOST = 'http://localhost:1234'
        env.SENTRY_DSN = ''
        env.COUNTLY_HOST = 'http://localhost:1234'
        env.COUNTLY_APP_KEY = ''
    } else if (mode === 'production' || process.env.DEV_ANALYTICS === 'true') {
        if (process.env.DEV_ANALYTICS === 'true') {
            console.warn(
                `Forcing analytics to be enabled, but BE CAREFUL: this will send events to the production analytics backend`,
            )
        }
        env.PIWIK_HOST = 'https://analytics.worldbrain.io'
        env.SENTRY_DSN =
            'https://205014a0f65e4160a29db2935250b47c@sentry.io/305612'
        env.COUNTLY_HOST = 'https://analytics2.worldbrain.io'
        env.COUNTLY_APP_KEY = '47678cda223ca2570cb933959c9037613a751283'
    }

    return env
}

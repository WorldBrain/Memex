import process from 'process'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

export const envPaths = {
    development: path.resolve(__dirname, '../private/.env.development'),
    production: path.resolve(__dirname, '../private/.env.production'),
    fallback: path.resolve(__dirname, '../private/.env.example'),
}

export const doesFileExist = (path) =>
    new Promise((resolve) => fs.access(path, (err) => resolve(err == null)))

export async function determineEnvPath({ mode }) {
    if (mode === 'development') {
        return (await doesFileExist(envPaths.development))
            ? envPaths.development
            : envPaths.fallback
    }

    if (await doesFileExist(envPaths.production)) {
        return envPaths.production
    }

    console.error(
        `FATAL ERROR: production env file does not exist:\n${envPaths.production}\n`,
    )
    process.exit(1)
}

export default async ({ mode }) => {
    const envPath = await determineEnvPath({ mode })
    console.log('USING ENV FILE:', envPath)
    dotenv.config({ path: envPath })

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
        DEV_AUTH_STATE: '',
    }

    if (mode === 'development') {
        if (
            process.env.DEV_AUTH_STATE === '' ||
            process.env.DEV_AUTH_STATE == null
        ) {
            console.warn(
                `AUTH: Firebase auth will use staging credentials. See authentication/readme.md for more auth options.`,
            )
            env.DEV_AUTH_STATE = 'staging'
        } else {
            env.DEV_AUTH_STATE = process.env.DEV_AUTH_STATE
            console.info(
                `AUTH: Firebase auth state set to: ${env.DEV_AUTH_STATE}`,
            )
        }
    }

    // Analytics
    if (mode === 'development' && process.env.DEV_ANALYTICS !== 'true') {
        console.warn(
            `Turning off analytics for extension development, set DEV_ANALYTICS=true if you're hacking on analytics`,
        )
        env.SENTRY_DSN = ''
    } else if (mode === 'production' || process.env.DEV_ANALYTICS === 'true') {
        if (process.env.DEV_ANALYTICS === 'true') {
            console.warn(
                `Forcing analytics to be enabled, but BE CAREFUL: this will send events to the production analytics backend`,
            )
        }
        env.SENTRY_DSN =
            'https://205014a0f65e4160a29db2935250b47c@sentry.io/305612'
        // env.COUNTLY_APP_KEY = '47678cda223ca2570cb933959c9037613a751283'
    }

    return {
        defaultEnv: env,
        envPath,
    }
}

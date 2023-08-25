import { toInteger } from 'lodash'
import browser from 'webextension-polyfill'
import {
    COUNTER_STORAGE_KEY,
    DEFAULT_COUNTER_STORAGE_KEY,
    FREE_PLAN_LIMIT,
    AI_SUMMARY_URLS,
} from './constants'

export async function checkStripePlan(email) {
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'

    const baseUrl = isStaging
        ? 'https://cloudflare-memex-staging.memex.workers.dev'
        : 'https://cloudfare-memex.memex.workers.dev'
    const url = `${baseUrl}` + '/stripe-subscriptions'

    const response = await fetch(url, {
        method: 'POST',
        headers: {},
        body: JSON.stringify({
            email,
        }),
    })

    const subscriptionStatus = await response.json()
    const currentDate = new Date(Date.now())
    const currentMonth = currentDate.getMonth()

    const currentCount = await browser.storage.local.get(COUNTER_STORAGE_KEY)
    if (currentCount[COUNTER_STORAGE_KEY] === undefined) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                s: subscriptionStatus.pageLimit,
                sQ: subscriptionStatus.AILimit,
                c: 0,
                cQ: 0,
                m: currentMonth,
            },
        })
    } else {
        const { c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                s: subscriptionStatus.pageLimit,
                sQ: subscriptionStatus.AILimit,
                c: c ? c : 0,
                cQ: cQ ? cQ : 0,
                m: m ? m : currentMonth,
            },
        })
    }

    return subscriptionStatus
}

export async function upgradePlan(pageLimit, AILimit) {
    const currentCount = await browser.storage.local.get(COUNTER_STORAGE_KEY)
    const currentDate = new Date(Date.now())
    const currentMonth = currentDate.getMonth()

    if (currentCount[COUNTER_STORAGE_KEY] === undefined) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                s: pageLimit,
                sQ: AILimit,
                c: 0,
                cQ: 0,
                m: currentMonth,
            },
        })
    } else {
        const { s, sQ, c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                s: pageLimit,
                sQ: AILimit,
                c: c,
                cQ: cQ ? cQ : 0,
                m: m ? m : currentMonth,
            },
        })
    }

    return
}

async function enforceTrialPeriod30Days() {
    const installTimeData = await browser.storage.local.get(
        'localSettings.installTimestamp',
    )
    const installTimestamp = installTimeData['localSettings.installTimestamp']

    if (!installTimestamp) {
        console.error('Install timestamp not found!')
        return
    }

    const currentTime = new Date().getTime()
    const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
    if (currentTime - installTimestamp < thirtyDaysInMillis) {
        return true // Return the function if the install time is less than 30 days ago
    } else {
        return false // Return the function if the install time is more than 30 days ago
    }
}

export async function updatePageCounter() {
    const isTrial = await enforceTrialPeriod30Days()
    console.log('isTrial', isTrial)

    if (isTrial) {
        return
    }

    const currentCount = await browser.storage.local.get(COUNTER_STORAGE_KEY)

    if (currentCount[COUNTER_STORAGE_KEY] === undefined) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })
    } else {
        const { s, sQ, c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                s: s,
                sQ: sQ ?? DEFAULT_COUNTER_STORAGE_KEY.sQ,
                c: c + 1,
                cQ: cQ ?? 0,
                m: m,
            },
        })
    }

    return
}
export async function updateAICounter() {
    const isTrial = await enforceTrialPeriod30Days()

    if (isTrial) {
        return
    }

    const currentCount = await browser.storage.local.get(COUNTER_STORAGE_KEY)

    if (
        currentCount[COUNTER_STORAGE_KEY] === undefined ||
        currentCount[COUNTER_STORAGE_KEY].sQ === undefined
    ) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })
    } else {
        const { s, sQ, c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                s: s,
                sQ: sQ,
                c: c,
                cQ: cQ + 1,
                m: m,
            },
        })
    }

    return
}

export async function checkStatus() {
    const isTrial = await enforceTrialPeriod30Days()
    const currentDate = new Date(Date.now())
    const currentMonth = currentDate.getMonth()

    if (isTrial) {
        return {
            pageLimit: 20000,
            AIlimit: 20000,
            pageCounter: 0,
            AIcounter: 0,
            m: currentMonth,
        }
    }

    const currentStatus = await browser.storage.local.get(COUNTER_STORAGE_KEY)

    if (
        currentStatus[COUNTER_STORAGE_KEY] === undefined ||
        currentStatus[COUNTER_STORAGE_KEY].sQ === undefined
    ) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })

        // TODO: make more robust by fetching free tier units from Cloudflare workers and KV
        return {
            pageLimit: 26,
            AIlimit: 26,
            pageCounter: 0,
            AIcounter: 0,
            m: currentMonth,
        }
    } else {
        const { s, sQ, c, cQ, m } = currentStatus[COUNTER_STORAGE_KEY]

        // Resets the counters if the month has changed
        if (m !== currentMonth) {
            await browser.storage.local.set({
                [COUNTER_STORAGE_KEY]: {
                    s: s,
                    c: 0,
                    sQ: sQ,
                    cQ: 0,
                    m: currentMonth,
                },
            })
            return {
                pageLimit: s,
                AIlimit: sQ,
                pageCounter: 0,
                AIcounter: 0,
                m: currentMonth,
            }
        } else {
            return {
                pageLimit: s,
                AIlimit: sQ,
                pageCounter: c,
                AIcounter: cQ,
                m: currentMonth,
            }
        }
    }
}

export async function pageActionAllowed() {
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'
    let urlToOpen = isStaging
        ? 'https://memex.garden/upgradeStaging'
        : 'https://memex.garden/upgrade'

    const status = await checkStatus()
    if (status.pageLimit > 10000 || status.pageLimit > status.pageCounter) {
        return true
    } else {
        window.open(urlToOpen, '_blank')
        return false
    }
}
export async function AIActionAllowed() {
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'
    let urlToOpen = isStaging
        ? 'https://memex.garden/upgradeStaging'
        : 'https://memex.garden/upgradeNotification'

    const status = await checkStatus()
    if (status.AIlimit > 10000 || status.AIlimit > status.AIcounter) {
        return true
    } else {
        window.open(urlToOpen, '_blank')
        return false
    }
}

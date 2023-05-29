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

export async function updatePageCounter() {
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
    const currentStatus = await browser.storage.local.get(COUNTER_STORAGE_KEY)
    const currentDate = new Date(Date.now())
    const currentMonth = currentDate.getMonth()

    if (
        currentStatus[COUNTER_STORAGE_KEY] === undefined ||
        currentStatus[COUNTER_STORAGE_KEY].sQ === undefined
    ) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })

        // TODO: make more robust by fetching free tier units from Cloudflare workers and KV
        return {
            pageLimit: 25,
            AIlimit: 25,
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

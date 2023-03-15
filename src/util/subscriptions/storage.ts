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

    console.log('works', email)
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

    console.log('response', response)
    const subscriptionStatus = await response.json()

    console.log('infno', subscriptionStatus)
    return subscriptionStatus
}

export async function upgradePlan(plan) {
    const currentCount = await browser.storage.local.get(COUNTER_STORAGE_KEY)
    const { month } = currentCount[COUNTER_STORAGE_KEY]
    const { s, c, m } = currentCount[COUNTER_STORAGE_KEY]

    let maxCount
    if (plan > 10000) {
        maxCount = 200000
    } else {
        maxCount = plan
    }

    await browser.storage.local.set({
        [COUNTER_STORAGE_KEY]: {
            s: maxCount,
            c: c,
            m: month,
        },
    })

    return
}

export async function countAIrequests(url) {
    const currentCount = await browser.storage.local.get(AI_SUMMARY_URLS)

    if (currentCount[AI_SUMMARY_URLS] === undefined) {
        await updateCounter()
        const listOfURLs = []
        listOfURLs.unshift(url)
        await browser.storage.local.set({
            [AI_SUMMARY_URLS]: listOfURLs,
        })
    } else {
        const listOfURLs = currentCount[AI_SUMMARY_URLS]
        if (listOfURLs.some((item) => item === url)) {
            return
        } else {
            if (actionAllowed()) {
                listOfURLs.unshift(url)
                await updateCounter()
                await browser.storage.local.set({
                    [AI_SUMMARY_URLS]: listOfURLs,
                })
            } else {
                return false
            }
        }
    }

    return
}
export async function updateCounter() {
    const currentCount = await browser.storage.local.get(COUNTER_STORAGE_KEY)

    if (currentCount[COUNTER_STORAGE_KEY] === undefined) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })
    } else {
        const { s, c, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                s: s,
                c: c + 1,
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

    if (currentStatus[COUNTER_STORAGE_KEY] === undefined) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })

        // TODO: make more robust by fetching free tier units from Cloudflare workers and KV
        return { maxCounter: 50, blockCounter: 0, m: currentMonth }
    } else {
        const { s, c, m } = currentStatus[COUNTER_STORAGE_KEY]

        let month = m
        if (currentStatus[COUNTER_STORAGE_KEY].m !== currentMonth) {
            await browser.storage.local.set({
                [COUNTER_STORAGE_KEY]: {
                    s: s,
                    c: 0,
                    m: currentMonth,
                },
            })
            await browser.storage.local.set({
                [AI_SUMMARY_URLS]: null,
            })
            return { maxCounter: s, blockCounter: 0 }
        } else {
            return { maxCounter: s, blockCounter: c }
        }
    }
}

export async function actionAllowed() {
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'
    let urlToOpen = isStaging
        ? 'https://memex.garden/upgradeStaging'
        : 'https://memex.garden/upgrade'

    const status = await checkStatus()
    if (status.maxCounter > 10000 || status.maxCounter > status.blockCounter) {
        return true
    } else {
        window.open(urlToOpen, '_blank')
        return false
    }
}

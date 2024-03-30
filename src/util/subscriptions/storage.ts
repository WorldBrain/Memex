import browser from 'webextension-polyfill'
import { COUNTER_STORAGE_KEY, DEFAULT_COUNTER_STORAGE_KEY } from './constants'
import { trackHitPaywall } from '@worldbrain/memex-common/lib/analytics/events'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { ContentScriptsInterface } from 'src/content-scripts/background/types'

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
                c: 0,
                cQ: 0,
                m: currentMonth,
                pU: subscriptionStatus,
            },
        })
    } else {
        const { c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                c: c ? c : 0,
                cQ: cQ ? cQ : 0,
                m: m ? m : currentMonth,
                pU: subscriptionStatus,
            },
        })
    }

    return subscriptionStatus
}

export async function upgradePlan() {
    const currentCount = await browser.storage.local.get(COUNTER_STORAGE_KEY)
    const currentDate = new Date(Date.now())
    const currentMonth = currentDate.getMonth()

    if (currentCount[COUNTER_STORAGE_KEY] === undefined) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                c: 0,
                cQ: 0,
                m: currentMonth,
                pU: currentCount[COUNTER_STORAGE_KEY].pU,
            },
        })
    } else {
        const { s, sQ, c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                c: c,
                cQ: cQ ? cQ : 0,
                m: m ? m : currentMonth,
                pU: currentCount[COUNTER_STORAGE_KEY].pU,
            },
        })
    }

    return
}

export async function enforceTrialPeriod30Days(signupDate?) {
    let signupTimestamp

    if (signupDate) {
        signupTimestamp = signupDate
        await browser.storage.local.set({
            'localSettings.signupTimestamp': signupDate,
        })
    } else {
        const signupTimestampData = await browser.storage.local.get(
            'localSettings.signupTimestamp',
        )
        signupTimestamp = signupTimestampData['localSettings.signupTimestamp']

        if (!signupTimestamp) {
            console.error('Install timestamp not found!')
            return false
        }
    }
    const currentTime = new Date().getTime()
    const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000 // 30 days in seconds

    if (currentTime - signupTimestamp < thirtyDaysInMillis) {
        return true // Return the function if the install time is less than 30 days ago
    } else {
        return false // Return the function if the install time is more than 30 days ago
    }
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
                c: c + 1,
                cQ: cQ ?? 0,
                m: m,
                pU: currentCount[COUNTER_STORAGE_KEY].pU,
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
                c: c,
                cQ: cQ + 1,
                m: m,
                pU: currentCount[COUNTER_STORAGE_KEY].pU,
            },
        })
    }

    return
}

export async function checkStatus(feature: 'bookmarking' | 'AI') {
    const currentStatus = await browser.storage.local.get(COUNTER_STORAGE_KEY)
    const currentDate = new Date(Date.now())
    const currentMonth = currentDate.getMonth()

    if ((await enforceTrialPeriod30Days()) === true) {
        return true
    }

    if (currentStatus.m !== currentMonth) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                c: 0,
                cQ: 0,
                m: currentMonth,
            },
        })
    }

    if (
        currentStatus[COUNTER_STORAGE_KEY] === undefined ||
        currentStatus[COUNTER_STORAGE_KEY].sQ === undefined
    ) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })

        return false
    }

    if (feature === 'bookmarking') {
        const hasBookmarkPowerUp =
            currentStatus[COUNTER_STORAGE_KEY].pU.Unlimited ||
            currentStatus[COUNTER_STORAGE_KEY].pU.bookmarksPowerUp

        if (hasBookmarkPowerUp) {
            return true
        } else {
            const currentCounter = currentStatus[COUNTER_STORAGE_KEY].c
            if (currentCounter < 25) {
                return true
            }
        }
    }
    if (feature === 'AI') {
        const hasAIPowerUp = currentStatus[COUNTER_STORAGE_KEY].pU.AIpowerup

        if (hasAIPowerUp) {
            return true
        } else {
            const currentCounter = currentStatus[COUNTER_STORAGE_KEY].cQ
            if (currentCounter < 25) {
                return true
            }
        }
    }
    return false
}

export async function pageActionAllowed(
    analyticsBG,
    onlyCheckNoUpdate?: boolean,
) {
    const allowed = await checkStatus('bookmarking')
    console.log('allowed', allowed)
    if (!onlyCheckNoUpdate) {
        updatePageCounter()
    }

    if (allowed) {
        return true
    } else {
        if (analyticsBG) {
            try {
                await trackHitPaywall(analyticsBG, { type: 'pagesLimit' })
            } catch (error) {
                console.error(
                    `Error tracking space Entry create event', ${error}`,
                )
            }
        }
        return false
    }
}
export async function AIActionAllowed(
    analyticsBG,
    onlyCheckNoUpdate?: boolean,
) {
    const allowed = await checkStatus('AI')

    if (!onlyCheckNoUpdate) {
        updateAICounter()
    }

    if (allowed) {
        return true
    } else {
        if (analyticsBG) {
            try {
                await trackHitPaywall(analyticsBG, { type: 'aiLimit' })
            } catch (error) {
                console.error(
                    `Error tracking space Entry create event', ${error}`,
                )
            }
        }
        return false
    }
}
export async function downloadMemexDesktop(getSystemArchAndOS) {
    const OS = getSystemArchAndOS.os
    const arch = getSystemArchAndOS.arch

    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'

    const baseUrl = isStaging
        ? 'https://cloudflare-memex-staging.memex.workers.dev'
        : 'https://cloudfare-memex.memex.workers.dev'

    const response = await fetch(baseUrl + '/download_memex_desktop', {
        method: 'POST',
        body: JSON.stringify({
            OS: OS,
            arch: arch,
        }),
        headers: { 'Content-Type': 'application/json' },
    })

    let responseContent = await response.json()
    return responseContent.downloadUrl
}

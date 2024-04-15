import browser from 'webextension-polyfill'
import { COUNTER_STORAGE_KEY, DEFAULT_COUNTER_STORAGE_KEY } from './constants'
import { trackHitPaywall } from '@worldbrain/memex-common/lib/analytics/events'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { ContentScriptsInterface } from 'src/content-scripts/background/types'
import { CLOUDFLARE_WORKER_URLS } from '@worldbrain/memex-common/lib/content-sharing/storage/constants'
import { PremiumPlans } from '@worldbrain/memex-common/lib/subscriptions/availablePowerups'
import { RemoteBGScriptInterface } from 'src/background-script/types'
import { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

export async function checkStripePlan(email) {
    const isStaging =
        process.env.REACT_APP_FIREBASE_PROJECT_ID?.includes('staging') ||
        process.env.NODE_ENV === 'development'

    const baseUrl = isStaging
        ? CLOUDFLARE_WORKER_URLS.staging
        : CLOUDFLARE_WORKER_URLS.production
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
                pU: subscriptionStatus.status,
            },
        })
    } else {
        const { c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                c: c ? c : 0,
                cQ: cQ ? cQ : 0,
                m: m ? m : currentMonth,
                pU: subscriptionStatus.status,
            },
        })
    }

    return subscriptionStatus.status
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
    // signupTimestamp =
    //     new Date(signupTimestamp).getTime() - 365 * 24 * 60 * 60 * 1000 // 1 year ago
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
        currentCount[COUNTER_STORAGE_KEY].cQ === undefined
    ) {
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: DEFAULT_COUNTER_STORAGE_KEY,
        })
        return
    } else {
        const { c, cQ, m } = currentCount[COUNTER_STORAGE_KEY]
        await browser.storage.local.set({
            [COUNTER_STORAGE_KEY]: {
                c: c,
                cQ: cQ + 1,
                m: m,
                pU: currentCount[COUNTER_STORAGE_KEY].pU,
            },
        })
        return
    }
}

export async function checkStatus(feature: PremiumPlans) {
    const currentStatusStorage = await browser.storage.local.get(
        COUNTER_STORAGE_KEY,
    )

    const currentStatus =
        currentStatusStorage[COUNTER_STORAGE_KEY] ?? DEFAULT_COUNTER_STORAGE_KEY
    const currentDate = new Date(Date.now())
    const currentMonth = currentDate.getMonth()

    if ((await enforceTrialPeriod30Days()) === true) {
        return true
    }

    // if (currentStatus.m !== currentMonth) {
    //     await browser.storage.local.set({
    //         [COUNTER_STORAGE_KEY]: {
    //             c: currentStatus.c,
    //             cQ: currentStatus.cQ,
    //             m: currentMonth,
    //         },
    //     })
    // }

    if (feature === 'bookmarksPowerUp') {
        const hasBookmarkPowerUp =
            (currentStatus.pU?.Unlimited ||
                currentStatus.pU?.bookmarksPowerUp) ??
            false

        if (hasBookmarkPowerUp) {
            return true
        } else {
            const currentCounter = currentStatus.c
            if (currentCounter < 25) {
                return true
            }
        }
    }
    if (feature === 'AIpowerup') {
        const hasAIPowerUp =
            currentStatus[COUNTER_STORAGE_KEY].pU?.AIpowerup ?? false

        if (hasAIPowerUp) {
            return true
        } else {
            const currentCounter = currentStatus.cQ
            if (currentCounter < 25) {
                return true
            }
        }
    }
    if (feature === 'AIpowerupOwnKey') {
        const hasAIPowerUp =
            (currentStatus.pU.AIpowerupOwnKey || currentStatus.pU.AIpowerup) ??
            false

        if (hasAIPowerUp) {
            return true
        } else {
            const currentCounter = currentStatus.cQ
            if (currentCounter < 25) {
                return true
            }
        }
    }
    return false
}

export async function pageActionAllowed(
    analyticsBG,
    collectionsBG: RemoteCollectionsInterface,
    pageToCheck: string,
    onlyCheckNoUpdate?: boolean,
) {
    const isAlreadySaved =
        (await collectionsBG.findPageByUrl(normalizeUrl(pageToCheck))) !=
            null ?? false

    if (isAlreadySaved) {
        return true
    }

    const allowed = await checkStatus('bookmarksPowerUp')
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
    feature: PremiumPlans,
    onlyCheckNoUpdate?: boolean,
) {
    const allowed = await checkStatus(feature)

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
        ? CLOUDFLARE_WORKER_URLS.staging
        : CLOUDFLARE_WORKER_URLS.production

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

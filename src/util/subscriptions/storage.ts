import browser from 'webextension-polyfill'
import { COUNTER_STORAGE_KEY, DEFAULT_COUNTER_STORAGE_KEY } from './constants'

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
        return { subscriptionStatus: '0', blockCounter: 0, m: currentMonth }
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
            return { subscriptionStatus: s, blockCounter: 0 }
        } else {
            return { subscriptionStatus: s, blockCounter: c }
        }
    }
}

export async function actionAllowed() {
    const status = await checkStatus()

    if (
        status.subscriptionStatus === 'u' ||
        (status.subscriptionStatus === '500' && status.blockCounter < 500) ||
        (status.subscriptionStatus === '0' && status.blockCounter < 100)
    ) {
        return true
    } else if (
        status.subscriptionStatus === '500' &&
        status.blockCounter >= 500
    ) {
        window.open('https://memex.garden', '_blank')
        return false
    } else if (
        status.subscriptionStatus === '0' &&
        status.blockCounter >= 100
    ) {
        window.open('https://memex.garden', '_blank')
        return false
    }
}

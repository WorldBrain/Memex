import { installTimeStorageKey } from 'src/imports/background'
import { API_HOST } from 'src/analytics/internal/constants'

const API_PATH = '/user-token'

export const USER_ID = 'user-id'

export async function generateTokenIfNot({
    installTime,
    hostname = API_HOST,
    pathname = API_PATH,
}) {
    const userId = (await browser.storage.local.get(USER_ID))[USER_ID]
    if (userId) {
        return userId
    }

    // if install time is not present then current time stores as install time and send to server same
    if (!installTime) {
        installTime = Date.now()
        browser.storage.local.set({ [installTimeStorageKey]: installTime })
    }

    const generateToken = await fetch(hostname + pathname, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: `installTime=${installTime}`,
    })
    const token = await generateToken.json()

    if (token.success) {
        browser.storage.local.set({ [USER_ID]: token.id })
        return token.id
    }
}

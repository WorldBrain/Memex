import { installTimeStorageKey } from 'src/imports/background'

const API_PATH = '/user-token'

export const USER_ID = 'user-id'

export default async function generateTokenIfNot(installTime) {
    const userId = (await browser.storage.local.get(USER_ID))[USER_ID]

    // if install time is not present then current time stores as install time and send to server same
    if (!installTime) {
        installTime = Date.now()
        browser.storage.local.set({ [installTimeStorageKey]: installTime })
    }

    const host =
        'https://a8495szyaa.execute-api.eu-central-1.amazonaws.com/' +
        (process.env.NODE_ENV === 'production' ? 'production' : 'staging')

    if (!userId) {
        const generateToken = await fetch(host + API_PATH, {
            method: 'POST',
            headers: {
                'Content-type':
                    'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: `installTime=${installTime}`,
        })
        const token = await generateToken.json()

        if (token.success) {
            browser.storage.local.set({ [USER_ID]: token.id })
        }
    }
}

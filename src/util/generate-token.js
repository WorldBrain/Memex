import { installTimeStorageKey } from 'src/imports/background'

const API_PATH = '/api/v1/returnToken'

export const USER_ID = 'user-id'

export default async function generateTokenIfNot(installTime) {
    const userId = (await browser.storage.local.get(USER_ID))[USER_ID]

    // if install time is not present then current time stores as install time and send to server same
    if (!installTime) {
        installTime = Date.now()
        browser.storage.local.set({ [installTimeStorageKey]: installTime })
    }

    if (!userId) {
        const generateToken = await fetch(process.env.REDASH_API + API_PATH, {
            method: 'POST',
            headers: {
                'Content-type':
                    'application/x-www-form-urlencoded; charset=UTF-8',
            },
            body: `install_time=${installTime}`,
        })
        const token = await generateToken.json()

        if (token.status === 200) {
            browser.storage.local.set({ [USER_ID]: token.id })
        }
    }
}

import { API_HOST } from 'src/analytics/internal/constants'
import { INSTALL_TIME_KEY } from 'src/constants'
const uuidv4 = require('uuid/v4')

const API_PATH = '/user-token'

export const USER_ID = 'user-id'

export async function generateTokenIfNot({
    installTime,
    hostname = API_HOST,
    pathname = API_PATH,
}) {
    const isDoNotTrackEnabled = window.navigator.doNotTrack

    if (isDoNotTrackEnabled) {
        return null
    }

    const userId = (await browser.storage.local.get(USER_ID))[USER_ID]
    if (userId) {
        return userId
    }

    if (!installTime) {
        installTime = Date.now()
        browser.storage.local.set({ [INSTALL_TIME_KEY]: installTime })
    }

    const newId = uuidv4()
    browser.storage.local.set({ [USER_ID]: newId })
    return newId
}

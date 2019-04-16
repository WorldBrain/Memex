import { API_HOST } from 'src/analytics/internal/constants'
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

    return uuidv4()
}

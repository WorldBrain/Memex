import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from 'src/options/privacy/constants'
import { INSTALL_TIME_KEY } from '../constants'
import { generateTokenIfNot } from 'src/util/generate-token'

export async function shouldTrack(defTracking = false) {
    const isDoNotTrackEnabled = window.navigator.doNotTrack

    if (isDoNotTrackEnabled) {
        return false
    }

    const storage = await browser.storage.local.get({
        [SHOULD_TRACK]: defTracking,
    })

    return storage[SHOULD_TRACK]
}

export async function fetchUserId() {
    if (!(await shouldTrack())) {
        return null
    }

    const installTime = (await browser.storage.local.get(INSTALL_TIME_KEY))[
        INSTALL_TIME_KEY
    ]
    const userId = await generateTokenIfNot(installTime)

    return userId
}

import analytics from '.'
import { remoteFunction } from 'src/util/webextensionRPC'
import { SHOULD_TRACK_STORAGE_KEY as SHOULD_TRACK } from 'src/options/privacy/constants'

export async function storeTrackingOption(isOptIn, skipEventTrack = false) {
    const storeLocalStorage = () =>
        browser.storage.local.set({ [SHOULD_TRACK]: isOptIn })

    const trackEvent = force => {
        if (skipEventTrack) {
            return Promise.resolve()
        }

        const trackEvent = analytics.trackEvent(
            {
                category: 'Privacy',
                action: 'Change tracking pref',
                name: isOptIn ? 'opt-in' : 'opt-out',
            },
            force,
        )

        const processEvent = remoteFunction('processEvent')({
            type: isOptIn
                ? 'changeTrackingPrefOptIn'
                : 'changeTrackingPrefOptOut',
            force,
        })

        return Promise.all([trackEvent, processEvent])
    }

    // Do event track after state change, as the event may be a noop if opt-out state is already set
    if (isOptIn) {
        await storeLocalStorage()
        await trackEvent(false)
    } else {
        await trackEvent(true)
        storeLocalStorage()
    }
}

import { browser } from 'webextension-polyfill-ts'

export const subscriptionRedirect =
    'https://memex.cloud/auth/chargebee/callback'

export function setupRequestInterceptors({ webRequest }) {
    webRequest.onBeforeRequest.addListener(
        makeChargebeeCallbackHandler(),
        { urls: [`${subscriptionRedirect}*`] },
        ['blocking'],
    )
}

export function makeChargebeeCallbackHandler() {
    return ({ url, tabId }) => {
        if (tabId === -1) {
            // Came from bg script, prevent infinite loop of DOOM!
            return {}
        }

        const targetUrl = `${browser.extension.getURL(
            '/options.html',
        )}#/account-subscriptions`

        // to get around the blocked state of the request, we update the original tab with the account screen.
        // this is probably a bit glitchy at first, but we may be able to improve on that experience. For now it should be OK.
        setTimeout(() => {
            browser.tabs.update(tabId, { active: true, url: targetUrl })
        }, 1)

        return { redirectUrl: targetUrl }
    }
}

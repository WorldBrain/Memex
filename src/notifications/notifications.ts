// Use these keys in case of action buttons, import the keys in the storage-keys-notif module
import * as storageKeys from './storage-keys-notif'
import * as actionTypes from './action-types'

import { NotifDefinition } from './types'

/** Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it */
export const releaseTime: number = 1532947573751

/* Example Notification:
{
    id: 'direct_links_inital_notification',
    title: 'New Feature: Memex.Link',
    message:
        'Test Message',
    buttons: [
        {
            action: {
                type: actionTypes.OPEN_URL,
                url: 'https://worldbrain.io',
                context: 'new-tab',
            },
            label: 'Learn More',
        },
        {
            action: {
                type: actionTypes.OPEN_URL,
                url: 'https://memex.io',
                context: 'new-tab',
            },
            label: 'Learn More',
        },
    ],
},
*/
export const NOTIFS: NotifDefinition[] = []

// Dummy search engine notification
export const SEARCH_ENGINE_NOTIF = {
    id: 'direct_links_inital_notification31',
    title: 'New Feature: Comments & Annotation',
    message:
        'Highlight any text on the web and add comments to it. Also attach comments to every websites you find.',
    button: {
        action: {
            type: actionTypes.TOGGLE_SETTING,
            key: storageKeys.SHOULD_TRACK_STORAGE_KEY,
        },
        label: 'Enable Tracking',
    },
}

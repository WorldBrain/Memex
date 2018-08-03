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

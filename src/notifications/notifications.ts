// Use these keys in case of action buttons, import the keys in the storage-keys-notif module
import * as storageKeys from './storage-keys-notif'
import * as actionTypes from './action-types'

import { NotifDefinition } from './types'

/** Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it */
export const releaseTime: number = 1552869760591

/* Example Notification:
{
        id: 'direct_links_inital_notification',
        search: {
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
            ],
        },
        system: {
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
            ],
        },
        overview: {
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
            ],
        },
    },
*/

export const NOTIFS: NotifDefinition[] = [
    {
        id: 'ribbon_new_2019_18_03',
        search: {
            title: "🚩 New Feature: Toolbar 2.0",
            message: 'Tag, star, sort pages & add notes blazingly fast. Try it out by moving your cursor to the right side of the screen when visiting a website.',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://www.notion.so/worldbrain/0-15-0-67ec1dcbf41642eda2fcef516ed1928a',
                        context: 'new-tab',
                    },
                    label: 'Find out more',
                },
            ],
        },
        overview: {
            title: "🚩 New Feature: Toolbar 2.0",
            message: 'Tag, star, sort pages & add notes blazingly fast. Try it out by moving your cursor to the right side of the screen when visiting a website.',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://www.notion.so/worldbrain/0-15-0-67ec1dcbf41642eda2fcef516ed1928a',
                        context: 'new-tab',
                    },
                    label: 'Find out more',
                },
            ],
        },
    },
]

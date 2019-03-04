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

export const UPDATE_NOTIFS: NotifDefinition[] = [
    {
        id: 'ribbon_new_2019_18_03',
        search: {
            title: "🚩 New Feature: Ribbon 2.0",
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
            title: "🚩 New Feature: Ribbon 2.0",
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

export const EVENT_NOTIFS: object = {
    backup_error: {
        id: 'backup_error',
        system: {
            title: 'Error backing up data.',
            message: 'Please check your internet connectivity',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: '/options.html#/overview?showInbox=true',
                        context: 'self',
                    },
                    label: 'Backup Now',
                },
            ],
        },
        overview: {
            title: 'Backup Error due to poor internet connectivity.',
            message: `Please make sure that you have an internet connection
                for a successful backup.`,
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: '/options.html#/backup',
                        context: 'self',
                    },
                    label: 'Retry',
                },
            ],
        },
    },
    drive_size_empty: {
        id: 'drive_size_empty',
        system: {
            title: 'Drive Size',
            message: 'There seems to be no space in your Google Drive',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: '/options.html#/overview?showInbox=true',
                    },
                    label: 'Retry',
                },
            ],
        },
        overview: {
            title: 'No Drive Size Available',
            message: `There is no space available in your Google Drive.
                Please clear some space in your drive to be able to successfully
                backup your future data.`,
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://drive.google.com',
                    },
                    label: 'Go to Google Drive',
                },
            ],
        },
    },
    auto_backup_expired: {
        id: 'auto_backup_expired',
        system: {
            title: 'Auto Backup',
            message: 'Your Auto Backup subscription has expired.',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://worldbrain.io/pricing',
                        context: 'self',
                    },
                    label: 'Renew Subscription',
                },
            ],
        },
        overview: {
            title: 'Auto Backup Subscription',
            message: `Your Auto Backup subscription has expired. If you want to
                renew your subscription click on the button below.`,
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://worldbrain.io/pricing',
                        context: 'self',
                    },
                    label: 'Renew Subscription',
                },
            ],
        },
    },
}

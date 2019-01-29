// Use these keys in case of action buttons, import the keys in the storage-keys-notif module
import * as storageKeys from './storage-keys-notif'
import * as actionTypes from './action-types'

import { NotifDefinition } from './types'

/** Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it */
export const releaseTime: number = 1542240979258

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
        id: 'restore',
        search: {
            title: "Tab Manager, shortcuts, restore",
            message: 'A release packed with new features',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://www.notion.so/worldbrain/0-13-0-7c5e607f7fd04fbf83d454866d683db9',
                        context: 'new-tab',
                    },
                    label: 'Find out more',
                },
            ],
        },
        system: {
            title: 'Tab Manager & shortcuts',
            message:
                'A release packed with new features',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://www.notion.so/worldbrain/0-13-0-7c5e607f7fd04fbf83d454866d683db9',
                        context: 'new-tab',
                    },
                    label: 'Learn More',
                },
            ],
        },
        overview: {
            title: "Tab Manager, keyboard shortcuts & restore",
            message:
                'Check out our latest release packed with new features',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url: 'https://www.notion.so/worldbrain/0-13-0-7c5e607f7fd04fbf83d454866d683db9',
                        context: 'new-tab',
                    },
                    label: 'Find out more',
                },
            ],
        },
    },
    {
        id: 'backup_error',
        system: {
            title: 'Error backing up data.',
            message: 'An error occured while backing up your data',
        },
        overview: {
            title: 'Error backing up data.',
            message: 'An error occured while backing up your data.',
            buttons: [
                // TODO: Add the button sending them to the backup page
            ],
        },
    },
    {
        id: 'drive_size_empty',
        system: {
            title: 'Drive Size',
            message: 'There seems to be no space in your Google Drive',
        },
        overview: {
            title: 'Drive Size',
            message: 'There seems to be no space in your Google Drive',
        },
    },
    {
        id: 'auto_backup_expired',
        system: {
            title: 'Auto Backup',
            message: 'Your auto-backup subscription has ended',
        },
        overview: {
            title: 'Auto Backup',
            message: 'Your auto-backup subscription has ended.',
            buttons: [
                // TODO: A link to send them to a page to renew the subscription
            ],
        },
    },
]

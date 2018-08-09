// Use these keys in case of action buttons, import the keys in the storage-keys-notif module
import * as storageKeys from './storage-keys-notif'
import * as actionTypes from './action-types'

import { NotifDefinition } from './types'

/** Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it */
export const releaseTime: number = 1533513202569

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
        id: 'Announce Annotations',
        search: {
            title: 'New Feature: Annotation',
            message:
                'Highlight any text on the web and add comments to it. Also attach comments to every websites you find.',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url:
                            'https://worldbrain.helprace.com/i66-feature-annotations-comments',
                        context: 'new-tab',
                    },
                    label: 'Learn More',
                },
            ],
        },
        overview: {
            title: 'New Feature: Comments & Annotation',
            message:
                'Highlight any text on the web and add comments to it. Also attach comments to every websites you find.',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url:
                            'https://worldbrain.helprace.com/i66-feature-annotations-comments',
                        context: 'new-tab',
                    },
                    label: 'Learn More',
                },
            ],
        },
    },
    {
        id: 'Announce Collections',
        search: {
            title: 'New Feature: Collections',
            message: 'Sort your favorite websites in useful lists',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url:
                            'https://worldbrain.helprace.com/i67-feature-collections',
                        context: 'new-tab',
                    },
                    label: 'Learn More',
                },
            ],
        },
        system: {
            title: 'New Feature: Collections',
            message: 'Sort your favorite websites in useful lists',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url:
                            'https://worldbrain.helprace.com/i67-feature-collections',
                        context: 'new-tab',
                    },
                    label: 'Learn More',
                },
            ],
        },
        overview: {
            title: 'New Feature: Collections',
            message: 'Sort your favorite websites in useful lists',
            buttons: [
                {
                    action: {
                        type: actionTypes.OPEN_URL,
                        url:
                            'https://worldbrain.helprace.com/i67-feature-collections',
                        context: 'new-tab',
                    },
                    label: 'Learn More',
                },
            ],
        },
    },
]

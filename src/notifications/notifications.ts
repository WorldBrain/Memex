import { SHOULD_TRACK_STORAGE_KEY } from '../options/privacy/constants'

export interface ActionDefinition {
    /** Type of the button the button, it can be go-to-url etc. */
    type: string,
    /** Url of the button if the button is to open a new link */
    url?: string,
    /** It is used for open the new tab or self tab {new-tab|self} */
    context?: string,
    /** Key when we need to use the variable of the local storage */
    key?: string,
}

export interface ButtonDefinition {
    action?: ActionDefinition
    label: string
    primary?: boolean
}

export interface NotifDefinition {
    /** Should be unique (feature_name + notification + incNumber) */
    id: string
    /** Title of the notifications - Do not support html tags */
    title: string
    /** Message in the text - It supports html tags (for example h1, i, b) */
    message: string
    /** Buttons that will be present in the notifications
     * It can be any action button or link button
     */
    buttons?: ButtonDefinition[]
}

/** Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it */
export const releaseTime: number = 1532421254491

/**
 * Add New Notification Here
 * Add the new notification in {NOTIFS} array
 * There are some fields that are mandtory and some of them are optional
 * Fields and its description - * indicates that it is mandtory
 *      id* - Should be unique (feature_name + notification + incNumber)
 *      title* - Title of the notifications - Do not support html tags
 *      message* - Message in the text - It supports html tags (for example h1, i, b)
 *      releaseTime* - Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it
 */
export const NOTIFS: NotifDefinition[] = [
    {
        id: 'direct_links_inital_notification',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        buttons: [
            {
                action: {
                    type: 'go-to-url',
                    url: 'https://worldbrain.io',
                    context: 'new-tab'
                },
                label: 'Learn More',
            },
            {
                action: {
                    type: 'go-to-url',
                    url: 'https://memex.io',
                    context: 'new-tab'
                },
                label: 'Learn More',
            }
        ],
    },
    {
        id: 'tracking',
        title: 'New Feature: Internal Tracking + Custom Analytics',
        message:
            'Now we can track the uses of features if you have enabled the tracking, it is used for the improvement in the system. By this we can improve our system. Now you can also get some activity based notifications in which you can try different filters. You can also use the tags/domain. Domain has exclusion filter too.',
        buttons: [
            {
                action: {
                    type: 'toggle-storage-option',
                    key: SHOULD_TRACK_STORAGE_KEY,
                },
                label: 'Enable Tracking',
            },
            {
                action: {
                    type: 'go-to-url',
                    url: 'https://memex.io',
                    context: 'new-tab'
                },
                label: 'Learn More',
            }
        ],
    },
    {
        id: 'direct_links_inital_notification3',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification4',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification5',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification6',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest <h1>Message Test Message</h1> <i>Test Message</i> Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification7',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification8',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification9',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification10',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification11',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest <h1>Message Test Message</h1> <i>Test Message</i> Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification12',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification13',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification14',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification15',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification16',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest <h1>Message Test Message</h1> <i>Test Message</i> Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification17',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification18',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification19',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification20',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification21',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest <h1>Message Test Message</h1> <i>Test Message</i> Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification22',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification23',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification24',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
    {
        id: 'direct_links_inital_notification25',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
    },
]

interface ButtonDefinition {
    action?: any
    label: string
    primary?: boolean
}

interface NotifDefinition {
    id: string
    title: string
    message: string
    buttons?: ButtonDefinition[]
}

interface Notifs {
    releaseTime: number
    notifs: NotifDefinition[]
}


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
export const NOTIFS: Notifs = {
    releaseTime: 1531929627308,
    notifs: [
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
                        type: 'track-option-change',
                        key: true,
                    },
                    label: 'Enable Tracking',
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
    ]
}

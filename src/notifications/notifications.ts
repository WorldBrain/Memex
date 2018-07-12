interface NotifDefinition {
    id: string
    title: string
    message: string
    buttonText?: string
    link?: string
    sentTime: number
}


/**
 * Add New Notification Here
 * Add the new notification in {NOTIFS} array
 * There are some fields that are mandtory and some of them are optional
 * Fields and its description - * indicates that it is mandtory
 *      id* - Should be unique (feature_name + notification + incNumber)
 *      title* - Title of the notifications - Do not support html tags
 *      message* - Message in the text - It supports html tags (for example h1, i, b)
 *      sentTime* - Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it
 *      buttonText - If there is any link then text of button
 *      link - If there is any button then open link when click it
 */
export const NOTIFS: NotifDefinition[] = [
    {
        id: 'direct_links_inital_notification',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        buttonText: 'Learn More',
        link: 'https://worldbrain.io',
        sentTime: 1530786142840,
    },
    {
        id: 'direct_links_inital_notification2',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        buttonText: 'Learn More',
        link: 'https://worldbrain.io',
        sentTime: 1530786142840,
    },
    {
        id: 'direct_links_inital_notification3',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        buttonText: 'Learn More',
        link: 'https://worldbrain.io',
        sentTime: 1530786142840,
    },
    {
        id: 'direct_links_inital_notification4',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        buttonText: 'Learn More',
        link: 'https://worldbrain.io',
        sentTime: 1530786142840,
    },
    {
        id: 'direct_links_inital_notification5',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        buttonText: 'Learn More',
        link: 'https://worldbrain.io',
        sentTime: 1530786142840,
    },
    {
        id: 'direct_links_inital_notification6',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest <h1>Message Test Message</h1> <i>Test Message</i> Test Message Test Message Test Message Test Message Test Message Test Message ',
        buttonText: 'Learn More',
        link: 'https://worldbrain.io',
        sentTime: 1530793168585,
    },
    {
        id: 'direct_links_inital_notification7',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        sentTime: 1530793440987,
    },
    {
        id: 'direct_links_inital_notification8',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        sentTime: 1530804655282,
    },
    {
        id: 'direct_links_inital_notification9',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        sentTime: 1530804911894,
    },
    {
        id: 'direct_links_inital_notification10',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test MessageTest Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
        sentTime: 1530804911894,
    },
]

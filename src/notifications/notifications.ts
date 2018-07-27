import { SHOULD_TRACK_STORAGE_KEY } from '../options/privacy/constants'
import * as actionTypes from './action-types'

import { NotifDefinition } from './types'

/** Time when create the notif, get the current unix time (Date.now()) - Important, the notif insertation in db depends on it */
export const releaseTime: number = 1532421254491

export const NOTIFS: NotifDefinition[] = [
    {
        id: 'direct_links_inital_notification',
        title: 'New Feature: Memex.Link',
        message:
            'Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message Test Message ',
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
    {
        id: 'tracking',
        title: 'New Feature: Internal Tracking + Custom Analytics',
        message:
            'Now we can track the uses of features if you have enabled the tracking, it is used for the improvement in the system. By this we can improve our system. Now you can also get some activity based notifications in which you can try different filters. You can also use the tags/domain. Domain has exclusion filter too.',
        buttons: [
            {
                action: {
                    type: actionTypes.TOGGLE_SETTING,
                    key: SHOULD_TRACK_STORAGE_KEY,
                },
                label: 'Enable Tracking',
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

import { MenuOptions } from './types'
import { ONBOARDING_QUERY_PARAMS } from '../onboarding/constants'

export const menuItems: MenuOptions = [
    {
        text: 'Tutorials and FAQs',
        link: 'https://worldbrain.io/tutorials',
    },
    '-',
    {
        text: 'Onboarding Wizard',
        link: '#/overview?' + ONBOARDING_QUERY_PARAMS.NEW_USER,
    },
    '-',
    {
        text: 'GitHub',
        link: 'https://github.com/worldbrain/memex',
    },
    '-',
    {
        text: 'Community Forum',
        link: 'https://worldbrain.io/help',
    },
    '-',
    {
        text: 'Keyboard Shortcuts',
        link: '#/settings',
    },
    '-',
    {
        text: 'Changelog & Roadmap',
        link: 'https://worldbrain.io/changelog',
    },
    '-',
    {
        text: 'Terms & Privacy',
        link: 'https://worldbrain.io/tos',
        small: true,
    },
    '-',
    {
        text: 'Twitter - @worldbrain',
        link: 'https://twitter.com/worldbrain',
        small: true,
    },
    '-',
]

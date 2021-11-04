import { MenuOptions } from './types'
import { ONBOARDING_QUERY_PARAMS } from '../onboarding/constants'
import * as icons from 'src/common-ui/components/design-library/icons'

export const menuItems: MenuOptions = [
    {
        text: 'Chat with us',
        link:
            'https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599',
        icon: icons.commentFull,
        top: true,
    },
    '-',
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

import { MenuOptions } from './types'
import { ONBOARDING_QUERY_PARAMS } from '../onboarding/constants'
import * as icons from 'src/common-ui/components/design-library/icons'

export const menuItems: MenuOptions = [
    {
        text: 'Get Early Bird Discount',
        link: 'https://links.memex.garden/announcements/pioneer-plan',
        icon: icons.sunrise,
        top: true,
    },
    {
        text: 'Chat with us',
        link:
            'https://go.crisp.chat/chat/embed/?website_id=05013744-c145-49c2-9c84-bfb682316599',
        icon: icons.commentEmpty,
    },
    {
        text: 'Tutorials and FAQs',
        link: 'https://tutorials.memex.garden',
        icon: icons.helpIcon,
    },
    {
        text: 'Feature Requests & Bugs',
        link: 'https://links.memex.garden/feedback',
        icon: icons.sadFace,
    },
    {
        text: 'Community Forum',
        link: 'https://community.memex.garden',
        icon: icons.peopleFine,
    },
    {
        text: 'Keyboard Shortcuts',
        link: '#/settings',
        icon: icons.command,
    },
    {
        text: 'Changelog',
        link: 'https://worldbrain.io/changelog',
        icon: icons.clock,
    },

    {
        text: 'Terms & Privacy',
        link: 'https://links.memex.garden/privacy',
        icon: icons.shield,
    },
    {
        text: 'Twitter - @memexgarden',
        link: 'https://twitter.com/memexgarden',
        icon: icons.twitter,
    },
]

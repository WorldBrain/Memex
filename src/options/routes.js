import ImportContainer from './imports'
// import SettingsContainer from './containers/settings'
import BackupSettingsContainer from '../backup-restore/ui/backup-pane'
import Statistics from './statistics'
import Settings from './settings'
import UserScreen from 'src/authentication/components/UserScreen'
import React from 'react'
import DashboardResultsContainer from 'src/overview/components/DashboardResultsContainer'

export default [
    {
        name: 'Usage Statistics',
        pathname: '/statistics',
        component: Statistics,
        hideFromSidebar: true,
    },
    {
        name: 'Back to Dashboard',
        pathname: '/overview',
        component: DashboardResultsContainer,
        icon: 'home.svg',
        useOwnLayout: true,
    },
    {
        name: 'Settings',
        pathname: '/settings',
        component: Settings,
        icon: 'settings.svg',
    },
    {
        name: 'Import & Integrations',
        pathname: '/import',
        component: ImportContainer,
        icon: 'integrate.svg',
    },
    {
        name: 'Backup',
        pathname: '/backup',
        component: BackupSettingsContainer,
        icon: 'import.svg',
    },
    {
        name: 'My Account',
        pathname: '/account',
        component: UserScreen,
        icon: 'personFine.svg',
    },
    // {
    //     name: 'Blocklist',
    //     pathname: '/blocklist',
    //     component: SettingsContainer,
    //     icon: 'block.svg',
    // },
    // {
    //     name: 'Privacy',
    //     pathname: '/privacy',
    //     component: Privacy,
    //     icon: 'shield.svg',
    // },
    // {
    //     name: 'Memex Team',
    //     pathname: 'https://worldbrain.io/team',
    //     icon: 'team',
    //     isExternal: true,
    // },
    {
        name: 'Forum',
        pathname: 'https://worldbrain.io/help',
        icon: 'help.svg',
        isExternal: true,
    },
    {
        name: 'Tutorial',
        pathname: 'https://tutorials.memex.garden',
        isExternal: true,
        icon: 'info.svg',
    },
    // {
    //     name: 'Get Early Bird Discount',
    //     pathname: 'https://worldbrain.io/announcements/pioneer-plan',
    //     isExternal: true,
    //     icon: 'money.svg',
    // },
    {
        name: 'User Account',
        pathname: '/account',
        icon: 'settings.svg',
        component: UserScreen,
        hideFromSidebar: true,
    },
    {
        name: 'User Account',
        pathname: '/account-subscriptions',
        icon: 'settings.svg',
        component: (props) => (
            <UserScreen {...props} initiallyShowSubscriptionModal refreshUser />
        ),
        hideFromSidebar: true,
    },
]

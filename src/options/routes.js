import ImportContainer from './imports'
// import SettingsContainer from './containers/settings'
import BackupSettingsContainer from '../backup-restore/ui/backup-pane'
import Statistics from './statistics'
import Settings from './settings'
import UserScreen from 'src/authentication/components/UserScreen'
import Blocklist from './blacklist'
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
        icon: 'searchIcon',
        useOwnLayout: true,
    },
    {
        name: 'Settings',
        pathname: '/settings',
        component: Settings,
        icon: 'settings',
    },
    {
        name: 'Import & Integrations',
        pathname: '/import',
        component: ImportContainer,
        icon: 'integrate',
    },
    {
        name: 'Backup',
        pathname: '/backup',
        component: BackupSettingsContainer,
        icon: 'folder',
    },
    {
        name: 'My Account',
        pathname: '/account',
        component: UserScreen,
        icon: 'personFine',
    },
    {
        name: 'Blocklist',
        pathname: '/blocklist',
        component: Blocklist,
        icon: 'block',
    },
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
        icon: 'helpIcon',
        isExternal: true,
    },
    {
        name: 'Tutorial',
        pathname: 'https://tutorials.memex.garden',
        isExternal: true,
        icon: 'info',
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
        icon: 'settings',
        component: UserScreen,
        hideFromSidebar: true,
    },
    {
        name: 'User Account',
        pathname: '/account-subscriptions',
        icon: 'setting',
        component: (props) => (
            <UserScreen {...props} initiallyShowSubscriptionModal refreshUser />
        ),
        hideFromSidebar: true,
    },
]

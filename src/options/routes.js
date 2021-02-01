import ImportContainer from './imports'
import SettingsContainer from './containers/settings'
import BackupSettingsContainer from '../backup-restore/ui/backup-pane'
import Privacy from './privacy'
import Statistics from './statistics'
import Settings from './settings'
import UserScreen from '../authentication/components/UserScreen'
import React from 'react'
import SyncDevicesPaneContainer from '../sync/components/device-list/SyncDevicesPane'
import DashboardResultsContainer from 'src/overview/components/DashboardResultsContainer'
import BetaFeaturesScreen from 'src/features/ui/components/BetaFeaturesScreen'
import Reader from 'src/reader/components/Reader'

export default [
    {
        name: 'Usage Statistics',
        pathname: '/statistics',
        component: Statistics,
        hideFromSidebar: true,
    },
    {
        name: 'Home',
        pathname: '/overview',
        component: DashboardResultsContainer,
        icon: 'home',
        useOwnLayout: true,
    },
    {
        name: 'PDF Reader',
        pathname: '/read',
        component: Reader,
        icon: 'settings',
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
        icon: 'import',
    },
    {
        name: 'Backup & Restore',
        pathname: '/backup',
        component: BackupSettingsContainer,
        icon: 'backup',
    },
    {
        name: 'Sync',
        pathname: '/sync',
        component: SyncDevicesPaneContainer,
        icon: 'sync',
    },
    {
        name: 'Beta Features',
        pathname: '/features',
        icon: 'settings',
        component: BetaFeaturesScreen,
    },
    {
        name: 'Blocklist',
        pathname: '/blocklist',
        component: SettingsContainer,
        icon: 'block',
    },
    {
        name: 'Privacy',
        pathname: '/privacy',
        component: Privacy,
        icon: 'privacy',
    },
    // {
    //     name: 'Memex Team',
    //     pathname: 'https://worldbrain.io/team',
    //     icon: 'team',
    //     isExternal: true,
    // },
    {
        name: 'Help',
        pathname: 'https://worldbrain.io/help',
        icon: 'help',
        isExternal: true,
    },
    {
        name: 'Tutorial',
        pathname: 'https://worldbrain.io/tutorials',
        isExternal: true,
        icon: 'info',
    },
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
        icon: 'settings',
        component: (props) => (
            <UserScreen {...props} initiallyShowSubscriptionModal refreshUser />
        ),
        hideFromSidebar: true,
    },
]

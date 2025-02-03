import ImportContainer from './imports'
// import SettingsContainer from './containers/settings'
import BackupSettingsContainer from '../backup-restore/ui/backup-pane'
import Settings from './settings'
import UserScreen from 'src/authentication/components/UserScreen'
import Blocklist from './blacklist'
import React from 'react'
import DashboardResultsContainer from 'src/overview/components/DashboardResultsContainer'
import BetaFeaturesSettings from 'src/beta-features/ui/containers/beta-features-settings'
import Changelog from 'src/changelog/ui/containers/changelog'

export default [
    {
        name: 'Back to Dashboard',
        pathname: '/overview',
        component: (props) => <DashboardResultsContainer {...props} />,
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
        name: 'Blocklist',
        pathname: '/blocklist',
        component: Blocklist,
        icon: 'block',
    },
    {
        name: null,
        icon: null,
    },
    {
        name: 'My Account',
        pathname: '/account',
        component: UserScreen,
        icon: 'personFine',
    },

    {
        name: 'Beta Features',
        pathname: '/betaFeatures',
        component: BetaFeaturesSettings,
        icon: 'stars',
    },
    {
        name: 'Feedback',
        pathname: '/feedback',
        component: (props) => <Changelog mode="feedback" {...props} />,
        icon: 'sadFace',
    },
    {
        name: 'Changelog/Roadmap',
        pathname: '/changelog',
        component: (props) => <Changelog mode="changelog" {...props} />,
        icon: 'clock',
    },

    {
        name: 'User Account',
        pathname: '/account',
        icon: 'settings',
        component: UserScreen,
        hideFromSidebar: true,
    },
]

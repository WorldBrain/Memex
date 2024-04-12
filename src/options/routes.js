import ImportContainer from './imports'
// import SettingsContainer from './containers/settings'
import BackupSettingsContainer from '../backup-restore/ui/backup-pane'
import Settings from './settings'
import UserScreen from 'src/authentication/components/UserScreen'
import Blocklist from './blacklist'
import React from 'react'
import DashboardResultsContainer from 'src/overview/components/DashboardResultsContainer'

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
    {
        name: 'Feedback',
        pathname: 'https://feedback.memex.garden',
        icon: 'helpIcon',
        isExternal: true,
    },
    {
        name: 'Tutorial',
        pathname: 'https://tutorials.memex.garden/tutorials',
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
        icon: 'setting',
        component: (props) => (
            <UserScreen
                {...props}
                initiallyShowSubscriptionModal
                refreshUser
                bgScriptBG={this.props.bgScriptBG}
            />
        ),
        hideFromSidebar: true,
    },
]

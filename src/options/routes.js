import ImportContainer from './imports'
import SettingsContainer from './containers/settings'
import NotificationsContainer from './containers/notifications'

export default [
    {
        name: 'Import',
        pathname: '/import',
        component: ImportContainer,
    },
    {
        name: 'Settings',
        pathname: '/settings',
        component: SettingsContainer,
    },
    {
        name: 'Notifications',
        pathname: '/notifications',
        component: NotificationsContainer,
    },
]

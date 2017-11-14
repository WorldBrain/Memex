import ImportContainer from './imports'
import SettingsContainer from './containers/settings'
import Privacy from './privacy/index'
import Help from './help/index'
import Acknowledgements from './acknowledgement/components/content'
import Tutorial from './tutorial'
import NewInstall from './new-install'
import NotificationsContainer from './containers/notifications'

export default [
    {
        name: 'New install',
        pathname: '/new_install',
        component: NewInstall,
        hideSidebar: true,
        hideFromSidebar: true,
    },
    {
        name: 'Go back to Search',
        pathname: '/overview/overview.html',
        component: 'faq',
        icon: 'search',
    },
    {
        name: 'Import',
        pathname: '/import',
        component: ImportContainer,
        icon: 'file_download',
    },
    {
        name: 'Blacklist',
        pathname: '/blacklist',
        component: SettingsContainer,
        icon: 'block',
    },
    {
        name: 'Privacy',
        pathname: '/privacy',
        component: Privacy,
        icon: 'security',
    },
    {
        name: 'Acknowledgements',
        pathname: '/acknowledgements',
        component: Acknowledgements,
        icon: 'perm_identity',
    },
    {
        name: 'Help Me Please',
        pathname: '/help',
        component: Help,
        icon: 'help',
    },
    {
        name: 'Tutorial',
        pathname: '/tutorial',
        component: Tutorial,
        icon: 'info',
    },
    {
        name: 'Notifications',
        pathname: '/notifications',
        component: NotificationsContainer,
    },
]

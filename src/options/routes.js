import ImportContainer from './imports'
import SettingsContainer from './containers/settings'
import Privacy from './privacy'
import Help from './help/index'
import Acknowledgements from './acknowledgement/components/content'
import Tutorial from './tutorial'
import About from './about'
import Vision from './vision'
import Changelog from './changelog'
import NewInstall from './new-install'
import Statistics from './statistics'

export default [
    {
        name: 'New install',
        pathname: '/new_install',
        component: NewInstall,
        hideSidebar: true,
        hideFromSidebar: true,
        exact: false,
    },
    {
        name: 'Usage Statistics',
        pathname: '/statistics',
        component: Statistics,
        hideFromSidebar: true,
        exact: false,
    },
    {
        name: 'Go back to Search',
        pathname: '/overview/overview.html',
        component: 'faq',
        icon: 'search',
        exact: false,
    },
    {
        name: 'Import History & Bookmarks',
        pathname: '/import',
        component: ImportContainer,
        icon: 'file_download',
        exact: false,
    },
    {
        name: 'Blacklist',
        pathname: '/blacklist',
        component: SettingsContainer,
        icon: 'block',
        exact: false,
    },
    {
        name: 'Privacy',
        pathname: '/privacy',
        component: Privacy,
        icon: 'security',
        exact: false,
    },
    {
        name: 'Help Me Please',
        pathname: '/help',
        component: Help,
        icon: 'help',
        exact: false,
    },
    {
        name: 'Tutorial',
        pathname: '/tutorial',
        component: Tutorial,
        icon: 'info',
        exact: false,
    },
    {
        name: 'About',
        pathname: '/about',
        component: About,
        exact: true,
        icon: 'info',
        subRoutes: [
            {
                name: 'Vision',
                pathname: '/vision',
                component: Vision,
                subLink: true,
                hideFromSidebar: true,
                exact: false,
            },
            {
                name: 'Changelog',
                pathname: '/changelog',
                component: Changelog,
                subLink: true,
                hideFromSidebar: true,
                exact: false,
            },
            {
                name: 'Acknowledgements',
                pathname: '/acknowledgements',
                component: Acknowledgements,
                // icon: 'perm_identity',
                subLink: true,
                hideFromSidebar: true,
                exact: false,
            },
        ],
    },
]

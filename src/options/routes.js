import ImportContainer from './imports'
import SettingsContainer from './containers/settings'
import Privacy from './privacy'
import Acknowledgements from './acknowledgement/components/content'
import Tutorial from './tutorial'
import Statistics from './statistics'
import SearchInjection from './search-injection'

export default [
    {
        name: 'Usage Statistics',
        pathname: '/statistics',
        component: Statistics,
        hideFromSidebar: true,
    },
    {
        name: 'Go back to Search',
        pathname: '/overview/overview.html',
        component: 'faq',
        icon: 'search',
    },
    {
        name: 'Import History & Bookmarks',
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
        name: 'Show Memex alongside Google',
        pathname: '/search-injection',
        component: SearchInjection,
        icon: 'search',
    },
    {
        name: 'Acknowledgements',
        pathname: '/acknowledgements',
        component: Acknowledgements,
        icon: 'perm_identity',
    },
    {
        name: 'Help Me Please',
        pathname: 'https://worldbrain.io/help',
        component: 'faq',
        icon: 'help',
    },
    {
        name: 'Tutorial',
        pathname: '/tutorial',
        component: Tutorial,
        icon: 'info',
    },
]

import ImportContainer from './imports'
import SettingsContainer from './containers/settings'
import PrivacyContainer from './privacy/index'

export default [
    {
        name: 'Import',
        pathname: '/import',
        component: ImportContainer,
        icon: 'file_download',
    },
    {
        name: 'Settings',
        pathname: '/settings',
        component: SettingsContainer,
        icon: 'settings',
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
        component: PrivacyContainer,
        icon: 'security',
    },
    {
        name: 'Acknowledgements',
        pathname: '/acknowledgements',
        component: SettingsContainer,
        icon: 'archive',
    },
    {
        name: 'Help Me Please',
        pathname: '/faq',
        component: SettingsContainer,
        icon: 'help',
    },
]

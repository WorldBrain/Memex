import ImportContainer from './imports'
import SettingsContainer from './containers/settings'

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
]

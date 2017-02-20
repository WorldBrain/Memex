import ImportContainer from './containers/import';
import SettingsContainer from './containers/settings';

export default [
    {
        name: 'Import',
        pathname: '/import',
        component: ImportContainer
    },
    {
        name: 'Settings',
        pathname: '/settings',
        component: SettingsContainer
    }
];

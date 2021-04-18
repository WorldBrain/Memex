export function getKeyName(params: {
    navigatorAPI?: Navigator
    key: 'mod' | 'alt'
}): string {
    const { platform } = params.navigatorAPI ?? window.navigator

    if (platform.startsWith('Mac')) {
        switch (params.key) {
            case 'alt':
                return 'option'
            case 'mod':
            default:
                return 'cmd'
        }
    }

    switch (params.key) {
        case 'alt':
            return 'alt'
        case 'mod':
        default:
            return 'ctrl'
    }
}

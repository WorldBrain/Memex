function getBaseUrl() {
    return process.env.NODE_ENV === 'production'
        ? `https://memex.social`
        : `https://staging.memex.social`
}

export function getListShareUrl(options: { remoteListId: string }) {
    return `${getBaseUrl()}/c/${options.remoteListId}`
}

export function getPageShareUrl(options: { remotePageInfoId: string }) {
    return `${getBaseUrl()}/p/${options.remotePageInfoId}`
}

export function getNoteShareUrl(options: { remoteAnnotationId: string }) {
    return `${getBaseUrl()}/a/${options.remoteAnnotationId}`
}

export function isShareUrl(url: string) {
    return url.startsWith(getBaseUrl())
}

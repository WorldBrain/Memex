import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'

function getBaseUrl() {
    if (process.env.NODE_ENV === 'production') {
        return `https://memex.social`
    }
    if (process.env.USE_FIREBASE_EMULATOR === 'true') {
        return 'http://localhost:3000'
    }
    return `https://staging.memex.social`
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

export function getFeedUrl() {
    return `${getBaseUrl()}/feed`
}

export function isShareUrl(url: string) {
    return url.startsWith(getBaseUrl())
}

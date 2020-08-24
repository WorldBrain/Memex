import { getLocalStorage, setLocalStorage } from 'src/util/storage'

export const LAST_SHARED_ANNOTS =
    '@ContentSharing-last-shared-annotation-timestamp'

export const generateUrl = (params: { pageUrl: string; now: () => number }) => {
    const { pageUrl, now } = params
    return `${pageUrl}/#${now()}`
}

export const getLastSharedAnnotationTimestamp = (): Promise<
    number | undefined
> => getLocalStorage(LAST_SHARED_ANNOTS)

export const setLastSharedAnnotationTimestamp = (
    timestamp = Date.now(),
): Promise<void> => setLocalStorage(LAST_SHARED_ANNOTS, timestamp)

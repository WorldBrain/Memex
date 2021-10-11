import { CLOUD_SYNCED_COLLECTIONS } from 'src/personal-cloud/background/constants'

export { STORAGE_VERSIONS } from '@worldbrain/memex-common/lib/browser-extension/storage/versions'

export const PERSISTENT_STORAGE_VERSIONS = {
    0: { version: new Date('2021-06-24') },
}

export const WATCHED_COLLECTIONS = [...CLOUD_SYNCED_COLLECTIONS]

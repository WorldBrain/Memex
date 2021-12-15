import { COLLECTION_NAMES as PAGES_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/pages/constants'
import { COLLECTION_NAMES as TAGS_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/tags/constants'
import { COLLECTION_NAMES as LISTS_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import { COLLECTION_NAMES as ANNOTATIONS_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/annotations/constants'
import { COLLECTION_NAMES as TEMPLATE_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/storage/modules/copy-paster/constants'
import { COLLECTION_NAMES as SHARING_COLLECTION_NAMES } from '@worldbrain/memex-common/lib/content-sharing/client-storage'
import { COLLECTION_NAMES as SETTINGS_COLLECTION_NAMES } from 'src/sync-settings/background/constants'

export const PASSIVE_DATA_CUTOFF_DATE = new Date('2019-09-09')

export const PERSONAL_CLOUD_ACTION_RETRY_INTERVAL = 1000 * 60 * 5

export const CLOUD_SYNCED_COLLECTIONS: string[] = [
    PAGES_COLLECTION_NAMES.bookmark,
    PAGES_COLLECTION_NAMES.visit,
    PAGES_COLLECTION_NAMES.page,
    PAGES_COLLECTION_NAMES.locator,
    TAGS_COLLECTION_NAMES.tag,
    LISTS_COLLECTION_NAMES.list,
    LISTS_COLLECTION_NAMES.listEntry,
    SETTINGS_COLLECTION_NAMES.settings,
    TEMPLATE_COLLECTION_NAMES.templates,
    ANNOTATIONS_COLLECTION_NAMES.annotation,
    ANNOTATIONS_COLLECTION_NAMES.listEntry,
    SHARING_COLLECTION_NAMES.annotationPrivacy,
    SHARING_COLLECTION_NAMES.listMetadata,
    SHARING_COLLECTION_NAMES.annotationMetadata,
]

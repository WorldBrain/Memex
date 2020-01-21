import { CollectionDefinitionMap } from '@worldbrain/storex'
import { COLLECTION_DEFINITIONS as PAGE_COLLECTION_DEFINITIONS } from '@worldbrain/memex-storage/lib/pages/constants'

// TODO: move these declarations to own feature storage classes
export default {
    ...PAGE_COLLECTION_DEFINITIONS,
} as CollectionDefinitionMap

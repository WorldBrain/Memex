import { CollectionDefinitionMap } from '@worldbrain/storex'
import { tagCollectionDefinition } from '@worldbrain/memex-storage/lib/tags/constants'
import {
    pageCollectionDefinition,
    visitCollectionDefinition,
    favIconCollectionDefinition,
} from '@worldbrain/memex-storage/lib/pages/constants'

// TODO: move these declarations to own feature storage classes
export default {
    ...pageCollectionDefinition,
    ...visitCollectionDefinition,
    ...favIconCollectionDefinition,
    ...tagCollectionDefinition,
} as CollectionDefinitionMap

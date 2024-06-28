import type {
    RemoteFunctionRole,
    RemotePositionalFunction,
    RemoteFunction,
} from 'src/util/webextensionRPC'
import type { Annotation } from 'src/annotations/types'
import type { AnnotSearchParams } from 'src/search/background/types'
import type { Anchor } from 'src/highlighting/types'
import type { SharedAnnotationReference } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { SharedAnnotationWithRefs } from '../types'
import { HighlightColor } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/types'

export interface AnnotationInterface<Role extends RemoteFunctionRole> {
    getAllAnnotationsByUrl: RemotePositionalFunction<
        Role,
        [AnnotSearchParams] | [AnnotSearchParams, boolean],
        Annotation[]
    >
    listAnnotationsByPageUrl: RemoteFunction<
        Role,
        {
            pageUrl: string
            withTags?: boolean
            withLists?: boolean
            withBookmarks?: boolean
        },
        Array<Annotation & { createdWhen?: number; lastEdited?: number }>
    >
    listAnnotationIdsByColor: RemoteFunction<
        Role,
        {
            color: string
        },
        Array<Annotation>
    >
    createAnnotation: RemotePositionalFunction<
        Role,
        | [CreateAnnotationParams]
        | [CreateAnnotationParams, { skipPageIndexing?: boolean }],
        string // Returns unique annotation URL
    >
    updateAnnotationBookmark: RemotePositionalFunction<
        Role,
        [{ url: string; isBookmarked: boolean }],
        string
    >
    editAnnotation: RemotePositionalFunction<
        Role,
        [string, string, HighlightColor['id'] | string, string],
        any
    >
    updateAnnotationTags: RemotePositionalFunction<
        Role,
        [{ url: string; tags: string[] }] | [string, string],
        any
    >
    editAnnotationTags: RemoteFunction<
        Role,
        {
            tagsToBeAdded: string[]
            tagsToBeDeleted: string[]
            url: string
        },
        any
    >
    deleteAnnotation: RemotePositionalFunction<
        Role,
        [string] | [string, boolean],
        any
    >
    getAnnotationTags: RemotePositionalFunction<Role, any[], any>
    addAnnotationTag: RemotePositionalFunction<Role, any[], any>
    delAnnotationTag: RemotePositionalFunction<Role, any[], any>
    toggleSidebarOverlay: RemoteFunction<
        Role,
        { unifiedAnnotationId: string },
        any
    >
    toggleAnnotBookmark: RemotePositionalFunction<Role, any[], any>
    getAnnotBookmark: RemotePositionalFunction<Role, any[], any>
    getAnnotationByPk: RemotePositionalFunction<Role, any[], any>
    getListIdsForAnnotation: RemotePositionalFunction<
        Role,
        [{ annotationId: string }],
        number[]
    >
    getSharedAnnotations: RemotePositionalFunction<
        Role,
        [
            {
                sharedAnnotationReferences: SharedAnnotationReference[]
                withCreatorData?: boolean
            },
        ],
        Array<SharedAnnotationWithRefs>
    >
}

export interface CreateAnnotationParams {
    url?: string
    pageUrl: string
    title?: string
    comment?: string
    body?: string
    color?: HighlightColor['id']
    selector?: Anchor
    isBookmarked?: boolean
    isSocialPost?: boolean
    createdWhen?: Date
}

import {
    RemoteFunctionRole,
    RemotePositionalFunction,
    RemoteFunction,
} from 'src/util/webextensionRPC'
import { Annotation } from 'src/annotations/types'
import { AnnotSearchParams } from 'src/search/background/types'
import { Anchor } from 'src/highlighting/types'

export interface AnnotationInterface<Role extends RemoteFunctionRole> {
    createDirectLink: RemotePositionalFunction<Role, any[], any>
    getAllAnnotationsByUrl: RemotePositionalFunction<
        Role,
        [AnnotSearchParams] | [AnnotSearchParams, boolean],
        Annotation[]
    >
    listAnnotationsByPageUrl: RemoteFunction<
        Role,
        { pageUrl: string },
        Annotation[]
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
        [string, string, boolean] | [string, string],
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
    followAnnotationRequest: RemotePositionalFunction<Role, any[], any>
    toggleSidebarOverlay: RemoteFunction<Role, { activeUrl: string }, any>
    toggleAnnotBookmark: RemotePositionalFunction<Role, any[], any>
    getAnnotBookmark: RemotePositionalFunction<Role, any[], any>
    insertAnnotToList: RemotePositionalFunction<Role, any[], any>
    removeAnnotFromList: RemotePositionalFunction<Role, any[], any>
    goToAnnotationFromSidebar: RemoteFunction<
        Role,
        {
            url: string
            annotation: Annotation
        },
        void
    >
}

export interface CreateAnnotationParams {
    url?: string
    pageUrl: string
    title?: string
    comment?: string
    body?: string
    selector?: Anchor
    isBookmarked?: boolean
    isSocialPost?: boolean
    createdWhen?: Date
}

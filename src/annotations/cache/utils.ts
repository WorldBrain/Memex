import type {
    FollowedList,
    RemotePageActivityIndicatorInterface,
} from 'src/page-activity-indicator/background/types'
import type {
    PageList,
    RemoteCollectionsInterface,
} from 'src/custom-lists/background/types'
import type { Annotation } from '../types'
import type {
    PageAnnotationsCacheInterface,
    UnifiedAnnotation,
    UnifiedAnnotationForCache,
    UnifiedList,
    UnifiedListForCache,
} from './types'
import { shareOptsToPrivacyLvl } from '../utils'
import { normalizeUrl } from '@worldbrain/memex-url-utils'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { AnnotationInterface } from '../background/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'

export const reshapeAnnotationForCache = (
    annot: Annotation,
    opts: {
        extraData?: Partial<UnifiedAnnotation>
        /** Generally only makes sense for test assertions - local list IDs will be mapped to cache IDs internally */
        excludeLocalLists?: boolean
    },
): UnifiedAnnotationForCache => {
    const createdWhen = annot.createdWhen?.getTime()
    if (createdWhen == null) {
        throw new Error(
            'Cannot reshape annotation missing createdWhen timestamp',
        )
    }
    return {
        localId: annot.url,
        unifiedListIds: opts.extraData?.unifiedListIds ?? [],
        body: annot.body,
        comment: annot.comment,
        selector: annot.selector,
        creator: opts.extraData?.creator,
        localListIds: opts.excludeLocalLists ? undefined : annot.lists,
        normalizedPageUrl: annot.pageUrl,
        lastEdited: annot.lastEdited?.getTime() ?? createdWhen,
        createdWhen,
        privacyLevel: shareOptsToPrivacyLvl({
            shouldShare: annot.isShared,
            isBulkShareProtected: annot.isBulkShareProtected,
        }),
        ...(opts.extraData ?? {}),
    }
}

// export const reshapeCacheAnnotation = (
//     annot: UnifiedAnnotation & Required<Pick<UnifiedAnnotation, 'localId'>>,
// ): Annotation => ({
//     url: annot.localId,
//     pageUrl: annot.normalizedPageUrl,
//     body: annot.body,
//     comment: annot.comment,
//     selector: annot.selector,
//     isShared: annot.isShared,
//     isBulkShareProtected: annot.isBulkShareProtected,
//     lastEdited: new Date(annot.lastEdited),
//     createdWhen: new Date(annot.createdWhen),
//     lists: [],
//     tags: [],
// })

export const reshapeLocalListForCache = (
    list: PageList,
    opts: {
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => ({
    name: list.name,
    localId: list.id,
    remoteId: list.remoteId,
    creator: opts.extraData?.creator,
    description: list.description,
    unifiedAnnotationIds: [],
    ...(opts.extraData ?? {}),
})

export const reshapeFollowedListForCache = (
    list: FollowedList,
    opts: {
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => ({
    name: list.name,
    localId: undefined,
    remoteId: list.sharedList.toString(),
    creator: { type: 'user-reference', id: list.creator },
    description: undefined,
    unifiedAnnotationIds: [],
    ...(opts.extraData ?? {}),
})

// NOTE: this is tested as part of the sidebar logic tests
export async function hydrateCache({
    bgModules,
    ...args
}: {
    fullPageUrl: string
    user: UserReference
    cache: PageAnnotationsCacheInterface
    bgModules: {
        pageActivityIndicator: RemotePageActivityIndicatorInterface
        contentSharing: ContentSharingInterface
        annotations: AnnotationInterface<'caller'>
        customLists: RemoteCollectionsInterface
    }
}): Promise<void> {
    const localListsData = await bgModules.customLists.fetchAllLists({})
    const remoteListIds = await bgModules.contentSharing.getRemoteListIds({
        localListIds: localListsData.map((list) => list.id),
    })
    const followedListsData = await bgModules.pageActivityIndicator.getPageFollowedLists(
        args.fullPageUrl,
    )
    const pageSharedListIds = (
        await bgModules.customLists.fetchPageLists({
            url: args.fullPageUrl,
        })
    ).filter((listId) => remoteListIds[listId] != null)
    const seenFollowedLists = new Set<AutoPk>()

    const listsToCache = localListsData.map((list) => {
        let creator: UserReference
        const remoteId = remoteListIds[list.id]
        if (remoteId != null && followedListsData[remoteId]) {
            seenFollowedLists.add(followedListsData[remoteId].sharedList)
            creator = {
                type: 'user-reference',
                id: followedListsData[remoteId].creator,
            }
        }
        return reshapeLocalListForCache(list, {
            extraData: {
                remoteId,
                creator,
            },
        })
    })

    // Ensure we cover any followed-only lists (no local data)
    Object.values(followedListsData)
        .filter((list) => !seenFollowedLists.has(list.sharedList))
        .forEach((list) =>
            listsToCache.push(reshapeFollowedListForCache(list, {})),
        )

    args.cache.setLists(listsToCache)

    const annotationsData = await bgModules.annotations.listAnnotationsByPageUrl(
        {
            pageUrl: args.fullPageUrl,
            withLists: true,
        },
    )

    const privacyLvlsByAnnot = await bgModules.contentSharing.findAnnotationPrivacyLevels(
        { annotationUrls: annotationsData.map((annot) => annot.url) },
    )

    args.cache.setAnnotations(
        normalizeUrl(args.fullPageUrl),
        annotationsData.map((annot) => {
            const privacyLevel = privacyLvlsByAnnot[annot.url]

            // Inherit parent page shared lists if public annot
            if (privacyLevel >= AnnotationPrivacyLevels.SHARED) {
                annot.lists.push(...pageSharedListIds)
            }

            return reshapeAnnotationForCache(annot, {
                extraData: {
                    creator: args.user,
                    privacyLevel,
                },
            })
        }),
    )
}

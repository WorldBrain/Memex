import type {
    FollowedList,
    FollowedListEntry,
} from 'src/page-activity-indicator/background/types'
import type { PageList } from 'src/custom-lists/background/types'
import type { Annotation, SharedAnnotationWithRefs } from '../types'
import type {
    PageAnnotationsCacheInterface,
    RGBAColor,
    UnifiedAnnotation,
    UnifiedAnnotationForCache,
    UnifiedList,
    UnifiedListForCache,
} from './types'
import { shareOptsToPrivacyLvl } from '../utils'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { AnnotationPrivacyLevels } from '@worldbrain/memex-common/lib/annotations/types'
import type { UserReference } from '@worldbrain/memex-common/lib/web-interface/types/users'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import { normalizedStateToArray } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { SPECIAL_LIST_IDS } from '@worldbrain/memex-common/lib/storage/modules/lists/constants'
import type { SharedListEntry } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { BackgroundModuleRemoteInterfaces } from 'src/background-script/types'
import type { SharedListMetadata } from 'src/content-sharing/background/types'
import { DEFAULT_KEY } from '@worldbrain/memex-common/lib/utils/item-ordering'
import { createSyncSettingsStore } from 'src/sync-settings/util'
import { HIGHLIGHT_COLORS_DEFAULT } from '@worldbrain/memex-common/lib/common-ui/components/highlightColorPicker/constants'

export const reshapeAnnotationForCache = (
    annot: Annotation & {
        createdWhen?: Date | number
        lastEdited?: Date | number
    },
    opts: {
        extraData?: Partial<UnifiedAnnotation>
        /** Generally only used for test assertions - local list IDs will be mapped to cache IDs internally */
        excludeLocalLists?: boolean
    },
): UnifiedAnnotationForCache => {
    if (annot.createdWhen == null) {
        throw new Error(
            'Cannot reshape annotation missing createdWhen timestamp',
        )
    }
    const createdWhen =
        typeof annot.createdWhen === 'number'
            ? annot.createdWhen
            : annot.createdWhen.getTime()
    const lastEdited =
        annot.lastEdited == null
            ? createdWhen
            : typeof annot.lastEdited === 'number'
            ? annot.lastEdited
            : annot.lastEdited.getTime()
    return {
        localId: annot.url,
        remoteId: undefined,
        unifiedListIds: opts.extraData?.unifiedListIds ?? [],
        body: annot.body,
        comment: annot.comment,
        selector: annot.selector,
        creator: opts.extraData?.creator,
        localListIds: opts.excludeLocalLists ? undefined : annot.lists,
        normalizedPageUrl: annot.pageUrl,
        lastEdited,
        createdWhen,
        privacyLevel: shareOptsToPrivacyLvl({
            shouldShare: annot.isShared,
            isBulkShareProtected: annot.isBulkShareProtected,
        }),
        color: annot.color as RGBAColor,
        ...(opts.extraData ?? {}),
    }
}

export const reshapeSharedAnnotationForCache = (
    annot: Omit<SharedAnnotationWithRefs, 'creator'>,
    opts: {
        extraData?: Partial<UnifiedAnnotation>
        /** Generally only used test assertions - local list IDs will be mapped to cache IDs internally */
        excludeLocalLists?: boolean
    },
): UnifiedAnnotationForCache => {
    return {
        localId: undefined,
        remoteId: annot.reference.id.toString(),
        unifiedListIds: opts.extraData?.unifiedListIds ?? [],
        body: annot.body,
        comment: annot.comment,
        selector: annot.selector,
        creator: annot.creatorReference,
        localListIds: opts.excludeLocalLists ? undefined : [],
        normalizedPageUrl: annot.normalizedPageUrl,
        lastEdited: annot.updatedWhen,
        createdWhen: annot.createdWhen,
        privacyLevel: AnnotationPrivacyLevels.SHARED,
        color: annot.color as RGBAColor,
        ...(opts.extraData ?? {}),
    }
}

export const reshapeLocalListForCache = (
    list: PageList,
    opts: {
        hasRemoteAnnotations?: boolean
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => {
    let type: UnifiedList['type'] = 'user-list'
    if (list.type === 'page-link') {
        type = 'page-link'
    } else if (Object.values(SPECIAL_LIST_IDS).includes(list.id)) {
        type = 'special-list'
    }

    return {
        type,
        name: list.name,
        order: list.order,
        localId: list.id,
        remoteId: list.remoteId,
        creator: opts.extraData?.creator,
        description: list.description,
        unifiedAnnotationIds: [],
        hasRemoteAnnotationsToLoad: !!opts.hasRemoteAnnotations,
        parentUnifiedId: null, // NOTE: this will be derived inside cache add logic
        parentLocalId: list.parentListId,
        pathLocalIds: list.pathListIds,
        ...(opts.extraData ?? {}),
    }
}

export const reshapeFollowedListForCache = (
    list: FollowedList,
    opts: {
        hasRemoteAnnotations?: boolean
        extraData?: Partial<UnifiedList>
    },
): UnifiedListForCache => ({
    name: list.name,
    // TODO: Are followed page links a thing? If so there's no easy way to distinguish them here
    type: 'user-list',
    localId: undefined,
    remoteId: list.sharedList.toString(),
    creator: { type: 'user-reference', id: list.creator },
    description: undefined,
    unifiedAnnotationIds: [],
    hasRemoteAnnotationsToLoad: !!opts.hasRemoteAnnotations,
    parentUnifiedId: null,
    parentLocalId: null,
    order: DEFAULT_KEY,
    ...(opts.extraData ?? {}),
})

export const getUserAnnotationsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
    normalizedPageUrl: string,
    userId?: string,
): UnifiedAnnotation[] =>
    normalizedStateToArray(cache.annotations).filter(
        (annot) =>
            annot.normalizedPageUrl === normalizedPageUrl &&
            (annot.creator == null ||
                (userId ? annot.creator.id === userId : false)),
    )

export const getHighlightAnnotationsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
): UnifiedAnnotation[] =>
    normalizedStateToArray(cache.annotations).filter((a) => a.body?.length > 0)

export const getUserHighlightsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
    userId?: string,
): UnifiedAnnotation[] =>
    getHighlightAnnotationsArray(cache).filter(
        (annot) =>
            annot.creator == null ||
            (userId ? annot.creator.id === userId : false),
    )

export const getListHighlightsArray = (
    cache: Pick<PageAnnotationsCacheInterface, 'annotations'>,
    listId: UnifiedList['unifiedId'],
): UnifiedAnnotation[] =>
    getHighlightAnnotationsArray(cache).filter((annot) =>
        annot.unifiedListIds.includes(listId),
    )

export const getLocalListIdsForCacheIds = (
    cache: Pick<PageAnnotationsCacheInterface, 'lists'>,
    cacheIds: string[],
): number[] =>
    cacheIds
        .map((listId) => cache.lists.byId[listId]?.localId)
        .filter((id) => id != null)

interface CacheHydratorDeps<
    T extends keyof BackgroundModuleRemoteInterfaces<'caller'>
> {
    user?: UserReference
    cache: PageAnnotationsCacheInterface
    bgModules: Pick<BackgroundModuleRemoteInterfaces<'caller'>, T>
}

// NOTE: this is tested as part of the sidebar logic tests
export async function hydrateCacheForPageAnnotations(
    args: CacheHydratorDeps<
        | 'bgScript'
        | 'customLists'
        | 'annotations'
        | 'syncSettings'
        | 'contentSharing'
        | 'pageActivityIndicator'
    > & {
        fullPageUrl: string
        skipListHydration?: boolean
        keepExistingAnnotationData?: boolean
    },
): Promise<void> {
    if (!args.skipListHydration) {
        const localListsData = await args.bgModules.customLists.fetchAllLists({
            includeTreeData: true,
        })
        const listMetadata = await args.bgModules.contentSharing.getListShareMetadata(
            {
                localListIds: localListsData.map((list) => list.id),
            },
        )
        const followedListsData = await args.bgModules.pageActivityIndicator.getPageFollowedLists(
            args.fullPageUrl,
            Object.values(listMetadata).map((metadata) => metadata.remoteId),
        )

        await hydrateCacheLists({
            listMetadata,
            localListsData,
            followedListsData,
            ...args,
        })
    }

    const annotationsData = await args.bgModules.annotations.listAnnotationsByPageUrl(
        {
            pageUrl: args.fullPageUrl,
            withLists: true,
        },
    )

    const annotationUrls = annotationsData.map((annot) => annot.url)
    const privacyLvlsByAnnot = await args.bgModules.contentSharing.findAnnotationPrivacyLevels(
        { annotationUrls },
    )
    const remoteIdsByAnnot = await args.bgModules.contentSharing.getRemoteAnnotationIds(
        { annotationUrls },
    )
    const pageLocalListIds = await args.bgModules.customLists.fetchPageLists({
        url: args.fullPageUrl,
    })
    const syncSettingsStore = createSyncSettingsStore({
        syncSettingsBG: args.bgModules.syncSettings,
    })
    const highlightColors =
        (await syncSettingsStore.highlightColors.get('highlightColors')) ??
        HIGHLIGHT_COLORS_DEFAULT
    args.cache.setHighlightColorDictionary(highlightColors)

    args.cache.setAnnotations(
        annotationsData.map((annot) => {
            const privacyLevel = privacyLvlsByAnnot[annot.url]

            // Inherit parent page shared lists if public annot
            const unifiedListIds =
                privacyLevel >= AnnotationPrivacyLevels.SHARED
                    ? pageLocalListIds
                          .map((localListId) => {
                              const cachedList = args.cache.getListByLocalId(
                                  localListId,
                              )
                              return cachedList?.remoteId != null
                                  ? cachedList.unifiedId
                                  : null
                          })
                          .filter((id) => id != null)
                    : undefined

            return reshapeAnnotationForCache(annot, {
                extraData: {
                    remoteId: remoteIdsByAnnot[annot.url]?.toString(),
                    creator: args.user,
                    unifiedListIds,
                    privacyLevel,
                },
            })
        }),
        { keepExistingData: args.keepExistingAnnotationData },
    )

    args.cache.setPageData(
        normalizeUrl(args.fullPageUrl),
        pageLocalListIds.map(
            (localListId) =>
                args.cache.getListByLocalId(localListId)?.unifiedId,
        ),
    )
}

// NOTE: this is tested as part of the dashboard + space-picker logic tests
export async function hydrateCacheForListUsage(
    args: CacheHydratorDeps<
        'bgScript' | 'contentSharing' | 'customLists' | 'pageActivityIndicator'
    >,
): Promise<void> {
    const localListsData = await args.bgModules.customLists.fetchAllLists({
        includeDescriptions: true,
        skipSpecialLists: false,
        includeTreeData: true,
    })
    const followedListsData = await args.bgModules.pageActivityIndicator.getAllFollowedLists()
    const listMetadata = await args.bgModules.contentSharing.getListShareMetadata(
        {
            localListIds: localListsData.map((list) => list.id),
        },
    )

    await hydrateCacheLists({
        listMetadata,
        followedListsData,
        localListsData,
        ...args,
    })
}

async function hydrateCacheLists(
    args: {
        localListsData: PageList[]
        listMetadata: { [localListId: number]: SharedListMetadata }
        followedListsData: {
            [remoteListId: string]: Pick<
                FollowedList,
                'sharedList' | 'creator' | 'name' | 'type'
            > &
                Partial<Pick<FollowedListEntry, 'hasAnnotationsFromOthers'>>
        }
    } & CacheHydratorDeps<
        'bgScript' | 'contentSharing' | 'customLists' | 'pageActivityIndicator'
    >,
): Promise<void> {
    // Get all the IDs of page link lists
    const pageLinkListIds = new Set<string>()
    for (const list of Object.values(args.followedListsData)) {
        if (list.type === 'page-link') {
            pageLinkListIds.add(list.sharedList.toString())
        }
    }
    for (const list of args.localListsData) {
        const metadata = args.listMetadata[list.id]
        if (metadata?.remoteId != null && list.type === 'page-link') {
            pageLinkListIds.add(metadata.remoteId)
        }
    }

    // Look up shared list entry data for all the page link lists to be able to get them to the cache
    const sharedListEntryMap = new Map<
        string,
        Pick<SharedListEntry, 'entryTitle' | 'normalizedUrl'> & { id: string }
    >()
    if (pageLinkListIds.size) {
        const followedEntriesByList = await args.bgModules.pageActivityIndicator.getEntriesForFollowedLists(
            [...pageLinkListIds],
            { sortAscByCreationTime: true },
        )
        for (const entries of Object.values(followedEntriesByList)) {
            if (entries.length) {
                sharedListEntryMap.set(entries[0].followedList.toString(), {
                    normalizedUrl: entries[0].normalizedPageUrl,
                    id: entries[0].sharedListEntry.toString(),
                    entryTitle: entries[0].entryTitle,
                })
            }
        }
    }

    const seenFollowedLists = new Set<AutoPk>()

    const listsToCache = args.localListsData.map((list) => {
        let creator = args.user
        let hasRemoteAnnotations = false
        const metadata = args.listMetadata[list.id]
        const sharedListEntryData =
            list.type === 'page-link'
                ? sharedListEntryMap.get(metadata?.remoteId) ?? undefined
                : undefined

        if (
            metadata?.remoteId != null &&
            args.followedListsData[metadata.remoteId]
        ) {
            seenFollowedLists.add(
                args.followedListsData[metadata.remoteId].sharedList,
            )
            hasRemoteAnnotations =
                args.followedListsData[metadata.remoteId]
                    .hasAnnotationsFromOthers
            creator = {
                type: 'user-reference',
                id: args.followedListsData[metadata.remoteId].creator,
            }
        }
        return reshapeLocalListForCache(list, {
            hasRemoteAnnotations,
            extraData: {
                normalizedPageUrl: sharedListEntryData?.normalizedUrl,
                sharedListEntryId: sharedListEntryData?.id,
                isPrivate: metadata?.private ?? true,
                remoteId: metadata?.remoteId,
                creator,
            },
        })
    })

    // Ensure we cover any followed-only lists (lists with no local data)
    Object.values(args.followedListsData)
        .filter((list) => !seenFollowedLists.has(list.sharedList))
        .forEach((list) => {
            const sharedListEntryData =
                list.type === 'page-link'
                    ? sharedListEntryMap.get(list.sharedList.toString()) ??
                      undefined
                    : undefined
            listsToCache.push(
                reshapeFollowedListForCache(list, {
                    hasRemoteAnnotations: list.hasAnnotationsFromOthers,
                    extraData: {
                        normalizedPageUrl: sharedListEntryData?.normalizedUrl,
                        sharedListEntryId: sharedListEntryData?.id,
                    },
                }),
            )
        })

    args.cache.setLists(listsToCache)

    // Set up list change side-effects
    args.cache.events.addListener('addedList', async (list) => {
        if (list.type !== 'special-list') {
            await args.bgModules.bgScript.broadcastListChangeToAllTabs({
                type: 'create',
                list,
            })
        }
    })
    args.cache.events.addListener('removedList', async (list) => {
        if (list.localId != null) {
            await args.bgModules.bgScript.broadcastListChangeToAllTabs({
                type: 'delete',
                localListId: list.localId,
            })
        }
    })
}

export function deriveListOwnershipStatus(
    listData: UnifiedList,
    currentUser?: UserReference,
): 'Creator' | 'Follower' | 'Contributor' {
    if (listData.remoteId != null && listData.localId == null) {
        return 'Follower'
    }

    if (
        listData.remoteId != null &&
        listData.localId != null &&
        listData.creator?.id !== currentUser?.id
    ) {
        return 'Contributor'
    }

    return 'Creator'
}

export type UnifiedListsByCategories = {
    myLists: UnifiedList<'user-list' | 'special-list'>[]
    joinedLists: UnifiedList<'user-list'>[]
    followedLists: UnifiedList<'user-list'>[]
    pageLinkLists: UnifiedList<'page-link'>[]
}

export function siftListsIntoCategories(
    lists: UnifiedList[],
    currentUser?: UserReference,
): UnifiedListsByCategories {
    const categories: UnifiedListsByCategories = {
        myLists: [],
        joinedLists: [],
        followedLists: [],
        pageLinkLists: [],
    }
    for (const list of lists) {
        const ownership = deriveListOwnershipStatus(list, currentUser)
        if (list.type === 'page-link') {
            categories.pageLinkLists.push(list)
        } else if (ownership === 'Creator' && list.type === 'user-list') {
            categories.myLists.push(list)
        } else if (ownership === 'Follower' && !list.isForeignList) {
            categories.followedLists.push(list as any)
        } else if (ownership === 'Contributor') {
            categories.joinedLists.push(list as any)
        }
    }
    return categories
}

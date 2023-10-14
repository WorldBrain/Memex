import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import type {
    PageAnnotationsCacheInterface,
    UnifiedList,
    UnifiedListForCache,
} from 'src/annotations/cache/types'
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import { trackCopyInviteLink } from '@worldbrain/memex-common/lib/analytics/events'
import { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'

export interface Dependencies {
    contentSharingBG: ContentSharingInterface
    spacesBG: RemoteCollectionsInterface
    listData: UnifiedList
    errorMessage?: string
    loadOwnershipData?: boolean
    onSpaceShare?: (remoteListId: string) => void
    copyToClipboard: (text: string) => Promise<boolean>
    analyticsBG: AnalyticsCoreInterface
    pageLinkCreateState?: TaskState
    annotationsCache?: PageAnnotationsCacheInterface
    pageListDataForCurrentPage: UnifiedListForCache<'page-link'> | null
}

export type Event = UIEvent<{
    shareSpace: null
    copyInviteLink: { linkIndex: number; linkType: 'page-link' | 'space-link' }
    reloadInviteLinks: { listData: UnifiedListForCache<'page-link'> | null }
}>

export interface State {
    loadState: TaskState
    ownershipLoadState: TaskState
    listShareLoadState: TaskState
    inviteLinksLoadState: TaskState
    inviteLinks: InviteLink[]
    showSuccessMsg: boolean
    mode: 'confirm-space-delete' | 'followed-space' | null
    nameValue: string
    showSaveButton: boolean
    pageListDataForCurrentPage: UnifiedList | null
}

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class PageLinkShareMenu extends UILogic<State, Event> {
    static MSG_TIMEOUT = 2000

    constructor(protected dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        ownershipLoadState: 'pristine',
        listShareLoadState: 'pristine',
        inviteLinksLoadState: 'pristine',
        inviteLinks: [],
        nameValue: this.dependencies.listData.name,
        showSuccessMsg: false,
        mode: null,
        showSaveButton: false,
        pageListDataForCurrentPage: null,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        let state = previousState

        await loadInitial(this, async () => {
            // this.emitMutation({ inviteLinksLoadState: { $set: 'running' } })

            const listsOfPage = await this.dependencies.spacesBG.fetchListPagesByUrl(
                {
                    url: window.location.href,
                },
            )

            const listsOfPageIds = listsOfPage.map((list) => list.id)

            let listsOfPageData = null
            for (const list of listsOfPageIds) {
                let listData = await this.dependencies.annotationsCache.getListByLocalId(
                    list,
                )

                if (
                    listData.type === 'page-link' &&
                    (listData?.localId > listsOfPageData?.localId ||
                        listsOfPageData == null)
                ) {
                    listsOfPageData = listData
                }
            }

            if (listsOfPageData) {
                this.emitMutation({
                    pageListDataForCurrentPage: { $set: listsOfPageData },
                })

                await this.loadInviteLinks(listsOfPageData)

                if (this.dependencies.loadOwnershipData) {
                    state = await this.loadSpaceOwnership(previousState)
                }

                // if (state.mode !== 'followed-space') {
                //     await this.loadInviteLinks(listsOfPageData[0])
                // }
            }
        })
    }

    private async loadSpaceOwnership(previousState: State): Promise<State> {
        const { listData, spacesBG } = this.dependencies
        const mutation: UIMutation<State> = {}

        await executeUITask(this, 'ownershipLoadState', async () => {
            if (listData.remoteId == null) {
                mutation.mode = { $set: null }
                return
            }

            // TODO: maybe remove this call
            const listDataWithOwnership = await spacesBG.fetchSharedListDataWithOwnership(
                {
                    remoteListId: listData.remoteId,
                },
            )
            if (listData == null) {
                throw new Error('Remote list data not found')
            }

            mutation.mode = {
                $set: listDataWithOwnership.isOwned ? null : 'followed-space',
            }
        })

        this.emitMutation(mutation)
        return this.withMutation(previousState, mutation)
    }

    private async loadInviteLinks(
        listData?: UnifiedListForCache<'page-link'> | null,
    ) {
        const { contentSharingBG } = this.dependencies

        const createListLink = (collaborationKey?: string): string =>
            listData.type === 'page-link' &&
            getSinglePageShareUrl({
                collaborationKey,
                remoteListId: listData.remoteId,
                remoteListEntryId: listData.sharedListEntryId,
            })

        await executeUITask(this, 'inviteLinksLoadState', async () => {
            if (listData.remoteId == null) {
                return
            }

            if (listData.collabKey != null) {
                this.emitMutation({
                    inviteLinks: {
                        $set: [
                            {
                                roleID: SharedListRoleID.Commenter,
                                link: createListLink(),
                            },
                            {
                                roleID: SharedListRoleID.ReadWrite,
                                link: createListLink(listData.collabKey),
                            },
                        ],
                    },
                })
                return
            }

            // TODO: Remove all this logic once full support for list's `collabKey` is in the cache
            const { links } = await contentSharingBG.getExistingKeyLinksForList(
                {
                    listReference: {
                        id: listData.remoteId,
                        type: 'shared-list-reference',
                    },
                },
            )

            const contribLink = links.find((link) => link.keyString != null)

            const inviteLinks: InviteLink[] = [
                {
                    roleID: SharedListRoleID.Commenter,
                    link: createListLink(),
                },
            ]
            if (contribLink) {
                inviteLinks.push({
                    roleID: SharedListRoleID.ReadWrite,
                    link: createListLink(contribLink.keyString),
                })
            }

            this.emitMutation({ inviteLinks: { $set: inviteLinks } })
        })
    }

    reloadInviteLinks: EventHandler<'reloadInviteLinks'> = async ({
        event,
    }) => {
        await this.loadInviteLinks(event.listData)
    }

    shareSpace: EventHandler<'shareSpace'> = async ({}) => {
        const {
            listData,
            onSpaceShare,
            copyToClipboard,
            contentSharingBG,
        } = this.dependencies

        let remoteListId = listData.remoteId

        await executeUITask(this, 'inviteLinksLoadState', async () => {
            const shareResult = await contentSharingBG.scheduleListShare({
                localListId: listData.localId,
            })
            remoteListId = shareResult.remoteListId
            onSpaceShare?.(remoteListId)

            this.emitMutation({
                showSuccessMsg: { $set: true },
                inviteLinks: { $set: shareResult.links },
            })

            const linkToCopy =
                shareResult.links[1]?.link ?? shareResult.links[0]?.link
            if (linkToCopy != null) {
                await copyToClipboard(linkToCopy)
            }
        })

        await executeUITask(this, 'listShareLoadState', async () => {
            await contentSharingBG.waitForListShare({
                localListId: listData.localId,
            })
        })

        setTimeout(
            () => this.emitMutation({ showSuccessMsg: { $set: false } }),
            PageLinkShareMenu.MSG_TIMEOUT,
        )
    }

    copyInviteLink: EventHandler<'copyInviteLink'> = async ({
        previousState,
        event,
    }) => {
        const inviteLink = previousState.inviteLinks[event.linkIndex]
        if (inviteLink == null) {
            throw new Error('Link to copy does not exist - cannot copy')
        }

        await this.dependencies.copyToClipboard(inviteLink.link)

        const showInviteLinkCopyMsg = (showCopyMsg: boolean) =>
            this.emitMutation({
                inviteLinks: {
                    [event.linkIndex]: {
                        showCopyMsg: { $set: showCopyMsg },
                    },
                },
            })

        showInviteLinkCopyMsg(true)

        if (this.dependencies.analyticsBG) {
            try {
                await trackCopyInviteLink(this.dependencies.analyticsBG, {
                    inviteType:
                        event.linkIndex === 0 ? 'reader' : 'contributer',
                    linkType:
                        event.linkType === 'page-link'
                            ? 'page-link'
                            : 'space-link',
                    source: 'extension',
                })
            } catch (error) {
                console.error(`Error tracking space create event', ${error}`)
            }
        }

        setTimeout(
            () => showInviteLinkCopyMsg(false),
            PageLinkShareMenu.MSG_TIMEOUT,
        )
    }
}

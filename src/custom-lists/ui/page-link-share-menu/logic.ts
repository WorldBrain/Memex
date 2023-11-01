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
    onSpaceShare: () => Promise<void>
    copyToClipboard: (text: string) => Promise<boolean>
    analyticsBG: AnalyticsCoreInterface
    annotationsCache?: PageAnnotationsCacheInterface
    pageListDataForCurrentPage: UnifiedListForCache<'page-link'> | null
}

export type Event = UIEvent<{
    copyInviteLink: { link: string }
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
    isLocalPDF: boolean
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
        isLocalPDF: false,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        let state = previousState

        if (window.location.href.includes('/pdfjs/viewer.html?file=blob')) {
            this.emitMutation({
                isLocalPDF: { $set: true },
            })
        }

        await loadInitial(this, async () => {
            if (this.dependencies.listData) {
                this.emitMutation({
                    pageListDataForCurrentPage: {
                        $set: this.dependencies.listData,
                    },
                })

                await this.loadInviteLinks(
                    this.dependencies.listData as UnifiedListForCache<
                        'page-link'
                    >,
                )

                if (this.dependencies.loadOwnershipData) {
                    state = await this.loadSpaceOwnership(previousState)
                }
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

    copyInviteLink: EventHandler<'copyInviteLink'> = async ({ event }) => {
        await this.dependencies.copyToClipboard(event.link)
    }
}

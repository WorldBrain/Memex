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
import { getSinglePageShareUrl } from 'src/content-sharing/utils'
import { SharedListRoleID } from '@worldbrain/memex-common/lib/content-sharing/types'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'

export interface Dependencies {
    fullPageUrl: string
    authBG: AuthRemoteFunctionsInterface
    spacesBG: RemoteCollectionsInterface
    analyticsBG: AnalyticsCoreInterface
    contentSharingBG: ContentSharingInterface
    listData?: UnifiedList<'page-link'>
    annotationsCache: PageAnnotationsCacheInterface
    onNewPageLinkCreate?: () => Promise<void>
    copyToClipboard: (text: string) => Promise<void>
}

export type Event = UIEvent<{
    createPageLink: null
    copyInviteLink: { link: string }
    reloadInviteLinks: { listData: UnifiedList<'page-link'> }
}>

export interface State {
    loadState: TaskState
    ownershipLoadState: TaskState
    listShareLoadState: TaskState
    pageLinkCreateState: TaskState
    inviteLinksLoadState: TaskState
    inviteLinks: InviteLink[]
    mode: 'confirm-space-delete' | 'followed-space' | null
    selectedPageLinkList: UnifiedList<'page-link'> | null
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
        pageLinkCreateState: 'pristine',
        inviteLinksLoadState: 'pristine',
        inviteLinks: [],
        mode: null,
        selectedPageLinkList: null,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        const {
            fullPageUrl,
            listData: initListData,
            annotationsCache,
            authBG,
        } = this.dependencies

        let listData: UnifiedList<'page-link'>
        await loadInitial(this, async () => {
            if (initListData != null) {
                listData = initListData
                this.emitMutation({
                    selectedPageLinkList: {
                        $set: initListData,
                    },
                })
                return
            }

            const currentUser = await authBG.getCurrentUser()
            if (!currentUser) {
                throw new Error('Cannot create page links - User not logged in')
            }

            const sharedPageListIds = annotationsCache.getSharedPageListIds(
                normalizeUrl(fullPageUrl),
            )
            let latestPageLinkList: UnifiedList<'page-link'> = null
            for (const listId of sharedPageListIds) {
                const listData = annotationsCache.lists.byId[listId]
                if (
                    listData?.type === 'page-link' &&
                    (listData?.localId > latestPageLinkList?.localId ||
                        latestPageLinkList == null)
                ) {
                    latestPageLinkList = listData
                }
            }

            if (latestPageLinkList != null) {
                this.emitMutation({
                    selectedPageLinkList: { $set: latestPageLinkList },
                })
                listData = latestPageLinkList
            }
        })
        if (listData != null) {
            await this.loadInviteLinks(listData)
        }
    }

    createPageLink: EventHandler<'createPageLink'> = async ({
        previousState,
        event,
    }) => {
        // TODO: implement page link creation logic
        await this.dependencies.onNewPageLinkCreate()
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

    private async loadInviteLinks(listData: UnifiedListForCache<'page-link'>) {
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
        this.emitMutation({ selectedPageLinkList: { $set: event.listData } })
        await this.loadInviteLinks(event.listData)
    }

    copyInviteLink: EventHandler<'copyInviteLink'> = async ({ event }) => {
        await this.dependencies.copyToClipboard(event.link)
    }
}

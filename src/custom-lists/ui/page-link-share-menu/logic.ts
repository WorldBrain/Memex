import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { RemoteCollectionsInterface } from 'src/custom-lists/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import type {
    ContentSharingInterface,
    RemoteContentSharingByTabsInterface,
} from 'src/content-sharing/background/types'
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
import { getTelegramUserDisplayName } from '@worldbrain/memex-common/lib/telegram/utils'
import type { AuthenticatedUser } from '@worldbrain/memex-common/lib/authentication/types'

export interface Dependencies {
    fullPageUrl: string
    fromDashboard?: boolean
    autoCreateLinkIfNone?: boolean
    authBG: AuthRemoteFunctionsInterface
    analyticsBG: AnalyticsCoreInterface
    contentSharingBG: ContentSharingInterface
    contentSharingByTabsBG: RemoteContentSharingByTabsInterface<'caller'>
    listData?: UnifiedList<'page-link'>
    annotationsCache: PageAnnotationsCacheInterface
    onNewPageLinkCreate?: (
        pageLinkListId: UnifiedList['unifiedId'],
    ) => Promise<void>
    copyToClipboard: (text: string) => Promise<boolean>
    setLoadingState?: (loading: TaskState) => void
}

export type Event = UIEvent<{
    createPageLink: null
    copyInviteLink: { link: string }
    reloadInviteLinks: { listData: UnifiedList<'page-link'> }
    showTutorial: boolean
}>

export interface State {
    loadState: TaskState
    listShareLoadState: TaskState
    pageLinkCreateState: TaskState
    inviteLinksLoadState: TaskState
    inviteLinks: InviteLink[]
    selectedPageLinkList: UnifiedList<'page-link'> | null
    showTutorial: boolean
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
        listShareLoadState: 'pristine',
        pageLinkCreateState: 'pristine',
        inviteLinksLoadState: 'pristine',
        inviteLinks: [],
        selectedPageLinkList: null,
        showTutorial: false,
    })

    private async ensureLoggedInUser(): Promise<AuthenticatedUser> {
        const currentUser = await this.dependencies.authBG.getCurrentUser()
        if (!currentUser) {
            throw new Error('Cannot create page links - User not logged in')
        }
        return currentUser
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        const {
            listData: initListData,
            autoCreateLinkIfNone,
            annotationsCache,
            fullPageUrl,
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

            await this.ensureLoggedInUser()
            const sharedPageListIds =
                annotationsCache.normalizedPageUrlsToPageLinkListIds.get(
                    normalizeUrl(fullPageUrl),
                ) ?? new Set()
            let latestPageLinkList: UnifiedList<'page-link'> = null
            for (const listId of sharedPageListIds) {
                const listData = annotationsCache.lists.byId[
                    listId
                ] as UnifiedList<'page-link'>
                if (
                    listData?.localId > latestPageLinkList?.localId ||
                    latestPageLinkList == null
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
        if (listData == null && autoCreateLinkIfNone) {
            await this._createPageLink()
        }
    }

    private async _createPageLink() {
        await executeUITask(this, 'pageLinkCreateState', async () => {
            this.dependencies.setLoadingState?.('running')
            // TODO: Refactor title to be passed down - not relevant here
            let title: string
            if (window.location.href.includes('web.telegram.org')) {
                title = getTelegramUserDisplayName(
                    document,
                    window.location.href,
                )
            }
            const currentUser = await this.ensureLoggedInUser()

            const {
                collabKey,
                listTitle,
                localListId,
                remoteListId,
                remoteListEntryId,
            } = await this.dependencies.contentSharingByTabsBG.schedulePageLinkCreation(
                {
                    fullPageUrl: this.dependencies.fullPageUrl,
                    customPageTitle: title,
                    skipPageIndexing: this.dependencies.fromDashboard,
                },
            )

            const pageLinkList: UnifiedListForCache<'page-link'> = {
                type: 'page-link',
                name: listTitle,
                creator: { type: 'user-reference', id: currentUser.id },
                localId: localListId,
                collabKey: collabKey.toString(),
                remoteId: remoteListId.toString(),
                sharedListEntryId: remoteListEntryId.toString(),
                normalizedPageUrl: normalizeUrl(this.dependencies.fullPageUrl),
                unifiedAnnotationIds: [],
                hasRemoteAnnotationsToLoad: false,
                parentLocalId: null,
                isPrivate: false,
            }
            const { unifiedId } = this.dependencies.annotationsCache.addList(
                pageLinkList,
            )
            const cachedList = this.dependencies.annotationsCache.lists.byId[
                unifiedId
            ] as UnifiedList<'page-link'>
            this.emitMutation({ selectedPageLinkList: { $set: cachedList } })

            await Promise.all([
                this.dependencies.contentSharingBG.waitForPageLinkCreation({
                    fullPageUrl: this.dependencies.fullPageUrl,
                }),
                this.dependencies.onNewPageLinkCreate?.(unifiedId),
                this.loadInviteLinks(cachedList),
            ])
            this.dependencies.setLoadingState?.('success')
        })
    }

    showTutorial: EventHandler<'showTutorial'> = async ({ event }) => {
        console.log('showTutorial', event)
        this.emitMutation({ showTutorial: { $set: event } })
    }
    createPageLink: EventHandler<'createPageLink'> = async ({}) => {
        await this._createPageLink()
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

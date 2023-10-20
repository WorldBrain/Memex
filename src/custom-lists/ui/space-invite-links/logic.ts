import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { TaskState } from 'ui-logic-core/lib/types'
import type { InviteLink } from '@worldbrain/memex-common/lib/content-sharing/ui/list-share-modal/types'
import { trackCopyInviteLink } from '@worldbrain/memex-common/lib/analytics/events'
import type { AnalyticsCoreInterface } from '@worldbrain/memex-common/lib/analytics/types'
import {
    SharedListEmailInvite,
    SharedListRoleID,
} from '@worldbrain/memex-common/lib/content-sharing/types'
import {
    NormalizedState,
    initNormalizedState,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import type { AutoPk } from '@worldbrain/memex-common/lib/storage/types'
import type { UnifiedList } from 'src/annotations/cache/types'
import type { ContentSharingInterface } from 'src/content-sharing/background/types'
import {
    getListShareUrl,
    getSinglePageShareUrl,
} from 'src/content-sharing/utils'

export interface Dependencies {
    listData: UnifiedList
    analyticsBG: AnalyticsCoreInterface
    contentSharingBG: ContentSharingInterface
    copyToClipboard: (text: string) => Promise<boolean>
    /**
     * If defined will override this component's ability to fetch links from storage.
     * TODO: Remove this once list auto-share is moved to BG
     */
    inviteLinksState?: {
        links: InviteLink[]
        loadState: TaskState
    }
}

export interface State {
    loadState: TaskState
    inviteLinksLoadState: TaskState
    emailInvitesLoadState: TaskState
    emailInvitesCreateState: TaskState
    emailInvitesDeleteState: TaskState
    emailInvitesHoverState: AutoPk | null
    emailInviteInputValue: string
    inviteLinks: InviteLink[]
    emailInviteInputRole:
        | SharedListRoleID.Commenter
        | SharedListRoleID.ReadWrite
    emailInvites: NormalizedState<
        SharedListEmailInvite & {
            id: AutoPk
            sharedListKey: AutoPk
            roleID: SharedListRoleID
        }
    >
}

export type Event = UIEvent<{
    copyInviteLink: { linkIndex: number; linkType: 'page-link' | 'space-link' }
    updateEmailInviteInputRole: { role: SharedListRoleID }
    updateEmailInviteInputValue: { value: string }
    setEmailInvitesHoverState: { id: AutoPk }
    deleteEmailInvite: { key: string }
    inviteViaEmail: { now?: number }
}>

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class SpaceInviteLinksLogic extends UILogic<State, Event> {
    static MSG_TIMEOUT = 2000

    constructor(protected dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        inviteLinksLoadState: 'pristine',
        emailInvitesLoadState: 'pristine',
        emailInvitesCreateState: 'pristine',
        emailInvitesDeleteState: 'pristine',
        inviteLinks: [],
        emailInviteInputRole: SharedListRoleID.Commenter,
        emailInviteInputValue: '',
        emailInvites: initNormalizedState(),
        emailInvitesHoverState: null,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial(this, async () => {
            await Promise.all([
                this.dependencies.inviteLinksState
                    ? Promise.resolve()
                    : this.loadInviteLinks(),
                this.loadEmailInvites(),
            ])
        })
    }

    private async loadEmailInvites() {
        const { listData, contentSharingBG } = this.dependencies

        await executeUITask(this, 'emailInvitesLoadState', async () => {
            if (listData.remoteId == null) {
                return
            }

            const emailInvites = await contentSharingBG.loadListEmailInvites({
                listReference: {
                    type: 'shared-list-reference',
                    id: listData.remoteId,
                },
            })
            if (emailInvites.status !== 'success') {
                throw new Error('Failed to load email invites for list')
            }
            this.emitMutation({
                emailInvites: {
                    $set: initNormalizedState({
                        seedData: emailInvites.data,
                        getId: (invite) => invite.sharedListKey.toString(),
                    }),
                },
            })
        })
    }

    private async loadInviteLinks() {
        const { listData, contentSharingBG } = this.dependencies

        const createListLink = (collaborationKey?: string): string =>
            listData.type === 'page-link'
                ? getSinglePageShareUrl({
                      collaborationKey,
                      remoteListId: listData.remoteId,
                      remoteListEntryId: listData.sharedListEntryId,
                  })
                : getListShareUrl({
                      collaborationKey,
                      remoteListId: listData.remoteId,
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

    setEmailInvitesHoverState: EventHandler<
        'setEmailInvitesHoverState'
    > = async ({ event }) => {
        this.emitMutation({
            emailInvitesHoverState: { $set: event.id },
        })
    }

    updateEmailInviteInputValue: EventHandler<
        'updateEmailInviteInputValue'
    > = async ({ event }) => {
        this.emitMutation({ emailInviteInputValue: { $set: event.value } })
    }

    updateEmailInviteInputRole: EventHandler<
        'updateEmailInviteInputRole'
    > = async ({ event }) => {
        if (
            event.role !== SharedListRoleID.Commenter &&
            event.role !== SharedListRoleID.ReadWrite
        ) {
            throw new Error(
                'Cannot set invite role other than Commenter and ReadWrite',
            )
        }
        this.emitMutation({ emailInviteInputRole: { $set: event.role } })
    }

    inviteViaEmail: EventHandler<'inviteViaEmail'> = async ({
        event,
        previousState,
    }) => {
        const now = event.now ?? Date.now()
        const email = previousState.emailInviteInputValue.trim()
        const roleID = previousState.emailInviteInputRole

        const prevInviteCount = previousState.emailInvites.allIds.length
        const tmpId = `tmp-invite-id-${prevInviteCount}`
        this.emitMutation({
            emailInviteInputValue: { $set: '' },
            emailInvites: {
                allIds: { $push: [tmpId] },
                byId: {
                    [tmpId]: {
                        $set: {
                            email,
                            roleID,
                            id: tmpId,
                            createdWhen: now,
                            sharedListKey: null,
                        },
                    },
                },
            },
        })
        await executeUITask(this, 'emailInvitesCreateState', async () => {
            let remoteId = this.dependencies.listData.remoteId

            if (remoteId == null) {
                remoteId = await this.dependencies.contentSharingBG.getRemoteListId(
                    {
                        localListId: this.dependencies.listData.localId,
                    },
                )
            }

            const result = await this.dependencies.contentSharingBG.createListEmailInvite(
                {
                    now,
                    email,
                    roleID,
                    listId: remoteId,
                },
            )
            if (result.status === 'success') {
                // Replace temp emailInvites state with the full one
                this.emitMutation({
                    emailInvites: {
                        allIds: {
                            [prevInviteCount]: { $set: result.keyString },
                        },
                        byId: {
                            $unset: [tmpId],
                            [result.keyString]: {
                                $set: {
                                    email,
                                    roleID,
                                    createdWhen: now,
                                    id: result.keyString,
                                    sharedListKey: result.keyString,
                                },
                            },
                        },
                    },
                })
            } else if (result.status === 'permission-denied') {
                this.emitMutation({
                    emailInvites: {
                        byId: { $unset: [tmpId] },
                        allIds: {
                            $apply: (prev) =>
                                prev.filter((ids) => ids !== tmpId),
                        },
                    },
                })
                throw new Error('Email invite encountered an error')
            }
        })
    }

    deleteEmailInvite: EventHandler<'deleteEmailInvite'> = async ({
        event,
        previousState,
    }) => {
        await executeUITask(this, 'emailInvitesDeleteState', async () => {
            if (previousState.emailInvites.byId[event.key] == null) {
                throw new Error(
                    'Attempted to delete email invite that is not in state',
                )
            }

            this.emitMutation({
                emailInvites: {
                    byId: { $unset: [event.key] },
                    allIds: {
                        $apply: (prev) =>
                            prev.filter((ids) => ids !== event.key),
                    },
                },
            })
            const result = await this.dependencies.contentSharingBG.deleteListEmailInvite(
                {
                    keyString: event.key,
                },
            )
            if (result.status !== 'success') {
                throw new Error(
                    'Email invite deletion encountered a server-side error',
                )
            }
        })
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
            SpaceInviteLinksLogic.MSG_TIMEOUT,
        )
    }
}

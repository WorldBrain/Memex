import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import { executeUITask, loadInitial } from 'src/util/ui-logic'
import type { TaskState } from 'ui-logic-core/lib/types'
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

export interface Dependencies {
    listData: UnifiedList
    analyticsBG: AnalyticsCoreInterface
    contentSharingBG: ContentSharingInterface
    copyToClipboard: (text: string) => Promise<boolean>
}

export interface State {
    loadState: TaskState
    emailInvitesLoadState: TaskState
    emailInvitesCreateState: TaskState
    emailInvitesDeleteState: TaskState
    emailInvitesHoverState: AutoPk | null
    emailInviteInputValue: string
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
    updateEmailInviteInputRole: { role: SharedListRoleID }
    updateEmailInviteInputValue: { value: string }
    setEmailInvitesHoverState: { id: AutoPk }
    deleteEmailInvite: { key: string }
    inviteViaEmail: { state?: State; remoteId?: string }
    reloadEmailInvites: { remoteListId: string }
    updateProps: { props: Dependencies }
}>

type EventHandler<EventName extends keyof Event> = UIEventHandler<
    State,
    Event,
    EventName
>

export default class SpaceEmailInvitesLogic extends UILogic<State, Event> {
    static MSG_TIMEOUT = 2000

    constructor(protected dependencies: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        loadState: 'pristine',
        emailInvitesLoadState: 'pristine',
        emailInvitesCreateState: 'pristine',
        emailInvitesDeleteState: 'pristine',
        emailInviteInputRole: SharedListRoleID.Commenter,
        emailInviteInputValue: '',
        emailInvites: initNormalizedState(),
        emailInvitesHoverState: null,
    })

    init: EventHandler<'init'> = async ({ previousState }) => {
        await loadInitial(this, async () => {
            this._loadEmailInvites(this.dependencies.listData.remoteId)
        })
    }
    updateProps: EventHandler<'updateProps'> = async ({ event }) => {
        this.dependencies = event.props
        this._loadEmailInvites(this.dependencies.listData.remoteId)
    }

    reloadEmailInvites: EventHandler<'reloadEmailInvites'> = async ({
        previousState,
        event,
    }) => {
        this.emitMutation({ emailInvites: { $set: initNormalizedState() } })
        await this._loadEmailInvites(event.remoteListId)
    }

    private async _loadEmailInvites(remoteListId?: string) {
        await executeUITask(this, 'emailInvitesLoadState', async () => {
            if (remoteListId == null) {
                return
            }

            const emailInvites = await this.dependencies.contentSharingBG.loadListEmailInvites(
                {
                    listReference: {
                        type: 'shared-list-reference',
                        id: remoteListId,
                    },
                },
            )
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
        const now = Date.now()
        const email = event.state.emailInviteInputValue.trim()
        const roleID = event.state.emailInviteInputRole

        const prevInviteCount = event.state.emailInvites.allIds.length
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
            let remoteId = this.dependencies.listData?.remoteId ?? null

            while (remoteId == null) {
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
                    emailInvitesLoadState: { $set: 'success' },
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
                    emailInvitesLoadState: { $set: 'pristine' },
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
}

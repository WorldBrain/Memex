import { UILogic, UIEventHandler } from 'ui-logic-core'
import type { Dependencies, State, Events, ListTreeState } from './types'
import { initNormalizedState } from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

let initListTreeState = (
    unifiedId: string,
    allLists: Dependencies['lists'],
    prevState?: ListTreeState,
): ListTreeState => ({
    unifiedId,
    areChildrenShown: prevState?.areChildrenShown ?? false,
    isNewChildInputShown: prevState?.isNewChildInputShown ?? false,
    newChildListCreateState: prevState?.newChildListCreateState ?? 'pristine',
    hasChildren:
        allLists.filter(
            (l) => l.parentUnifiedId === unifiedId && l.type === 'user-list',
        ).length > 0,
})

export class ListTreesLogic extends UILogic<State, Events> {
    constructor(private deps: Dependencies) {
        super()
    }

    getInitialState = (): State => ({
        listTrees: initNormalizedState(),
    })

    syncListWithTreeState(
        lists: Dependencies['lists'],
        { listTrees }: State,
    ): void {
        this.emitMutation({
            listTrees: {
                $set: initNormalizedState({
                    getId: (list) => list.unifiedId,
                    seedData: lists.map((list) =>
                        initListTreeState(
                            list.unifiedId,
                            lists,
                            listTrees.byId[list.unifiedId],
                        ),
                    ),
                }),
            },
        })
    }

    init: EventHandler<'init'> = ({ event, previousState }) => {
        this.syncListWithTreeState(this.deps.lists, previousState)
    }

    createNewChildList: EventHandler<'createNewChildList'> = ({ event }) => {
        // TODO: Properly set up async state with error handling
        this.deps.onConfirmChildListCreate(event.listId, event.name)
        this.emitMutation({
            listTrees: {
                byId: {
                    [event.listId]: {
                        isNewChildInputShown: { $set: false },
                        newChildListCreateState: { $set: 'success' },
                    },
                },
            },
        })
    }

    toggleShowChildren: EventHandler<'toggleShowChildren'> = ({
        event,
        previousState,
    }) => {
        let prevState = previousState.listTrees.byId[event.listId]
        this.emitMutation({
            listTrees: {
                byId: {
                    [event.listId]: {
                        areChildrenShown: { $set: !prevState.areChildrenShown },
                    },
                },
            },
        })
    }

    toggleShowNewChildInput: EventHandler<'toggleShowNewChildInput'> = ({
        event,
        previousState,
    }) => {
        let prevState = previousState.listTrees.byId[event.listId]
        this.emitMutation({
            listTrees: {
                byId: {
                    [event.listId]: {
                        isNewChildInputShown: {
                            $set: !prevState.isNewChildInputShown,
                        },
                        // Couple tree toggle state to this. If not open, open it. Else leave it
                        areChildrenShown: {
                            $set: !prevState.isNewChildInputShown
                                ? true
                                : prevState.areChildrenShown,
                        },
                    },
                },
            },
        })
    }
}

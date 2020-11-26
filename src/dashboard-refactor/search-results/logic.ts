import { UILogic, UIEvent, UIEventHandler, UIMutation } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'

import { RootState as State, NotesType, PageState, NoteState } from './types'
import { AnnotationsSorter } from 'src/sidebar/annotations-sidebar/sorting'

export type Events = UIEvent<{
    setPageBookmark: { id: string; isBookmarked: boolean }
    setPageNotesShown: { pageId: string; day: number; areShown: boolean }
    setPageNotesSort: { pageId: string; sortingFn: AnnotationsSorter }
    setPageNotesType: { pageId: string; noteType: NotesType }
}>

type EventHandler<EventName extends keyof Events> = UIEventHandler<
    State,
    Events,
    EventName
>

export class SearchResultsLogic extends UILogic<State, Events> {
    getInitialState(): State {
        return {
            results: {},
            pagesLookup: {
                allIds: [],
                byId: {},
            },
            notesLookup: {
                allIds: [],
                byId: {},
            },
            searchType: 'pages',
            areAllNotesShown: false,
            searchState: 'pristine',
            paginationState: 'pristine',
        }
    }

    setPageBookmark: EventHandler<'setPageBookmark'> = ({ event }) => {
        this.emitMutation({
            pagesLookup: {
                byId: {
                    [event.id]: { isBookmarked: { $set: event.isBookmarked } },
                },
            },
        })
    }

    setPageNotesShown: EventHandler<'setPageNotesShown'> = ({ event }) => {
        this.emitMutation({
            results: {
                [event.day]: {
                    pages: {
                        byId: {
                            [event.pageId]: { areNotesShown: event.areShown },
                        },
                    },
                },
            },
        })
    }
}

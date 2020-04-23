import { UILogic, UIEvent, UIEventHandler } from 'ui-logic-core'
import { TaskState } from 'ui-logic-core/lib/types'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { RibbonController } from 'src/in-page-ui/ribbon'
import { InPageUI } from 'src/in-page-ui/shared-state'
import { RibbonContainerDependencies } from './types'
import * as componentTypes from '../../components/types'

export type PropKeys<Base, ValueCondition> = keyof Pick<
    Base,
    {
        [Key in keyof Base]: Base[Key] extends ValueCondition ? Key : never
    }[keyof Base]
>
type ValuesOf<Props> = Omit<Props, PropKeys<Props, Function>> // tslint:disable-line
type HandlersOf<Props> = {
    [Key in PropKeys<Props, Function>]: Props[Key] extends (
        value: infer Arg,
    ) => void
        ? Arg
        : null
} // tslint:disable-line

export interface RibbonContainerState {
    highlights: ValuesOf<componentTypes.RibbonHighlightsProps>
    tooltip: ValuesOf<componentTypes.RibbonTooltipProps>
    // sidebar: ValuesOf<componentTypes.RibbonSidebarProps>
    commentBox: ValuesOf<componentTypes.RibbonCommentBoxProps>
    bookmark: ValuesOf<componentTypes.RibbonBookmarkProps>
    tagging: ValuesOf<componentTypes.RibbonTaggingProps>
    lists: ValuesOf<componentTypes.RibbonListsProps>
    search: ValuesOf<componentTypes.RibbonSearchProps>
    pausing: ValuesOf<componentTypes.RibbonPausingProps>
}

export type RibbonContainerEvents = UIEvent<
    {
        show: null
        hide: null
    } & HandlersOf<componentTypes.RibbonHighlightsProps> &
        HandlersOf<componentTypes.RibbonTooltipProps> &
        // HandlersOf<componentTypes.RibbonSidebarProps> &
        HandlersOf<componentTypes.RibbonCommentBoxProps> &
        HandlersOf<componentTypes.RibbonBookmarkProps> &
        HandlersOf<componentTypes.RibbonTaggingProps> &
        HandlersOf<componentTypes.RibbonListsProps> &
        HandlersOf<componentTypes.RibbonSearchProps> &
        HandlersOf<componentTypes.RibbonPausingProps>
>

export interface RibbonContainerOptions extends RibbonContainerDependencies {
    inPageUI: InPageUI
    ribbonController: RibbonController
}

type EventHandler<
    EventName extends keyof RibbonContainerEvents
> = UIEventHandler<RibbonContainerState, RibbonContainerEvents, EventName>

export class RibbonContainerLogic extends UILogic<
    RibbonContainerState,
    RibbonContainerEvents
>
// implements UIEventHandlers<RibbonContainerState, RibbonContainerEvents>
{
    constructor(private dependencies: RibbonContainerOptions) {
        super()
    }

    getInitialState(): RibbonContainerState {
        return {
            highlights: {
                areHighlightsEnabled: false,
            },
            tooltip: {
                isTooltipEnabled: false,
            },
            // sidebar: {
            //     isSidebarOpen: false,
            // },
            commentBox: {
                commentText: '',
                showCommentBox: false,
                isCommentSaved: false,
            },
            bookmark: {
                isBookmarked: false,
            },
            tagging: {
                tags: [],
                initTagSuggs: [],
                showTagsPicker: false,
            },
            lists: {
                collections: [],
                initCollSuggs: [],
                showCollectionsPicker: false,
            },
            search: {
                showSearchBox: false,
                searchValue: '',
            },
            pausing: {
                isPaused: false,
            },
        }
    }

    init: EventHandler<'init'> = async ({ previousState }) => {
        // await loadInitial<RibbonContainerState>(this, async () => {
        //     await this._maybeLoad(previousState, {})
        // })
    }

    cleanup() {}

    // show: EventHandler<'show'> = () => {
    //     return { state: { $set: 'visible' } }
    // }

    // hide: EventHandler<'hide'> = () => {
    //     return { state: { $set: 'hidden' } }
    // }
}

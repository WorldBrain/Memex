import React, { Component } from 'react'

import Ribbon from './ribbon'

import {
    IndexDropdown,
    AddListDropdownContainer,
} from 'src/common-ui/containers'
import { PageList } from 'src/custom-lists/background/types'
import AnnotationsManager from 'src/annotations/annotations-manager'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { RibbonSubcomponentProps } from './types'

interface StateProps {
    isExpanded: boolean
    tabId: number
}

interface DispatchProps {
    handleRibbonToggle: () => void
}

interface OwnProps {
    getRemoteFunction: (name: string) => (...args: any[]) => Promise<any>
    highlighter: Pick<HighlightInteractionInterface, 'removeHighlights'>
    isRibbonEnabled: boolean
    annotationsManager: AnnotationsManager
    getUrl: () => string
    handleRemoveRibbon: () => void
}

type Props = StateProps & DispatchProps & OwnProps & RibbonSubcomponentProps

export default class RibbonContainer extends Component<Props> {
    private renderTagsManager() {
        return (
            <IndexDropdown
                env="inpage"
                url={this.props.getUrl()}
                tabId={this.props.tabId}
                initFilters={this.props.tagging.tags}
                initSuggestions={this.props.tagging.initTagSuggs}
                source="tag"
                onFilterAdd={this.props.tagging.onTagAdd}
                onFilterDel={this.props.tagging.onTagDel}
                isForRibbon
            />
        )
    }

    private renderCollectionsManager() {
        return (
            <AddListDropdownContainer
                env="inpage"
                url={this.props.getUrl()}
                initLists={this.props.lists.collections}
                initSuggestions={this.props.lists.initCollSuggs}
                onFilterAdd={this.props.lists.onCollectionAdd}
                onFilterDel={this.props.lists.onCollectionDel}
                isForRibbon
            />
        )
    }

    render() {
        return (
            <div>
                <Ribbon
                    {...this.props}
                    tagManager={this.renderTagsManager()}
                    collectionsManager={this.renderCollectionsManager()}
                />
            </div>
        )
    }
}

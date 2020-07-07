import * as React from 'react'
import styled from 'styled-components'

import { StatefulUIElement } from 'src/util/ui-logic'
import AnnotationsSidebar, {
    AnnotationsSidebarProps,
} from '../components/AnnotationsSidebar'
import {
    SidebarContainerLogic,
    SidebarContainerState,
    SidebarContainerEvents,
    SidebarContainerOptions,
    AnnotationEventContext,
} from './logic'
import { ButtonTooltip } from 'src/common-ui/components'

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export interface Props extends SidebarContainerOptions {
    setRef?: (sidebar: AnnotationsSidebarContainer) => void
}

export abstract class AnnotationsSidebarContainer<
    P extends Props = Props
> extends StatefulUIElement<P, SidebarContainerState, SidebarContainerEvents> {
    constructor(props: P) {
        super(props, new SidebarContainerLogic(props))

        if (props.setRef) {
            props.setRef(this)
        }
    }

    showSidebar() {
        this.processEvent('show', null)
    }

    hideSidebar() {
        this.processEvent('hide', null)
    }

    setPageUrl = (pageUrl: string) => {
        this.processEvent('setPageUrl', { pageUrl })
    }

    handleClickOutside = (e) => {
        if (this.props.onClickOutside) {
            return this.props.onClickOutside(e)
        }

        // Do not close the sidebar if clicked on a highlight in the page
        if (e.target?.dataset?.annotation) {
            return
        }

        if (this.state.showState === 'visible') {
            this.hideSidebar()
        }
    }

    protected getEditProps(): AnnotationsSidebarProps['annotationEditProps'] {
        return {
            env: this.props.env,
            handleMouseEnter: (url) =>
                this.processEvent('annotationMouseEnter', {
                    annotationUrl: url,
                }),
            handleMouseLeave: (url) =>
                this.processEvent('annotationMouseLeave', {
                    annotationUrl: url,
                }),
            handleBookmarkToggle: (url) =>
                this.processEvent('toggleAnnotationBookmark', {
                    annotationUrl: url,
                    ...DEF_CONTEXT,
                }),
            handleConfirmDelete: (url) =>
                this.processEvent('deleteAnnotation', {
                    annotationUrl: url,
                    ...DEF_CONTEXT,
                }),
            handleTrashBtnClick: (url) =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: url,
                    mode: 'delete',
                    ...DEF_CONTEXT,
                }),
            handleCancelDelete: (url) =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: url,
                    mode: 'default',
                    ...DEF_CONTEXT,
                }),
            handleConfirmAnnotationEdit: ({ url, ...args }) =>
                this.processEvent('editAnnotation', {
                    annotationUrl: url,
                    ...args,
                    ...DEF_CONTEXT,
                }),
            handleEditBtnClick: (url) =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: url,
                    mode: 'edit',
                    ...DEF_CONTEXT,
                }),
            handleGoToAnnotation: (url) =>
                this.processEvent('goToAnnotationInPage', {
                    annotationUrl: url,
                    ...DEF_CONTEXT,
                }),
        }
    }

    protected getCreateProps(): AnnotationsSidebarProps['annotationCreateProps'] {
        return {
            anchor: this.state.commentBox.anchor,
            onCancel: () => this.processEvent('cancelNewPageComment', null),
            onSave: ({ text, isBookmarked, ...args }) =>
                this.processEvent('saveNewPageComment', {
                    commentText: text,
                    bookmarked: isBookmarked,
                    ...args,
                }),
        }
    }

    protected getTagProps(): AnnotationsSidebarProps['annotationTagProps'] {
        return {
            loadDefaultSuggestions: () =>
                this.props.tags.fetchInitialTagSuggestions(),
            queryEntries: (query) =>
                this.props.tags.searchForTagSuggestions({ query }),
        }
    }

    private handleAddCommentBtnClick: React.MouseEventHandler = (e) => {
        e.preventDefault()

        if (this.state.showCommentBox) {
            this.processEvent('cancelNewPageComment', null)
        } else {
            this.processEvent('addNewPageComment', null)
        }
    }

    protected abstract renderTopBarLeft(): JSX.Element

    private renderTopBar() {
        return (
            <TopBarContainerStyled>
                {this.renderTopBarLeft()}
                <ButtonTooltip
                    tooltipText="Add notes to page"
                    position="leftNarrow"
                >
                    <CommentBtn onClick={this.handleAddCommentBtnClick} />
                </ButtonTooltip>
            </TopBarContainerStyled>
        )
    }

    render() {
        if (this.state.showState === 'hidden') {
            return null
        }

        return (
            <ContainerStyled {...this.props}>
                {this.renderTopBar()}
                <AnnotationsSidebar
                    {...this.state}
                    isSearchLoading={
                        this.state.primarySearchState === 'running'
                    }
                    appendLoader={this.state.secondarySearchState === 'running'}
                    annotationModes={this.state.annotationModes.pageAnnotations}
                    isAnnotationCreateShown={this.state.showCommentBox}
                    hoverAnnotationUrl={this.state.hoverAnnotationUrl}
                    annotationCreateProps={this.getCreateProps()}
                    annotationEditProps={this.getEditProps()}
                    annotationTagProps={this.getTagProps()}
                    handleScrollPagination={() =>
                        this.processEvent('paginateSearch', null)
                    }
                />
            </ContainerStyled>
        )
    }
}

const ContainerStyled = styled.div`
    padding: 10px;
    height: 100%;
    width: 450px;
    position: fixed;
    right: ${(props: Props) => (props.env === 'overview' ? 0 : 40)}px;
    top: ${(props: Props) => (props.env === 'overview' ? 55 : 0)}px;

    z-index: 9999999; /* This is to combat pages setting high values on certain elements under the sidebar */
    background: #fff;
    transition: all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
`

const TopBarContainerStyled = styled.div`
    position: sticky;
    top: 0;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 7px 8px 5px 3px;
    height: 40px;
    box-sizing: border-box;
    margin-top: 3px;
`

// TODO: inheirits from .nakedSquareButton
const CommentBtn = styled.button`
    background-color: #e8e8e8;
    color: rgb(54, 54, 46);
    border-radius: 3px;
    padding: 2px;
    background-image: url('/img/comment_add.svg');

    width: 25px;
    height: 25px;
    border-radius: 3px;
    opacity: 0.8;
    margin-left: 4px;
    background-size: 18px 18px;
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    background-color: transparent;
    cursor: pointer;

    &:hover {
        opacity: 1;
    }

    &:active {
        opacity: 1;
    }

    &:focus {
        outline: none;
    }
`

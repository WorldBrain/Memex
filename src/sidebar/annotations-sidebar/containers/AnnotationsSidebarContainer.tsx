import * as React from 'react'
import styled, { ThemeProvider } from 'styled-components'

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
    INIT_FORM_STATE,
} from './logic'
import { ButtonTooltip } from 'src/common-ui/components'
import { AnnotationFooterEventProps } from 'src/annotations/components/AnnotationFooter'
import { Annotation } from 'src/annotations/types'
import {
    AnnotationEditEventProps,
    AnnotationEditGeneralProps,
} from 'src/annotations/components/AnnotationEdit'

const DEF_CONTEXT: { context: AnnotationEventContext } = {
    context: 'pageAnnotations',
}

export interface Props extends SidebarContainerOptions {
    skipTopBarRender?: boolean
}

export class AnnotationsSidebarContainer<
    P extends Props = Props
> extends StatefulUIElement<P, SidebarContainerState, SidebarContainerEvents> {
    constructor(props: P) {
        super(props, new SidebarContainerLogic(props))
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

    private handleClickOutside = (e) => {
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

    protected bindAnnotationFooterEventProps(
        annotation: Annotation,
    ): AnnotationFooterEventProps {
        return {
            onEditIconClick: () =>
                this.processEvent('setAnnotationEditMode', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            toggleBookmark: () =>
                this.processEvent('toggleAnnotationBookmark', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onDeleteIconClick: () =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    mode: 'delete',
                    ...DEF_CONTEXT,
                }),
            onDeleteCancel: () =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    mode: 'default',
                    ...DEF_CONTEXT,
                }),
            onDeleteConfirm: () =>
                this.processEvent('deleteAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onEditCancel: () =>
                this.processEvent('switchAnnotationMode', {
                    annotationUrl: annotation.url,
                    mode: 'default',
                    ...DEF_CONTEXT,
                }),
            onEditConfirm: () =>
                this.processEvent('editAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
            onGoToAnnotation:
                this.props.showGoToAnnotationBtn && annotation.body?.length > 0
                    ? () =>
                          this.processEvent('goToAnnotationInNewTab', {
                              annotationUrl: annotation.url,
                              ...DEF_CONTEXT,
                          })
                    : undefined,
        }
    }

    protected bindAnnotationEditProps(
        annotation: Annotation,
    ): AnnotationEditEventProps & AnnotationEditGeneralProps {
        const { editForms } = this.state
        // Should only ever be undefined for a moment, between creating a new annot state and
        //  the time it takes for the BG method to return the generated PK
        const form = editForms[annotation.url] ?? { ...INIT_FORM_STATE.form }

        return {
            isTagInputActive: form.isTagInputActive,
            comment: form.commentText,
            tags: form.tags,
            updateTags: (args) =>
                this.processEvent('updateTagsForEdit', {
                    annotationUrl: annotation.url,
                    ...args,
                }),
            deleteSingleTag: (tag) =>
                this.processEvent('deleteEditCommentTag', {
                    annotationUrl: annotation.url,
                    tag,
                }),
            setTagInputActive: (active) =>
                this.processEvent('setEditCommentTagPicker', {
                    annotationUrl: annotation.url,
                    active,
                }),
            onCommentChange: (comment) =>
                this.processEvent('changeEditCommentText', {
                    annotationUrl: annotation.url,
                    comment,
                }),
            onEditConfirm: () =>
                this.processEvent('editAnnotation', {
                    annotationUrl: annotation.url,
                    ...DEF_CONTEXT,
                }),
        }
    }

    protected getEditableProps(): AnnotationsSidebarProps['annotationEditableProps'] {
        return {
            onMouseEnter: (url) =>
                this.processEvent('annotationMouseEnter', {
                    annotationUrl: url,
                }),
            onMouseLeave: (url) =>
                this.processEvent('annotationMouseLeave', {
                    annotationUrl: url,
                }),
            onGoToAnnotation: (url) =>
                this.processEvent('goToAnnotation', {
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
                    isBookmarked,
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

    private renderTopBar() {
        return (
            <TopBarContainerStyled>
                {this.props?.elements?.topBarLeft}
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
            <ThemeProvider theme={this.props.theme}>
                <ContainerStyled className="ignore-react-onclickoutside">
                    {!this.props.skipTopBarRender && this.renderTopBar()}
                    <AnnotationsSidebar
                        {...this.state}
                        needsWaypoint={!this.state.noResults}
                        appendLoader={
                            this.state.secondarySearchState === 'running'
                        }
                        annotationModes={
                            this.state.annotationModes.pageAnnotations
                        }
                        isAnnotationCreateShown={this.state.showCommentBox}
                        hoverAnnotationUrl={this.state.hoverAnnotationUrl}
                        annotationTagProps={this.getTagProps()}
                        annotationCreateProps={this.getCreateProps()}
                        annotationEditableProps={this.getEditableProps()}
                        bindAnnotationFooterEventProps={(url) =>
                            this.bindAnnotationFooterEventProps(url)
                        }
                        bindAnnotationEditProps={(url) =>
                            this.bindAnnotationEditProps(url)
                        }
                        handleScrollPagination={() =>
                            this.processEvent('paginateSearch', null)
                        }
                        isSearchLoading={
                            this.state.primarySearchState === 'running'
                        }
                        onClickOutside={this.handleClickOutside}
                        theme={this.props.theme}
                    />
                </ContainerStyled>
            </ThemeProvider>
        )
    }
}

const ContainerStyled = styled.div`
    height: 100%;
    overflow: hidden scroll;
    width: 450px;
    position: fixed;
    padding: 0px 0px 10px 5px;

    right: ${({ theme }: Props) => theme?.rightOffsetPx ?? 0}px;
    top: ${({ theme }: Props) => theme?.topOffsetPx ?? 0}px;
    padding-right: ${({ theme }: Props) => theme?.paddingRight ?? 0}px;

    z-index: 9999999; /* This is to combat pages setting high values on certain elements under the sidebar */
    background: #fff;
    transition: all 0.1s cubic-bezier(0.65, 0.05, 0.36, 1) 0s;
    box-shadow: rgba(15, 15, 15, 0.05) 0px 0px 0px 1px,
        rgba(15, 15, 15, 0.1) 0px 3px 6px, rgba(15, 15, 15, 0.2) 0px 9px 24px;
`

const TopBarContainerStyled = styled.div`
    position: static;
    top: 0;
    background: #fff;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 34px;
    box-sizing: border-box;
    padding: 5px 5px 5px 0px;
    width: 97%;
    margin-bottom: 2px;
    box-shadow: 0px 3px 5px -3px #e0e0e0;
`

// TODO: inheirits from .nakedSquareButton
const CommentBtn = styled.button`
    background-color: #e8e8e8;
    color: rgb(54, 54, 46);
    border-radius: 3px;
    padding: 2px;
    background-image: url('/img/comment_add.svg');
    width: 24px;
    height: 24px;
    border-radius: 3px;
    opacity: 0.8;
    background-size: 20px 20px;
    background-repeat: no-repeat;
    background-position: center;
    border: none;
    background-color: transparent;
    cursor: pointer;

    &:hover {
        opacity: 1;
        background-color: #e0e0e0;
    }

    &:active {
        opacity: 1;
    }

    &:focus {
        outline: none;
    }
`

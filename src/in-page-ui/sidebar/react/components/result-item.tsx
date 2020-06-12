import React, {
    Component,
    ReactNode,
    MouseEventHandler,
    DragEventHandler,
} from 'react'
import cx from 'classnames'

import AnnotationList from './annotation-list'
import { LoadingIndicator } from 'src/common-ui/components'
import { SocialPage } from 'src/social-integration/types'
import PageResultItem from 'src/common-ui/components/page-result-item'
import SocialResultItem from 'src/common-ui/components/social-result-item'
import { HighlightInteractionInterface } from 'src/highlighting/types'
import { AnnotationBoxEventProps } from 'src/in-page-ui/components/annotation-box/annotation-box'
import { AnnotationMode, SidebarEnv } from '../types'
import { TagsEventProps } from 'src/in-page-ui/components/annotation-box/edit-mode-content'
import AllModesFooter from 'src/in-page-ui/components/annotation-box/all-modes-footer'

const styles = require('./result-item.css')

export interface PageDeleteProps {
    pageUrlToDelete?: string
    handleDeletePage: () => Promise<void>
    handleDeletePageModalClose: () => void
}

export interface Props extends Partial<SocialPage> {
    url: string
    fullUrl: string
    title?: string
    favIcon?: string
    nullImg?: string
    screenshot?: string
    displayTime?: string
    isDeleting: boolean
    tags: string[]
    lists: string[]
    hasBookmark?: boolean
    isSidebarOpen?: boolean
    isListFilterActive: boolean
    areScreenshotsEnabled?: boolean
    areAnnotationsExpanded?: boolean
    isResponsibleForSidebar?: boolean
    isOverview?: boolean
    isSocial?: boolean
    annotations?: any[]
    annotsCount?: number
    tagHolder: ReactNode
    tagManager: ReactNode
    listManager: ReactNode
    copyPasterManager: ReactNode
    highlighter: HighlightInteractionInterface
    annotationEventProps: AnnotationBoxEventProps
    annotationModes: {
        [annotationUrl: string]: AnnotationMode
    }
    pageDeleteProps: PageDeleteProps
    tagsEventProps: TagsEventProps
    onTagBtnClick: MouseEventHandler
    onListBtnClick: MouseEventHandler
    onTrashBtnClick: MouseEventHandler
    onCommentBtnClick: MouseEventHandler
    onToggleBookmarkClick: MouseEventHandler
    onCopyPasterBtnClick: MouseEventHandler
    handleCrossRibbonClick: MouseEventHandler
    resetUrlDragged: () => void
    setUrlDragged: (url: string) => void
    setTagButtonRef: (el: HTMLElement) => void
    setListButtonRef: (el: HTMLElement) => void
    setCopyPasterButtonRef: (el: HTMLElement) => void
    isBetaEnabled: boolean
}

class ResultItem extends Component<Props> {
    get hrefToPage() {
        return `${this.props.fullUrl}`
    }

    get environment(): SidebarEnv {
        if (this.props.isOverview) {
            return 'overview'
        } else {
            return 'inpage'
        }
    }

    get shouldShowDeleteConfirm(): boolean {
        const { pageDeleteProps } = this.props

        return (
            pageDeleteProps.pageUrlToDelete != null &&
            pageDeleteProps.pageUrlToDelete === this.props.url
        )
    }

    dragStart: DragEventHandler = (e) => {
        const { url, setUrlDragged, isSocial } = this.props

        setUrlDragged(url)
        const crt = this.props.isOverview
            ? document.getElementById('dragged-element')
            : (document
                  .querySelector('.memex-ribbon-sidebar-container')
                  .shadowRoot.querySelector('#dragged-element') as HTMLElement)
        crt.style.display = 'block'

        const data = JSON.stringify({
            url,
            isSocialPost: isSocial,
        })

        e.dataTransfer.setData('text/plain', data)

        e.dataTransfer.setDragImage(crt, 10, 10)
    }

    private renderDeleteConfirm() {
        const { pageDeleteProps } = this.props

        if (!this.shouldShowDeleteConfirm) {
            return null
        }

        return (
            <AllModesFooter
                mode="delete"
                handleDeleteAnnotation={pageDeleteProps.handleDeletePage}
                handleCancelDeletion={
                    pageDeleteProps.handleDeletePageModalClose
                }
            />
        )
    }

    private renderAnnotsList() {
        if (!(this.props.annotations && this.props.annotations.length)) {
            return null
        }

        return (
            <AnnotationList
                env={this.environment}
                isExpandedOverride={this.props.areAnnotationsExpanded}
                openAnnotationSidebar={this.props.onCommentBtnClick}
                pageUrl={this.hrefToPage}
                annotations={this.props.annotations}
                highlighter={this.props.highlighter}
                annotationModes={this.props.annotationModes}
                annotationEventProps={this.props.annotationEventProps}
                tagsEventProps={this.props.tagsEventProps}
            />
        )
    }

    render() {
        return (
            <li
                className={cx({
                    [styles.isDeleting]: this.props.isDeleting,
                })}
            >
                {this.props.isDeleting && (
                    <LoadingIndicator className={styles.deletingSpinner} />
                )}
                {this.props.tagManager}
                {this.props.listManager}
                {this.props.copyPasterManager}
                <div
                    className={cx(styles.rootContainer, {
                        [styles.rootContainerBottomBorder]: !this
                            .shouldShowDeleteConfirm,
                        [styles.tweetRootContainer]: this.props.isSocial,
                        [styles.rootContainerOverview]: this.props.isOverview,
                        [styles.isSidebarOpen]: this.props
                            .isResponsibleForSidebar,
                    })}
                >
                    <a
                        onDragStart={this.dragStart}
                        onDragEnd={this.props.resetUrlDragged}
                        className={cx(styles.root, {
                            [styles.rootOverview]: this.props.isOverview,
                        })}
                        draggable
                        href={this.hrefToPage}
                        target="_blank"
                    >
                        {this.props.isSocial ? (
                            <SocialResultItem {...this.props} />
                        ) : (
                            <PageResultItem {...this.props} />
                        )}
                    </a>
                </div>
                {this.renderDeleteConfirm()}
                {this.renderAnnotsList()}
            </li>
        )
    }
}

export default ResultItem

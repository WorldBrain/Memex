import React, {
    PureComponent,
    ReactNode,
    MouseEventHandler,
    DragEventHandler,
} from 'react'
import cx from 'classnames'

import { runInBackground } from 'src/util/webextensionRPC'
import { AnnotationInterface } from 'src/annotations/background/types'
import AnnotationList from './annotation-list'
import { LoadingIndicator } from 'src/common-ui/components'
import { SocialPage } from 'src/social-integration/types'
import PageResultItem from './page-result-item'
import SocialResultItem from './social-result-item'
import SemiCircularRibbon from './semi-circular-ribbon'

const styles = require('./result-item.css')

// TODO (sidebar-refactor): I'm simply setting this up and passing this down
//  to the baby comps to save time, but all these components need to be sorted sometime
const annotationsBG = runInBackground<AnnotationInterface<'caller'>>()

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
    arePickersOpen?: boolean
    isListFilterActive: boolean
    areScreenshotsEnabled?: boolean
    areAnnotationsExpanded?: boolean
    isResponsibleForSidebar?: boolean
    activeShareMenuNoteId: string | undefined
    activeTagPickerNoteId: string | undefined
    activeCopyPasterAnnotationId: string | undefined
    isOverview?: boolean
    isSocial?: boolean
    annotations?: any[]
    annotsCount?: number
    tagHolder: ReactNode
    tagManager: ReactNode
    listManager: ReactNode
    copyPasterManager: ReactNode
    onTagBtnClick: MouseEventHandler
    onListBtnClick: MouseEventHandler
    onTrashBtnClick: MouseEventHandler
    onReaderBtnClick?: MouseEventHandler
    onCommentBtnClick: MouseEventHandler
    onToggleBookmarkClick: MouseEventHandler
    onCopyPasterBtnClick: MouseEventHandler
    handleCrossRibbonClick: MouseEventHandler
    goToAnnotation: (annotation: any) => void
    resetUrlDragged: () => void
    setUrlDragged: (url: string) => void
    setTagButtonRef: (el: HTMLElement) => void
    setListButtonRef: (el: HTMLElement) => void
    setCopyPasterButtonRef: (el: HTMLElement) => void
    setActiveTagPickerNoteId: (id: string) => void
    setActiveShareMenuNoteId?: (id: string) => void
    setActiveCopyPasterAnnotationId?: (id: string) => void
}

class ResultItem extends PureComponent<Props> {
    get hrefToPage() {
        return `${this.props.fullUrl}`
    }

    dragStart: DragEventHandler<HTMLAnchorElement> = (e) => {
        const { fullUrl, setUrlDragged, isSocial } = this.props

        setUrlDragged(fullUrl)
        const crt = this.props.isOverview
            ? document.getElementById('dragged-element')
            : (document
                  .querySelector('.memex-ribbon-sidebar-container')
                  .shadowRoot.querySelector('#dragged-element') as HTMLElement)
        crt.style.display = 'block'

        const data = JSON.stringify({
            url: fullUrl,
            isSocialPost: isSocial,
        })

        e.dataTransfer.setData('text/plain', data)

        e.dataTransfer.setDragImage(crt, 10, 10)
    }

    private handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (this.props.arePickersOpen || this.props.isSidebarOpen) {
            e.preventDefault()
        }
    }

    private renderAnnotsList() {
        if (!(this.props.annotations && this.props.annotations.length)) {
            return null
        }

        return (
            <AnnotationList
                {...this.props}
                isExpandedOverride={this.props.areAnnotationsExpanded}
                openAnnotationSidebar={this.props.onCommentBtnClick}
                pageUrl={this.hrefToPage}
                annotations={this.props.annotations}
                goToAnnotation={this.props.goToAnnotation}
                handleDeleteAnnotation={(url) =>
                    annotationsBG.deleteAnnotation(url)
                }
                handleEditAnnotation={async (url, comment, tags) => {
                    await annotationsBG.editAnnotation(url, comment)
                    await annotationsBG.updateAnnotationTags({ url, tags })
                }}
            />
        )
    }

    render() {
        return (
            <li
                className={cx(styles.listItem, styles.resultBox, {
                    [styles.isDeleting]: this.props.isDeleting,
                })}
            >
                <div className={styles.resultBoxItem}>
                    {this.props.isDeleting && (
                        <LoadingIndicator className={styles.deletingSpinner} />
                    )}
                    {this.props.tagManager}
                    {this.props.listManager}
                    {this.props.copyPasterManager}
                    <div
                        className={cx(
                            styles.rootContainer,
                            styles.rootContainerOverview,
                            {
                                [styles.tweetRootContainer]: this.props
                                    .isSocial,
                                [styles.isSidebarOpen]: this.props
                                    .isResponsibleForSidebar,
                            },
                        )}
                    >
                        <a
                            onClick={this.handleClick}
                            onDragStart={this.dragStart}
                            onDragEnd={this.props.resetUrlDragged}
                            className={cx(styles.root, styles.rootOverview)}
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
                    {this.renderAnnotsList()}
                </div>

                {this.props.isListFilterActive && (
                    <div className={styles.removeCollectionItemBox}>
                        <SemiCircularRibbon
                            onClick={this.props.handleCrossRibbonClick}
                        />
                    </div>
                )}
            </li>
        )
    }
}

export default ResultItem

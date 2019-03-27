import React, {
    PureComponent,
    ReactNode,
    MouseEventHandler,
    DragEventHandler,
} from 'react'
import classNames from 'classnames'

import { LoadingIndicator } from '../../../common-ui/components'
import niceTime from '../../../util/nice-time'
import SemiCircularRibbon from './SemiCircularRibbon'
import ButtonTooltip from '../../../common-ui/components/button-tooltip'
import AnnotationList from './annotation-list'

const styles = require('./PageResultItem.css')

export interface Props {
    url: string
    title: string
    favIcon: string
    nullImg?: string
    screenshot: string
    displayTime: number
    isDeleting: boolean
    hasBookmark: boolean
    isSidebarOpen: boolean
    isListFilterActive: boolean
    areAnnotationsExpanded: boolean
    isResponsibleForSidebar: boolean
    annotations: any[]
    annotsCount: number
    tagHolder: ReactNode
    tagManager: ReactNode
    onTagBtnClick: MouseEventHandler
    onTrashBtnClick: MouseEventHandler
    onCommentBtnClick: MouseEventHandler
    onToggleBookmarkClick: MouseEventHandler
    handleCrossRibbonClick: MouseEventHandler
    resetUrlDragged: () => void
    hideSearchFilters: () => void
    setUrlDragged: (url: string) => void
    setTagButtonRef: (el: HTMLButtonElement) => void
}

class PageResultItem extends PureComponent<Props> {
    static defaultProps = {
        nullImg: '/img/null-icon.png',
    }

    get bookmarkClass() {
        return classNames(styles.button, {
            [styles.bookmark]: this.props.hasBookmark,
            [styles.notBookmark]: !this.props.hasBookmark,
        })
    }

    get hrefToPage() {
        return `http://${this.props.url}`
    }

    dragStart: DragEventHandler = e => {
        const { url, setUrlDragged } = this.props

        setUrlDragged(url)
        const crt = document.getElementById('dragged-element')
        crt.style.display = 'block'

        e.dataTransfer.setData('text/plain', url)

        e.dataTransfer.setDragImage(crt, 10, 10)
        if (this.props.isSidebarOpen) {
            this.props.hideSearchFilters()
        }
    }

    renderAnnotsList() {
        if (!(this.props.annotations && this.props.annotations.length)) {
            return null
        }

        return (
            <AnnotationList
                isExpandedOverride={this.props.areAnnotationsExpanded}
                openAnnotationSidebar={this.props.onCommentBtnClick}
                pageUrl={this.hrefToPage}
                annotations={this.props.annotations}
            />
        )
    }

    render() {
        return (
            <li
                className={classNames({
                    [styles.isDeleting]: this.props.isDeleting,
                })}
            >
                {this.props.isDeleting && (
                    <LoadingIndicator className={styles.deletingSpinner} />
                )}
                <div
                    className={classNames(styles.rootContainer, {
                        [styles.isSidebarOpen]: this.props
                            .isResponsibleForSidebar,
                    })}
                >
                    <a
                        onDragStart={this.dragStart}
                        onDragEnd={this.props.resetUrlDragged}
                        className={styles.root}
                        href={this.hrefToPage}
                        target="_blank"
                        draggable
                    >
                        <div className={styles.screenshotContainer}>
                            <img
                                className={styles.screenshot}
                                src={
                                    this.props.screenshot == null
                                        ? this.props.nullImg
                                        : this.props.screenshot
                                }
                            />
                        </div>
                        <div className={styles.infoContainer}>
                            <div className={styles.firstlineContainer}>
                                <div
                                    className={styles.title}
                                    title={this.props.title}
                                >
                                    {this.props.favIcon && (
                                        <img
                                            className={styles.favIcon}
                                            src={this.props.favIcon}
                                        />
                                    )}
                                    <span className={styles.titleText}>
                                        {this.props.title}
                                    </span>
                                </div>
                                <ButtonTooltip
                                    tooltipText="Remove from collection"
                                    position="leftNarrow"
                                >
                                    <div className={styles.crossRibbon}>
                                        {this.props.isListFilterActive && (
                                            <SemiCircularRibbon
                                                onClick={
                                                    this.props
                                                        .handleCrossRibbonClick
                                                }
                                            />
                                        )}
                                    </div>
                                </ButtonTooltip>
                            </div>
                            <div className={styles.url}>{this.props.url}</div>

                            <div className={styles.detailsContainer}>
                                <div className={styles.detailsBox}>
                                    <div className={styles.displayTime}>
                                        {' '}
                                        {niceTime(this.props.displayTime)}{' '}
                                    </div>
                                    {/* Tag Holder */}
                                    {this.props.tagHolder}
                                </div>
                                <div
                                    className={styles.buttonsContainer}
                                    onClick={e => e.preventDefault()}
                                >
                                    <button
                                        disabled={this.props.isDeleting}
                                        className={classNames(
                                            styles.button,
                                            styles.trash,
                                        )}
                                        onClick={this.props.onTrashBtnClick}
                                        title={
                                            'Delete this page & all related content'
                                        }
                                    />
                                    <button
                                        className={classNames(
                                            styles.button,
                                            styles.tag,
                                        )}
                                        onClick={this.props.onTagBtnClick}
                                        ref={this.props.setTagButtonRef}
                                        title={'Add/View Tags'}
                                    />
                                    <button
                                        className={classNames(
                                            styles.button,
                                            styles.comment,
                                            {
                                                [styles.commentActive]:
                                                    this.props.annotsCount > 0,
                                            },
                                        )}
                                        onClick={this.props.onCommentBtnClick}
                                        title={
                                            'Add/View Commments & Annotations'
                                        }
                                    >
                                        <span className={styles.annotsCount}>
                                            {this.props.annotsCount}
                                        </span>
                                    </button>
                                    <button
                                        disabled={this.props.isDeleting}
                                        className={this.bookmarkClass}
                                        onClick={
                                            this.props.onToggleBookmarkClick
                                        }
                                        title={'Bookmark this page'}
                                    />
                                </div>
                            </div>
                        </div>
                    </a>
                </div>
                {this.props.tagManager}
                {this.renderAnnotsList()}
            </li>
        )
    }
}

export default PageResultItem

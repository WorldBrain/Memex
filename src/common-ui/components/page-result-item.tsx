import React, {
    PureComponent,
    MouseEventHandler,
    ReactNode,
    DragEventHandler,
} from 'react'
import cx from 'classnames'

import SemiCircularRibbon from './semi-circular-ribbon'
import LoadingIndicator from './LoadingIndicator'
import AnnotationList from './annotation-list'
import ButtonTooltip from './button-tooltip'

const styles = require('./page-result-item.css')

export interface Props {
    url: string
    title: string
    favIcon: string
    nullImg?: string
    screenshot: string
    displayTime: string
    annotsCount: number
    isDeleting?: boolean
    isOverview?: boolean
    hasBookmark?: boolean
    isListFilterActive?: boolean
    areScreenshotsEnabled?: boolean
    areAnnotationsExpanded?: boolean
    isResponsibleForSidebar?: boolean
    annotations: any[]
    tagHolder: ReactNode
    tagManager: ReactNode
    onTagBtnClick: MouseEventHandler
    onTrashBtnClick: MouseEventHandler
    onCommentBtnClick: MouseEventHandler
    onToggleBookmarkClick: MouseEventHandler
    handleCrossRibbonClick: MouseEventHandler
    setUrlDragged: (url: string) => void
    resetUrlDragged: () => void
    setTagButtonRef: (el: HTMLButtonElement) => void
}

export class PageResultItem extends PureComponent<Props> {
    static defaultProps = {
        nullImg: '/img/null-icon.png',
    }

    get bookmarkClass() {
        return cx(styles.button, {
            [styles.bookmark]: this.props.hasBookmark,
            [styles.notBookmark]: !this.props.hasBookmark,
        })
    }

    get hrefToPage() {
        return `http://${this.props.url}`
    }

    private dragStart: DragEventHandler = e => {
        const { url, setUrlDragged } = this.props

        setUrlDragged(url)
        const crt = this.props.isOverview
            ? document.getElementById('dragged-element')
            : (document
                  .querySelector('.memex-ribbon-sidebar-container')
                  .shadowRoot.querySelector('#dragged-element') as HTMLElement)

        crt.style.display = 'block'

        e.dataTransfer.setData('text/plain', url)
        e.dataTransfer.setDragImage(crt, 10, 10)
    }

    private renderAnnotsList() {
        if (!(this.props.annotations && this.props.annotations.length)) {
            return null
        }

        return (
            <AnnotationList
                env="overview"
                isExpandedOverride={this.props.areAnnotationsExpanded}
                openAnnotationSidebar={this.props.onCommentBtnClick}
                pageUrl={this.hrefToPage}
                annotations={this.props.annotations}
            />
        )
    }

    private renderScreenshot() {
        if (!this.props.isOverview || !this.props.areScreenshotsEnabled) {
            return null
        }

        return (
            <div className={styles.screenshotContainer}>
                {this.props.screenshot == null ? (
                    <ButtonTooltip
                        position="CenterCenter"
                        tooltipText="Screenshots are not captured when importing, or when you switch away from a tab too quickly."
                    >
                        <img
                            className={styles.screenshot}
                            src={this.props.nullImg}
                        />
                    </ButtonTooltip>
                ) : (
                    <img
                        className={styles.screenshot}
                        src={this.props.screenshot}
                    />
                )}
            </div>
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
                <div
                    className={cx(styles.rootContainer, {
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
                        href={this.hrefToPage}
                        target="_blank"
                        draggable
                    >
                        {this.renderScreenshot()}
                        <div
                            className={cx(styles.infoContainer, {
                                [styles.infoContainerOverview]: this.props
                                    .isOverview,
                                [styles.noScreenshot]: !this.props
                                    .areScreenshotsEnabled,
                            })}
                        >
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
                            {!this.props.isOverview && this.props.tagHolder}

                            <div className={styles.detailsContainer}>
                                <div className={styles.detailsBox}>
                                    <div className={styles.displayTime}>
                                        {this.props.displayTime}
                                    </div>
                                    {this.props.isOverview &&
                                        this.props.tagHolder}
                                </div>
                                <div
                                    className={styles.buttonsContainer}
                                    onClick={e => e.preventDefault()}
                                >
                                    <button
                                        disabled={this.props.isDeleting}
                                        className={cx(
                                            styles.button,
                                            styles.trash,
                                        )}
                                        onClick={this.props.onTrashBtnClick}
                                        title="Delete this page & all related content"
                                    />
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.tag,
                                        )}
                                        onClick={this.props.onTagBtnClick}
                                        ref={this.props.setTagButtonRef}
                                        title="Add/View Tags"
                                    />
                                    <button
                                        className={cx(
                                            styles.button,
                                            styles.comment,
                                            {
                                                [styles.commentActive]:
                                                    this.props.annotsCount > 0,
                                            },
                                        )}
                                        onClick={this.props.onCommentBtnClick}
                                        title="Add/View Commments & Annotations"
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
                                        title="Star this page"
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

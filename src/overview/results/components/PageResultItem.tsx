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
    tagPills: ReactNode[]
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
                <div className={styles.rootContainer}>
                    <a
                        onDragStart={this.dragStart}
                        onDragEnd={this.props.resetUrlDragged}
                        className={styles.root}
                        href={this.props.url}
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
                        <div className={styles.descriptionContainer}>
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
                                {this.props.title}
                            </div>
                            <div className={styles.url}>{this.props.url}</div>
                            <div className={styles.time}>
                                <div className={styles.displayTime}>
                                    {' '}
                                    {niceTime(this.props.displayTime)}{' '}
                                </div>
                                <span className={styles.tagList}>
                                    {this.props.tagPills}
                                </span>
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
                                        )}
                                        onClick={this.props.onCommentBtnClick}
                                        title={
                                            'Add/View Commments & Annotations'
                                        }
                                    />
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
                    <div className={styles.crossRibbon}>
                        {this.props.isListFilterActive && (
                            <SemiCircularRibbon
                                onClick={this.props.handleCrossRibbonClick}
                            />
                        )}
                    </div>
                </div>
                <AnnotationList
                    openAnnotationSidebar={this.props.onCommentBtnClick}
                />
                {this.props.tagManager}
            </li>
        )
    }
}

export default PageResultItem

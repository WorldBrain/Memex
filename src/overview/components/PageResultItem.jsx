import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { LoadingIndicator } from 'src/common-ui/components'
import niceTime from 'src/util/nice-time'
import styles from './PageResultItem.css'
import SemiCircularRibbon from './SemiCircularRibbon'

const nullImg = '/img/null-icon.png'

const getBookmarkClass = ({ hasBookmark }) =>
    classNames(styles.button, {
        [styles.bookmark]: hasBookmark,
        [styles.notBookmark]: !hasBookmark,
    })

class PageResultItem extends PureComponent {
    static propTypes = {
        favIcon: PropTypes.string,
        screenshot: PropTypes.string,
        displayTime: PropTypes.number.isRequired,
        url: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        hasBookmark: PropTypes.bool.isRequired, // eslint-disable-line
        isDeleting: PropTypes.bool.isRequired,
        onTrashBtnClick: PropTypes.func.isRequired,
        onToggleBookmarkClick: PropTypes.func.isRequired,
        tagPills: PropTypes.array.isRequired,
        tagManager: PropTypes.node,
        onTagBtnClick: PropTypes.func.isRequired,
        setTagButtonRef: PropTypes.func.isRequired,
        isListFilterActive: PropTypes.bool.isRequired,
        handleCrossRibbonClick: PropTypes.func.isRequired,
        setUrlDragged: PropTypes.func.isRequired,
        hideSearchFilters: PropTypes.func.isRequired,
        isSidebarOpen: PropTypes.bool.isRequired,
    }

    dragStart = e => {
        const { url, setUrlDragged } = this.props
        setUrlDragged(url)
        const crt = document.getElementById('dragged-element')
        crt.style.display = 'block'

        e.dataTransfer.setData('text/plain', url)

        e.dataTransfer.setDragImage(crt, 15, 15)
        if (this.props.isSidebarOpen) this.props.hideSearchFilters()
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
                        draggable="true"
                        onDragStart={this.dragStart}
                        className={styles.root}
                        href={this.props.url}
                        target="_blank"
                    >
                        <div className={styles.screenshotContainer}>
                            <img
                                className={styles.screenshot}
                                src={
                                    this.props.screenshot == null
                                        ? nullImg
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
                                        className={classNames(
                                            styles.button,
                                            styles.tag,
                                        )}
                                        onClick={this.props.onTagBtnClick}
                                        ref={this.props.setTagButtonRef}
                                    />
                                    <button
                                        className={classNames(
                                            styles.button,
                                            styles.comment,
                                        )}
                                        onClick={this.props.onCommentBtnClick}
                                    />
                                    <button
                                        disabled={this.props.isDeleting}
                                        className={classNames(
                                            styles.button,
                                            styles.trash,
                                        )}
                                        onClick={this.props.onTrashBtnClick}
                                    />
                                    <button
                                        disabled={this.props.isDeleting}
                                        className={getBookmarkClass(this.props)}
                                        onClick={
                                            this.props.onToggleBookmarkClick
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </a>
                    <div className={styles.crossRibbon}>
                        {this.props.isListFilterActive && (
                            <SemiCircularRibbon title="Remove from this collection">
                                <img
                                    onClick={this.props.handleCrossRibbonClick}
                                    src="/img/cross_grey.svg"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                    }}
                                />
                            </SemiCircularRibbon>
                        )}
                    </div>
                </div>
                {this.props.tagManager}
            </li>
        )
    }
}

export default PageResultItem

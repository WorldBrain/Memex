import React from 'react'
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

const PageResultItem = props => (
    <li className={classNames({ [styles.isDeleting]: props.isDeleting })}>
        {props.isDeleting && (
            <LoadingIndicator className={styles.deletingSpinner} />
        )}
        <div className={styles.rootContainer}>
            <a
                draggable="true"
                className={styles.root}
                href={props.url}
                target="_blank"
            >
                <div className={styles.screenshotContainer}>
                    <img
                        className={styles.screenshot}
                        src={
                            props.screenshot == null
                                ? nullImg
                                : props.screenshot
                        }
                    />
                </div>
                <div className={styles.descriptionContainer}>
                    <div className={styles.title} title={props.title}>
                        {props.favIcon && (
                            <img
                                className={styles.favIcon}
                                src={props.favIcon}
                            />
                        )}
                        {props.title}
                    </div>
                    <div className={styles.url}>{props.url}</div>
                    <div className={styles.time}>
                        <div className={styles.displayTime}>
                            {' '}
                            {niceTime(props.displayTime)}{' '}
                        </div>
                        <span className={styles.tagList}>{props.tagPills}</span>
                        <div
                            className={styles.buttonsContainer}
                            onClick={e => e.preventDefault()}
                        >
                            <button
                                className={classNames(
                                    styles.button,
                                    styles.tag,
                                )}
                                onClick={props.onTagBtnClick}
                                ref={props.setTagButtonRef}
                            />
                            <button
                                className={classNames(
                                    styles.button,
                                    styles.comment,
                                )}
                                onClick={this.props.onCommentBtnClick}
                            />
                            <button
                                disabled={props.isDeleting}
                                className={classNames(
                                    styles.button,
                                    styles.trash,
                                )}
                                onClick={props.onTrashBtnClick}
                            />
                            <button
                                disabled={props.isDeleting}
                                className={getBookmarkClass(props)}
                                onClick={props.onToggleBookmarkClick}
                            />
                        </div>
                    </div>
                </div>
            </a>
            <div className={styles.crossRibbon}>
                {props.isListFilterActive && (
                    <SemiCircularRibbon title="Remove from currently selected list">
                        <img
                            onClick={props.handleCrossRibbonClick}
                            src="/img/cross.svg"
                            style={{ maxWidth: '100%', maxHeight: '100%' }}
                        />
                    </SemiCircularRibbon>
                )}
            </div>
            <div>
                {props.showListDropdown && (
                    <SemiCircularRibbon>
                        <input
                            type="checkbox"
                            checked={props.isUrlEdited}
                            className={styles.checkbox}
                        />
                        <label onClick={props.handleToggleUrlToEdit} />
                    </SemiCircularRibbon>
                )}
            </div>
        </div>
        {props.tagManager}
    </li>
)

PageResultItem.propTypes = {
    favIcon: PropTypes.string,
    screenshot: PropTypes.string,
    displayTime: PropTypes.number.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    hasBookmark: PropTypes.bool.isRequired, // eslint-disable-line
    isDeleting: PropTypes.bool.isRequired,
    onTrashBtnClick: PropTypes.func.isRequired,
    onCommentBtnClick: PropTypes.func.isRequired,
    onToggleBookmarkClick: PropTypes.func.isRequired,
    tagPills: PropTypes.array.isRequired,
    tagManager: PropTypes.node,
    onTagBtnClick: PropTypes.func.isRequired,
    setTagButtonRef: PropTypes.func.isRequired,
    isListFilterActive: PropTypes.bool.isRequired,
    handleCrossRibbonClick: PropTypes.func.isRequired,
    showListDropdown: PropTypes.bool.isRequired,
    isUrlEdited: PropTypes.bool.isRequired,
    handleToggleUrlToEdit: PropTypes.func.isRequired,
}

export default PageResultItem

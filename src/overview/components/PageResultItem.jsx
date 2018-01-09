import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import { LoadingIndicator } from 'src/common-ui/components'
import niceTime from 'src/util/nice-time'
import ImgFromPouch from './ImgFromPouch'
import styles from './PageResultItem.css'

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
        <a className={styles.root} href={props.url} target="_blank">
            <div className={styles.screenshotContainer}>
                {props._attachments && props._attachments.screenshot ? (
                    <ImgFromPouch
                        className={styles.screenshot}
                        doc={props}
                        attachmentId="screenshot"
                    />
                ) : (
                    <img
                        className={styles.screenshot}
                        src="/img/null-icon.png"
                    />
                )}
            </div>
            <div className={styles.descriptionContainer}>
                <div className={styles.title} title={props.title}>
                    {props._attachments &&
                        props._attachments.favIcon && (
                            <ImgFromPouch
                                className={styles.favIcon}
                                doc={props}
                                attachmentId="favIcon"
                            />
                        )}
                    {props.title}
                </div>
                <div className={styles.url}>{props.url}</div>
                <div className={styles.time}>
                    {niceTime(+props.displayTime)}
                    <div className={styles.buttonsContainer}>
                        <button
                            className={classNames(styles.button, styles.tag)}
                            onClick={props.onTagBtnClick(props._id)}
                        />
                        <button
                            disabled={props.isDeleting}
                            className={classNames(styles.button, styles.trash)}
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
        {props.showOrNot && props.children}
    </li>
)

PageResultItem.propTypes = {
    _attachments: PropTypes.object,
    displayTime: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    hasBookmark: PropTypes.bool.isRequired, // eslint-disable-line
    isDeleting: PropTypes.bool.isRequired,
    onTrashBtnClick: PropTypes.func.isRequired,
    onToggleBookmarkClick: PropTypes.func.isRequired,
    children: PropTypes.object.isRequired,
    showOrNot: PropTypes.bool.isRequired,
    onTagBtnClick: PropTypes.func.isRequired,
    _id: PropTypes.string.isRequired,
}

export default PageResultItem

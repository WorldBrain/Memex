import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import niceTime from 'src/util/nice-time'
import ImgFromPouch from './ImgFromPouch'
import styles from './PageResultItem.css'

const getBookmarkClass = ({ hasBookmark }) =>
    classNames(styles.button, {
        [styles.bookmark]: hasBookmark,
        [styles.notBookmark]: !hasBookmark,
    })

const PageResultItem = props => (
    <a className={styles.root} href={props.url} target="_blank">
        <div className={styles.screenshotContainer}>
            {props._attachments && props._attachments.screenshot ? (
                <ImgFromPouch
                    className={styles.screenshot}
                    doc={props}
                    attachmentId="screenshot"
                />
            ) : (
                <img className={styles.screenshot} src="/img/null-icon.png" />
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
            <div className={styles.time}>{niceTime(+props.displayTime)}</div>
        </div>
        <div className={styles.buttonsContainer}>
            <button className={getBookmarkClass(props)}
                onClick={props.hasBookmark? props.onUnbookmarkClick: props.onBookmarkClick}
            />
            <button
                className={classNames(styles.button, styles.trash)}
                onClick={props.onTrashBtnClick}
            />
        </div>
    </a>
)

PageResultItem.propTypes = {
    _attachments: PropTypes.object.isRequired,
    displayTime: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    hasBookmark: PropTypes.bool.isRequired, // eslint-disable-line
    onTrashBtnClick: PropTypes.func.isRequired,
    onUnbookmarkClick: PropTypes.func.isRequired,
    onBookmarkClick: PropTypes.func.isRequired,
}

export default PageResultItem

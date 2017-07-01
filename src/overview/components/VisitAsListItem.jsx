import get from 'lodash/fp/get'
import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { Button, Popup } from 'semantic-ui-react'
import classNames from 'classnames'

import { LinkToLocalVersion } from 'src/page-viewer'
import niceTime from 'src/util/nice-time'

import ImgFromPouch from './ImgFromPouch'
import styles from './VisitAsListItem.css'
import { deleteVisit } from '../actions'


const VisitAsListItem = ({doc, compact, onTrashButtonClick}) => {
    const pageSize = get(['_attachments', 'frozen-page.html', 'length'])(doc.page)
    const sizeInMB = pageSize !== undefined
        ? Math.round(pageSize / 1024**2 * 10) / 10
        : 0
    const visitClasses = classNames({
        [styles.root]: true,
        [styles.compact]: compact,
    })
    const hasFavIcon = !!(doc.page._attachments && doc.page._attachments.favIcon)
    const favIcon = hasFavIcon
        ? (
            <ImgFromPouch
                className={styles.favIcon}
                doc={doc.page}
                attachmentId='favIcon'
            />
        )
        : <img className={styles.favIcon} src='img/null-icon.png' />
    return (
        <LinkToLocalVersion
            page={doc.page}
            className={visitClasses}
            // DEBUG Show document props on ctrl+meta+click
            onClick={e => { if (e.metaKey && e.ctrlKey) { console.log(doc); e.preventDefault() } }}
        >
            <div className={styles.screenshotContainer}>
                {doc.page._attachments && doc.page._attachments.screenshot
                    ? (
                        <ImgFromPouch
                            className={styles.screenshot}
                            doc={doc.page}
                            attachmentId='screenshot'
                        />
                    )
                    : favIcon
                }
            </div>
            <div className={styles.descriptionContainer}>
                <div
                    className={styles.title}
                >
                    {hasFavIcon && favIcon}
                    <span title={doc.page.title}>
                        {doc.page.title}
                    </span>
                </div>
                <div className={styles.url}>
                    <a
                        href={doc.page.url}
                    >
                        {doc.page.url}
                    </a>
                </div>
                <div className={styles.time}>{niceTime(doc.visitStart)}</div>
            </div>
            <div className={styles.buttonsContainer}>
                <Popup
                    trigger={
                        <Button
                            icon='trash'
                            onClick={e => { e.preventDefault() }}
                        />
                    }
                    content={
                        <Button
                            negative
                            content={`Forget this item`}
                            onClick={e => { onTrashButtonClick() }}
                            title={`Stored page size: ${sizeInMB} MB`}
                        />
                    }
                    on='focus'
                    hoverable
                    position='right center'
                />
            </div>
        </LinkToLocalVersion>
    )
}

VisitAsListItem.propTypes = {
    doc: PropTypes.object.isRequired,
    compact: PropTypes.bool,
    onTrashButtonClick: PropTypes.func,
}


const mapStateToProps = state => ({})

const mapDispatchToProps = (dispatch, {doc}) => ({
    onTrashButtonClick: () => dispatch(deleteVisit({visitId: doc._id})),
})

export default connect(mapStateToProps, mapDispatchToProps)(VisitAsListItem)

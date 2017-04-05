import React, { PropTypes } from 'react'
import classNames from 'classnames'

import {localVersionAvailable, LinkToLocalVersion} from 'src/page-viewer'
import niceTime from 'src/util/nice-time'
import styles from './VisitAsListItem.css'


const VisitAsListItem = ({doc, compact}) => {
    const visitClasses = classNames({
        [styles.root]: true,
        [styles.compact]: compact,
    })

    return (
        <a
            className={visitClasses}
            href={doc.page.url}
            title={doc.page.url}
            // DEBUG Show document props on ctrl+meta+click
            onClick={e => { if (e.metaKey && e.ctrlKey) { console.log(doc); e.preventDefault() } }}
        >
            <span className={styles.pageIconContainer} title={doc.page.title}>
                {doc.page.favIcon
                    ? <img src={doc.page.favIcon} />
                    : <img src='img/null-icon.png' />
                }
            </span>
            <div className={styles.descriptionContainer}>
                <div className={styles.title}><strong>{doc.page.title}</strong></div>
                <div className={styles.url}>{doc.page.url}</div>
                <div className={styles.time}>{niceTime(doc.visitStart)}</div>
            </div>
            <div className={styles.buttonsContainer}>
                {localVersionAvailable({page: doc.page})
                    ? (
                        <LinkToLocalVersion page={doc.page}>
                            <img src='img/save-icon.png' alt='save-icon' />
                        </LinkToLocalVersion>
                    )
                    : null
                }
                <img src='img/trash-icon.png' alt='trash-icon' />
            </div>
            <div className={styles.screenshotContainer}>
                {doc.page.screenshot
                    ? <img src={doc.page.screenshot} />
                    : <p className={styles.noScreenshotAvailable}>No screenshot available.</p>
                }
            </div>
        </a>
    )
}

VisitAsListItem.propTypes = {
    doc: PropTypes.object.isRequired,
    compact: PropTypes.bool,
}

export default VisitAsListItem

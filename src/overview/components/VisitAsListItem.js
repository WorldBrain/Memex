import React from 'react'
import classNames from 'classnames'
import niceTime from '../../util/nice-time'
import styles from './VisitAsListItem.css'

import {localVersionAvailable, LinkToLocalVersion } from '../../page-viewer'

const VisitAsListItem = ({doc, compact}) => {
    const visitClasses = classNames({
        [styles.root]: true,
        [styles.compact]: compact
    })

    return (
        <a
            className={visitClasses}
            href={doc.page.url}
            title={doc.page.url}
            // DEBUG Show document props on ctrl+meta+click
            onClick={e=>{if (e.metaKey && e.ctrlKey) {console.log(doc); e.preventDefault()}}}
        >

            <span className={styles.logo} title={doc.page.title}>
                {doc.page.favIcon
                    ? <img className={styles.favicon} src={doc.page.favIcon} />
                    : <img className={styles.favicon} src='img/null-icon.png' />
                }
            </span>
            <div className={styles.result_content}>
                <div className={styles.title}><strong>{doc.page.title}</strong></div>
                <div className={styles.url}>{doc.page.url}</div>
                <div className={styles.time}>{niceTime(doc.visitStart)}</div>
            </div>
            <div className={styles.linkToLocalVersion}>
                {localVersionAvailable({page: doc.page})
                    ? <LinkToLocalVersion page={doc.page}>
                    <img src='img/save-icon.png' alt='save-icon' />
                    </LinkToLocalVersion>
                    : null
                }
                <img src='img/trash-icon.png' alt='trash-icon' />
            </div>
            <div className={styles.screenshot}>
                {doc.page.screenshot
                ? <img className={styles.thumbnail} src={doc.page.screenshot} />
                : <p className={styles.no_thumbnail}>No screenshot<br />available</p>
                }
            </div>
        </a>
    )
}

export default VisitAsListItem

import React from 'react'

import {localVersionAvailable, LinkToLocalVersion } from '../../page-viewer'

const VisitAsListItem = ({doc}) => (
    <a
        className="VisitAsListItem"
        href={doc.page.url}
        title={doc.page.url}
        // DEBUG Show document props on meta+click
        onClick={e=>{if (e.metaKey) {console.log(doc); e.preventDefault()}}}
    >

        {doc.page.screenshot
            ? <img className="thumbnail" src={doc.page.screenshot} />
            : null
        }

        <div className="caption">
            <span className="title" title={doc.page.title}>
                {doc.page.favIcon
                    ? <img className="favIcon" src={doc.page.favIcon} />
                    : null
                }
                {doc.page.title}
            </span>
            {localVersionAvailable({page: doc.page})
                ? <LinkToLocalVersion page={doc.page}>💾</LinkToLocalVersion>
                : null
            }
        </div>
    </a>
)

export default VisitAsListItem

import React from 'react'

import niceTime from '../../util/nice-time'

const VisitAsListItem = ({doc, extraBottomSpace, style}) => (
    <a
        className="VisitAsListItem"
        href={doc.page.url}
        title={doc.page.url}
        style={{marginBottom: extraBottomSpace, ...style}}
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

            <time className="timestamp" dateTime={new Date(doc.visitStart)}>
                {doc.visitStart ? niceTime(doc.visitStart) : null}
            </time>
        </div>
    </a>
)

export default VisitAsListItem

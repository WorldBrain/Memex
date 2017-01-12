import React from 'react'

import niceTime from '../../util/nice-time'


const WebPageAsListItem = ({doc, extraBottomSpace, style}) => (
    <a
        className="WebPageAsListItem"
        href={doc.visitedUrl}
        title={doc.visitedUrl}
        style={{marginBottom: extraBottomSpace, ...style}}
    >

        {doc.screenshot ? <img className="thumbnail" src={doc.screenshot} /> : null}

        <div className="caption">
            <span className="title" title={doc.title}>
                {doc.favIcon ? <img className="favIcon" src={doc.favIcon} /> : null}
                {doc.title}
            </span>

            <time className="timestamp" dateTime={new Date(doc.timestamp)}>
                {niceTime(doc.timestamp)}
            </time>
        </div>
    </a>
)

export default WebPageAsListItem

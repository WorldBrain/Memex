import React from 'react'

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

        </div>
    </a>
)

export default VisitAsListItem

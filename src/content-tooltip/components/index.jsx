import React from 'react'
import ReactDOM from 'react-dom'
import Container from './container'

export default function setupUIContainer(
    target,
    { createAndCopyDirectLink, openSettings },
) {
    return new Promise(resolve => {
        ReactDOM.render(
            <Container
                onInit={showTooltip => resolve(showTooltip)}
                createAndCopyDirectLink={createAndCopyDirectLink}
                openSettings={openSettings}
            />,
            target,
        )
    })
}

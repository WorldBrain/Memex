import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import styled from 'styled-components'

import { theme } from 'src/common-ui/components/design-library/theme'
import TutorialContainer, { Props } from './tutorial-container'
import { tutorialContents } from './tutorial-cards-content'

// card container (hold cycling logic)
// card component (holds card content, isEndOfCycle, isStartOfCycle)

export function setupTutorialUIContainer(
    target: Element,
    params: {
        destroyTutorial: () => void
        finishTutorial: () => void
    },
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(
            <ThemeProvider theme={theme}>
                <TutorialContainer content={tutorialContents} {...params} />
            </ThemeProvider>,
            target,
        )
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}

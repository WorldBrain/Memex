import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import styled from 'styled-components'

import {
    loadThemeVariant,
    theme,
} from 'src/common-ui/components/design-library/theme'
import TutorialContainer, { Props } from './tutorial-container'
import { tutorialContents } from './tutorial-cards-content'
import { MemexThemeVariant } from '@worldbrain/memex-common/lib/common-ui/styles/types'

// card container (hold cycling logic)
// card component (holds card content, isEndOfCycle, isStartOfCycle)

export interface TutorialParams {
    destroyTutorial: () => void
    finishTutorial: () => void
}
interface TutorialRootProps {
    params: TutorialParams
}

interface TutorialRootState {
    themeVariant?: MemexThemeVariant
}

class Root extends React.Component<TutorialRootProps, TutorialRootState> {
    state: TutorialRootState = {}

    async componentDidMount() {
        this.setState({
            themeVariant: await loadThemeVariant(),
        })
    }

    render() {
        const { themeVariant } = this.state
        if (!themeVariant) {
            return null
        }

        return (
            <ThemeProvider theme={theme({ variant: themeVariant })}>
                <TutorialContainer
                    content={tutorialContents}
                    {...this.props.params}
                />
            </ThemeProvider>
        )
    }
}

export function setupTutorialUIContainer(
    target: Element,
    params: TutorialParams,
): Promise<() => void> {
    return new Promise(async (resolve) => {
        ReactDOM.render(<Root params={params} />, target)
    })
}

export function destroyUIContainer(target) {
    ReactDOM.unmountComponentAtNode(target)
}

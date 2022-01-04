import React from 'react'
import { reactEventHandler } from 'src/util/ui-logic'
import styled from 'styled-components'
import TutorialStep from './tutorial-step'
import * as icons from 'src/common-ui/components/design-library/icons'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'

// tutorial step like in the mockup
export type TutorialStepContent = {
    subtitle: string
    keyboardShortcut: string
    text: string | React.Component | JSX.Element
}

const SmallImages = styled.img`
    width: 16px;
    height: 16px;
    vertical-align: sub;
    padding: 0 5px;
`

const FinishHeader = styled.div`
    font-size: 16px;
    font-weight: bold;
    text-align: left;
    margin-bottom: 17px;
`
const OptionItem = styled.div`
    font-size: 14px;
    text-align: left;
    padding: 10px 0;
    cursor: pointer;
`

const FinishContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
`

export const tutorialSteps: TutorialStepContent[] = [
    // Specific kind of card: Tutorial Step (e.g., not a final screen)
    {
        subtitle: 'Save the page',
        keyboardShortcut: getKeyName({ key: 'alt' }) + ' + s',
        text: (
            <span>
                Click the <SmallImages src={icons.heartEmpty} /> in the ribbon
                that appears when hovering to the top right of the screen or
                when clicking the <SmallImages src={icons.logoSmall} /> icon in
                the browser menu bar.
            </span>
        ),
    },
    {
        subtitle: 'Highlight & Annotate',
        keyboardShortcut: getKeyName({ key: 'alt' }) + ' + a/w',
        text: (
            <span>
                Select a piece of text and right click to highlight, or use the
                highlighter tooltip that appears.
                <br />
                <strong>Shift+click</strong> on the tooltip to instantly create
                a shareable link.
            </span>
        ),
    },
    {
        subtitle: 'Search Saved Pages',
        keyboardShortcut: getKeyName({ key: 'alt' }) + ' + f',
        text: (
            <span>
                Any page you save or highlight is full-text searchable via the
                dashboard. <br />
                <br />
                Do so by clicking on the <SmallImages
                    src={icons.searchIcon}
                />{' '}
                icon in the ribbon that appears when hovering to the top right
                of the screen or when clicking the{' '}
                <SmallImages src={icons.logoSmall} /> icon in the browser menu
                bar.
            </span>
        ),
    },
]
const tutorialEnd = {
    // Final screen, we define its component inline
    title: 'Done!',
    component: (
        <React.Fragment>
            <FinishContainer>
                <FinishHeader>Want more advanced workflows?</FinishHeader>
                <OptionItem
                    onClick={() =>
                        window.open('https://tutorials.memex.garden')
                    }
                >
                    🎓 Visit our tutorials
                </OptionItem>
                <OptionItem
                    onClick={() =>
                        window.open('https://links.memex.garden/onboarding')
                    }
                >
                    ☎️ Book an onboarding call
                </OptionItem>
            </FinishContainer>
        </React.Fragment>
    ),
}

export type TutorialCardContent = {
    // Generic tutorial card content including title. May include a TutorialStepContent or just any react component
    title: string
    component: JSX.Element
}

export const tutorialContents: TutorialCardContent[] = [
    // Variable holding the actual contents of the tutorial
    ...tutorialSteps.map((step, i) => {
        return {
            title: 'Getting Started in 3 Steps',
            component: <TutorialStep cardIndex={i} {...step} />,
        }
    }),

    tutorialEnd,
]

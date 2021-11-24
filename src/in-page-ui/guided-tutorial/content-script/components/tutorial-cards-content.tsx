import React from 'react'
import { reactEventHandler } from 'src/util/ui-logic'
import styled from 'styled-components'
import TutorialStep from './tutorial-step'

// tutorial step like in the mockup
export type TutorialStepContent = {
    subtitle: string
    keyboardShortcut: string
    text: string | React.Component
}

export const tutorialSteps: TutorialStepContent[] = [
    // Specific kind of card: Tutorial Step (e.g., not a final screen)
    {
        subtitle: 'Save the page',
        keyboardShortcut: 'ctrl + s',
        text:
            'Click the heart in the ribbon that appears when hovering to the top right of the screen or when clicking the gear icon in the browser menu bar.',
    },
    {
        subtitle: 'Highlight & Annotate',
        keyboardShortcut: 'ctrl + a/w',
        text: '[Highlight & Annotate text]',
    },
    {
        subtitle: 'Search Saved Pages',
        keyboardShortcut: 'option + f',
        text: '[Search Saved Pages text]',
    },
]
const tutorialEnd = {
    // Final screen, we define its component inline
    title: 'Done!',
    component: (
        <React.Fragment>
            <h3>Want more advanced workflows?</h3>
            <span>Visit our tutorials</span>
            <span>Book an onboarding call and productivity coaching</span>
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

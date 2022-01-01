import React from 'react'
import { reactEventHandler } from 'src/util/ui-logic'
import styled from 'styled-components'
import TutorialStep from './tutorial-step'
import * as icons from 'src/common-ui/components/design-library/icons'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { browser } from 'webextension-polyfill-ts'

// tutorial step like in the mockup
export type TutorialStepContent = {
    subtitle: JSX.Element | string | React.Component
    keyboardShortcut?: string
    text: JSX.Element | string | React.Component
    top?: string
    bottom?: string
    left?: string
    right?: string
    width?: string
    height?: string
}

const SmallImages = styled.img`
    width: 16px;
    height: 16px;
    vertical-align: sub;
    padding: 0 5px 1px 5px;
`

const FinishHeader = styled.div`
    font-size: 16px;
    font-weight: bold;
    text-align: left;
    margin-bottom: 17px;
`

const SaveTextContainer = styled.div`
    padding-left: 40px;
`

const OptionsList = styled.div`
    display: grid;
    grid-auto-flow: column;
    grid-gap: 20px;
    padding: 0 60px 30px;
`

const OptionItem = styled.div`
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: 400;
    flex-direction: column;
    text-align: center;
    padding: 10px 10px;
    cursor: pointer;
    font-weight: bold;
    height: 140px;
    width: 140px;
    color: ${(props) => props.theme.colors.primary};
    box-shadow: 0px 1px 5px 1px rgba(0, 0, 0, 0.1);

    &:hover {
        background-color: #f0f0f0;
    }
`

const OptionItemIcon = styled.div`
    font-size: 30px;
    margin-bottom: 10px;
`

const FinishContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding-top: 20px;
`

const PinTitleContainer = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
`

const PinTitleImage = styled.img`
    width: 24px;
    height: 24px;
    vertical-align: sub;
    padding: 0 15px 0 0;
`

const AnnotationTitleContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
`

const AnnotationTitleBox = styled.div`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
`

const FinishTitleBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    flex-direction: column;
    margin-bottom: 30px;
`

const AnnotationTitleText = styled.div`
    font-size: 1.1em;
    display: flex;
    align-items: center;
`

const AnnotationSubTitleText = styled.div`
    font-size: 1em;
    font-weight: normal;
    color: ${(props) => props.theme.colors.subText};
`

const AnnotationTitleImage = styled.div`
    font-size: 30px;
    padding: 0 5px 0 0;
`

const MouseOverArea = styled.div<{ top: string }>`
    width: 20px;
    height: 360px;
    position: absolute;
    top: ${(props) => (props.top ? props.top : '-100px')};
    right: -70px;
    background: #ff000040;
    border: 2px solid #ff000080;
    border-radius: 3px;
    opacity: 0;
    animation: 3s ease-in-out 0.5s MouseAreaAppear infinite;
    animation-iteration-count: infinite;
    display: ${(props) => (props.onMouseEnter ? 'none' : 'flex')};

    @keyframes MouseAreaAppear {
        0% {
            opacity: 0;
        }
        50% {
            opacity: 1;
        }
        100% {
            opacity: 0;
        }
    }
`

const ShortcutLabelContainer = styled.div`
    margin: 20px 0px;
`

const ShortcutLabel = styled.span`
    border: 1px solid #f29d9d;
    border-radius: 3px;
    padding: 4px 14px;
    font-size: 16px;
    width: fit-content;
    background-color: #f29d9d60;
    white-space: nowrap;
    vertical-align: top;
    color: #545454;
    font-weight: 600;
    margin: 2px 0px;
`

const PinTutorialArrow = styled.span`
    display: flex;
    height: 30px;
    width: 30px;
    position: absolute;
    right: 20px;
    top: 20px;
    mask-size: contain;
    mask-position: center;
    mask-repeat: no-repeat;
    mask-image: url(${icons.arrowUp});
    background-color: ${(props) => props.theme.colors.primary};

    animation: 2s ease-in-out 0s PinWiggle infinite;
    animation-iteration-count: infinite;

    @keyframes PinWiggle {
        0% {
            transform: translateY(20px);
        }
        50% {
            transform: translateY(0%);
        }
        100% {
            transform: translateY(20px);
        }
    }
`

const AnnotationTutorialArrow = styled.span`
    display: flex;
    height: 30px;
    width: 30px;
    position: absolute;
    left: 20px;
    bottom: 20px;
    mask-size: contain;
    mask-position: center;
    mask-repeat: no-repeat;
    mask-image: url(${icons.arrowUp});
    background-color: ${(props) => props.theme.colors.primary};
    animation: 2s ease-in-out 0s AnnotationWiggle infinite;
    animation-iteration-count: infinite;
    transform: rotate(180deg);

    @keyframes AnnotationWiggle {
        0% {
            transform: translate(30px, -30px) rotate(225.5deg);
        }
        50% {
            transform: translate(0%, 0%) rotate(225.5deg);
        }
        100% {
            transform: translate(30px, -30px) rotate(225.5deg);
        }
    }
`

const RibbonTutorialArrow = styled.span`
    display: flex;
    height: 30px;
    width: 30px;
    position: absolute;
    right: 20px;
    top: 40px;
    mask-size: contain;
    mask-position: center;
    mask-repeat: no-repeat;
    mask-image: url(${icons.arrowUp});
    background-color: ${(props) => props.theme.colors.primary};
    animation: 2s ease-in-out 0s RibbonWiggle infinite;
    animation-iteration-count: infinite;
    transform: rotate(180deg);

    @keyframes RibbonWiggle {
        0% {
            transform: translate(-30px, 0px) rotate(90deg);
        }
        50% {
            transform: translate(0%, 0%) rotate(90deg);
        }
        100% {
            transform: translate(-30px, 0px) rotate(90deg);
        }
    }
`

export const tutorialSteps: TutorialStepContent[] = [
    // Specific kind of card: Tutorial Step (e.g., not a final screen)

    {
        subtitle: (
            <>
                <PinTitleContainer>
                    <AnnotationTitleContainer>
                        <AnnotationTitleBox>
                            <PinTitleImage src={icons.heartEmpty} />
                            <AnnotationTitleText>
                                Bookmark this page
                            </AnnotationTitleText>
                        </AnnotationTitleBox>
                    </AnnotationTitleContainer>
                    <RibbonTutorialArrow />
                </PinTitleContainer>
                <MouseOverArea top={'-40px'} />
            </>
        ),
        text: (
            <SaveTextContainer>
                <PinTitleContainer>
                    Use the sidebar or keyboard shortcuts
                </PinTitleContainer>
                <ShortcutLabelContainer>
                    <ShortcutLabel>{getKeyName({ key: 'alt' })}</ShortcutLabel>{' '}
                    + <ShortcutLabel>s</ShortcutLabel>
                </ShortcutLabelContainer>
            </SaveTextContainer>
        ),
        top: '60px',
        bottom: null,
        left: null,
        right: '60px',
        width: '470px',
        height: '220px',
    },

    {
        subtitle: (
            <>
                <PinTitleContainer>
                    <AnnotationTitleContainer>
                        <AnnotationTitleBox>
                            <PinTitleImage src={icons.highlighterFull} />
                            <AnnotationTitleText>
                                Add Highlights and Annotations
                            </AnnotationTitleText>
                        </AnnotationTitleBox>
                    </AnnotationTitleContainer>
                    <AnnotationTutorialArrow />
                </PinTitleContainer>
            </>
        ),
        text: (
            <SaveTextContainer>
                <p>Select text and use the tooltip or keyboard shortcuts</p>
                <ShortcutLabelContainer>
                    <ShortcutLabel>{getKeyName({ key: 'alt' })}</ShortcutLabel>{' '}
                    + <ShortcutLabel>a</ShortcutLabel> or{' '}
                    <ShortcutLabel>w</ShortcutLabel>
                </ShortcutLabelContainer>
            </SaveTextContainer>
        ),
        top: '30px',
        bottom: null,
        left: null,
        right: '40px',
        width: '480px',
        height: '230px',
    },

    {
        subtitle: (
            <>
                <PinTitleContainer>
                    <AnnotationTitleContainer>
                        <AnnotationTitleBox>
                            <PinTitleImage src={icons.commentEmpty} />
                            <AnnotationTitleText>
                                View your annotations
                            </AnnotationTitleText>
                        </AnnotationTitleBox>
                    </AnnotationTitleContainer>
                    <RibbonTutorialArrow />
                </PinTitleContainer>
                <MouseOverArea top={'-70px'} />
            </>
        ),
        text: (
            <SaveTextContainer>
                Hover over the red area to open the annotation sidebar. <br />
                <ShortcutLabelContainer>
                    <ShortcutLabel>{getKeyName({ key: 'alt' })}</ShortcutLabel>{' '}
                    + <ShortcutLabel>q</ShortcutLabel>
                </ShortcutLabelContainer>
            </SaveTextContainer>
        ),
        top: '85px',
        bottom: null,
        left: null,
        right: '60px',
        width: '540px',
        height: '220px',
    },

    {
        subtitle: (
            <PinTitleContainer>
                <PinTitleImage src={icons.pin} />
                Pin Memex to your menu
                <PinTutorialArrow />
            </PinTitleContainer>
        ),
        text: (
            <SaveTextContainer>
                <p>Easy access to bookmarking, adding to Spaces & searching.</p>
            </SaveTextContainer>
        ),
        top: '30px',
        bottom: null,
        left: null,
        right: '140px',
        width: '540px',
        height: '170px',
    },

    {
        subtitle: (
            <>
                <FinishContainer>
                    <FinishTitleBox>
                        <AnnotationTitleText>
                            <AnnotationTitleImage>✌🏽</AnnotationTitleImage>{' '}
                            Done!
                        </AnnotationTitleText>
                        <AnnotationSubTitleText>
                            Here are some next steps you can do.
                        </AnnotationSubTitleText>
                    </FinishTitleBox>
                    <OptionsList>
                        {/* <OptionItem
                                onClick={() =>
                                    window.open(`${browser.runtime.getURL('/options.html')}#/import`)
                                }
                            >
                                ❤️ Import your existing bookmarks and folders
                            </OptionItem> */}
                        <OptionItem
                            onClick={() =>
                                window.open('https://tutorials.memex.garden')
                            }
                        >
                            <OptionItemIcon>🎓</OptionItemIcon>
                            Visit
                            <br />
                            tutorials
                        </OptionItem>
                        <OptionItem
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/onboarding',
                                )
                            }
                        >
                            <OptionItemIcon>☎️</OptionItemIcon>
                            Personalised <br />
                            onboarding
                        </OptionItem>
                        {/* <OptionItem
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/onboarding',
                                )
                            }
                        >
                            <OptionItemIcon>🔖</OptionItemIcon>
                            Import <br />Bookmarks
                        </OptionItem> */}
                    </OptionsList>
                </FinishContainer>
            </>
        ),
        text: <></>,
        top: '25%',
        bottom: null,
        left: '0px',
        width: '700px',
        height: 'fit-content',
    },

    // {
    //     subtitle: 'Save the page',

    //     text: (
    //         <span>
    //             Click the <SmallImages src={icons.heartEmpty} /> in the ribbon
    //             that appears when hovering to the top right of the screen or
    //             when clicking the <SmallImages src={icons.logoSmall} /> icon in
    //             the browser menu bar.
    //         </span>
    //     ),
    //     top: '30px',
    //     bottom: null,
    //     left: null,
    //     right: null,
    // },
    // {
    //     subtitle: 'Highlight & Annotate',
    //     keyboardShortcut: getKeyName({ key: 'alt' }) + ' + a/w',
    //     text: (
    //         <span>
    //             Select a piece of text and right click to highlight, or use the
    //             highlighter tooltip that appears.
    //             <br />
    //             <strong>Shift+click</strong> on the tooltip to instantly create
    //             a shareable link.
    //         </span>
    //     ),
    //     top: '0px',
    //     bottom: null,
    //     left: null,
    //     right: null,
    // },
    // {
    //     subtitle: 'Search Saved Pages',
    //     keyboardShortcut: getKeyName({ key: 'alt' }) + ' + f',
    //     text: (
    //         <span>
    //             Any page you save or highlight is full-text searchable via the
    //             dashboard. <br />
    //             <br />
    //             Do so by clicking on the <SmallImages
    //                 src={icons.searchIcon}
    //             />{' '}
    //             icon in the ribbon that appears when hovering to the top right
    //             of the screen or when clicking the{' '}
    //             <SmallImages src={icons.logoSmall} /> icon in the browser menu
    //             bar.
    //         </span>
    //     ),
    //     top: '0px',
    //     bottom: null,
    //     left: null,
    //     right: null,
    // },
]

export type TutorialCardContent = {
    // Generic tutorial card content including title. May include a TutorialStepContent or just any react component
    title: string
    component: JSX.Element
    top?: string
    bottom?: string
    left?: string
    right?: string
    width?: string
    height?: string
}

export const tutorialContents: TutorialCardContent[] = [
    // Variable holding the actual contents of the tutorial
    ...tutorialSteps.map((step, i) => {
        return {
            title: 'Getting Started in 3 Steps',
            component: <TutorialStep cardIndex={i} {...step} />,
        }
    }),
]

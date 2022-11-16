import React from 'react'
import { reactEventHandler } from 'src/util/ui-logic'
import styled from 'styled-components'
import TutorialStep from './tutorial-step'
import * as icons from 'src/common-ui/components/design-library/icons'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import browser from 'webextension-polyfill'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

// tutorial step like in the mockup
export type TutorialStepContent = {
    subtitle: JSX.Element | string | React.Component
    keyboardShortcut?: string
    top?: string
    bottom?: string
    left?: string
    right?: string
    width?: string
    height?: string
    showHoverArea?: boolean
    position?: string
    extraArea?: JSX.Element | string | React.Component
}

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 20px;
    font-weight: bold;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 18px;
    margin-bottom: 40px;
    font-weight: 500;
    margin-top: 10px;
`

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
    color: ${(props) => props.theme.colors.normalText};
    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.05);

    &:hover {
        background-color: #f5f5f5;
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

const ShortCutContainer = styled.div`
    display: flex;
    align-items: center;
    color: ${(props) => props.theme.colors.greyScale9};
    grid-gap: 3px;
    font-weight: 400;
`

const ShortCutText = styled.div`
    display: block;
    font-weight: 400;
    color: ${(props) => props.theme.colors.greyScale9};
    letter-spacing: 1px;
    margin-right: -1px;

    &:first-letter {
        text-transform: capitalize;
    }
`

const ShortCutBlock = styled.div`
    border-radius: 5px;
    border: 1px solid ${(props) => props.theme.colors.greyScale10};
    color: ${(props) => props.theme.colors.greyScale9};
    display: flex;
    align-items: center;
    justify-content: center;
    height: 20px;
    padding: 0px 6px;
    font-size: 12px;
`
const CardContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    grid-gap: 16px;
`

const IconBlock = styled.div`
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    background: ${(props) => props.theme.colors.darkhover};
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 48px;
    width: 48px;
`

const ContentArea = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    grid-gap: 10px;
`

const Title = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 16px;
    font-weight: 600;
`

const Description = styled.div`
    color: ${(props) => props.theme.colors.greyScale8};
    font-size: 16px;
    font-weight: 300;
`

const TitleArea = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 15px;
    height: 26px;
`

export const tutorialSteps: TutorialStepContent[] = [
    // Specific kind of card: Tutorial Step (e.g., not a final screen)

    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.searchIcon}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Onboarding Done!</Title>
                        </TitleArea>
                        <Description>Some things you can do next.</Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        extraArea: (
            <>
                <FinishContainer>
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
        top: '25%',
        bottom: null,
        left: '0px',
        width: '700px',
        height: 'fit-content',
    },

    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.stars}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Get the basics in 90s</Title>
                        </TitleArea>
                        <Description>
                            Hover over the green area on the right to open the
                            quick action bar.
                        </Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        top: '44%',
        left: null,
        right: null,
        showHoverArea: true,
        position: 'center',
        width: '700px',
    },

    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.heartEmpty}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Bookmark this Page</Title>
                            <ShortCutContainer>
                                <ShortCutBlock>
                                    <ShortCutText>
                                        {getKeyName({ key: 'alt' })}
                                    </ShortCutText>
                                </ShortCutBlock>{' '}
                                +{' '}
                                <ShortCutBlock>
                                    <ShortCutText>S</ShortCutText>
                                </ShortCutBlock>{' '}
                            </ShortCutContainer>
                        </TitleArea>
                        <Description>
                            Use the heart icon in the quick action bar or use
                            keyboard shortcuts.
                        </Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        bottom: '30px',
        left: null,
        right: null,
        showHoverArea: true,
        position: 'center',
        width: '700px',
    },
    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.collectionsEmpty}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Add this page to a Space</Title>
                            <ShortCutContainer>
                                <ShortCutBlock>
                                    <ShortCutText>
                                        {getKeyName({ key: 'alt' })}
                                    </ShortCutText>
                                </ShortCutBlock>{' '}
                                +{' '}
                                <ShortCutBlock>
                                    <ShortCutText>C</ShortCutText>
                                </ShortCutBlock>{' '}
                            </ShortCutContainer>
                        </TitleArea>
                        <Description>
                            Spaces are like tags that you can share and
                            collaboratively curate.
                        </Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        bottom: '30px',
        left: null,
        right: null,
        showHoverArea: false,
        position: 'center',
        width: '700px',
    },
    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.highlight}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Create a Highlight</Title>
                            <ShortCutContainer>
                                <ShortCutBlock>
                                    <ShortCutText>
                                        {getKeyName({ key: 'alt' })}
                                    </ShortCutText>
                                </ShortCutBlock>{' '}
                                +{' '}
                                <ShortCutBlock>
                                    <ShortCutText>A</ShortCutText>
                                </ShortCutBlock>{' '}
                            </ShortCutContainer>
                        </TitleArea>
                        <Description>
                            Select some text and use the tooltip, or use
                            keyboard shortcuts.
                        </Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        bottom: '30px',
        left: null,
        right: null,
        showHoverArea: false,
        position: 'center',
        width: '700px',
    },
    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.commentEmpty}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>View your Highlights</Title>
                            <ShortCutContainer>
                                <ShortCutBlock>
                                    <ShortCutText>
                                        {getKeyName({ key: 'alt' })}
                                    </ShortCutText>
                                </ShortCutBlock>{' '}
                                +{' '}
                                <ShortCutBlock>
                                    <ShortCutText>Q</ShortCutText>
                                </ShortCutBlock>{' '}
                            </ShortCutContainer>
                        </TitleArea>
                        <Description>
                            Click on the highlight or open the sidebar via the
                            quick action ribbon
                        </Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        bottom: '30px',
        left: null,
        right: null,
        showHoverArea: false,
        position: 'center',
        width: '700px',
    },

    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.searchIcon}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>
                                Search everything you saved or annotated
                            </Title>
                            <ShortCutContainer>
                                <ShortCutBlock>
                                    <ShortCutText>
                                        {getKeyName({ key: 'alt' })}
                                    </ShortCutText>
                                </ShortCutBlock>{' '}
                                +{' '}
                                <ShortCutBlock>
                                    <ShortCutText>F</ShortCutText>
                                </ShortCutBlock>{' '}
                            </ShortCutContainer>
                        </TitleArea>
                        <Description>
                            Click on the search icon in the Quick Action Ribbon.
                        </Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        bottom: '30px',
        left: null,
        right: null,
        showHoverArea: false,
        position: 'center',
        width: '700px',
    },

    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.pin}
                            heightAndWidth="28px"
                            hoverOff
                            color={'purple'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Pin Memex to the extension bar</Title>
                        </TitleArea>
                        <Description>
                            Don't like the Quick Action Ribbon and want to use
                            something else?
                        </Description>
                    </ContentArea>
                </CardContainer>
            </>
        ),
        left: null,
        right: '20px',
        top: '20px',
        showHoverArea: false,
        position: 'center',
        width: '700px',
    },
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
    showHoverArea?: boolean
    extraArea?: JSX.Element | string | React.Component
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

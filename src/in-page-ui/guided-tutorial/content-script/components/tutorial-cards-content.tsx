import React from 'react'
import { reactEventHandler } from 'src/util/ui-logic'
import styled from 'styled-components'
import TutorialStep from './tutorial-step'
import * as icons from 'src/common-ui/components/design-library/icons'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import browser from 'webextension-polyfill'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

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
    color: ${(props) => props.theme.colors.greyScale6};
    grid-gap: 3px;
    font-weight: 400;
`

const ShortCutText = styled.div`
    display: block;
    font-weight: 400;
    color: ${(props) => props.theme.colors.greyScale6};
    letter-spacing: 1px;
    margin-right: -1px;

    &:first-letter {
        text-transform: capitalize;
    }
`

const ShortCutBlock = styled.div`
    border-radius: 5px;
    border: 1px solid ${(props) => props.theme.colors.greyScale10};
    color: ${(props) => props.theme.colors.greyScale6};
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

const FirstCardContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    grid-gap: 16px;

    & * {
        align-items: center !important;
        display: flex;
        justify-content: center !important;
    }
`

const IconBlock = styled.div`
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    background: ${(props) => props.theme.colors.greyScale2};
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
    grid-gap: 5px;
`

const Title = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 18px;
    font-weight: 600;
`

const Description = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 16px;
    font-weight: 300;
`

const TitleArea = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 15px;
    height: 26px;
`

const ActionsBlock = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    width: 100%;
`

const ActionCard = styled.div`
    height: 100px;
    width: fill-available;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${(props) => props.theme.colors.greyScale2};
    flex-direction: column;
    border-radius: 8px;
    grid-gap: 10px;

    cursor: pointer;

    & * {
        cursor: pointer;
    }

    &:hover {
        opacity: 0.8;
    }
`

const ActionText = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-weight: 400;
    font-size: 14px;
`

const TutorialTitleSection = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 30px;
    width: 100%;
    margin-bottom: 15px;
`

const TutorialTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-weight: 700;
    font-size: 16px;
`

const ViewAllButton = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-weight: 400;
    font-size: 16px;
    display: flex;
    grid-gap: 10px;
    cursor: pointer;
    align-items: center;
    padding: 4px 4px 4px 8px;
    border-radius: 5px;

    & * {
        cursor: pointer;
    }

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale3};
    }
`

const TutorialOptionsList = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    grid-gap: 10px;
`

const TutorialOption = styled.div`
    width: fill-available;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 10px;
    grid-gap: 15px;
    background-color: ${(props) => props.theme.colors.greyScale2};
    border-radius: 8px;

    cursor: pointer;

    & * {
        cursor: pointer;
    }

    &:hover {
        opacity: 0.8;
    }
`

const TutorialOptionText = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-weight: 400;
    font-size: 14px;
`

export const tutorialSteps: TutorialStepContent[] = [
    // Specific kind of card: Tutorial Step (e.g., not a final screen)

    {
        subtitle: (
            <>
                <FirstCardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.stars}
                            heightAndWidth="28px"
                            hoverOff
                            color={'prime1'}
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
                </FirstCardContainer>
            </>
        ),
        top: '44%',
        left: null,
        right: null,
        showHoverArea: true,
        position: 'center',
        width: '500px',
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
                            color={'prime1'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Bookmark this Page</Title>
                            <KeyboardShortcuts
                                keys={[getKeyName({ key: 'alt' }), 'S']}
                            />
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
                            color={'prime1'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Add this page to a Space</Title>
                            <KeyboardShortcuts
                                keys={[getKeyName({ key: 'alt' }), 'C']}
                            />
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
                            color={'prime1'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>Create a Highlight</Title>
                            <KeyboardShortcuts
                                keys={[getKeyName({ key: 'alt' }), 'A']}
                            />
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
                            filePath={icons.commentAdd}
                            heightAndWidth="28px"
                            hoverOff
                            color={'prime1'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>View your Highlights</Title>
                            <KeyboardShortcuts
                                keys={[getKeyName({ key: 'alt' }), 'Q']}
                            />
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
                            color={'prime1'}
                        />
                    </IconBlock>
                    <ContentArea>
                        <TitleArea>
                            <Title>
                                Search everything you saved or annotated
                            </Title>
                            <KeyboardShortcuts
                                keys={[getKeyName({ key: 'alt' }), 'F']}
                            />
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
                            color={'prime1'}
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
    {
        subtitle: (
            <>
                <CardContainer>
                    <IconBlock>
                        <Icon
                            filePath={icons.searchIcon}
                            heightAndWidth="28px"
                            hoverOff
                            color={'prime1'}
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
                    <ActionsBlock>
                        <ActionCard
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/onboarding',
                                )
                            }
                        >
                            <Icon
                                filePath={icons.phone}
                                heightAndWidth="28px"
                                hoverOff
                                color={'prime1'}
                            />
                            <ActionText>
                                Personalised Onboarding Call
                            </ActionText>
                        </ActionCard>
                        <ActionCard
                            onClick={() =>
                                window.open('https://community.memex.garden')
                            }
                        >
                            <Icon
                                filePath={icons.searchIcon}
                                heightAndWidth="28px"
                                hoverOff
                                color={'prime1'}
                            />
                            <ActionText>Community FAQs</ActionText>
                        </ActionCard>
                    </ActionsBlock>

                    <TutorialTitleSection>
                        <TutorialTitle>More Tutorials</TutorialTitle>
                        <ViewAllButton
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials',
                                )
                            }
                        >
                            View All
                            <Icon
                                filePath={icons.arrowRight}
                                heightAndWidth="22px"
                                color={'greyScale5'}
                                hoverOff
                            />
                        </ViewAllButton>
                    </TutorialTitleSection>
                    <TutorialOptionsList>
                        <TutorialOption
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials/youtubeannotations',
                                )
                            }
                        >
                            <Icon
                                filePath={icons.play}
                                heightAndWidth="28px"
                                hoverOff
                            />
                            <TutorialOptionText>
                                Annotate YouTube videos
                            </TutorialOptionText>
                        </TutorialOption>
                        <TutorialOption
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials/pdfAnnotations',
                                )
                            }
                        >
                            <Icon
                                filePath={icons.pdf}
                                heightAndWidth="28px"
                                hoverOff
                            />
                            <TutorialOptionText>
                                Annotate local or web PDFs
                            </TutorialOptionText>
                        </TutorialOption>
                        <TutorialOption
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials/ShareAndCollaborateSpaces',
                                )
                            }
                        >
                            <Icon
                                filePath={icons.collectionsEmpty}
                                heightAndWidth="28px"
                                hoverOff
                            />
                            <TutorialOptionText>
                                Share and collaboratively annotate the web with
                                Spaces
                            </TutorialOptionText>
                        </TutorialOption>
                        <TutorialOption
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials/CopyPasteTemplates',
                                )
                            }
                        >
                            <Icon
                                filePath={icons.copy}
                                heightAndWidth="28px"
                                hoverOff
                            />
                            <TutorialOptionText>
                                Export saved content in customisable copy/paste
                                templates
                            </TutorialOptionText>
                        </TutorialOption>
                        <TutorialOption
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials/readwiseIntegration',
                                )
                            }
                        >
                            <Icon
                                filePath={icons.readwise}
                                heightAndWidth="28px"
                                hoverOff
                            />
                            <TutorialOptionText>
                                Integrate with Readwise (and from there to Roam,
                                Notion & Evernote)
                            </TutorialOptionText>
                        </TutorialOption>
                    </TutorialOptionsList>
                </FinishContainer>
            </>
        ),
        top: '12%',
        bottom: null,
        left: 'auto',
        width: '500px',
        height: 'fit-content',
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

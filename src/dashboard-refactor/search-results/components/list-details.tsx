import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { fonts } from '../../styles'
import Margin from 'src/dashboard-refactor/components/Margin'
import { ButtonTooltip } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import MemexEditor from '@worldbrain/memex-common/lib/editor'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import { ClickAway } from 'src/util/click-away-wrapper'
import { HoverBox } from 'src/common-ui/components/design-library/HoverBox'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'

export interface Props {
    listName: string
    remoteLink?: string
    localListId: number
    description?: string
    isOwnedList?: boolean
    saveDescription: (description: string) => void
    onAddContributorsClick?: React.MouseEventHandler
}

interface State {
    description: string
    isEditingDescription: boolean
    showQuickTutorial: boolean
}

export default class ListDetails extends PureComponent<Props, State> {
    state: State = {
        isEditingDescription: false,
        description: this.props.description ?? '',
        showQuickTutorial: false,
    }

    static MOD_KEY = getKeyName({ key: 'mod' })

    private handleDescriptionSave() {
        this.props.saveDescription(this.state.description)
        this.setState({ isEditingDescription: false })
    }

    private handleDescriptionInputKeyDown: React.KeyboardEventHandler = (e) => {
        if (e.key === 'Escape') {
            this.setState({ isEditingDescription: false })
            return
        }

        if (navigator.platform === 'MacIntel') {
            if (e.key === 'Enter' && e.metaKey) {
                this.handleDescriptionSave()
                return
            }
        } else {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleDescriptionSave()
                return
            }
        }
    }

    private renderMarkdownHelpButton() {
        return (
            <MarkdownButtonContainer
                onClick={() =>
                    this.setState({
                        showQuickTutorial: !this.state.showQuickTutorial,
                    })
                }
            >
                Formatting Help
                <MarkdownButton src={icons.helpIcon} />
            </MarkdownButtonContainer>
        )
    }

    private renderDescription() {
        if (this.state.isEditingDescription) {
            return (
                <DescriptionEditorContainer>
                    <MemexEditor
                        autoFocus
                        markdownContent={this.state.description}
                        onKeyDown={this.handleDescriptionInputKeyDown}
                        placeholder="Write a description for this Space"
                        onContentUpdate={(description) =>
                            this.setState({ description })
                        }
                    />
                    <SaveActionBar>
                        <BtnContainerStyled>
                            <ButtonTooltip
                                tooltipText={`${ListDetails.MOD_KEY} + Enter`}
                                position="bottom"
                            >
                                <SaveBtn
                                    onClick={() => this.handleDescriptionSave()}
                                >
                                    Save
                                </SaveBtn>
                            </ButtonTooltip>
                            <ButtonTooltip tooltipText="esc" position="bottom">
                                <CancelBtnStyled
                                    onClick={() =>
                                        this.setState({
                                            isEditingDescription: false,
                                        })
                                    }
                                >
                                    Cancel
                                </CancelBtnStyled>
                            </ButtonTooltip>
                        </BtnContainerStyled>
                        {this.renderMarkdownHelpButton()}
                    </SaveActionBar>
                </DescriptionEditorContainer>
            )
        }

        return (
            <>
                <DescriptionText>{this.props.description}</DescriptionText>
            </>
        )
    }

    private EditButton() {
        const maybeRenderTooltip = (children: JSX.Element) =>
            this.props.isOwnedList ? (
                <ButtonTooltip
                    position="bottom"
                    tooltipText={<span>Edit Space Description</span>}
                >
                    {children}
                </ButtonTooltip>
            ) : (
                <ButtonTooltip
                    position="bottom"
                    tooltipText={
                        <span>
                            It isn't yet possible to edit descriptions
                            <br /> of Spaces that aren't yours
                        </span>
                    }
                >
                    {children}
                </ButtonTooltip>
            )
        return (
            <>
                {maybeRenderTooltip(
                    <Margin right={'10px'}>
                        <Icon
                            hoverOff={!this.props.isOwnedList}
                            onClick={() =>
                                this.props.isOwnedList &&
                                this.setState({ isEditingDescription: true })
                            }
                            heightAndWidth="20px"
                            color={'lighterText'}
                            icon={'edit'}
                        />
                    </Margin>,
                )}
            </>
        )
    }

    render() {
        return (
            <>
                <TopBarContainer top="10px" bottom="10px">
                    <Container
                        hasDescription={this.state.description.length > 0}
                        center={!this.props.remoteLink}
                    >
                        <TitleContainer>
                            <DetailsContainer>
                                <SectionTitle>
                                    {this.props.listName}
                                </SectionTitle>
                            </DetailsContainer>
                            <BtnsContainer>
                                {this.EditButton()}
                                {this.props.remoteLink ? (
                                    <>
                                        <Margin right="10px">
                                            <ButtonTooltip
                                                tooltipText="Invite people to this Space"
                                                position="bottom"
                                            >
                                                <Icon
                                                    height="19px"
                                                    filePath={icons.peopleFine}
                                                    color="purple"
                                                    onClick={
                                                        this.props
                                                            .onAddContributorsClick
                                                    }
                                                />
                                            </ButtonTooltip>
                                        </Margin>
                                        <PrimaryAction
                                            onClick={() =>
                                                window.open(
                                                    this.props.remoteLink,
                                                )
                                            }
                                            label="Open Web View"
                                            fontSize={'14px'}
                                        />
                                    </>
                                ) : (
                                    <ButtonTooltip
                                        tooltipText="Invite people to this Space"
                                        position="bottom"
                                    >
                                        <PrimaryAction
                                            onClick={
                                                this.props
                                                    .onAddContributorsClick
                                            }
                                            label={
                                                <ShareCollectionBtn>
                                                    <Icon
                                                        height="14px"
                                                        filePath={icons.link}
                                                        color="white"
                                                        hoverOff
                                                    />
                                                    <ShareCollectionBtnLabel>
                                                        Share Space
                                                    </ShareCollectionBtnLabel>
                                                </ShareCollectionBtn>
                                            }
                                        />
                                    </ButtonTooltip>
                                )}
                            </BtnsContainer>
                        </TitleContainer>
                        {this.props.isOwnedList &&
                            this.state.description.length === 0 &&
                            !this.state.isEditingDescription && (
                                <>
                                    <EditDescriptionButton
                                        onClick={() =>
                                            this.setState({
                                                isEditingDescription: true,
                                            })
                                        }
                                    >
                                        + Add Space description
                                    </EditDescriptionButton>
                                </>
                            )}
                    </Container>
                    <DescriptionContainer>
                        {this.renderDescription()}
                    </DescriptionContainer>
                    {this.state.showQuickTutorial && (
                        <HoverBox
                            top={'260px'}
                            right={'420px'}
                            width="430px"
                            position={'sticky'}
                            height="430px"
                            overflow="scroll"
                        >
                            <QuickTutorial
                                markdownHelpOnTop={true}
                                getKeyboardShortcutsState={
                                    getKeyboardShortcutsState
                                }
                            />
                        </HoverBox>
                    )}
                </TopBarContainer>
                {this.state.description.length > 0 ? (
                    <ReferencesContainer>
                        References
                        <Margin top="5px" bottom="5px" width="unset">
                            {this.props.remoteLink && (
                                <InfoText>
                                    Only your own contributions to this space
                                    are visible locally. To see all, open the{' '}
                                    <a
                                        target="_blank"
                                        href={this.props.remoteLink}
                                    >
                                        web view{' '}
                                    </a>
                                </InfoText>
                            )}
                        </Margin>
                    </ReferencesContainer>
                ) : (
                    <></>
                )}
            </>
        )
    }
}

const TitleContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    grid-gap: 10px;
`

const ReferencesContainer = styled.div`
    width: 100%;
    font-weight: lighter;
    font-size: 20px;
    color: #96a0b5;
    margin-top: 20px;
    padding-bottom: 5px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
`

const EditDescriptionButton = styled.div`
    color: ${(props) => props.theme.colors.purple};
    font-size: 14px;
    border: none;
    background: none;
    padding: 8px 10px 8px 0px;
    cursor: pointer;
`

const DescriptionEditorContainer = styled.div`
    width: 100%;
    border-radius: 6px;
    box-shadow: 0px 3px 7px -6px #d0d0d057;
    background: white;
    margin-top: 5px;

    & > div:first-child {
        & > div {
            margin: 0px 0px 5px 0px;
        }
    }
`

const SaveActionBar = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: 5px;
`

const BtnContainerStyled = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
`

const CancelBtnStyled = styled.button`
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    padding: 3px 5px;
    background: transparent;
    border-radius: 3px;
    color: red;

    &:hover {
        background-color: ${(props) => props.theme.colors.backgroundColor};
    }

    &:focus {
        background-color: #79797945;
    }
`

const SaveBtn = styled.div`
    flex-direction: row;
    align-items: center;
    box-sizing: border-box;
    cursor: pointer;
    font-size: 14px;
    border: none;
    outline: none;
    margin-right: 5px;
    background: transparent;
    border-radius: 3px;
    font-weight: 700;
    border: 1px solid ${(props) => props.theme.colors.lightgrey};
    display: grid;
    grid-auto-flow: column;
    padding: 4px 8px;
`

const TopBarContainer = styled(Margin)`
    z-index: 2147483640;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background: white;
    border-radius: 10px;
    padding: 20px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 300;
`

const MarkdownButtonContainer = styled.div`
    display: flex;
    font-size: 12px;
    color: ${(props) => props.theme.colors.lighterText};
    align-items: center;
    cursor: pointer;
`

const MarkdownButton = styled.img`
    display: flex;
    height: 16px;
    opacity: 0.8;
    mask-position: center center;
    margin-left: 10px;
    cursor: pointer;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
`

const Container = styled.div<{ hasDescription: boolean; center: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    z-index: 1002;
    padding-bottom: ${(props) => (props.hasDescription ? '20px' : '0px')};
    margin-bottom: ${(props) => (props.hasDescription ? '15px' : '0px')};
    border-bottom: ${(props) =>
        props.hasDescription ? '1px solid #f0f0f0' : 'unset'};

    & a {
        text-decoration: none;
        font-weight: 600;
    }
`

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    width: 100%;
`

const ShareCollectionBtn = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

const ShareCollectionBtnLabel = styled.div`
    padding-left: 10px;
    font-size: 14px;
`

const BtnsContainer = styled.div`
    display: flex;
    align-items: center;
    z-index: 100;
    align-self: flex-start;
`

const Name = styled.div`
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-size: 20px;
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary};
`

const Note = styled.span`
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-size: 12px;
    color: ${fonts.primary.colors.secondary};
`

const DescriptionContainer = styled.div`
    width: 100%;
`

const DescriptionText = styled(Markdown)`
    color: ${(props) => props.theme.colors.lighterText};
`

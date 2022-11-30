import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { fonts } from '../../styles'
import Margin from 'src/dashboard-refactor/components/Margin'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
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
    isOwnedList?: boolean
    isJoinedList?: boolean
    description: string | null
    saveDescription: (description: string) => void
    onAddContributorsClick?: React.MouseEventHandler
    listId?: number
}

interface State {
    description: string
    isEditingDescription: boolean
    showQuickTutorial: boolean
}

export default class ListDetails extends PureComponent<Props, State> {
    static MOD_KEY = getKeyName({ key: 'mod' })

    private formattingHelpBtn = React.createRef<HTMLElement>()
    state: State = {
        description: this.props.description ?? '',
        isEditingDescription: false,
        showQuickTutorial: false,
    }

    componentWillUpdate(nextProps: Props) {
        if (this.props.localListId !== nextProps.localListId) {
            this.setState({
                description: nextProps.description ?? '',
                isEditingDescription: false,
                showQuickTutorial: false,
            })
        }
    }

    private finishEdit(args: { shouldSave?: boolean }) {
        if (args.shouldSave) {
            this.props.saveDescription(this.state.description)
        }
        this.setState({ isEditingDescription: false, showQuickTutorial: false })
    }

    private handleDescriptionInputKeyDown: React.KeyboardEventHandler = (e) => {
        if (e.key === 'Escape') {
            this.finishEdit({ shouldSave: false })
            return
        }

        if (navigator.platform === 'MacIntel') {
            if (e.key === 'Enter' && e.metaKey) {
                this.finishEdit({ shouldSave: true })
                return
            }
        } else {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.finishEdit({ shouldSave: true })
                return
            }
        }
    }

    private renderMarkdownHelpButton() {
        return (
            <MarkdownButtonContainer
                ref={this.formattingHelpBtn}
                onClick={() =>
                    this.setState({
                        showQuickTutorial: !this.state.showQuickTutorial,
                    })
                }
            >
                Formatting
                <Icon filePath={icons.helpIcon} heightAndWidth={'20px'} />
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
                        {this.renderMarkdownHelpButton()}
                        <BtnContainerStyled>
                            <TooltipBox
                                tooltipText={`${ListDetails.MOD_KEY} + Enter`}
                                placement="bottom"
                            >
                                <Icon
                                    heightAndWidth="22px"
                                    icon={icons.check}
                                    color={'purple'}
                                    onClick={() =>
                                        this.finishEdit({ shouldSave: true })
                                    }
                                />
                            </TooltipBox>
                            <TooltipBox tooltipText="esc" placement="bottom">
                                <Icon
                                    heightAndWidth="22px"
                                    icon={icons.removeX}
                                    color={'normalText'}
                                    onClick={() =>
                                        this.setState({
                                            isEditingDescription: false,
                                        })
                                    }
                                />
                            </TooltipBox>
                        </BtnContainerStyled>
                    </SaveActionBar>
                </DescriptionEditorContainer>
            )
        }

        if (this.props.listId === 20201015) {
            return (
                <DescriptionText>
                    {'Things you saved from your mobile devices'}
                </DescriptionText>
            )
        }

        if (this.props.listId === 20201014) {
            return (
                <DescriptionText>
                    {
                        'Everything you save, annotate or organise appears here so you have a chance to go through it again.'
                    }
                </DescriptionText>
            )
        }

        return <DescriptionText>{this.props.description}</DescriptionText>
    }

    private renderEditButton() {
        // If followed list, don't allow editing
        if (!this.props.isOwnedList && !this.props.isJoinedList) {
            return null
        }

        const tooltipText = this.props.isOwnedList ? (
            <span>Edit Space Description</span>
        ) : (
            <span>
                It isn't yet possible to edit descriptions <br /> of Spaces that
                aren't yours
            </span>
        )

        return (
            <TooltipBox placement="bottom" tooltipText={tooltipText}>
                <Icon
                    hoverOff={!this.props.isOwnedList}
                    onClick={() =>
                        this.props.isOwnedList &&
                        this.setState({ isEditingDescription: true })
                    }
                    heightAndWidth="18px"
                    color={'normalText'}
                    icon={'edit'}
                    defaultBackground
                />
            </TooltipBox>
        )
    }

    render() {
        return (
            <>
                <TopBarContainer bottom="10px">
                    <Container
                        hasDescription={this.props.description?.length > 0}
                        center={!this.props.remoteLink}
                    >
                        <TitleContainer>
                            <DetailsContainer>
                                <SectionTitle>
                                    {this.props.listName}
                                    {this.props.listId === 20201015 &&
                                        'Saved on Mobile'}
                                    {this.props.listId === 20201014 && 'Inbox'}
                                </SectionTitle>
                                <TitleEditContainer>
                                    {this.renderEditButton()}
                                </TitleEditContainer>
                            </DetailsContainer>
                            {this.props.listName && (
                                <BtnsContainer>
                                    {this.props.remoteLink ? (
                                        <>
                                            <Margin right="10px">
                                                <Icon
                                                    height="19px"
                                                    filePath={icons.goTo}
                                                    color="iconColor"
                                                    onClick={() =>
                                                        window.open(
                                                            this.props
                                                                .remoteLink,
                                                        )
                                                    }
                                                />
                                            </Margin>
                                            <PrimaryAction
                                                onClick={
                                                    this.props
                                                        .onAddContributorsClick
                                                }
                                                label={
                                                    <ShareCollectionBtn>
                                                        <Icon
                                                            height="20px"
                                                            filePath={
                                                                icons.link
                                                            }
                                                            color="white"
                                                            hoverOff
                                                        />
                                                        <ShareCollectionBtnLabel>
                                                            Share Space
                                                        </ShareCollectionBtnLabel>
                                                    </ShareCollectionBtn>
                                                }
                                                backgroundColor={'darkhover'}
                                                fontColor={'normalText'}
                                            />
                                        </>
                                    ) : (
                                        <TooltipBox
                                            tooltipText="Invite people to this Space"
                                            placement="bottom"
                                        >
                                            <PrimaryAction
                                                onClick={
                                                    this.props
                                                        .onAddContributorsClick
                                                }
                                                label={
                                                    <ShareCollectionBtn>
                                                        <Icon
                                                            height="20px"
                                                            filePath={
                                                                icons.link
                                                            }
                                                            color="white"
                                                            hoverOff
                                                        />
                                                        <ShareCollectionBtnLabel>
                                                            Share Space
                                                        </ShareCollectionBtnLabel>
                                                    </ShareCollectionBtn>
                                                }
                                                backgroundColor={'darkhover'}
                                                fontColor={'normalText'}
                                            />
                                        </TooltipBox>
                                    )}
                                </BtnsContainer>
                            )}
                        </TitleContainer>
                        {this.props.isOwnedList &&
                            !this.props.description?.length &&
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
                        {!this.state.isEditingDescription && (
                            <DescriptionEditContainer>
                                {this.renderEditButton()}
                            </DescriptionEditContainer>
                        )}
                    </DescriptionContainer>
                    {this.state.showQuickTutorial && (
                        <ClickAway
                            ignoreClickOnElement={
                                this.formattingHelpBtn.current
                            }
                            onClickAway={() =>
                                this.setState({ showQuickTutorial: false })
                            }
                        >
                            <HoverBox
                                top={'260px'}
                                right={'420px'}
                                width="430px"
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
                        </ClickAway>
                    )}
                </TopBarContainer>
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
    grid-gap: 10px;
`

const TopBarContainer = styled(Margin)`
    z-index: 2147483640;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-radius: 10px;
    padding: 20px 0 5px 0;
`

const MarkdownButtonContainer = styled.div`
    display: flex;
    font-size: 12px;
    color: ${(props) => props.theme.colors.lighterText};
    align-items: center;
    cursor: pointer;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 24px;
    font-weight: bold;
`

const TitleEditContainer = styled.div`
    display: none;
    margin-left: 5px;
`
const DescriptionEditContainer = styled.div`
    display: none;
`

const Container = styled.div<{ hasDescription: boolean; center: boolean }>`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    z-index: 1002;

    & a {
        text-decoration: none;
        font-weight: 600;
    }
`

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: row;
    grid-gap: 5px;
    width: 100%;

    &:hover ${TitleEditContainer} {
        display: flex;
    }
`

const ShareCollectionBtn = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    grid-gap: 5px;
`

const ShareCollectionBtnLabel = styled.div`
    font-size: 14px;
`

const BtnsContainer = styled.div`
    display: flex;
    align-items: center;
    z-index: 100;
    align-self: flex-start;
`

const DescriptionContainer = styled.div`
    width: 100%;
    margin-top: 10px;
    display: flex;
    justify-content: flex-end;

    &:hover ${DescriptionEditContainer} {
        display: flex;
        justify-self: flex-end;
        align-self: flex-start;
        position: absolute;
    }
`

const DescriptionText = styled(Markdown)`
    color: ${(props) => props.theme.colors.normalText};
`

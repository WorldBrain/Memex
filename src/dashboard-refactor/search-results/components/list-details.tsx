import React, { PureComponent, useState } from 'react'
import styled, { css } from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { fonts } from '../../styles'
import Margin from 'src/dashboard-refactor/components/Margin'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import MemexEditor, {
    MemexEditorInstance,
} from '@worldbrain/memex-common/lib/editor'
import Markdown from '@worldbrain/memex-common/lib/common-ui/components/markdown'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'
import QuickTutorial from '@worldbrain/memex-common/lib/editor/components/QuickTutorial'
import { getKeyboardShortcutsState } from 'src/in-page-ui/keyboard-shortcuts/content_script/detection'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'
import { sizeConstants } from '../../constants'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import type { UnifiedList } from 'src/annotations/cache/types'
import { ImageSupportInterface } from 'src/image-support/background/types'
import { sleepPromise } from 'src/util/promises'

export interface Props {
    remoteLink?: string
    isOwnedList?: boolean
    isJoinedList?: boolean
    description: string | null
    type: 'page-link' | 'user-list' | 'special-list'
    listData: Pick<UnifiedList, 'unifiedId' | 'localId' | 'name'>
    saveDescription: (description: string) => void
    saveTitle: (title: string, listId: string) => void
    onAddContributorsClick?: React.MouseEventHandler
    clearInbox?: () => void
    imageSupport: ImageSupportInterface<'caller'>
    getRootElement: () => HTMLElement
}

interface State {
    description: string
    isEditingDescription: boolean
    showQuickTutorial: boolean
    spaceTitle: string
    isDeboucingEditor: boolean
    shouldShowEditor: boolean
}

export default class ListDetails extends PureComponent<Props, State> {
    static MOD_KEY = getKeyName({ key: 'mod' })
    private formattingHelpBtn = React.createRef<HTMLDivElement>()
    private editorRef: MemexEditorInstance

    state: State = {
        description: this.props.description ?? '',
        isEditingDescription: false,
        showQuickTutorial: false,
        spaceTitle: this.props.listData.name,
        isDeboucingEditor: false,
        shouldShowEditor: true,
    }

    async componentDidMount() {
        if (
            !this.editorRef?.checkIfHasContent() &&
            !this.state.isEditingDescription
        ) {
            this.setState({ shouldShowEditor: false })
        } else if (this.state.isEditingDescription) {
            this.setState({ shouldShowEditor: true })
        }
        if (
            this.editorRef?.checkIfHasContent() ||
            this.props.description.length > 0
        ) {
            this.setState({ shouldShowEditor: true })
        }
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (prevProps.description !== this.props.description) {
            if (this.props.description != null) {
                this.editorRef?.updateContentExternally(this.props.description)
            } else {
                this.editorRef?.updateContentExternally('')
            }
        }
    }

    async componentWillUpdate(nextProps: Props, prevState: State) {
        if (this.props.listData.unifiedId !== nextProps.listData.unifiedId) {
            this.setState({
                description: nextProps.description ?? '',
                isEditingDescription: false,
                showQuickTutorial: false,
                spaceTitle: nextProps.listData.name,
            })
        }
    }

    private finishEdit(args: { shouldSave?: boolean }) {
        if (!this.state.isDeboucingEditor) {
            if (args.shouldSave) {
                this.props.saveDescription(this.state.description)
                this.props.saveTitle(
                    this.state.spaceTitle,
                    this.props.listData.unifiedId,
                )
            }
            this.setState({
                isEditingDescription: false,
                showQuickTutorial: false,
            })
        }
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

    private setDebouncingSaveBlock = (isDeboucingEditor: boolean) => {
        this.setState({ isDeboucingEditor })
    }

    private renderDescription() {
        if (this.props.listData.localId === 20201015) {
            return (
                <SubtitleText>
                    Pages you saved on your mobile devices for{' '}
                    <DownloadLink
                        onClick={() => {
                            window.open(
                                'https://apps.apple.com/app/id1471860331',
                                '_blank',
                            )
                        }}
                    >
                        iOS
                    </DownloadLink>{' '}
                    and{' '}
                    <DownloadLink
                        onClick={() => {
                            window.open(
                                'https://play.google.com/store/apps/details?id=io.worldbrain',
                                '_blank',
                            )
                        }}
                    >
                        Android
                    </DownloadLink>
                </SubtitleText>
            )
        }

        if (this.props.listData.localId === 20201014) {
            return (
                <SubtitleText>
                    {
                        'A getting-things-done style inbox for everything you save, annotate or organise.'
                    }
                </SubtitleText>
            )
        }

        // if (
        //     !this.state.isEditingDescription &&
        //     !this.editorRef?.checkIfHasContent()
        // ) {
        //     return <></>
        // }
        return (
            <MemexEditor
                onContentUpdate={(description) =>
                    this.setState({ description })
                }
                markdownContent={this.state.description}
                onKeyDown={this.handleDescriptionInputKeyDown}
                promptPlaceholder="+ Add Space description"
                setEditorInstanceRef={(ref) => (this.editorRef = ref)}
                editable={this.state.isEditingDescription}
                imageSupport={this.props.imageSupport}
                getRootElement={this.props.getRootElement}
                setDebouncingSaveBlock={this.setDebouncingSaveBlock}
                setEditing={async () => {
                    this.setState({
                        isEditingDescription: true,
                    })
                }}
                defaultMinimized
            />
        )
    }

    private renderEditButton() {
        // If followed list, don't allow editing
        if (!this.props.isOwnedList && !this.props.isJoinedList) {
            return null
        }

        return (
            <TooltipBox
                placement="bottom"
                tooltipText={
                    <span>
                        Edit Space
                        <br />
                        <strong>Double Click</strong> on title or description
                    </span>
                }
                getPortalRoot={this.props.getRootElement}
            >
                <Icon
                    hoverOff={!this.props.isOwnedList}
                    onClick={() =>
                        this.props.isOwnedList &&
                        this.setState({ isEditingDescription: true })
                    }
                    padding={'5px'}
                    heightAndWidth="22px"
                    icon={'edit'}
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
                        {this.state.isEditingDescription ? (
                            <TitleContainer>
                                <TitleEditContainer
                                    isEditing={this.state.isEditingDescription}
                                >
                                    <TextField
                                        value={this.state.spaceTitle}
                                        onChange={(e) =>
                                            this.setState({
                                                spaceTitle: (e.target as HTMLInputElement)
                                                    .value,
                                            })
                                        }
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                this.finishEdit({
                                                    shouldSave:
                                                        this.props
                                                            .description !==
                                                            this.state
                                                                .description ||
                                                        this.props.listData
                                                            .name !==
                                                            this.state
                                                                .spaceTitle,
                                                })
                                            } else if (e.key === 'Escape') {
                                                this.finishEdit({
                                                    shouldSave: false,
                                                })
                                                return
                                            }
                                        }}
                                        background="transparent"
                                    />
                                </TitleEditContainer>
                                <BtnContainerStyled>
                                    <TooltipBox
                                        tooltipText="esc"
                                        placement="bottom"
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <Icon
                                            heightAndWidth="22px"
                                            icon={icons.removeX}
                                            color={'white'}
                                            onClick={() =>
                                                this.setState({
                                                    isEditingDescription: false,
                                                })
                                            }
                                        />
                                    </TooltipBox>
                                    <TooltipBox
                                        tooltipText={`${ListDetails.MOD_KEY} + Enter`}
                                        placement="bottom"
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <Icon
                                            heightAndWidth="22px"
                                            icon={icons.check}
                                            color={'prime1'}
                                            onClick={() =>
                                                this.finishEdit({
                                                    shouldSave:
                                                        this.props
                                                            .description !==
                                                            this.state
                                                                .description ||
                                                        this.props.listData
                                                            .name !==
                                                            this.state
                                                                .spaceTitle,
                                                })
                                            }
                                        />
                                    </TooltipBox>
                                </BtnContainerStyled>
                            </TitleContainer>
                        ) : (
                            <TitleContainer>
                                <DetailsContainer>
                                    <SectionTitle
                                        onDoubleClick={() => {
                                            this.setState({
                                                isEditingDescription: true,
                                            })
                                        }}
                                    >
                                        {this.props.listData.name}
                                    </SectionTitle>
                                    {/* <TitleEditContainer>
                                    {this.renderEditButton()}
                                </TitleEditContainer> */}
                                </DetailsContainer>
                                <BtnsContainer>
                                    {this.props.listData.localId ===
                                    20201014 ? (
                                        <TooltipBox
                                            tooltipText={
                                                <TooltipTextContent>
                                                    <strong>Tip:</strong> Remove
                                                    individual pages with the
                                                    <br />{' '}
                                                    <Icon
                                                        filePath="removeX"
                                                        hoverOff
                                                        heightAndWidth="16px"
                                                    />{' '}
                                                    icon when hovering page
                                                    cards
                                                </TooltipTextContent>
                                            }
                                            placement="bottom-end"
                                            getPortalRoot={
                                                this.props.getRootElement
                                            }
                                        >
                                            <PrimaryAction
                                                label={'Clear Inbox'}
                                                onClick={() =>
                                                    this.props.clearInbox()
                                                }
                                                type={'forth'}
                                                size={'medium'}
                                                icon={'removeX'}
                                            />
                                        </TooltipBox>
                                    ) : undefined}
                                    {this.props.listData.localId !== 20201014 &&
                                    this.props.listData.localId !== 20201015 ? (
                                        <SpaceButtonRow>
                                            {this.props.isOwnedList ? (
                                                <>
                                                    <ActionButtons>
                                                        {this.renderEditButton()}
                                                        {this.props
                                                            .remoteLink && (
                                                            <TooltipBox
                                                                placement={
                                                                    'bottom'
                                                                }
                                                                tooltipText="Open in web view"
                                                                getPortalRoot={
                                                                    this.props
                                                                        .getRootElement
                                                                }
                                                            >
                                                                <Icon
                                                                    height="22px"
                                                                    padding={
                                                                        '5px'
                                                                    }
                                                                    filePath={
                                                                        icons.goTo
                                                                    }
                                                                    onClick={() =>
                                                                        window.open(
                                                                            this
                                                                                .props
                                                                                .remoteLink,
                                                                        )
                                                                    }
                                                                />
                                                            </TooltipBox>
                                                        )}
                                                    </ActionButtons>
                                                    {this.props.remoteLink ? (
                                                        <PrimaryAction
                                                            onClick={
                                                                this.props
                                                                    .onAddContributorsClick
                                                            }
                                                            size={'medium'}
                                                            type={'primary'}
                                                            label={
                                                                'Share Space'
                                                            }
                                                            icon={'invite'}
                                                        />
                                                    ) : (
                                                        <TooltipBox
                                                            tooltipText="Invite people to this Space"
                                                            placement="bottom"
                                                            getPortalRoot={
                                                                this.props
                                                                    .getRootElement
                                                            }
                                                        >
                                                            <PrimaryAction
                                                                onClick={
                                                                    this.props
                                                                        .onAddContributorsClick
                                                                }
                                                                size={'medium'}
                                                                type={'primary'}
                                                                label={
                                                                    'Share Space'
                                                                }
                                                                icon={'invite'}
                                                            />
                                                        </TooltipBox>
                                                    )}
                                                </>
                                            ) : (
                                                <PrimaryAction
                                                    onClick={() =>
                                                        window.open(
                                                            this.props
                                                                .remoteLink,
                                                        )
                                                    }
                                                    size={'medium'}
                                                    type={'primary'}
                                                    label={'Open in web view'}
                                                    icon={'goTo'}
                                                />
                                            )}
                                        </SpaceButtonRow>
                                    ) : undefined}
                                </BtnsContainer>
                            </TitleContainer>
                        )}
                        {/* {this.props.isOwnedList &&
                            !this.props.description?.length &&
                            !this.state.isEditingDescription &&
                            !(
                                this.props.listData.localId === 20201015 ||
                                this.props.listData.localId === 20201014
                            ) && (
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
                            )} */}
                    </Container>
                    <DescriptionContainer>
                        {this.renderDescription()}
                        {/* {!this.state.isEditingDescription && (
                            <DescriptionEditContainer>
                                {this.renderEditButton()}
                            </DescriptionEditContainer>
                        )} */}
                    </DescriptionContainer>
                    {this.state.showQuickTutorial && (
                        <PopoutBox
                            targetElementRef={this.formattingHelpBtn.current}
                            placement={'bottom-start'}
                            closeComponent={() =>
                                this.setState({ showQuickTutorial: false })
                            }
                            offsetX={5}
                            getPortalRoot={this.props.getRootElement}
                        >
                            <QuickTutorial
                                markdownHelpOnTop={true}
                                getKeyboardShortcutsState={
                                    getKeyboardShortcutsState
                                }
                                getRootElement={this.props.getRootElement}
                            />
                        </PopoutBox>
                    )}
                </TopBarContainer>
            </>
        )
    }
}

const DownloadLink = styled.span`
    color: ${(props) => props.theme.colors.prime2};
    font-size: inherit;
    margin: 0 3px;
    cursor: pointer;
`

const SubtitleText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    display: flex;
    text-align: left;
    font-size: 14px;
`

const TooltipTextContent = styled.div`
    display: block;
    line-height: 23px;

    > div {
        display: inline-block;
        vertical-align: middle;
    }
`

const SpaceButtonRow = styled.div`
    display: flex;
    grid-gap: 20px;
    align-items: center;
`
const ActionButtons = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
`

const TitleContainer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    grid-gap: 10px;
    height: 40px;
`

const EditDescriptionButton = styled.div`
    color: ${(props) => props.theme.colors.prime1};
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
    border: 1px solid ${(props) => props.theme.colors.greyScale2};

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
    z-index: 3010;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    border-radius: 10px;
    padding: 20px 0 5px 0;
    max-width: ${sizeConstants.searchResults.widthPx}px;
`

const MarkdownButtonContainer = styled.div`
    display: flex;
    font-size: 12px;
    color: ${(props) => props.theme.colors.greyScale5};
    align-items: center;
    cursor: pointer;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 24px;
    font-weight: bold;
    padding: 0 12px;
    height: fill-available;
    border-radius: 5px;
    height: 40px;
    display: flex;
    align-items: center;

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale3}20;
    }
`

const TitleEditContainer = styled.div<{
    isEditing: boolean
}>`
    width: fill-available;
    * {
        color: ${(props) => props.theme.colors.white};
        font-size: 24px;
        font-weight: bold;
    }
    border-radius: 5px;

    &:hover {
        background-color: ${(props) => props.theme.colors.greyScale3}20;
    }

    ${(props) =>
        props.isEditing &&
        css`
            background-color: ${(props) => props.theme.colors.greyScale3}30;
        `}
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
    grid-gap: 5px;
`

const DescriptionContainer = styled.div`
    width: 100%;
    margin-top: 10px;
    display: flex;
    justify-content: flex-start;
    overflow: scroll;
    max-height: 70vh;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;

    &:hover ${DescriptionEditContainer} {
        display: flex;
        justify-self: flex-start;
        align-self: flex-start;
        position: absolute;
    }
`

const DescriptionText = styled(Markdown)`
    color: ${(props) => props.theme.colors.greyScale5};
`

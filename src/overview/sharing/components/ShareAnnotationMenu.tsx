import React, { PureComponent } from 'react'
import styled, { css } from 'styled-components'
import Mousetrap from 'mousetrap'
import { TaskState } from 'ui-logic-core/lib/types'

import { executeReactStateUITask } from 'src/util/ui-logic'
import SharePrivacyOption, {
    Props as PrivacyOptionProps,
} from './SharePrivacyOption'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import * as icons from 'src/common-ui/components/design-library/icons'
import Margin from 'src/dashboard-refactor/components/Margin'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import { Checkbox } from 'src/common-ui/components'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import KeyboardShortcuts from '@worldbrain/memex-common/lib/common-ui/components/keyboard-shortcuts'

const COPY_TIMEOUT = 2000

export interface ShorcutHandlerDict {
    [shortcut: string]: () => Promise<void>
}

export interface Props {
    onCopyLinkClick: () => Promise<void>
    privacyOptionsTitleCopy: React.ReactNode
    shortcutHandlerDict?: ShorcutHandlerDict
    onClickOutside?: React.MouseEventHandler
    onPlusBtnClick?: React.MouseEventHandler
    privacyOptions: PrivacyOptionProps[]
    linkTitleCopy: React.ReactNode
    isLoading: boolean
    showLink: boolean
    link: string
    context?: string
    handleCreateLink?: () => Promise<void>
    autoShareState?: TaskState
    autoCreateLinkState?: TaskState
    autoCreateLinkSetting?: boolean
    toggleAutoCreateLinkSetting?: () => void
}

interface State {
    copyState: TaskState
}

class ShareAnnotationMenu extends PureComponent<Props, State> {
    copyTimeout?: ReturnType<typeof setTimeout>
    menuRef: React.RefObject<HTMLDivElement>
    state: State = { copyState: 'pristine' }

    componentDidMount() {
        if (this.props.shortcutHandlerDict) {
            for (const [shortcut, handler] of Object.entries(
                this.props.shortcutHandlerDict,
            )) {
                Mousetrap.bind(shortcut, handler)
            }
        }
    }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }

        if (this.props.shortcutHandlerDict) {
            for (const shortcut of Object.keys(
                this.props.shortcutHandlerDict,
            )) {
                Mousetrap.unbind(shortcut)
            }
        }
    }

    private handleLinkCopy = async () => {
        await this.props.onCopyLinkClick()
        this.setState({ copyState: 'success' })
        this.copyTimeout = setTimeout(
            () => this.setState({ copyState: 'pristine' }),
            COPY_TIMEOUT,
        )
    }

    private handleCreateLink = async () => {
        await executeReactStateUITask<State, 'copyState'>(
            this,
            'copyState',
            () => this.props.handleCreateLink(),
        )
        this.copyTimeout = setTimeout(
            () => this.setState({ copyState: 'pristine' }),
            COPY_TIMEOUT,
        )
    }

    private renderLinkContent() {
        const { copyState } = this.state
        return (
            <PrimaryAction
                onClick={() =>
                    this.props.link
                        ? this.handleLinkCopy()
                        : this.handleCreateLink()
                }
                label={
                    copyState === 'running' ? (
                        <LoadingIndicator size={14} />
                    ) : copyState === 'success' ? (
                        'Link copied to clipboard'
                    ) : (
                        'Share Annotation'
                    )
                }
                icon={
                    copyState === 'running'
                        ? null
                        : copyState === 'success'
                        ? 'copy'
                        : 'link'
                }
                type="secondary"
                size="medium"
                fullWidth
            />
        )
    }

    private renderMain() {
        return (
            <Menu ref={this.menuRef} context={this.props.context}>
                {this.props.context === 'AllNotesShare' ? (
                    this.props.isLoading ? (
                        <LoadingBox height={'80px'}>
                            <LoadingIndicator size={30} />
                        </LoadingBox>
                    ) : (
                        <>
                            <PrivacyContainer isLinkShown={this.props.showLink}>
                                <TopArea context={this.props.context}>
                                    {this.props.privacyOptionsTitleCopy ? (
                                        <PrivacyTitle>
                                            {this.props.privacyOptionsTitleCopy}
                                        </PrivacyTitle>
                                    ) : undefined}
                                    <PrivacyOptionContainer>
                                        {this.props.privacyOptions.map(
                                            (props, i) => (
                                                <SharePrivacyOption
                                                    key={i}
                                                    {...props}
                                                />
                                            ),
                                        )}
                                    </PrivacyOptionContainer>
                                </TopArea>
                            </PrivacyContainer>
                        </>
                    )
                ) : (
                    <>
                        {this.props.showLink && (
                            <TopArea>
                                {/* <PrivacyTitle>
                                        {this.props.linkTitleCopy}
                                    </PrivacyTitle> */}
                                <LinkCopierBox>
                                    {this.renderLinkContent()}
                                </LinkCopierBox>
                                <Checkbox
                                    key={1}
                                    id={'1'}
                                    isChecked={
                                        this.props.autoCreateLinkSetting ===
                                        true
                                    }
                                    handleChange={() =>
                                        this.props.toggleAutoCreateLinkSetting()
                                    }
                                    // isDisabled={!this.state.shortcutsEnabled}
                                    name={'Copy link when creating highlight'}
                                    label={'Copy link when creating highlight'}
                                    size={14}
                                    isLoading={
                                        this.props.autoCreateLinkState ===
                                        'running'
                                    }
                                />
                            </TopArea>
                        )}
                        <PrivacyContainer isLinkShown={this.props.showLink}>
                            <SubtitleSection>
                                <SectionTitle>Add to Spaces</SectionTitle>
                                {/* {this.props.autoShareState === 'running' ? (
                                    <LoadingBox
                                        padding={'0 10px 0 0'}
                                        loaderPosition={'flex-end'}
                                    >
                                        <LoadingIndicator size={16} />
                                    </LoadingBox>
                                ) : ( */}
                                <TooltipBox
                                    tooltipText={
                                        <TooltipTextBox>
                                            Added to all Spaces you put the page
                                            into <br />
                                            <KeyboardShortcuts
                                                keys={this.props.privacyOptions[1].shortcut.split(
                                                    '+',
                                                )}
                                                size={'small'}
                                            />
                                        </TooltipTextBox>
                                    }
                                    placement={'bottom-end'}
                                >
                                    <Checkbox
                                        key={1}
                                        id={'1'}
                                        isChecked={
                                            this.props.privacyOptions[1]
                                                .isSelected
                                        }
                                        handleChange={() =>
                                            this.props.privacyOptions[1]
                                                .isSelected
                                                ? this.props.privacyOptions[0].onClick()
                                                : this.props.privacyOptions[1].onClick()
                                        }
                                        // isDisabled={!this.state.shortcutsEnabled}
                                        name={'Auto Share'}
                                        label={'Auto Share'}
                                        size={14}
                                        isLoading={
                                            this.props.autoShareState ===
                                            'running'
                                        }
                                    />
                                </TooltipBox>
                                {/* )} */}
                            </SubtitleSection>
                            {/* <TopArea>
                                    {this.props.privacyOptionsTitleCopy ? (
                                        <PrivacyTitle>
                                            {
                                                this.props
                                                    .privacyOptionsTitleCopy
                                            }
                                        </PrivacyTitle>
                                    ) : undefined}
                                    <PrivacyOptionContainer>
                                        {this.props.privacyOptions.map(
                                            (props, i) => (
                                                <SharePrivacyOption
                                                    key={i}
                                                    {...props}
                                                />
                                            ),
                                        )}
                                    </PrivacyOptionContainer>
                                </TopArea> */}
                        </PrivacyContainer>
                    </>
                )}
            </Menu>
        )
    }

    render() {
        if (this.menuRef) {
            this.menuRef.current.focus()
        }

        return this.renderMain()
    }
}

export default ShareAnnotationMenu

const Menu = styled.div<{ context: string }>`
    padding: 5px 0px;
    width: 310px;
    z-index: 10;
    position: relative;

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
    &:first-child {
        padding: 15px 0px 0px 0px;
    }

    ${(props) =>
        props.context === 'AllNotesShare' &&
        css`
            height: fit-content;
            width: 350px;

            &:first-child {
                padding: 15px 15px 15px 15px;
            }
        `};
`

const SubtitleSection = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 5px;
    padding: 0 15px;
`

const TopArea = styled.div<{ context: string }>`
    padding: 10px 15px 10px 15px;
    height: fit-content;
    margin-bottom: 20px;
    grid-gap: 5px;
    display: flex;
    flex-direction: column;

    &:first-child {
        padding: 0px 15px 0px 15px;
    }

    ${(props) =>
        props.context === 'AllNotesShare' &&
        css`
            height: fit-content;

            &:first-child {
                padding: unset;
                margin-bottom: 0px;
            }
        `};
`

const LinkCopierBox = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 5px 0;
    background-color: ${(props) => props.theme.colors.greyScale1}70;
    border-radius: 5px;
`

const LoadingBox = styled.div<{
    height?: string
    loaderPosition?: string
    padding?: string
}>`
    width: 100%;
    display: flex;
    height: ${(props) => props.height || '100%'};
    align-items: center;
    justify-content: ${(props) => props.loaderPosition || 'center'};
    padding: ${(props) => props.padding || 'unset'};
`

const LinkCopier = styled.button`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 0;
    border-radius: 6px;
    height: 40px;
    background-color: ${(props) => props.theme.colors.greyScale2};
    padding: 0 10px;
    outline: none;
    cursor: pointer;
    overflow: hidden;

    & > span {
        overflow: hidden;
        width: 90%;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`

const LinkBox = styled.div`
    background: ${(props) => props.theme.colors.greyScale2};
    display: flex;
    width: 100%;
    align-items: center;
`

const LinkContent = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    width: -webkit-fill-available;
    text-overflow: ellipsis;
    overflow: hidden;
`

const PrivacyContainer = styled.div<{ isLinkShown: boolean }>`
    width: 100%;
`

const SectionTitle = styled.div`
    font-size: 14px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.white};
    white-space: nowrap;
`

const PrivacyTitle = styled.div`
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 10px;
    color: ${(props) => props.theme.colors.greyScale4};
    white-space: nowrap;
    padding-left: 5px;
`

const PrivacyOptionContainer = styled(Margin)`
    display: flex;
    justify-content: space-between;
    width: fill-available;
    flex-direction: row;
    align-items: center;
    grid-gap: 4px;
`
const TooltipTextBox = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    grid-gap: 5px;
    justify-content: center;
`

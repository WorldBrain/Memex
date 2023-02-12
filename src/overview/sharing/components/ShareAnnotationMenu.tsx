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
        await executeReactStateUITask<State, 'copyState'>(
            this,
            'copyState',
            () => this.props.onCopyLinkClick(),
        )
        this.copyTimeout = setTimeout(
            () => this.setState({ copyState: 'pristine' }),
            COPY_TIMEOUT,
        )
    }

    private renderLinkContent() {
        const { copyState } = this.state

        if (copyState === 'running' || this.props.isLoading) {
            return (
                <LoadingBox>
                    <LoadingIndicator size={16} />
                </LoadingBox>
            )
        } else if (copyState === 'success') {
            return <LinkContent>Copied to Clipboard</LinkContent>
        } else {
            return (
                <LinkBox>
                    <LinkContent>{this.props.link.split('://')[1]}</LinkContent>
                    <Icon filePath={icons.copy} heightAndWidth="14px" />
                </LinkBox>
            )
        }
    }

    private renderMain() {
        return (
            <Menu ref={this.menuRef} context={this.props.context}>
                {this.props.isLoading ? (
                    <LoadingBox>
                        <LoadingIndicator size={30} />
                    </LoadingBox>
                ) : (
                    <>
                        {this.props.context === 'AllNotesShare' ? (
                            <>
                                <PrivacyContainer
                                    isLinkShown={this.props.showLink}
                                >
                                    <TopArea context={this.props.context}>
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
                                    </TopArea>
                                </PrivacyContainer>
                            </>
                        ) : (
                            <>
                                {this.props.showLink && this.props.link && (
                                    <TopArea>
                                        <PrivacyTitle>
                                            {this.props.linkTitleCopy}
                                        </PrivacyTitle>
                                        <LinkCopierBox>
                                            <LinkCopier
                                                state={this.state.copyState}
                                                onClick={this.handleLinkCopy}
                                            >
                                                {this.renderLinkContent()}
                                            </LinkCopier>
                                        </LinkCopierBox>
                                    </TopArea>
                                )}
                                <PrivacyContainer
                                    isLinkShown={this.props.showLink}
                                >
                                    <TopArea>
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
                                    </TopArea>
                                </PrivacyContainer>
                            </>
                        )}
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
    width: 370px;
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

const TopArea = styled.div<{ context: string }>`
    padding: 10px 15px 10px 15px;
    height: 80px;

    &:first-child {
        padding: 0px 15px 0px 15px;
    }

    ${(props) =>
        props.context === 'AllNotesShare' &&
        css`
            height: fit-content;

            &:first-child {
                padding: unset;
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

const LoadingBox = styled.div`
    width: 100%;
    display: flex;
    height: 80px;
    align-items: center;
    justify-content: center;
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

    & * {
        cursor: pointer;
    }
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

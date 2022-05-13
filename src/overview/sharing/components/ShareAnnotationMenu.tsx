import React, { PureComponent } from 'react'
import styled from 'styled-components'
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
import { ClickAway } from 'src/util/click-away-wrapper'

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
            <Menu>
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
                                    <TopArea>
                                        <PrivacyTitle>
                                            {this.props.privacyOptionsTitleCopy}
                                        </PrivacyTitle>
                                        <PrivacyOptionContainer top="5px">
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
                                {/* {this.props.showLink && this.props.link ? (
                                    <>
                                        <TopArea>
                                            <PrivacyTitle>
                                                {this.props.linkTitleCopy}
                                            </PrivacyTitle>
                                            {this.props.onPlusBtnClick && (
                                    <Icon
                                        icon="plus"
                                        height="18px"
                                        onClick={this.props.onPlusBtnClick}
                                    />
                                )}
                                            <LinkCopierBox>
                                                <LinkCopier
                                                    state={this.state.copyState}
                                                    onClick={
                                                        this.handleLinkCopy
                                                    }
                                                >
                                                    {this.renderLinkContent()}
                                                </LinkCopier>
                                            </LinkCopierBox>
                                        </TopArea>
                                        <PrivacyContainer
                                            isLinkShown={this.props.showLink}
                                        >
                                            <TopArea>
                                                <PrivacyTitle>
                                                    {
                                                        this.props
                                                            .privacyOptionsTitleCopy
                                                    }
                                                </PrivacyTitle>
                                                <PrivacyOptionContainer top="5px">
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
                                        <NoResultsSection>
                                            <SectionCircle>
                                                <Icon
                                                    filePath={icons.heartEmpty}
                                                    heightAndWidth="20px"
                                                    color="purple"
                                                    hoverOff
                                                />
                                            </SectionCircle>
                                            <SectionTitle>
                                                No Link available yet
                                            </SectionTitle>
                                            <InfoText>
                                                First Bookmark or annotate this
                                                page
                                            </InfoText>
                                        </NoResultsSection>
                                    </>
                                )} */}
                            </>
                        ) : (
                            <>
                                {this.props.showLink && this.props.link && (
                                    <TopArea>
                                        <PrivacyTitle>
                                            {this.props.linkTitleCopy}
                                        </PrivacyTitle>
                                        {/* {this.props.onPlusBtnClick && (
                                    <Icon
                                        icon="plus"
                                        height="18px"
                                        onClick={this.props.onPlusBtnClick}
                                    />
                                )} */}
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
                                        <PrivacyTitle>
                                            {this.props.privacyOptionsTitleCopy}
                                        </PrivacyTitle>
                                        <PrivacyOptionContainer top="5px">
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
        if (this.props.onClickOutside) {
            return (
                <ClickAway onClickAway={this.props.onClickOutside}>
                    {this.renderMain()}
                </ClickAway>
            )
        }

        return this.renderMain()
    }
}

export default ShareAnnotationMenu

const NoResultsSection = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 0px;
    flex-direction: column;
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.backgroundHighlight};
    border-radius: 100px;
    height: 50px;
    width: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 10px;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 14px;
    font-weight: 400;
    text-align: center;
`

const Menu = styled.div`
    padding: 5px 0px;

    & * {
        font-family: ${(props) => props.theme.fonts.primary};
    }
`

const TopArea = styled.div`
    padding: 10px 15px 10px 15px;
`

const TitleContainer = styled.div`
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: space-between;
`

const LinkCopierBox = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 5px 0;
    background-color: ${(props) => props.theme.colors.backgroundColorDarker}70;
    border-radius: 5px;
`

const LoadingBox = styled.div`
    width: 100%;
    display: flex;
    height: 100px;
    align-items: center;
    justify-content: center;
`

const LinkCopier = styled.button`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 0;
    border-radius: 3px;
    height: 40px;
    background-color: ${(props) => props.theme.colors.backgroundColorDarker};
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
    display: flex;
    width: 100%;
    align-items: center;
`

const LinkContent = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    width: -webkit-fill-available;
    text-overflow: ellipsis;
    overflow: hidden;
`

const PrivacyContainer = styled.div<{ isLinkShown: boolean }>`
    width: 100%;
`

const PrivacyTitle = styled.div`
    font-size: 14px;
    font-weight: normal;
    margin-bottom: 10px;
    color: ${(props) => props.theme.colors.normalText};
`

const PrivacyOptionContainer = styled(Margin)`
    min-height: 100px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
`

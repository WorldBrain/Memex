import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Mousetrap from 'mousetrap'
import { TaskState } from 'ui-logic-core/lib/types'

import SharePrivacyOption, {
    Props as PrivacyOptionProps,
} from './SharePrivacyOption'
import { TypographyTextNormal } from 'src/common-ui/components/design-library/typography'
import { LoadingIndicator } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { ClickAway } from 'src/util/click-away-wrapper'
import Margin from 'src/dashboard-refactor/components/Margin'

const COPY_TIMEOUT = 2000

export interface ShorcutHandlerDict {
    [shortcut: string]: React.MouseEventHandler | (() => Promise<void>)
}

export interface Props {
    privacyOptionsTitleCopy: React.ReactNode
    privacyOptionsLoading: boolean
    privacyOptions: PrivacyOptionProps[]
    shortcutHandlerDict?: ShorcutHandlerDict
    linkTitleCopy?: React.ReactNode
    getLink: () => Promise<string>
    onClickOutside?: React.MouseEventHandler
    onCopyLinkClick: (createdLink: string) => Promise<void>
}

export interface State {
    loadState: TaskState
    copyState: TaskState
    showCopySuccess: boolean
    link?: string
}

class ShareAnnotationMenu extends PureComponent<Props, State> {
    copyTimeout?: ReturnType<typeof setTimeout>
    state: State = {
        loadState: 'running',
        copyState: 'pristine',
        showCopySuccess: false,
    }

    async componentDidMount() {
        try {
            const createdLink = await this.props.getLink()
            this.setState({
                link: createdLink,
                loadState: 'success',
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
        }

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

    private handleLinkClick = async () => {
        if (this.state.copyState === 'pristine') {
            this.setState({ copyState: 'running' })
            try {
                await this.props.onCopyLinkClick(this.state.link)
                this.setState({ copyState: 'success' })

                this.copyTimeout = setTimeout(() => {
                    this.setState({ loadState: 'pristine' })
                }, COPY_TIMEOUT)
            } catch (e) {
                this.setState({ copyState: 'error' })
                throw e
            }
        }
    }

    private renderLinkContent() {
        const { loadState, copyState } = this.state

        if (loadState === 'running') {
            return <LoadingIndicator />
        } else if (copyState === 'success') {
            return (
                <TypographyTextNormal>Copied to Clipboard</TypographyTextNormal>
            )
        } else {
            return (
                <>
                    <TypographyTextNormal>
                        {this.state.link}
                    </TypographyTextNormal>
                    <img src={icons.copy} />
                </>
            )
        }
    }

    render() {
        return (
            <ClickAway onClickAway={this.props.onClickOutside}>
                <Menu>
                    <TopArea>
                        <SectionTitle>{this.props.linkTitleCopy}</SectionTitle>
                        <LinkCopierBox>
                            <LinkCopier
                                state={this.state.loadState}
                                onClick={this.handleLinkClick}
                            >
                                {this.renderLinkContent()}
                            </LinkCopier>
                        </LinkCopierBox>
                    </TopArea>
                    <PrivacyContainer>
                        <PrivacyTitle>
                            {this.props.privacyOptionsTitleCopy}
                        </PrivacyTitle>
                        <PrivacyOptionContainer top="5px">
                            {this.props.privacyOptionsLoading ? (
                                <LoadingIndicator />
                            ) : (
                                this.props.privacyOptions.map((props, i) => (
                                    <SharePrivacyOption key={i} {...props} />
                                ))
                            )}
                        </PrivacyOptionContainer>
                    </PrivacyContainer>
                </Menu>
            </ClickAway>
        )
    }
}

export default ShareAnnotationMenu

const Menu = styled.div`
    & * {
        font-family: 'Poppins', sans-serif;
        line-height: 22px;
    }
`

const TopArea = styled.div`
    padding: 10px 15px;
`
const SectionTitle = styled.div`
    font-weight: bold;
    font-size: 14px;
    color: #3a2f45;
`

const LinkCopierBox = styled.div`
    width: 100%;
    display: flex;
    align-items: center;
    cursor: pointer;
    margin: 5px 0;
`

const RemoveIcon = styled.img`
    width: 24px;
    height: 24px;
    margin-left: 10px;
    border-radius: 3px;
    padding: 3px;
    cursor: pointer;

    &:hover {
        background-color: #e0e0e0;
    }
`

const LinkCopier = styled.button`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 0;
    border-radius: 3px;
    height: 30px;
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

const PrivacyContainer = styled.div`
    width: 100%;

    & * {
        color: ${(props) => props.theme.colors.primary};
    }
`

const PrivacyTitle = styled.div`
    font-size: 14px;
    font-weight: bold;
    padding: 0px 15px;
`

const PrivacyOptionContainer = styled(Margin)`
    min-height: 100px;
    display: flex;
    justify-content: center;
    flex-direction: column;
    align-items: center;
`

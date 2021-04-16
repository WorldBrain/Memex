import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Mousetrap from 'mousetrap'
import { TaskState } from 'ui-logic-core/lib/types'

import { executeReactStateUITask } from 'src/util/ui-logic'
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
    onCopyLinkClick: () => Promise<void>
    privacyOptionsTitleCopy: React.ReactNode
    shortcutHandlerDict?: ShorcutHandlerDict
    onClickOutside?: React.MouseEventHandler
    privacyOptions: PrivacyOptionProps[]
    linkTitleCopy: React.ReactNode
    isLoading: boolean
    showLink: boolean
    link: string
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
            return <LoadingIndicator />
        } else if (copyState === 'success') {
            return (
                <TypographyTextNormal>Copied to Clipboard</TypographyTextNormal>
            )
        } else {
            return (
                <>
                    <TypographyTextNormal>
                        {this.props.link}
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
                    {this.props.showLink && (
                        <TopArea>
                            <SectionTitle>
                                {this.props.linkTitleCopy}
                            </SectionTitle>
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
                    <PrivacyContainer>
                        {this.props.isLoading ? (
                            <LoadingIndicator />
                        ) : (
                            <>
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
                            </>
                        )}
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

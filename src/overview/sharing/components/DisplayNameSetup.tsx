import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

import { formBackground } from 'src/common-ui/components/design-library/colors'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import * as icons from 'src/common-ui/components/design-library/icons'

export interface Props {
    refreshUserInfoOnInit?: boolean
    authBG: AuthRemoteFunctionsInterface
    onSaveComplete?: React.MouseEventHandler
}

interface State {
    loadState: TaskState
    saveState: TaskState
    displayNameInput: string
    displayName: string
}

const Container = styled.div`
    width: fill-available;
`
const TextInputContainer = styled.div`
    display: flex;
    grid-auto-flow: column;
    grid-gap: 10px;
    align-items: center;
    justify-content: flex-start;
    border: 1px solid ${(props) => props.theme.colors.lineLightGrey};
    height: 50px;
    border-radius: 8px;
    width: fill-available;
    padding: 0 15px;
`

const TextInput = styled.input`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    border: none;
    background: transparent;

    &::placeholder {
        color: ${(props) => props.theme.colors.normalText};
    }
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.lighterText};
    font-size: 12px;
    opacity: 0.7;
    padding-left: 10px;
    margin-top: 5px;
`

const InputBox = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    width: fill-available;
`

const LoadingBlock = styled.div`
    width: 100%;
    justify-content: flex-start;
    padding-left: 15px;
    align-items: center;
    display: flex;
`

export default class DisplayNameSetup extends PureComponent<Props, State> {
    state: State = {
        loadState: 'running',
        saveState: 'pristine',
        displayNameInput: '',
        displayName: '',
    }

    async componentDidMount() {
        const { authBG, refreshUserInfoOnInit } = this.props
        this.setState({ loadState: 'running' })

        try {
            const profile = await authBG.getUserProfile()
            this.setState({
                loadState: 'success',
                displayNameInput: profile?.displayName ?? '',
                displayName: profile?.displayName ?? '',
            })
        } catch (e) {
            this.setState({ loadState: 'error' })
            throw e
        }

        if (refreshUserInfoOnInit) {
            await authBG.refreshUserInfo()
        }
    }

    private changeInput: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
        const displayNameInput = (e.target as HTMLInputElement).value
        this.setState({ displayNameInput, saveState: 'pristine' })
    }

    private confirmSave: React.MouseEventHandler = async (e) => {
        const displayName = this.state.displayNameInput.trim()
        if (!displayName.length || displayName === this.state.displayName) {
            return
        }

        this.setState({ saveState: 'running' })
        try {
            await this.props.authBG.updateUserProfile({ displayName })
            this.setState({ saveState: 'success' })
            this.props.onSaveComplete?.(e)
        } catch (err) {
            this.setState({ saveState: 'error' })
            throw err
        }
    }

    private renderBtnLabel() {
        if (this.state.saveState === 'running') {
            return <LoadingIndicator />
        }
        if (this.state.saveState === 'success') {
            return 'Saved!'
        }
        return 'Update'
    }

    render() {
        return (
            <Container>
                <InputBox>
                    <TextInputContainer>
                        <Icon
                            filePath={icons.smileFace}
                            heightAndWidth="20px"
                            hoverOff
                        />
                        {this.state.loadState === 'running' ? (
                            <LoadingBlock>
                                <LoadingIndicator size={16} />
                            </LoadingBlock>
                        ) : (
                            <TextInput
                                value={this.state.displayNameInput}
                                onChange={this.changeInput}
                                disabled={this.state.saveState === 'running'}
                                placeholder={'Add Display Name'}
                            />
                        )}
                    </TextInputContainer>
                    {this.state.displayName !== this.state.displayNameInput && (
                        <PrimaryAction
                            label={this.renderBtnLabel()}
                            onClick={this.confirmSave}
                        />
                    )}
                </InputBox>
                <InfoText>
                    Display name shown on shared Spaces, page links and
                    annotations
                </InfoText>
            </Container>
        )
    }
}

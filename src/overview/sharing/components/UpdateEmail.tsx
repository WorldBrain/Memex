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
    email: string
}

interface State {
    loadState: TaskState
    saveState: TaskState
    emailInput: string
    email: string
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

const WarningText = styled.div`
    background-color: ${(props) => props.theme.colors.warning};
    font-size: 14px;
    padding-left: 10px;
    margin-top: 5px;
    color: white;
    padding: 20px;
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InputBox = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 10px;
    width: fill-available;
`

export default class DisplayNameSetup extends PureComponent<Props, State> {
    state: State = {
        loadState: 'pristine',
        saveState: 'pristine',
        emailInput: this.props.email,
        email: this.props.email,
    }

    async componentDidMount() {
        const { authBG, refreshUserInfoOnInit } = this.props
        this.setState({ loadState: 'running' })
        const user = await this.props.authBG.getCurrentUser()

        try {
            const profile = await authBG.getUserProfile()
            this.setState({
                loadState: 'success',
                emailInput: user.email ?? '',
                email: user.email ?? '',
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
        const emailInput = (e.target as HTMLInputElement).value
        this.setState({ emailInput, saveState: 'pristine' })
    }

    private confirmSave: React.MouseEventHandler = async (e) => {
        const user = this.props.authBG.getCurrentUser()
        const email = this.state.emailInput.trim()
        if (!email.length || email === this.state.email) {
            return
        }

        this.setState({ saveState: 'running' })
        try {
            await this.props.authBG.changeEmailProcess(email)
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
                            filePath={icons.mail}
                            heightAndWidth="20px"
                            hoverOff
                        />
                        <TextInput
                            value={this.state.emailInput}
                            onChange={this.changeInput}
                            disabled={this.state.saveState === 'running'}
                            placeholder={'Add Display Name'}
                        />
                    </TextInputContainer>
                    {this.state.email !== this.state.emailInput && (
                        <PrimaryAction
                            label={this.renderBtnLabel()}
                            onClick={this.confirmSave}
                        />
                    )}
                </InputBox>
                {this.state.saveState === 'error' && (
                    <WarningText>
                        Log out and login again, then change your email.
                    </WarningText>
                )}
            </Container>
        )
    }
}

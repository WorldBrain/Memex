import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

import { formBackground } from 'src/common-ui/components/design-library/colors'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import { LoadingIndicator } from 'src/common-ui/components'

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

const NameInput = styled.input`
    background-color: ${formBackground};
    border-radius: 3px;
    outline: none;
    border: none;
    width: 300px;
    height: 35px;
    margin: 0 0 20px 0;
    text-align: center;
`

const InputContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
`

export default class DisplayNameSetup extends PureComponent<Props, State> {
    state: State = {
        loadState: 'pristine',
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
            <div>
                <InputContainer>
                    <NameInput
                        value={this.state.displayNameInput}
                        onChange={this.changeInput}
                        disabled={this.state.saveState === 'running'}
                    />
                    <PrimaryAction
                        label={this.renderBtnLabel()}
                        onClick={this.confirmSave}
                    />
                </InputContainer>
            </div>
        )
    }
}

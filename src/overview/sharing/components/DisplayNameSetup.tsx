import React, { PureComponent } from 'react'
import styled from 'styled-components'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

import { formBackground } from 'src/common-ui/components/design-library/colors'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'

export interface Props {
    refreshUserInfoOnInit?: boolean
    authBG: AuthRemoteFunctionsInterface
}

interface State {
    loadState: TaskState
    buttonLabel: string
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
        buttonLabel: 'Update',
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
        const displayName = (e.target as HTMLInputElement).value
        this.setState({ buttonLabel: 'Update', displayNameInput: displayName })
    }

    private confirmSave: React.MouseEventHandler = async () => {
        const displayName = this.state.displayNameInput.trim()
        if (!displayName.length || displayName === this.state.displayName) {
            return
        }

        await this.props.authBG.updateUserProfile({ displayName })
        this.setState({ buttonLabel: 'Saved!' })
    }

    render() {
        return (
            <div>
                <InputContainer>
                    <NameInput
                        value={this.state.displayNameInput}
                        onChange={this.changeInput}
                    />

                    <PrimaryAction
                        label={this.state.buttonLabel}
                        onClick={this.confirmSave}
                    />
                </InputContainer>
            </div>
        )
    }
}

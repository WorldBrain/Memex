import React, { ChangeEventHandler, PureComponent } from 'react'
import styled from 'styled-components'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import type { AuthRemoteFunctionsInterface } from 'src/authentication/background/types'
import type { TaskState } from 'ui-logic-core/lib/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'

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

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
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
    height: 40px;
    padding-left: 20px;
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

    private changeInput: ChangeEventHandler = (e) => {
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
            setTimeout(() => this.setState({ saveState: 'pristine' }), 2000)
        } catch (err) {
            this.setState({ saveState: 'error' })
            throw err
        }
    }

    private renderBtnLabel() {
        if (this.state.saveState === 'running') {
            return <LoadingIndicator size={20} />
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
                    {this.state.loadState === 'running' ? (
                        <LoadingBlock>
                            <LoadingIndicator size={16} />
                        </LoadingBlock>
                    ) : (
                        <TextField
                            value={this.state.displayNameInput}
                            onChange={this.changeInput}
                            disabled={this.state.saveState === 'running'}
                            placeholder={'Add Display Name'}
                            icon={'smileFace'}
                        />
                    )}
                    {this.state.displayName !== this.state.displayNameInput && (
                        <PrimaryAction
                            label={this.renderBtnLabel()}
                            onClick={this.confirmSave}
                            type={'primary'}
                            size={'medium'}
                            height={'44px'}
                            width={'80px'}
                        />
                    )}
                </InputBox>
                <InfoText>
                    Name shown on shared Spaces, page links and annotations
                </InfoText>
            </Container>
        )
    }
}

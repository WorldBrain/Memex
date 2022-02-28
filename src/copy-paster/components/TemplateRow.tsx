import React, { Component } from 'react'
import styled from 'styled-components'

import { Template } from '../types'
import ResultItemActionBtn from 'src/common-ui/components/result-item-action-btn'
import * as icons from 'src/common-ui/components/design-library/icons'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const COPY_TIMEOUT = 2000

export interface Props {
    template: Template

    onClick: () => Promise<void> | void
    onClickSetIsFavourite: (isFavourite: boolean) => void
    onClickEdit: () => void
}

interface State {
    isLoading: boolean
    hasCopied: boolean
}

export default class TemplateRow extends Component<Props, State> {
    private copyPromise: Promise<void> | null = null
    copyTimeout?: ReturnType<typeof setTimeout>
    state: State = { hasCopied: false, isLoading: false }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }
    }

    private handleSingleCopy = async () => {
        if (this.copyPromise) {
            return this.copyPromise
        }

        this.copyPromise = this.copy()

        await this.copyPromise
        this.copyPromise = null
    }

    private copy = async () => {
        this.setState({ isLoading: true })
        await this.props.onClick()
        this.setState({ hasCopied: true, isLoading: false })

        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }

        this.copyTimeout = setTimeout(() => {
            this.setState({ hasCopied: false })
        }, COPY_TIMEOUT)
    }

    private renderRowBody() {
        const { title, isFavourite } = this.props.template

        if (this.state.isLoading) {
            return (
                <Title fullWidth>
                    <LoadingIndicator />
                </Title>
            )
        }

        if (this.state.hasCopied) {
            return <Title fullWidth>Copied to clipboard</Title>
        }

        return (
            <>
                <Title>{title}</Title>
                <ActionsContainer>
                    <Icon
                        filePath={icons.copy}
                        heightAndWidth="16px"
                        onClick={this.handleSingleCopy}
                    />
                    <Icon
                        filePath={icons.edit}
                        heightAndWidth="16px"
                        onClick={this.props.onClickEdit}
                    />
                </ActionsContainer>
            </>
        )
    }

    render() {
        return <Row onClick={this.handleSingleCopy}>{this.renderRowBody()}</Row>
    }
}

const ActionsContainer = styled.div`
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    grid-gap: 5px;
    display: none;
`

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    border-radius: 5px;
    padding: 0px 15px;
    // border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        background-color: ${(props) => props.theme.colors.backgroundColor};

        ${ActionsContainer} { // if DeleteButtonContainer is not under an hovered ContainerSection
            display: flex;
        }
    }
`

const Title = styled.div`
    display: ${(props) => (props.fullWidth ? 'flex' : 'block')};
    justify-content: center;
    width: 100%;
    cursor: pointer;
    text-align: left;

    font-family: 'Inter', sans-serif;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    color: ${(props) => props.theme.colors.normalText};

    outline: none;
    border: none;
`

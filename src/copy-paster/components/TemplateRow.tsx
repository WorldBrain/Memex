import React, { Component } from 'react'
import styled, { css } from 'styled-components'

import { Template } from '../types'
import ResultItemActionBtn from 'src/common-ui/components/result-item-action-btn'
import * as icons from 'src/common-ui/components/design-library/icons'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const COPY_TIMEOUT = 2000

export interface Props {
    template: Template
    // onClickChangeOrder: (oldOrder: number) => void

    onClick: () => Promise<void> | void
    onClickEdit: () => void
    inFocus?: boolean
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

    private handleSingleCopy = async (event) => {
        if (this.copyPromise) {
            return this.copyPromise
        }

        this.copyPromise = this.copy()

        await this.copyPromise
        this.copyPromise = null
        event.stopPropagation()
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
        const { title, order } = this.props.template

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
            <RowContainer>
                <DragIconContainer>
                    <Icon
                        icon={'dragList'}
                        rotation={180}
                        heightAndWidth="16px"
                        hoverOff
                    />
                </DragIconContainer>
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
                        onClick={(event) => {
                            event.stopPropagation()
                            this.props.onClickEdit()
                        }}
                    />
                </ActionsContainer>
            </RowContainer>
        )
    }

    render() {
        return (
            <Row onClick={this.handleSingleCopy} inFocus={this.props.inFocus}>
                {this.renderRowBody()}
            </Row>
        )
    }
}

const RowContainer = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
`

const DragIconContainer = styled.div`
    position: absolute;
    left: -22px;
    display: flex;
    align-items: center;
    justify-content: center;
    display: none;

    &:hover {
        cursor: grab;
    }
    &:hover * {
        cursor: grab;
    }
`

const ActionsContainer = styled.div`
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    grid-gap: 5px;
    display: none;
    position: absolute;
    background-color: ${(props) => props.theme.colors.greyScale2}90;
    backdrop-filter: blur(4px);
    right: 0px;
    height: 40px;
    padding: 0 10px;
`

const Row = styled.div<{
    inFocus?: boolean
}>`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    position: relative;
    border-radius: 5px;
    padding: 0px 0 0 18px;
    // border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale3};

        ${ActionsContainer} { // if DeleteButtonContainer is not under an hovered ContainerSection
            display: flex;
        }
    }

    &:hover ${DragIconContainer} {
        display: flex;
    }

    ${(props) =>
        props.inFocus &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        `}
`

const Title = styled.div`
    display: ${(props) => (props.fullWidth ? 'flex' : 'block')};
    justify-content: center;
    width: 100%;
    cursor: pointer;
    text-align: left;

    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale6};

    outline: none;
    border: none;
`

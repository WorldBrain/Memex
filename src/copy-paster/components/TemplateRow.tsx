import React, { Component } from 'react'
import styled, { css } from 'styled-components'

import { Template } from '../types'
import ResultItemActionBtn from 'src/common-ui/components/result-item-action-btn'
import * as icons from 'src/common-ui/components/design-library/icons'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const COPY_TIMEOUT = 2000

export interface Props {
    templateTitle: string
    // onClickChangeOrder: (oldOrder: number) => void
    itemIndex: number
    onClick: () => Promise<void> | void
    onClickEdit: () => void
    inFocus?: boolean
    isDefault?: boolean
    focusOnElement: (index: number) => void
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
        const title = this.props.templateTitle

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
                <TitleBox>
                    <Title isDefault={this.props.isDefault}>{title}</Title>
                    {this.props.isDefault && (
                        <DefaultLabel>Default</DefaultLabel>
                    )}
                </TitleBox>
                <ActionsContainer
                    onClick={(event) => {
                        event.stopPropagation()
                    }}
                >
                    <Icon
                        filePath={icons.copy}
                        heightAndWidth="20px"
                        padding="4px"
                        onClick={this.handleSingleCopy}
                    />
                    <Icon
                        filePath={icons.edit}
                        heightAndWidth="20px"
                        padding="4px"
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
            <Row
                onClick={this.handleSingleCopy}
                inFocus={this.props.inFocus}
                onMouseEnter={() =>
                    this.props.focusOnElement(this.props.itemIndex)
                }
            >
                {this.renderRowBody()}
            </Row>
        )
    }
}

const TitleBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    grid-gap: 3px;
    width: fill-available;
    width: -moz-available;
`

const DefaultLabel = styled.div`
    font-size: 10px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.greyScale5};
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 2px 5px;
    border-radius: 5px;
    background-color: ${(props) => props.theme.colors.greyScale2};
    text-align: center;
    align-self: flex-start;
    justify-self: flex-start;
    display: inline-block;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px;
    width: fit-content;
`

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
    border-radius: 0 6px 6px 0;
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
    padding: 0px 0px 0 18px;
    // border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};

    &:last-child {
        border-bottom: none;
    }

    &:hover {
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

const Title = styled.div<{ fullWidth?: boolean; isDefault?: boolean }>`
    display: ${(props) => (props.fullWidth ? 'flex' : 'block')};
    justify-content: center;
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
    overflow: hidden;
    max-width: 220px;
    white-space: nowrap;
    text-overflow: ellipsis;

    ${(props) =>
        props.isDefault &&
        css`
            max-width: 230px;
        `}
`

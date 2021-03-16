import React, { Component } from 'react'
import styled from 'styled-components'

import { Template } from '../types'
import ResultItemActionBtn from 'src/common-ui/components/result-item-action-btn'
import * as icons from 'src/common-ui/components/design-library/icons'
import { LoadingIndicator } from 'src/common-ui/components'

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
        console.log('copying')
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
                    <ResultItemActionBtn
                        onClick={this.handleSingleCopy}
                        tooltipPosition="bottom"
                        imgSrc={icons.copy}
                        tooltipText="Copy"
                    />
                    {/*<ResultItemActionBtn
                        imgSrc={isFavourite ? starImg : emptyStarImg}
                        onClick={() =>
                            this.props.onClickSetIsFavourite(!isFavourite)
                        }
                        tooltipText={
                            isFavourite
                                ? 'Remove from favourites'
                                : 'Add to favourites'
                        }
                        tooltipPosition="left"
                    />
                    */}
                    <ResultItemActionBtn
                        imgSrc={icons.edit}
                        onClick={this.props.onClickEdit}
                        tooltipText="Edit"
                        tooltipPosition="bottom"
                    />
                </ActionsContainer>
            </>
        )
    }

    render() {
        return <Row onClick={this.handleSingleCopy}>{this.renderRowBody()}</Row>
    }
}

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;

    &:hover {
        background-color: #efefef;
    }
`

const Title = styled.div`
    display: ${(props) => (props.fullWidth ? 'flex' : 'block')};
    justify-content: center;
    width: 100%;
    cursor: pointer;
    text-align: left;

    font-family: Poppins;
    font-style: normal;
    font-weight: ${(props) => (props.fullWidth ? 'bold' : 'normal')};
    font-size: 14px;
    color: #3a2f45;

    padding: 4px 10px;

    outline: none;
    border: none;
    background: ${(props) =>
        props.fullWidth ? 'rgba(196, 196, 196, 0.5)' : 'transparent'};
`

const ActionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-end;
    margin-right: 8px;
`

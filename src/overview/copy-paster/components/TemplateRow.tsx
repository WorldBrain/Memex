import React, { Component } from 'react'
import { Template } from '../types'
import styled from 'styled-components'
import ResultItemActionBtn from 'src/common-ui/components/result-item-action-btn'
import { browser } from 'webextension-polyfill-ts'
import { ButtonTooltip } from 'src/common-ui/components'

const starImg = browser.extension.getURL('/img/star_full_grey.svg')
const emptyStarImg = browser.extension.getURL('/img/star_empty_grey.svg')
const editImg = browser.extension.getURL('/img/edit.svg')
const copyImg = browser.extension.getURL('/img/copy.svg')

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 0px 10px 0 15px;

    &:hover {
        background-color: #efefef;
    }
`

const Title = styled.div`
    display: block;
    width: 100%;
    cursor: pointer;
    text-align: left;

    font-family: Poppins;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    color: #3a2f45;

    margin: 4px 0;

    outline: none;
    border: none;
    background: transparent;
`

const ActionsContainer = styled.div`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-end;
    margin-right: 8px;
`

const COPY_TIMEOUT = 2000

interface TemplateRowProps {
    template: Template

    onClick: () => void
    onClickSetIsFavourite: (isFavourite: boolean) => void
    onClickEdit: () => void
}

interface State {
    hasCopied: boolean
}

export default class TemplateRow extends Component<TemplateRowProps> {
    state = {
        hasCopied: false,
    }

    copyTimeout?: ReturnType<typeof setTimeout>

    onClickCopy() {
        this.props.onClick()

        this.setState({ hasCopied: true })

        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }

        this.copyTimeout = setTimeout(() => {
            this.setState({ hasCopied: false })
        }, COPY_TIMEOUT)
    }

    componentWillUnmount() {
        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout)
        }
    }

    render() {
        const { title, isFavourite } = this.props.template
        const { hasCopied } = this.state

        return (
            <Row
                onClick={() => {
                    this.onClickCopy()
                }}
            >
                {hasCopied ? (
                    <Title>Copied to clipboard</Title>
                ) : (
                    <Title>{title}</Title>
                )}
                <ActionsContainer>
                    <ResultItemActionBtn
                        imgSrc={copyImg}
                        onClick={() => {
                            this.onClickCopy()
                        }}
                        tooltipText={hasCopied ? null : 'Copy'}
                        tooltipPosition="left"
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
                        imgSrc={editImg}
                        onClick={this.props.onClickEdit}
                        tooltipText="Edit"
                        tooltipPosition="left"
                    />
                </ActionsContainer>
            </Row>
        )
    }
}

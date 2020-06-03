import React, { PureComponent } from 'react'
import { Template } from '../types'
import styled from 'styled-components'
import ResultItemActionBtn from 'src/common-ui/components/result-item-action-btn'
import { browser } from 'webextension-polyfill-ts'

const starImg = browser.extension.getURL('/img/star_full_grey.svg')
const emptyStarImg = browser.extension.getURL('/img/star_empty_grey.svg')
const editImg = browser.extension.getURL('/img/edit.svg')

const Row = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
`

const Title = styled.button`
    display: block;
    width: 100%;
    cursor: pointer;
    text-align: left;

    font-family: Poppins;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
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

interface TemplateRowProps {
    template: Template

    onClick: () => void
    onClickSetFavourite: (favourite: boolean) => void
    onClickEdit: () => void
}

export default class TemplateRow extends PureComponent<TemplateRowProps> {
    render() {
        const { title, favourite } = this.props.template

        return (
            <Row>
                <Title onClick={this.props.onClick}>{title}</Title>
                <ActionsContainer>
                    <ResultItemActionBtn
                        imgSrc={favourite ? starImg : emptyStarImg}
                        onClick={() =>
                            this.props.onClickSetFavourite(!favourite)
                        }
                        tooltipText={
                            favourite
                                ? 'Remove from favourites'
                                : 'Add to favourites'
                        }
                        tooltipPosition="left"
                    />
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

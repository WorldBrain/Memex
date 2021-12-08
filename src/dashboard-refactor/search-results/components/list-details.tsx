import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Button from '@worldbrain/memex-common/lib/common-ui/components/button'
import { fonts } from '../../styles'
import Margin from 'src/dashboard-refactor/components/Margin'
import { ButtonTooltip } from 'src/common-ui/components'

export interface Props {
    listName: string
    remoteLink?: string
    localListId: number
    onAddContributorsClick?: React.MouseEventHandler
}

export default class ListDetails extends PureComponent<Props> {
    render() {
        return (
            <>
                {this.props.listName && (
                    <Margin top="10px" bottom="20px">
                        <Container>
                            <DetailsContainer>
                                <Name>{this.props.listName}</Name>
                                {this.props.remoteLink && (
                                    <Note>
                                        Only your own contributions to this
                                        space are visible locally. To see all,
                                        open the{' '}
                                        <a
                                            target="_blank"
                                            href={this.props.remoteLink}
                                        >
                                            web view{' '}
                                        </a>
                                    </Note>
                                )}
                            </DetailsContainer>
                            <BtnsContainer>
                                {this.props.remoteLink ? (
                                    <>
                                        <Margin right="10px">
                                            <ButtonTooltip
                                                tooltipText="Invite people to this collection"
                                                position="bottom"
                                            >
                                                <Icon
                                                    height="18px"
                                                    icon="addPeople"
                                                    color="darkgrey"
                                                    onClick={
                                                        this.props
                                                            .onAddContributorsClick
                                                    }
                                                />
                                            </ButtonTooltip>
                                        </Margin>
                                        <Button
                                            type="primary-action"
                                            externalHref={this.props.remoteLink}
                                        >
                                            Open Web View
                                        </Button>
                                    </>
                                ) : (
                                    <ButtonTooltip
                                        tooltipText="Invite people to this collection"
                                        position="bottom"
                                    >
                                        <Button
                                            type="primary-action"
                                            onClick={
                                                this.props
                                                    .onAddContributorsClick
                                            }
                                        >
                                            <ShareCollectionBtn>
                                                <Icon
                                                    height="18px"
                                                    icon="addPeople"
                                                    color="white"
                                                />
                                                <ShareCollectionBtnLabel>
                                                    Share Collection
                                                </ShareCollectionBtnLabel>
                                            </ShareCollectionBtn>
                                        </Button>
                                    </ButtonTooltip>
                                )}
                            </BtnsContainer>
                        </Container>
                    </Margin>
                )}{' '}
            </>
        )
    }
}

const Container = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: center;
    z-index: 1002;

    & a {
        text-decoration: none;
        font-weight: 600;
    }
`

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const ShareCollectionBtn = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

const ShareCollectionBtnLabel = styled.div`
    padding-left: 10px;
    font-size: 12px;
`

const BtnsContainer = styled.div`
    display: flex;
    align-items: center;
    z-index: 100;
`

const Name = styled.div`
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-size: 20px;
    font-weight: ${fonts.primary.weight.bold};
    color: ${fonts.primary.colors.primary};
`

const Note = styled.span`
    font-family: ${fonts.primary.name};
    font-style: normal;
    font-size: 12px;
    color: ${fonts.primary.colors.secondary};
`

import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Button from '@worldbrain/memex-common/lib/common-ui/components/button'
import { fonts } from '../../styles'
import Margin from 'src/dashboard-refactor/components/Margin'
import { ButtonTooltip } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'

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
                    <TopBarContainer top="10px" bottom="20px">
                        <Container center={!this.props.remoteLink}>
                            <DetailsContainer>
                                <SectionTitle>
                                    {this.props.listName}
                                </SectionTitle>
                                {this.props.remoteLink && (
                                    <InfoText>
                                        Only your own contributions to this
                                        space are visible locally. To see all,
                                        open the{' '}
                                        <a
                                            target="_blank"
                                            href={this.props.remoteLink}
                                        >
                                            web view{' '}
                                        </a>
                                    </InfoText>
                                )}
                            </DetailsContainer>
                            <BtnsContainer>
                                {this.props.remoteLink ? (
                                    <>
                                        <Margin right="10px">
                                            <ButtonTooltip
                                                tooltipText="Invite people to this Space"
                                                position="bottom"
                                            >
                                                <Icon
                                                    height="19px"
                                                    filePath={icons.peopleFine}
                                                    color="purple"
                                                    onClick={
                                                        this.props
                                                            .onAddContributorsClick
                                                    }
                                                />
                                            </ButtonTooltip>
                                        </Margin>
                                        <PrimaryAction
                                            onClick={() =>
                                                window.open(
                                                    this.props.remoteLink,
                                                )
                                            }
                                            label="Open Web View"
                                            fontSize={'14px'}
                                        />
                                    </>
                                ) : (
                                    <ButtonTooltip
                                        tooltipText="Invite people to this Space"
                                        position="bottom"
                                    >
                                        <PrimaryAction
                                            onClick={
                                                this.props
                                                    .onAddContributorsClick
                                            }
                                            label={
                                                <ShareCollectionBtn>
                                                    <Icon
                                                        height="14px"
                                                        filePath={icons.link}
                                                        color="white"
                                                        hoverOff
                                                    />
                                                    <ShareCollectionBtnLabel>
                                                        Share Space
                                                    </ShareCollectionBtnLabel>
                                                </ShareCollectionBtn>
                                            }
                                        />
                                    </ButtonTooltip>
                                )}
                            </BtnsContainer>
                        </Container>
                    </TopBarContainer>
                )}{' '}
            </>
        )
    }
}

const TopBarContainer = styled(Margin)`
    z-index: 2147483640;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.normalText};
    font-size: 14px;
    font-weight: 300;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 24px;
    font-weight: bold;
`

const Container = styled.div<{ center: boolean }>`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: ${(props) => (props.center ? 'center' : 'flex-start')};
    z-index: 1002;

    & a {
        text-decoration: none;
        font-weight: 600;
    }
`

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
`

const ShareCollectionBtn = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`

const ShareCollectionBtnLabel = styled.div`
    padding-left: 10px;
    font-size: 14px;
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

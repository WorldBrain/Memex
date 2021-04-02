import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Button from '@worldbrain/memex-common/lib/common-ui/components/button'
import colors from '../../colors'
import styles, { fonts } from '../../styles'
import Margin from 'src/dashboard-refactor/components/Margin'
import { ButtonTooltip } from 'src/common-ui/components'

export interface Props {
    listName: string
    remoteLink?: string
    isCollaborative: boolean
    onAddContributorsClick?: React.MouseEventHandler
}

export default class ListDetails extends PureComponent<Props> {
    render() {
        return (
            <Margin bottom="20px">
                <Container>
                    <DetailsContainer>
                        <Name>{this.props.listName}</Name>
                        {this.props.isCollaborative && (
                            <Note>
                                You can only see and search your own
                                contributions to this collection.
                                <br /> Open the collection in the web view to
                                see all entries.
                            </Note>
                        )}
                    </DetailsContainer>
                    <BtnsContainer>
                        {this.props.onAddContributorsClick && (
                            <Margin right="10px">
                                <ButtonTooltip
                                    tooltipText="Invite people to this collection"
                                    position="bottom"
                                >
                                    <Icon
                                        height="18px"
                                        icon="addPeople"
                                        onClick={
                                            this.props.onAddContributorsClick
                                        }
                                    />
                                </ButtonTooltip>
                            </Margin>
                        )}
                        {this.props.remoteLink && (
                            <Button
                                type="primary-action"
                                externalHref={this.props.remoteLink}
                            >
                                Open
                            </Button>
                        )}
                    </BtnsContainer>
                </Container>
            </Margin>
        )
    }
}

const Container = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    align-items: ${(props) => (props.remotLink ? 'flex-start' : 'center')};
`

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const BtnsContainer = styled.div`
    display: flex;
    align-items: center;
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

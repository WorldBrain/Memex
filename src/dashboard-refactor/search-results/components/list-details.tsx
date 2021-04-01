import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import Button from '@worldbrain/memex-common/lib/common-ui/components/button'

export interface Props {
    listName: string
    remoteLink?: string
    isCollaborative: boolean
    onAddContributorsClick?: React.MouseEventHandler
}

export default class ListDetails extends PureComponent<Props> {
    render() {
        return (
            <Container>
                <DetailsContainer>
                    <Name>{this.props.listName}</Name>
                    {this.props.isCollaborative && (
                        <Note>
                            You can only see and search your own contributions
                            to this collection.{'\n'}Open the collection in the
                            web view to see all entries.
                        </Note>
                    )}
                </DetailsContainer>
                <BtnsContainer>
                    {this.props.onAddContributorsClick && (
                        <Icon
                            height="18px"
                            icon="addPeople"
                            onClick={this.props.onAddContributorsClick}
                        />
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
        )
    }
}

const Container = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
`

const DetailsContainer = styled.div`
    display: flex;
    flex-direction: column;
`

const BtnsContainer = styled.div`
    display: flex;
    align-items: flex-start;
`

const Name = styled.h1``

const Note = styled.span``

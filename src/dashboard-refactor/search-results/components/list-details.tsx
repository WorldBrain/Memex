import React, { PureComponent } from 'react'
import styled from 'styled-components'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { fonts } from '../../styles'
import Margin from 'src/dashboard-refactor/components/Margin'
import { ButtonTooltip } from 'src/common-ui/components'
import * as icons from 'src/common-ui/components/design-library/icons'
import { PrimaryAction } from 'src/common-ui/components/design-library/actions/PrimaryAction'
import MemexEditor from '@worldbrain/memex-common/lib/editor'

export interface Props {
    listName: string
    remoteLink?: string
    localListId: number
    description?: string
    isOwnedList?: boolean
    saveDescription: (description: string) => void
    onAddContributorsClick?: React.MouseEventHandler
}

interface State {
    description: string
    isEditingDescription: boolean
}

export default class ListDetails extends PureComponent<Props, State> {
    state: State = {
        isEditingDescription: false,
        description: this.props.description ?? '',
    }

    private handleDescriptionSave() {
        this.setState({ isEditingDescription: false })
        this.props.saveDescription(this.state.description)
    }

    private handleDescriptionInputKeyDown: React.KeyboardEventHandler = (e) => {
        if (e.key === 'Escape') {
            this.setState({ isEditingDescription: false })
            return
        }

        if (navigator.platform === 'MacIntel') {
            if (e.key === 'Enter' && e.metaKey) {
                this.handleDescriptionSave()
                return
            }
        } else {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleDescriptionSave()
                return
            }
        }
    }

    private renderDescription() {
        if (this.state.isEditingDescription) {
            return (
                <MemexEditor
                    autoFocus
                    markdownContent={this.state.description}
                    onKeyDown={this.handleDescriptionInputKeyDown}
                    placeholder="Write a description for this Space"
                    onContentUpdate={(description) =>
                        this.setState({ description })
                    }
                />
            )
        }

        const maybeRenderTooltip = (children: JSX.Element) =>
            this.props.isOwnedList ? (
                children
            ) : (
                <ButtonTooltip
                    position="bottom"
                    tooltipText="It isn't yet possible to edit descriptions of Spaces that aren't yours"
                >
                    {children}
                </ButtonTooltip>
            )

        return (
            <>
                <DescriptionText>{this.props.description}</DescriptionText>
                {maybeRenderTooltip(
                    <PrimaryAction
                        disabled={!this.props.isOwnedList}
                        label="Edit Space Description"
                        fontSize="14px"
                        onClick={() =>
                            this.setState({ isEditingDescription: true })
                        }
                    />,
                )}
            </>
        )
    }

    render() {
        return (
            <TopBarContainer top="10px" bottom="20px">
                <Container center={!this.props.remoteLink}>
                    <DetailsContainer>
                        <SectionTitle>{this.props.listName}</SectionTitle>
                        {this.props.remoteLink && (
                            <InfoText>
                                Only your own contributions to this space are
                                visible locally. To see all, open the{' '}
                                <a target="_blank" href={this.props.remoteLink}>
                                    web view{' '}
                                </a>
                            </InfoText>
                        )}
                        <DescriptionContainer>
                            {this.renderDescription()}
                        </DescriptionContainer>
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
                                        window.open(this.props.remoteLink)
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
                                    onClick={this.props.onAddContributorsClick}
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

const DescriptionContainer = styled.div``

const DescriptionText = styled.div``

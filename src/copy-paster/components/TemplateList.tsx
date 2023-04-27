import React, { PureComponent } from 'react'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import styled from 'styled-components'
import { Template } from '../types'
import TemplateRow from './TemplateRow'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 15px 0px 18px;
    height: 30px;
    align-items: center;
`

const ButtonBox = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    justify-self: flex-end;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 14px;
    font-weight: 400;
    flex: 1;
    white-space: nowrap;
`

const NoResultsBox = styled.div`
    text-align: center;
    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    font-style: normal;
    font-size: 12px;
    padding: 15px 10px;
    color: ${(props) => props.theme.colors.white};
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    grid-gap: 10px;
`

const Center = styled.div`
    display: flex;
    justify-content: center;
    height: 200px;
    align-items: center;
    flex-direction: column;
    grid-gap: 10px;
`

const ContentBlock = styled.div`
    padding: 5px 10px 10px 10px;
    max-height: 300px;
    overflow: scroll;

    scrollbar-width: none;

    &::-webkit-scrollbar {
        display: none;
    }
`

const SectionCircle = styled.div`
    background: ${(props) => props.theme.colors.greyScale2};
    border: 1px solid ${(props) => props.theme.colors.greyScale6};
    border-radius: 8px;
    height: 30px;
    width: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
    text-align: center;
`
const InfoTextTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    margin-top: 20px;
`

interface InternalTemplateListProps {
    templates: Template[]

    onClickSetIsFavourite: (id: number, isFavourite: boolean) => void
    onClickEdit: (id: number) => void
    onClick: (id: number) => void
    onClickHowto: () => void
}

class InternalTemplateList extends PureComponent<InternalTemplateListProps> {
    render() {
        const { templates } = this.props

        if (templates.length === 0) {
            return (
                <NoResultsBox>
                    <SectionCircle>
                        <Icon
                            filePath={icons.copy}
                            heightAndWidth="16px"
                            color="prime1"
                            hoverOff
                        />
                    </SectionCircle>
                    <InfoText>
                        Create custom templates to copy/paste content into your
                        workflow
                    </InfoText>
                    <LesserLink
                        label={'Learn More >'}
                        onClick={this.props.onClickHowto}
                    />
                </NoResultsBox>
            )
        }

        return templates.map((template) => (
            <TemplateRow
                key={template.id}
                template={template}
                onClick={() => {
                    this.props.onClick(template.id)
                }}
                onClickSetIsFavourite={(isFavourite) =>
                    this.props.onClickSetIsFavourite(template.id, isFavourite)
                }
                onClickEdit={() => this.props.onClickEdit(template.id)}
            />
        ))
    }
}

interface TemplateListProps {
    isLoading?: boolean
    templates: Template[]

    onClickSetIsFavourite: (id: number, isFavourite: boolean) => void
    onClickEdit: (id: number) => void
    onClick: (id: number) => void
    onClickNew: () => void
    onClickHowto: () => void
}

export default class TemplateList extends PureComponent<TemplateListProps> {
    render() {
        if (this.props.isLoading) {
            return (
                <Center>
                    <LoadingIndicator size={25} />
                    <InfoTextTitle>Copying Content</InfoTextTitle>
                    <InfoText small>Don't close this modal</InfoText>
                </Center>
            )
        }

        return (
            <>
                <Header>
                    <SectionTitle>Copy/Paste Templates</SectionTitle>
                    <ButtonBox>
                        <Icon
                            filePath={icons.helpIcon}
                            heightAndWidth="18px"
                            padding={'5px'}
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials/text-exporter',
                                )
                            }
                        />
                        <Icon
                            filePath={icons.plus}
                            color="prime1"
                            padding={'5px'}
                            heightAndWidth="16px"
                            onClick={this.props.onClickNew}
                        />
                    </ButtonBox>
                </Header>
                <ContentBlock>
                    <InternalTemplateList
                        templates={this.props.templates}
                        onClick={this.props.onClick}
                        onClickSetIsFavourite={this.props.onClickSetIsFavourite}
                        onClickEdit={this.props.onClickEdit}
                        onClickHowto={this.props.onClickHowto}
                    />
                </ContentBlock>
            </>
        )
    }
}

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
    padding: 10px 15px 10px 15px;
    height: 30px;
    align-items: center;
    border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.darkerText};
    font-size: 14px;
    font-weight: bold;
`

const HeaderplaceHolder = styled.div`
    width: 24px;
`

const CreateNewButton = styled.button`
    font-family: ${(props) => props.theme.fonts.primary};
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    color: ${(props) => props.theme.colors.primary};
    cursor: pointer;
    padding: 0px;

    outline: none;
    border: none;
    background: transparent;
`

const NoResults = styled.p`
    text-align: center
    font-family: ${(props) => props.theme.fonts.primary};
    font-style: normal;
    font-size: 12px;
    padding: 0 15px;
    color: ${(props) => props.theme.colors.primary};
`

const NoResultsBox = styled.div`
    text-align: center
    font-family: 'Inter',
    font-style: normal;
    font-size: 12px;
    padding: 15px 10px;
    color: ${(props) => props.theme.colors.normalText};
    display:flex;
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
    grid-gap: 30px;
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
    background: ${(props) => props.theme.colors.backgroundHighlight}80;
    border-radius: 100px;
    height: 32px;
    width: 32px;
    display: flex;
    justify-content: center;
    align-items: center;
`

const InfoText = styled.div<{ small: boolean }>`
    color: ${(props) =>
        props.small
            ? props.theme.colors.normalText
            : props.theme.colors.lighterText};
    font-size: ${(props) => (props.small ? '12px' : '14px')};
    text-align: center;
    margin-top: ${(props) => props.small && '-25px'};
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
                            color="purple"
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
                onClick={() => this.props.onClick(template.id)}
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
                    <InfoText>Copying Content</InfoText>
                    <InfoText small>Don't close this modal</InfoText>
                </Center>
            )
        }

        return (
            <>
                <Header>
                    <Icon
                        filePath={icons.helpIcon}
                        heightAndWidth="16px"
                        onClick={() =>
                            window.open(
                                'https://links.memex.garden/tutorials/text-exporter',
                            )
                        }
                    />
                    <SectionTitle>Copy/Paste Templates</SectionTitle>
                    <Icon
                        filePath={icons.plus}
                        color="purple"
                        heightAndWidth="16px"
                        onClick={this.props.onClickNew}
                    />
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

import React, { PureComponent } from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import styled from 'styled-components'
import { Template } from '../types'
import TemplateRow from './TemplateRow'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 15px 10px 15px;
`

const HeaderText = styled.div`
    font-family: Poppins;
    font-style: normal;
    font-weight: bold;
    font-size: 14px;
    color: #3a2f45;
`

const CreateNewButton = styled.button`
    font-family: Poppins;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    color: #3a2f45;
    cursor: pointer;
    padding: 0px;

    outline: none;
    border: none;
    background: transparent;
`

const NoResults = styled.p`
    text-align: center
    font-family: Poppins;
    font-style: normal;
    font-size: 12px;
    padding: 0 15px;
    color: #3a2f45;
`

const NoResultsBox = styled.p`
    text-align: center
    font-family: Poppins;
    font-style: normal;
    font-size: 12px;
    padding: 0 15px;
    color: #3a2f45;
    display:flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
`

const Center = styled.div`
    display: flex;
    justify-content: center;
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
                    <NoResults>
                        Create custom templates to copy/paste content into your
                        workflow
                    </NoResults>
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
                    <LoadingIndicator />
                </Center>
            )
        }

        return (
            <div>
                <Header>
                    <HeaderText>Copy/Paste Templates</HeaderText>
                    <CreateNewButton onClick={this.props.onClickNew}>
                        + New
                    </CreateNewButton>
                </Header>

                <InternalTemplateList
                    templates={this.props.templates}
                    onClick={this.props.onClick}
                    onClickSetIsFavourite={this.props.onClickSetIsFavourite}
                    onClickEdit={this.props.onClickEdit}
                    onClickHowto={this.props.onClickHowto}
                />
            </div>
        )
    }
}

import React, { PureComponent } from 'react'
import { LoadingIndicator } from 'src/common-ui/components'
import styled from 'styled-components'
import { Template } from '../types'
import TemplateRow from './TemplateRow'

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`

const HeaderText = styled.h2`
    font-family: Poppins;
    font-style: normal;
    font-weight: bold;
    font-size: 16px;
    color: #3a2f45;
`

const CreateNewButton = styled.button`
    font-family: Poppins;
    font-style: normal;
    font-weight: normal;
    font-size: 16px;
    color: #3a2f45;
    cursor: pointer;

    outline: none;
    border: none;
    background: transparent;
`

const NoResults = styled.p`
    text-align: center
    font-family: Poppins;
    font-style: normal;
`

const Center = styled.div`
    display: flex;
    justify-content: center;
`

interface InternalTemplateListProps {
    templates: Template[]

    onClickSetIsFavourite: (id: string, isFavourite: boolean) => void
    onClickEdit: (id: string) => void
    onClick: (id: string) => void
}

class InternalTemplateList extends PureComponent<InternalTemplateListProps> {
    render() {
        const { templates } = this.props

        if (templates.length === 0) {
            return <NoResults>no templates yet, create one!</NoResults>
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

    onClickSetIsFavourite: (id: string, isFavourite: boolean) => void
    onClickEdit: (id: string) => void
    onClick: (id: string) => void
    onClickNew: () => void
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
                    <HeaderText>Templates</HeaderText>
                    <CreateNewButton onClick={this.props.onClickNew}>
                        + Create New
                    </CreateNewButton>
                </Header>

                <InternalTemplateList
                    templates={this.props.templates}
                    onClick={this.props.onClick}
                    onClickSetIsFavourite={this.props.onClickSetIsFavourite}
                    onClickEdit={this.props.onClickEdit}
                />
            </div>
        )
    }
}

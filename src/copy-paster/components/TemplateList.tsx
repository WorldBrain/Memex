import React, { PureComponent } from 'react'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import styled from 'styled-components'
import { Template } from '../types'
import ReactDOM from 'react-dom'

import TemplateRow from './TemplateRow'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 15px 0px 27px;
    height: 30px;
    align-items: center;
`

const DraggableItem = styled(Draggable)`
    color: ${(props) => props.theme.colors.greyScale7};
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

const Title = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    font-weight: 600;
`

const ContentBlock = styled.div`
    padding: 5px 10px 10px 10px;
    max-height: 300px;
    overflow: scroll;
    display: flex;
    flex-direction: column;

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
    focusIndex: number

    onClickEdit: (id: number) => void
    onClickCopy: (id: number) => void
    onClickHowto: () => void
    getRootElement: () => HTMLElement
    onReorderSave: (id: number, order: number) => void
}

// Helper function to reorder the result
const reorder = (
    list: Template[],
    startIndex: number,
    endIndex: number,
): Template[] => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)

    return result
}

interface Template {
    id: number
    order: number
    // include other properties of Template as needed
}

const getStyle = (isDragging) => ({
    // Example: change opacity and add a border if dragging
    opacity: isDragging ? 0.8 : 1,
    border: isDragging ? '2px dashed #000' : 'none',
})

export const orderGap = 1000000000000

class InternalTemplateList extends PureComponent<InternalTemplateListProps> {
    onDragEnd = (result) => {
        if (!result.destination) {
            return
        }

        const { source, destination } = result
        if (source.index === destination.index) {
            // No change in position
            return
        }

        const { templates } = this.props

        // Ensure all templates have an initial order if missing
        const initializedTemplates = templates.map((template, index) => ({
            ...template,
            order: template.order ?? orderGap * (index + 1),
        }))

        const reorderedTemplates = reorder(
            initializedTemplates,
            source.index,
            destination.index,
        )

        let newOrder

        if (destination.index === 0) {
            // Moved to the start
            newOrder = reorderedTemplates[1].order / 2
        } else if (destination.index === reorderedTemplates.length - 1) {
            // Moved to the end
            newOrder =
                reorderedTemplates[reorderedTemplates.length - 2].order +
                orderGap
        } else {
            // Moved to a middle position, calculate the average of the orders of the items before and after
            const beforeOrder = reorderedTemplates[destination.index - 1].order
            const afterOrder = reorderedTemplates[destination.index + 1].order
            newOrder = (beforeOrder + afterOrder) / 2
        }

        // Check if there is no space to reorder and recompute orders if needed
        if (
            newOrder === reorderedTemplates[destination.index - 1]?.order ||
            newOrder === reorderedTemplates[destination.index + 1]?.order
        ) {
            reorderedTemplates.forEach((template, index) => {
                // Recompute orders based on their position in the list
                const recalculatedOrder = orderGap * (index + 1)
                if (template.order !== recalculatedOrder) {
                    this.props.onReorderSave(template.id, recalculatedOrder)
                }
            })
        } else {
            // Update the order of the moved item if there's enough space

            const movedTemplate = reorderedTemplates[destination.index]
            if (movedTemplate.order !== newOrder) {
                this.props.onReorderSave(movedTemplate.id, newOrder)
            }
        }
    }

    render() {
        const { templates } = this.props

        const sortedTemplates = templates?.sort((a, b) => a.order - b.order)

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
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
                <Droppable droppableId="droppableTemplates">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {sortedTemplates.map((template, index) => (
                                <Draggable
                                    key={template.id}
                                    draggableId={String(template.id)}
                                    index={index}
                                >
                                    {(provided, snapshot) => {
                                        // Use a portal for the dragging item
                                        const draggableContent = (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                style={{
                                                    ...provided.draggableProps
                                                        .style,
                                                    zIndex: 30000000000000,
                                                    // Additional styles if needed
                                                }}
                                            >
                                                <TemplateRow
                                                    template={template}
                                                    onClick={() => {
                                                        this.props.onClickCopy(
                                                            template.id,
                                                        )
                                                    }}
                                                    isDefault={index === 0}
                                                    onClickEdit={() =>
                                                        this.props.onClickEdit(
                                                            template.id,
                                                        )
                                                    }
                                                    inFocus={
                                                        this.props
                                                            .focusIndex ===
                                                        index
                                                    }
                                                />
                                            </div>
                                        )

                                        const portalRoot =
                                            this.props.getRootElement?.() ??
                                            document.querySelector('body')

                                        if (snapshot.isDragging) {
                                            return ReactDOM.createPortal(
                                                draggableContent,
                                                portalRoot,
                                            )
                                        }

                                        return draggableContent
                                    }}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        )
    }
}

interface TemplateListProps {
    isLoading?: boolean
    copySuccess?: boolean
    templates: Template[]
    focusIndex: number

    onClickEdit: (id: number) => void
    onClickCopy: (id: number) => void
    onClickNew: () => void
    onClickHowto: () => void
    getRootElement: () => HTMLElement
    onReorderSave: (id: number, order: number) => void
}

export default class TemplateList extends PureComponent<TemplateListProps> {
    render() {
        if (this.props.copySuccess) {
            return (
                <Center>
                    <Icon
                        filePath="checkRound"
                        heightAndWidth="30px"
                        hoverOff
                    />
                    <Title>Copied to Clipboard</Title>
                </Center>
            )
        }

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
                        onClickCopy={this.props.onClickCopy}
                        onClickEdit={this.props.onClickEdit}
                        onClickHowto={this.props.onClickHowto}
                        getRootElement={this.props.getRootElement}
                        onReorderSave={this.props.onReorderSave}
                        focusIndex={this.props.focusIndex}
                    />
                </ContentBlock>
            </>
        )
    }
}

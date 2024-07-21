import React, { PureComponent } from 'react'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import styled from 'styled-components'
import type { Template } from '../types'
import ReactDOM from 'react-dom'
import TemplateRow from './TemplateRow'
import { LesserLink } from 'src/common-ui/components/design-library/actions/LesserLink'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import {
    DragDropContext,
    Droppable,
    Draggable,
    OnDragEndResponder,
} from 'react-beautiful-dnd'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0px 15px 0px 15px;
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

const Title = styled.div`
    display: flex;
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    font-weight: 600;
`

const ContentBlock = styled.div`
    padding: 5px 10px 10px 10px;
    max-height: 300px;
    max-width: 340px;
    overflow-y: scroll;
    display: flex;
    flex-direction: column;

    ::-webkit-scrollbar {
        background: transparent;
        width: 8px;
    }

    /* Track */
    ::-webkit-scrollbar-track {
        background: transparent;
        margin: 2px 0px 2px 0px;
        width: 8px;
        padding: 1px;
    }

    /* Handle */
    ::-webkit-scrollbar-thumb {
        background: ${(props) => props.theme.colors.greyScale2};
        border-radius: 10px;
        width: 4px;
    }

    /* Handle on hover */
    ::-webkit-scrollbar-thumb:hover {
        background: ${(props) => props.theme.colors.greyScale3};
        cursor: pointer;
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

const InfoText = styled.div<{ margin?: string }>`
    color: ${(props) => props.theme.colors.greyScale5};
    font-size: 14px;
    font-weight: 300;
    text-align: center;
    margin: ${(props) => props.margin};
`
const InfoTextTitle = styled.div`
    color: ${(props) => props.theme.colors.white};
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    margin-top: 20px;
`

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
    onReorder: (id: number, oldIndex: number, newIndex: number) => void
    focusOnElement: (index: number) => void
    copyExistingRenderedToClipboard: (
        renderedText: string,
        templateId: number,
    ) => Promise<void>
    errorCopyToClipboard: boolean
    renderedTextBuffered: string
}

export default class TemplateList extends PureComponent<TemplateListProps> {
    private onDragEnd: OnDragEndResponder = (result) => {
        if (
            !result.destination ||
            result.source.index === result.destination.index
        ) {
            return
        }

        this.props.onReorder(
            Number(result.draggableId),
            result.source.index,
            result.destination.index,
        )
    }

    componentDidMount(): void {
        this.handleKeyDown = this.handleKeyDown.bind(this)
        window.addEventListener('keydown', this.handleKeyDown)
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.handleKeyDown)
    }

    handleKeyDown(event: KeyboardEvent): void {
        // event has already been used for drag and drop
        if (event.defaultPrevented) {
            return
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault()
            event.stopPropagation()
        }
        if (event.key === 'Enter') {
            event.stopPropagation()
            event.stopImmediatePropagation()
            event.preventDefault()
            const currentTemplate = this.props.templates[this.props.focusIndex]

            if (event.shiftKey) {
                this.props.onClickEdit(currentTemplate.id)
            } else {
                this.props.onClickCopy(currentTemplate.id)
            }
        }
    }
    render() {
        if (this.props.errorCopyToClipboard) {
            return (
                <ContentBlock>
                    <Center>
                        <Icon
                            filePath="warning"
                            heightAndWidth="30px"
                            hoverOff
                        />
                        <Title>Template Processed, but...</Title>
                        <InfoText margin={'0 0 10px 0'}>
                            Window was out of focus so the text was generated
                            but the copy process didn't happen. <br />
                            Click this button to copy it to clipboard.
                        </InfoText>
                        <PrimaryAction
                            icon={'copy'}
                            label={'Copy to Clipboard'}
                            onClick={(event) => {
                                event.stopPropagation()
                                this.props.copyExistingRenderedToClipboard(
                                    this.props.renderedTextBuffered,
                                    this.props.templates[this.props.focusIndex]
                                        .id,
                                )
                            }}
                            type="secondary"
                            size="medium"
                        />
                    </Center>
                </ContentBlock>
            )
        }
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
                    <InfoText>Don't close this modal</InfoText>
                </Center>
            )
        }

        return (
            <>
                <Header>
                    <SectionTitle>Templates</SectionTitle>
                    <ButtonBox>
                        <TutorialBox
                            getRootElement={this.props.getRootElement}
                            tutorialId={'useTemplates'}
                        />
                        {/* <Icon
                            filePath={icons.helpIcon}
                            heightAndWidth="18px"
                            padding={'5px'}
                            onClick={() =>
                                window.open(
                                    'https://links.memex.garden/tutorials/text-exporter',
                                )
                            }
                        /> */}

                        <PrimaryAction
                            label={'New'}
                            onClick={this.props.onClickNew}
                            size="small"
                            type="forth"
                            icon={'plus'}
                            iconColor="prime1"
                            padding={'0px 6px 0 0'}
                        />
                    </ButtonBox>
                </Header>
                <ContentBlock>
                    {!this.props.templates.length ? (
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
                                Create custom templates to copy/paste content
                                into your workflow
                            </InfoText>
                            <LesserLink
                                label={'Learn More >'}
                                onClick={this.props.onClickHowto}
                            />
                        </NoResultsBox>
                    ) : (
                        <DragDropContext onDragEnd={this.onDragEnd}>
                            <Droppable droppableId="droppableTemplates">
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                    >
                                        {this.props.templates.map(
                                            (template, index) => (
                                                <Draggable
                                                    key={template.id}
                                                    draggableId={String(
                                                        template.id,
                                                    )}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => {
                                                        // Use a portal for the dragging item
                                                        const draggableContent = (
                                                            <div
                                                                ref={
                                                                    provided.innerRef
                                                                }
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                style={{
                                                                    ...provided
                                                                        .draggableProps
                                                                        .style,
                                                                    zIndex: 30000000000000,
                                                                    // Additional styles if needed
                                                                }}
                                                            >
                                                                <TemplateRow
                                                                    templateTitle={
                                                                        template.title
                                                                    }
                                                                    onClick={() => {
                                                                        this.props.onClickCopy(
                                                                            template.id,
                                                                        )
                                                                    }}
                                                                    isDefault={
                                                                        index ===
                                                                        0
                                                                    }
                                                                    onClickEdit={() =>
                                                                        this.props.onClickEdit(
                                                                            template.id,
                                                                        )
                                                                    }
                                                                    inFocus={
                                                                        this
                                                                            .props
                                                                            .focusIndex ===
                                                                        index
                                                                    }
                                                                    focusOnElement={
                                                                        this
                                                                            .props
                                                                            .focusOnElement
                                                                    }
                                                                    itemIndex={
                                                                        index
                                                                    }
                                                                />
                                                            </div>
                                                        )

                                                        const portalRoot =
                                                            this.props.getRootElement?.() ??
                                                            document.querySelector(
                                                                'body',
                                                            )

                                                        if (
                                                            snapshot.isDragging
                                                        ) {
                                                            return ReactDOM.createPortal(
                                                                draggableContent,
                                                                portalRoot,
                                                            )
                                                        }

                                                        return draggableContent
                                                    }}
                                                </Draggable>
                                            ),
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}
                </ContentBlock>
            </>
        )
    }
}

import React from 'react'
import Logic from './logic'
import {
    PromptTemplatesEvent,
    PromptTemplatesDependencies,
    PromptTemplatesState,
} from './types'
import { UIElement } from 'ui-logic-react'
import {
    DragDropContext,
    Draggable,
    Droppable,
    OnDragEndResponder,
} from 'react-beautiful-dnd'
import { PrimaryAction } from '../../../../external/@worldbrain/memex-common/ts/common-ui/components/PrimaryAction'
import TutorialBox from '../../../../external/@worldbrain/memex-common/ts/common-ui/components/tutorial-box'
import styled, { css } from 'styled-components'
import Icon from '../../../../external/@worldbrain/memex-common/ts/common-ui/components/icon'
import ReactDOM from 'react-dom'
import TextArea from '@worldbrain/memex-common/lib/common-ui/components/text-area'
import { getKeyName } from '@worldbrain/memex-common/lib/utils/os-specific-key-names'

export default class PromptTemplatesComponent extends UIElement<
    PromptTemplatesDependencies,
    PromptTemplatesState,
    PromptTemplatesEvent
> {
    constructor(props: PromptTemplatesDependencies) {
        super(props, { logic: new Logic(props) })
    }
    static MOD_KEY = getKeyName({ key: 'mod' })

    private onDragEnd: OnDragEndResponder = (result) => {
        if (
            !result.destination ||
            result.source.index === result.destination.index
        ) {
            return
        }

        this.processEvent('reorderTemplates', {
            oldIndex: result.source.index,
            newIndex: result.destination.index,
        })

        // this.props.onReorder(
        //     Number(result.draggableId),
        //     result.source.index,
        //     result.destination.index,
        // )
    }

    async componentDidMount(): Promise<void> {
        this.handleKeyDown = this.handleKeyDown.bind(this)
        window.addEventListener('keydown', this.handleKeyDown)
        await super.componentDidMount()
    }

    async componentWillUnmount(): Promise<void> {
        window.removeEventListener('keydown', this.handleKeyDown)
    }

    handleKeyDown(event: KeyboardEvent): void {
        // event has already been used for drag and drop
        const itemIndexInFocus = this.state.promptTemplatesArray.findIndex(
            (template) => template.isFocused,
        )
        if (event.defaultPrevented) {
            return
        }

        if (event.key === 'ArrowUp') {
            this.processEvent('focusTemplate', { id: itemIndexInFocus - 1 })
            event.preventDefault()
            event.stopPropagation()
        } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            event.stopPropagation()
            this.processEvent('focusTemplate', { id: itemIndexInFocus + 1 })
        }
        if (event.key === 'Enter') {
            event.stopPropagation()
            event.stopImmediatePropagation()
            event.preventDefault()

            if (event.shiftKey) {
                this.processEvent('selectTemplate', { id: itemIndexInFocus })
            } else {
                this.processEvent('selectTemplate', { id: itemIndexInFocus })
            }
        }
    }
    render() {
        return (
            <>
                <Header>
                    <SectionTitle>Prompt Templates</SectionTitle>
                    <ButtonBox>
                        <TutorialBox
                            getRootElement={this.props.getRootElement}
                            tutorialId={'useTemplates'}
                        />
                        <PrimaryAction
                            label={'New'}
                            onClick={() =>
                                this.processEvent('startNewTemplate', null)
                            }
                            size="small"
                            type="forth"
                            icon={'plus'}
                            iconColor="prime1"
                            padding={'0px 6px 0 0'}
                        />
                    </ButtonBox>
                </Header>
                <ContentBlock>
                    <DragDropContext onDragEnd={this.onDragEnd}>
                        <Droppable droppableId="droppableTemplates">
                            {(provided) => (
                                <div
                                    {...provided.droppableProps}
                                    ref={provided.innerRef}
                                    style={{
                                        gridGap: '3px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        // Additional styles if needed
                                    }}
                                >
                                    {this.state.promptTemplatesArray.map(
                                        (template, index) => (
                                            <Draggable
                                                key={index}
                                                draggableId={String(index)}
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
                                                            {this.state
                                                                .promptTemplatesArray[
                                                                index
                                                            ].isEditing ==
                                                            null ? (
                                                                <RowContainer
                                                                    inFocus={
                                                                        this
                                                                            .state
                                                                            .promptTemplatesArray[
                                                                            index
                                                                        ]
                                                                            .isFocused
                                                                    }
                                                                    onMouseOver={() => {
                                                                        this.processEvent(
                                                                            'focusTemplate',
                                                                            {
                                                                                id: index,
                                                                            },
                                                                        )
                                                                    }}
                                                                    onMouseLeave={() => {
                                                                        this.processEvent(
                                                                            'focusTemplate',
                                                                            {
                                                                                id: null,
                                                                            },
                                                                        )
                                                                    }}
                                                                    onClick={() =>
                                                                        this.processEvent(
                                                                            'selectTemplate',
                                                                            {
                                                                                id: index,
                                                                            },
                                                                        )
                                                                    }
                                                                    allowFitContent={
                                                                        !!this
                                                                            .state
                                                                            .promptTemplatesArray[
                                                                            index
                                                                        ]
                                                                            .isEditing
                                                                    }
                                                                >
                                                                    <DragIconContainer>
                                                                        <Icon
                                                                            icon={
                                                                                'dragList'
                                                                            }
                                                                            rotation={
                                                                                180
                                                                            }
                                                                            heightAndWidth="16px"
                                                                            hoverOff
                                                                        />
                                                                    </DragIconContainer>
                                                                    <TitleBox>
                                                                        <TemplateRowTitle>
                                                                            {
                                                                                this
                                                                                    .state
                                                                                    .promptTemplatesArray[
                                                                                    index
                                                                                ]
                                                                                    .text
                                                                            }
                                                                        </TemplateRowTitle>
                                                                    </TitleBox>
                                                                    {!this.state
                                                                        .promptTemplatesArray[
                                                                        index
                                                                    ]
                                                                        .isEditing && (
                                                                        <ActionsContainer
                                                                            onClick={(
                                                                                event,
                                                                            ) => {
                                                                                event.stopPropagation()
                                                                            }}
                                                                        >
                                                                            <Icon
                                                                                filePath={
                                                                                    'removeX'
                                                                                }
                                                                                heightAndWidth="20px"
                                                                                padding="4px"
                                                                                onClick={(
                                                                                    event,
                                                                                ) => {
                                                                                    event.stopPropagation()
                                                                                    this.processEvent(
                                                                                        'deleteTemplate',
                                                                                        {
                                                                                            id: index,
                                                                                        },
                                                                                    )
                                                                                }}
                                                                            />
                                                                            <Icon
                                                                                filePath={
                                                                                    'edit'
                                                                                }
                                                                                heightAndWidth="20px"
                                                                                padding="4px"
                                                                                onClick={(
                                                                                    event,
                                                                                ) => {
                                                                                    event.stopPropagation()
                                                                                    this.processEvent(
                                                                                        'setTemplateEdit',
                                                                                        {
                                                                                            id: index,
                                                                                            value: this
                                                                                                .state
                                                                                                .promptTemplatesArray[
                                                                                                index
                                                                                            ]
                                                                                                .text,
                                                                                        },
                                                                                    )
                                                                                }}
                                                                            />
                                                                        </ActionsContainer>
                                                                    )}
                                                                </RowContainer>
                                                            ) : (
                                                                <TextAreaContainer>
                                                                    <TextArea
                                                                        autoFocus
                                                                        value={
                                                                            this
                                                                                .state
                                                                                .promptTemplatesArray[
                                                                                index
                                                                            ]
                                                                                .isEditing
                                                                        }
                                                                        placeholder={
                                                                            'Type a new prompt'
                                                                        }
                                                                        background="greyScale3"
                                                                        onChange={(
                                                                            event,
                                                                        ) => {
                                                                            event.stopPropagation()
                                                                            this.processEvent(
                                                                                'setTemplateEdit',
                                                                                {
                                                                                    id: index,
                                                                                    value: (event.target as HTMLTextAreaElement)
                                                                                        .value,
                                                                                },
                                                                            )
                                                                        }}
                                                                        onKeyUp={(
                                                                            event,
                                                                        ) => {
                                                                            event.stopPropagation()
                                                                        }}
                                                                        onKeyDown={(
                                                                            event,
                                                                        ) => {
                                                                            event.stopPropagation()
                                                                            if (
                                                                                event.key ===
                                                                                    'Enter' &&
                                                                                event.metaKey
                                                                            ) {
                                                                                if (
                                                                                    (event.target as HTMLTextAreaElement)
                                                                                        .value
                                                                                        .length >
                                                                                    0
                                                                                ) {
                                                                                    event.stopPropagation()
                                                                                    this.processEvent(
                                                                                        'saveEditTemplate',
                                                                                        {
                                                                                            id: index,
                                                                                            text: (event.target as HTMLTextAreaElement)
                                                                                                .value,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            } else if (
                                                                                event.key ===
                                                                                'Enter'
                                                                            ) {
                                                                                // Allow Enter to function normally for new lines
                                                                            } else {
                                                                                // Handle other keys if needed
                                                                            }
                                                                        }}
                                                                    />
                                                                    <TextAreaSaveButton>
                                                                        <PrimaryAction
                                                                            label={
                                                                                PromptTemplatesComponent.MOD_KEY +
                                                                                '+ Enter'
                                                                            }
                                                                            size="small"
                                                                            type="tertiary"
                                                                            fontColor="greyScale5"
                                                                            fontSize="12px"
                                                                            padding="2px 4px;"
                                                                            onClick={() => {
                                                                                let content = this
                                                                                    .state
                                                                                    .promptTemplatesArray[
                                                                                    index
                                                                                ]
                                                                                    .isEditing

                                                                                if (
                                                                                    content !=
                                                                                    null
                                                                                ) {
                                                                                    this.processEvent(
                                                                                        'saveEditTemplate',
                                                                                        {
                                                                                            id: index,
                                                                                            text: content,
                                                                                        },
                                                                                    )
                                                                                }
                                                                            }}
                                                                        />
                                                                    </TextAreaSaveButton>
                                                                </TextAreaContainer>
                                                            )}
                                                        </div>
                                                    )

                                                    const portalRoot =
                                                        this.props.getRootElement?.() ??
                                                        document.querySelector(
                                                            'body',
                                                        )

                                                    if (snapshot.isDragging) {
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
                </ContentBlock>
            </>
        )
    }
}

const TextAreaContainer = styled.div`
    position: relative;
    margin-top: 3px;
`
const TextAreaSaveButton = styled.div`
    position: absolute;
    bottom: 5px;
    right: 5px;
`

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 15px 0px 15px;
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
    color: ${(props) => props.theme.colors.white};
    font-size: 14px;
    font-weight: 600;
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
    padding: 0 5px 5px 5px;
    overflow: scroll;
    width: 100%;
    box-sizing: border-box;
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

const TitleBox = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
    grid-gap: 3px;
    width: fill-available;
    width: -moz-available;
`

const DefaultLabel = styled.div`
    font-size: 10px;
    font-weight: 500;
    color: ${(props) => props.theme.colors.greyScale5};
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 2px 5px;
    border-radius: 5px;
    background-color: ${(props) => props.theme.colors.greyScale2};
    text-align: center;
    align-self: flex-start;
    justify-self: flex-start;
    display: inline-block;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-right: 10px;
    width: fit-content;
`

const DragIconContainer = styled.div`
    position: absolute;
    left: -15px;
    display: flex;
    align-items: center;
    justify-content: center;
    display: none;

    &:hover {
        cursor: grab;
    }
    &:hover * {
        cursor: grab;
    }
`

const ActionsContainer = styled.div`
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;
    grid-gap: 5px;
    display: none;
    position: absolute;
    background-color: ${(props) => props.theme.colors.greyScale2}90;
    backdrop-filter: blur(4px);
    right: 0px;
    height: 40px;
    padding: 0 10px;
    border-radius: 0 6px 6px 0;
`

const Row = styled.div<{
    inFocus?: boolean
}>`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    height: 40px;
    position: relative;
    border-radius: 5px;
    padding: 0px 0px 0 18px;
    // border-bottom: 1px solid ${(props) => props.theme.colors.lightgrey};

    &:last-child {
        border-bottom: none;
    }

    &:hover {
        ${ActionsContainer} { // if DeleteButtonContainer is not under an hovered ContainerSection
            display: flex;
        }
    }

    &:hover ${DragIconContainer} {
        display: flex;
    }

    ${(props) =>
        props.inFocus &&
        css`
            outline: 1px solid ${(props) => props.theme.colors.greyScale3};
        `}


`

const TemplateRowTitle = styled.div<{
    fullWidth?: boolean
    isDefault?: boolean
}>`
    display: ${(props) => (props.fullWidth ? 'flex' : 'block')};
    justify-content: center;
    cursor: pointer;
    text-align: left;

    font-family: 'Satoshi', sans-serif;
    font-feature-settings: 'pnum' on, 'lnum' on, 'case' on, 'ss03' on, 'ss04' on,
        'liga' off;
    font-style: normal;
    font-weight: normal;
    font-size: 14px;
    width: 90%;
    color: ${(props) => props.theme.colors.greyScale6};

    outline: none;
    border: none;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;

    ${(props) =>
        props.isDefault &&
        css`
            max-width: 230px;
        `}
`

const RowContainer = styled.div<{
    inFocus?: boolean
    allowFitContent?: boolean
}>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 40px;
    border-radius: 8px;
    padding: 0 0 0 10px;
    box-sizing: border-box;

    ${(props) =>
        props.inFocus &&
        css`
            ${ActionsContainer} {
                // if DeleteButtonContainer is not under an hovered ContainerSection
                display: flex;
            }
            ${DragIconContainer} {
                display: flex;
            }

            background: ${(props) => props.theme.colors.greyScale2};
        `};
    ${(props) =>
        props.allowFitContent &&
        css`
            height: fit-content;
        `};

    &:hover {
        cursor: pointer;
    }
`

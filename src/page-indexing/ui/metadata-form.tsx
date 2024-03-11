import React from 'react'
import type { PageIndexingInterface } from '../background/types'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'
import type {
    PageEntity,
    PageMetadata,
} from '@worldbrain/memex-common/lib/types/core-data-types/client'
import styled from 'styled-components'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import {
    DragDropContext,
    Draggable,
    Droppable,
    OnDragEndResponder,
} from 'react-beautiful-dnd'
import ReactDOM from 'react-dom'

export interface Props {
    pageIndexingBG: PageIndexingInterface<'caller'>
    normalizedPageUrl: string
    fullPageUrl: string
    onCancel: () => void
    onSave: () => void
    getRootElement?: () => HTMLElement
}

export interface State
    extends Required<Omit<PageMetadata, 'normalizedPageUrl'>> {
    entities: Omit<PageEntity, 'normalizedPageUrl'>[]
    loadState: UITaskState
    submitState: UITaskState
    contentType: 'web' | 'pdf'
    formChanged: boolean
    autoFillChanged: boolean
}

export class PageMetadataForm extends React.PureComponent<Props, State> {
    state: State = {
        doi: '',
        title: '',
        annotation: '',
        sourceName: '',
        journalName: '',
        journalPage: '',
        journalIssue: '',
        journalVolume: '',
        releaseDate: Date.now(),
        accessDate: Date.now(),
        entities: [],
        loadState: 'pristine',
        submitState: 'pristine',
        contentType: 'web',
        formChanged: false,
        autoFillChanged: false,
    }

    async componentDidMount() {
        const isPagePDF =
            (this.props.fullPageUrl &&
                this.props.fullPageUrl.includes('memex.cloud')) ||
            window.location.href.includes('/pdfjs/viewer.html?')

        console.log('isPagePDF', isPagePDF, this.props.fullPageUrl)

        this.setState({
            loadState: 'running',
            contentType: isPagePDF ? 'pdf' : 'web',
        })

        let initAccessDate = Date.now() // TODO: Replace this with a call to get the oldest visit/bookmark for this page
        const metadata = (await this.props.pageIndexingBG.getPageMetadata({
            normalizedPageUrl: this.props.normalizedPageUrl,
        })) ?? { entities: [], accessDate: initAccessDate }

        this.setState((previousState) => ({
            doi: metadata.doi ?? previousState.doi,
            // TODO: Fill in
            accessDate: metadata.accessDate,
            entities: metadata.entities,
            loadState: 'success',
        }))
    }

    private handleSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault()
        this.setState({ submitState: 'running', formChanged: false })

        await this.props.pageIndexingBG.updatePageMetadata({
            normalizedPageUrl: this.props.normalizedPageUrl,
            entities: this.state.entities,
            title: this.state.title,
            doi: this.state.doi,
            annotation: this.state.annotation,
            // TODO: Fill in
            sourceName: '',
            journalName: '',
            journalPage: '',
            journalIssue: '',
            journalVolume: '',
            releaseDate: 0,
            accessDate: 0,
        })
        this.setState({ submitState: 'success' })
        this.props.onSave()
    }

    private handleTextInputChange = (
        stateKey: string,
    ): React.ChangeEventHandler<HTMLInputElement> => (e) => {
        e.stopPropagation()
        this.setState({ [stateKey]: e.target.value, formChanged: true } as any)

        if (stateKey === 'doi') {
            this.setState({ autoFillChanged: true })
        }
    }

    handleAutoFill = async () => {
        this.setState({ autoFillChanged: false })
    }
    handleAddMoreEntities = async () => {}

    private onDragEnd: OnDragEndResponder = (result) => {
        if (
            !result.destination ||
            result.source.index === result.destination.index
        ) {
            return
        }
    }

    render() {
        return (
            <FormContainer>
                <FormSection>
                    {this.state.contentType === 'pdf' && (
                        <FormSectionItem>
                            <FormFieldTitle>DOI</FormFieldTitle>
                            <TextField
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                                value={this.state.doi}
                                onChange={this.handleTextInputChange('doi')}
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                            />
                            {this.state.autoFillChanged && (
                                <PrimaryAction
                                    type="glass"
                                    label="Autofill"
                                    size="small"
                                    icon="stars"
                                    padding="2px 5px"
                                    width="100%"
                                    onClick={this.handleAutoFill}
                                    fontColor="greyScale6"
                                />
                            )}
                        </FormSectionItem>
                    )}
                    <FormSectionItem>
                        <FormFieldTitle>Title</FormFieldTitle>
                        <TextField
                            onKeyDown={(e) => {
                                e.stopPropagation()
                            }}
                            value={this.state.title}
                            onChange={this.handleTextInputChange('title')}
                        />
                    </FormSectionItem>
                    <FormSectionItem>
                        <FormFieldTitle>URL</FormFieldTitle>
                        <TextField
                            onKeyDown={(e) => {
                                e.stopPropagation()
                            }}
                            value={this.props.fullPageUrl}
                            disabled
                        />
                    </FormSectionItem>
                    <FormSectionItem>
                        <FormFieldTitle>First access date</FormFieldTitle>
                        <TextField
                            onKeyDown={(e) => {
                                e.stopPropagation()
                            }}
                            value={this.state.accessDate}
                            onChange={this.handleTextInputChange('accessDate')}
                        />
                    </FormSectionItem>
                    <FormSectionItem>
                        <FormFieldTitle>Authors</FormFieldTitle>
                        <EntitiesContainer>
                            <DragDropContext onDragEnd={this.onDragEnd}>
                                <Droppable droppableId="droppableTemplates">
                                    {(provided) => (
                                        <div
                                            {...provided.droppableProps}
                                            ref={provided.innerRef}
                                        >
                                            {this.state.entities.map(
                                                (template, index) => (
                                                    <Draggable
                                                        key={template.id}
                                                        draggableId={String(
                                                            template.id,
                                                        )}
                                                        index={index}
                                                    >
                                                        {(
                                                            provided,
                                                            snapshot,
                                                        ) => {
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
                                                                    <EntitiesItem>
                                                                        <TextField
                                                                            onKeyDown={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation()
                                                                            }}
                                                                            placeholder="First Name"
                                                                        />
                                                                        <TextField
                                                                            onKeyDown={(
                                                                                e,
                                                                            ) => {
                                                                                e.stopPropagation()
                                                                            }}
                                                                            placeholder="Last Name"
                                                                        />
                                                                    </EntitiesItem>
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
                            <EntitiesItem>
                                <TextField
                                    onKeyDown={(e) => {
                                        e.stopPropagation()
                                    }}
                                    placeholder="First Name"
                                />
                                <TextField
                                    onKeyDown={(e) => {
                                        e.stopPropagation()
                                    }}
                                    placeholder="Last Name"
                                />
                            </EntitiesItem>
                            <PrimaryAction
                                label="Add More"
                                size="small"
                                icon="plus"
                                type="glass"
                                fullWidth
                                iconColor="prime1"
                                onClick={this.handleAddMoreEntities}
                                fontColor="greyScale6"
                            />
                        </EntitiesContainer>
                    </FormSectionItem>
                </FormSection>
                {this.state.contentType === 'pdf' && (
                    <FormSection>
                        <FormSectionItem>
                            <FormFieldTitle>Journal Name</FormFieldTitle>
                            <TextField
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                                value={this.state.journalName}
                                onChange={this.handleTextInputChange(
                                    'journalName',
                                )}
                            />
                        </FormSectionItem>
                        <FormSectionItem>
                            <FormFieldTitle>Volume</FormFieldTitle>
                            <TextField
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                                value={this.state.journalVolume}
                                onChange={this.handleTextInputChange(
                                    'journalVolume',
                                )}
                            />
                        </FormSectionItem>
                        <FormSectionItem>
                            <FormFieldTitle>Issue</FormFieldTitle>
                            <TextField
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                                value={this.state.journalIssue}
                                onChange={this.handleTextInputChange(
                                    'journalIssue',
                                )}
                            />
                        </FormSectionItem>
                        <FormSectionItem>
                            <FormFieldTitle>Release Date</FormFieldTitle>
                            <TextField
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                                value={this.state.releaseDate}
                                onChange={this.handleTextInputChange(
                                    'releaseDate',
                                )}
                            />
                        </FormSectionItem>
                        <FormSectionItem>
                            <FormFieldTitle>Page Number</FormFieldTitle>
                            <TextField
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                                value={this.state.journalPage}
                                onChange={this.handleTextInputChange(
                                    'journalPage',
                                )}
                            />
                        </FormSectionItem>
                        <FormSectionItem>
                            <FormFieldTitle>Journal Page</FormFieldTitle>
                            <TextField
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                                value={this.state.title}
                                onChange={this.handleTextInputChange('title')}
                            />
                        </FormSectionItem>
                    </FormSection>
                )}
                {this.state.formChanged && (
                    <SaveButtonBox>
                        <PrimaryAction
                            type="tertiary"
                            onClick={(e) => {
                                e.preventDefault()
                                this.props.onCancel()
                            }}
                            label="Cancel"
                            size="small"
                            icon="removeX"
                        />
                        <PrimaryAction
                            type="primary"
                            onClick={(e) => {
                                e.preventDefault()
                                this.handleSubmit(e)
                            }}
                            label="Save"
                            size="small"
                            icon="check"
                        />
                        {/* <input
                    type="button"
                    value="Cancel"
                    onClick={(e) => {
                        e.preventDefault()
                        this.props.onCancel()
                    }}
                />
                <input type="submit" value="Save" /> */}
                    </SaveButtonBox>
                )}
            </FormContainer>
        )
    }
}

const FormContainer = styled.form`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 40px;
    overflow: scroll;
    padding: 15px;
    width: 100%;
    box-sizing: border-box;
    position: relative;

    &::-webkit-scrollbar {
        display: none;
    }

    scrollbar-width: none;
    padding-bottom: 50px;
`

const FormSection = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 10px;
    width: 100%;
`

const FormSectionItem = styled.div`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-gap: 5px;
    width: 100%;
    position: relative;
`

const FormFieldTitle = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale4};
`

const SaveButtonBox = styled.div`
    position: fixed;
    top: 50px;
    right: 12px;
    display: flex;
    flex-direction: row;
    grid-gap: 10px;
    align-items: center;
    background: ${(props) => props.theme.colors.black0}98;
    backdrop-filter: blur(10px);
    padding: 5px;
    border-radius: 5px;
`

const TopRightActionButtons = styled.div`
    position: absolute;
    top: 0px;
    right: 0px;
`

const EntitiesContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 10px;
    width: 100%;
`

const EntitiesItem = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
`

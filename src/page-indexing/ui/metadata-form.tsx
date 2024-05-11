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
import {
    defaultOrderableSorter,
    pushOrderedItem,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import {
    NormalizedState,
    initNormalizedState,
    mergeNormalizedStates,
    normalizedStateToArray,
} from '@worldbrain/memex-common/lib/common-ui/utils/normalized-state'
import { normalizeUrl } from '@worldbrain/memex-common/lib/url-utils/normalize'
import { PDF_VIEWER_HTML } from 'src/pdf/constants'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import type { IconKeys } from '@worldbrain/memex-common/lib/common-ui/styles/types'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'

export interface Props {
    pageIndexingBG: PageIndexingInterface<'caller'>
    fullPageUrl: string
    onSave?: () => void
    onCancel?: () => void
    getRootElement?: () => HTMLElement
}

export interface State
    extends Required<
        Omit<
            PageMetadata,
            'normalizedPageUrl' | 'description' | 'previewImageUrl'
        >
    > {
    newEntityName: string
    newEntityIsPrimary: boolean
    newEntityAdditionalName: string
    /** Assumed to be sorted by `order` field. */
    entities: NormalizedState<Omit<PageEntity, 'normalizedPageUrl'>, number>
    loadState: UITaskState
    submitState: UITaskState
    autoFillState: UITaskState
    contentType: 'web' | 'pdf'
    formChanged: boolean
    displayFullUrl: string
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
        newEntityName: '',
        newEntityIsPrimary: false,
        newEntityAdditionalName: '',
        releaseDate: Date.now(),
        accessDate: Date.now(),
        entities: initNormalizedState(),
        loadState: 'pristine',
        submitState: 'pristine',
        autoFillState: 'pristine',
        contentType: 'web',
        formChanged: false,
        displayFullUrl: '',
    }
    private normalizedPageUrl: string

    constructor(props: Props) {
        super(props)
        this.normalizedPageUrl = normalizeUrl(props.fullPageUrl)
    }

    async componentDidMount() {
        const { pageIndexingBG, fullPageUrl } = this.props
        const isPagePDF =
            fullPageUrl.includes('memex.cloud') ||
            window.location.href.includes(PDF_VIEWER_HTML)

        this.setState({
            loadState: 'running',
            contentType: isPagePDF ? 'pdf' : 'web',
        })

        let metadata = await pageIndexingBG.getPageMetadata({
            normalizedPageUrl: this.normalizedPageUrl,
        })
        if (!metadata) {
            const firstAccessTime = await pageIndexingBG.getFirstAccessTimeForPage(
                { normalizedPageUrl: this.normalizedPageUrl },
            )
            metadata = {
                entities: [],
                accessDate: firstAccessTime ?? Date.now(),
            }
        }

        // TODO: This won't yet work for non-indexed PDF pages
        const originalUrl = isPagePDF
            ? await pageIndexingBG.getOriginalUrlForPdfPage({
                  normalizedPageUrl: this.normalizedPageUrl,
              })
            : fullPageUrl

        this.setState((previousState) => ({
            displayFullUrl: decodeURIComponent(originalUrl ?? ''),
            entities: initNormalizedState({
                seedData: metadata.entities.sort(defaultOrderableSorter),
                getId: (e) => e.id,
            }),
            journalVolume:
                metadata.journalVolume ?? previousState.journalVolume,
            journalIssue: metadata.journalIssue ?? previousState.journalIssue,
            journalName: metadata.journalName ?? previousState.journalName,
            journalPage: metadata.journalPage ?? previousState.journalPage,
            releaseDate: metadata.releaseDate ?? previousState.releaseDate,
            sourceName: metadata.sourceName ?? previousState.sourceName,
            annotation: metadata.annotation ?? previousState.annotation,
            accessDate: metadata.accessDate ?? previousState.accessDate,
            title: metadata.title ?? previousState.title,
            doi: metadata.doi ?? previousState.doi,
            loadState: 'success',
        }))
    }

    private get shouldEnableAddEntityBtn(): boolean {
        return this.state.newEntityName.trim().length > 0
    }

    private get shouldEnableAutoFillBtn(): boolean {
        return (
            this.state.doi.trim().length > 0 &&
            this.state.autoFillState === 'pristine'
        )
    }

    private get autoFillBtnIcon(): IconKeys | JSX.Element {
        const { autoFillState } = this.state
        if (autoFillState === 'running') {
            return <LoadingIndicator size={10} margin="5px" />
        }
        if (autoFillState === 'error') {
            return 'sadFace'
        }
        return 'stars'
    }

    private handleSubmit: React.FormEventHandler = async (e) => {
        e.preventDefault()
        this.setState({ submitState: 'running', formChanged: false })

        await this.props.pageIndexingBG.updatePageMetadata({
            doi: this.state.doi,
            title: this.state.title,
            annotation: this.state.annotation,
            sourceName: this.state.sourceName,
            accessDate: this.state.accessDate,
            releaseDate: this.state.releaseDate,
            journalName: this.state.journalName,
            journalPage: this.state.journalPage,
            journalIssue: this.state.journalIssue,
            journalVolume: this.state.journalVolume,
            normalizedPageUrl: this.normalizedPageUrl,
            entities: normalizedStateToArray(this.state.entities),
        })
        this.setState({ submitState: 'success' })
        this.props.onSave?.()
    }

    private handleTextInputChange = (
        stateKey: keyof State,
    ): React.ChangeEventHandler<HTMLInputElement> => (e) => {
        e.stopPropagation()
        this.setState({ [stateKey]: e.target.value, formChanged: true } as any)

        // Reset autofill state on DOI change to allow for re-autofill attempts
        if (stateKey === 'doi') {
            this.setState({ autoFillState: 'pristine' })
        }
    }

    private handleEntityTextInputChange = (
        stateKey: keyof Pick<PageEntity, 'name' | 'additionalName'>,
        entityId: number,
    ): React.ChangeEventHandler<HTMLInputElement> => (e) => {
        e.stopPropagation()

        this.setState((state) => ({
            entities: {
                ...state.entities,
                byId: {
                    ...state.entities.byId,
                    [entityId]: {
                        ...state.entities.byId[entityId],
                        [stateKey]: e.target.value,
                    },
                },
            },
            formChanged: true,
        }))
    }

    private handleAutoFill = async () => {
        if (!this.state.doi.trim().length) {
            return
        }
        this.setState({ autoFillState: 'running' })
        const fetchedPageMetadata = await this.props.pageIndexingBG.fetchPageMetadataByDOI(
            { doi: this.state.doi },
        )
        if (!fetchedPageMetadata) {
            this.setState({ autoFillState: 'error' })
            return
        }
        this.setState((state) => {
            // Merge any new auto-filled entities with existing
            const nextEntities = mergeNormalizedStates(
                this.state.entities,
                initNormalizedState({
                    seedData: fetchedPageMetadata.entities,
                    getId: (e) => e.id,
                }),
            )
            return {
                autoFillState: 'success',
                entities: nextEntities,
                doi: fetchedPageMetadata.doi ?? state.doi,
                title: fetchedPageMetadata.title ?? state.title,
                annotation: fetchedPageMetadata.annotation ?? state.annotation,
                sourceName: fetchedPageMetadata.sourceName ?? state.sourceName,
                journalName:
                    fetchedPageMetadata.journalName ?? state.journalName,
                journalPage:
                    fetchedPageMetadata.journalPage ?? state.journalPage,
                journalIssue:
                    fetchedPageMetadata.journalIssue ?? state.journalIssue,
                journalVolume:
                    fetchedPageMetadata.journalVolume ?? state.journalVolume,
                releaseDate:
                    fetchedPageMetadata.releaseDate ?? state.releaseDate,
            }
        })
    }

    private handleDeleteEntity = (entityId: number) => {
        if (!this.state.entities.byId[entityId]) {
            throw new Error(
                `Cannot delete entity that does not exist in state - ID: ${entityId}`,
            )
        }
        this.setState((state) => ({
            entities: initNormalizedState({
                seedData: normalizedStateToArray(state.entities).filter(
                    (e) => e.id !== entityId,
                ),
                getId: (e) => e.id,
            }),
        }))
        this.setState({ formChanged: true })
    }

    private handleAddEntity = () => {
        if (!this.shouldEnableAddEntityBtn) {
            throw new Error('Cannot add entity if input state not yet set')
        }
        const orderedEntityItems = normalizedStateToArray(
            this.state.entities,
        ).map((e) => ({
            key: e.order,
            id: e.id,
        }))
        const nextId = Date.now()
        const newEntity: Omit<PageEntity, 'normalizedPageUrl'> = {
            id: nextId,
            name: this.state.newEntityName.trim(),
            isPrimary: this.state.newEntityIsPrimary,
            additionalName: this.state.newEntityAdditionalName.trim(),
            order: pushOrderedItem(orderedEntityItems, nextId).create.key,
        }
        this.setState((state) => ({
            newEntityName: '',
            newEntityIsPrimary: false,
            newEntityAdditionalName: '',
            entities: {
                allIds: [...state.entities.allIds, nextId],
                byId: {
                    ...state.entities.byId,
                    [nextId]: newEntity,
                },
            },
            formChanged: true,
        }))
    }

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
                                value={this.state.doi}
                                onChange={this.handleTextInputChange('doi')}
                                onKeyDown={(e) => {
                                    e.stopPropagation()
                                }}
                            />
                            <PrimaryAction
                                type="glass"
                                label={'Autofill'}
                                spinningIcon={
                                    this.state.autoFillState === 'running'
                                }
                                size="small"
                                icon={this.autoFillBtnIcon}
                                padding="2px 5px"
                                width="100%"
                                onClick={this.handleAutoFill}
                                fontColor="greyScale6"
                                iconColor="greyScale6"
                                disabled={!this.shouldEnableAutoFillBtn}
                            />
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
                        <FormFieldTitle>Source name</FormFieldTitle>
                        <TextField
                            onKeyDown={(e) => {
                                e.stopPropagation()
                            }}
                            value={this.state.sourceName}
                            onChange={this.handleTextInputChange('sourceName')}
                        />
                    </FormSectionItem>
                    <FormSectionItem>
                        <FormFieldTitle>URL</FormFieldTitle>
                        <TextField
                            onKeyDown={(e) => {
                                e.stopPropagation()
                            }}
                            value={this.state.displayFullUrl}
                            disabled
                        />
                    </FormSectionItem>
                    <FormSectionItem>
                        <FormFieldTitle>First access date</FormFieldTitle>
                        <TextField
                            onKeyDown={(e) => {
                                e.stopPropagation()
                            }}
                            value={new Date(this.state.accessDate).toString()}
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
                                            {normalizedStateToArray(
                                                this.state.entities,
                                            ).map((entity, index) => (
                                                <Draggable
                                                    key={entity.id}
                                                    draggableId={String(
                                                        entity.id,
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
                                                                <EntitiesItem>
                                                                    <TextField
                                                                        onKeyDown={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation()
                                                                        }}
                                                                        placeholder="Last Name or Org"
                                                                        value={
                                                                            entity.name
                                                                        }
                                                                        onChange={this.handleEntityTextInputChange(
                                                                            'name',
                                                                            entity.id,
                                                                        )}
                                                                    />
                                                                    <TextField
                                                                        onKeyDown={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation()
                                                                        }}
                                                                        placeholder="First Name"
                                                                        value={
                                                                            entity.additionalName
                                                                        }
                                                                        onChange={this.handleEntityTextInputChange(
                                                                            'additionalName',
                                                                            entity.id,
                                                                        )}
                                                                    />
                                                                    <Icon
                                                                        filePath="removeX"
                                                                        onClick={() => {
                                                                            this.handleDeleteEntity(
                                                                                entity.id,
                                                                            )
                                                                        }}
                                                                        heightAndWidth="20px"
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
                                            ))}
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
                                    value={this.state.newEntityAdditionalName}
                                    onChange={this.handleTextInputChange(
                                        'newEntityAdditionalName',
                                    )}
                                />
                                <TextField
                                    onKeyDown={(e) => {
                                        e.stopPropagation()
                                    }}
                                    placeholder="Last Name"
                                    value={this.state.newEntityName}
                                    onChange={this.handleTextInputChange(
                                        'newEntityName',
                                    )}
                                />
                            </EntitiesItem>
                            {(this.state.newEntityAdditionalName?.length > 0 ||
                                this.state.newEntityName?.length > 0) && (
                                <PrimaryAction
                                    label="Add"
                                    size="small"
                                    icon="plus"
                                    type="glass"
                                    fullWidth
                                    iconColor="prime1"
                                    onClick={this.handleAddEntity}
                                    disabled={!this.shouldEnableAddEntityBtn}
                                    fontColor="greyScale6"
                                />
                            )}
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
                                value={new Date(
                                    this.state.accessDate,
                                ).toString()}
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
                                this.props.onCancel?.()
                            }}
                            label="Cancel"
                            size="small"
                            icon="removeX"
                        />
                        <PrimaryAction
                            type="primary"
                            onClick={this.handleSubmit}
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
    margin-bottom: 5px;
`

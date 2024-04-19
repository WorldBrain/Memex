import React, { PureComponent } from 'react'
import { Template } from '../types'
import styled, { css } from 'styled-components'
import * as icons from 'src/common-ui/components/design-library/icons'
import Icon from '@worldbrain/memex-common/lib/common-ui/components/icon'
import TextField from '@worldbrain/memex-common/lib/common-ui/components/text-field'
import { TooltipBox } from '@worldbrain/memex-common/lib/common-ui/components/tooltip-box'
import { TaskState } from 'ui-logic-core/lib/types'
import LoadingIndicator from '@worldbrain/memex-common/lib/common-ui/components/loading-indicator'
import { PrimaryAction } from '@worldbrain/memex-common/lib/common-ui/components/PrimaryAction'
import TutorialBox from '@worldbrain/memex-common/lib/common-ui/components/tutorial-box'
import { DEFAULT_TEMPLATES } from '../background/default-templates'
import { PopoutBox } from '@worldbrain/memex-common/lib/common-ui/components/popout-box'

interface TemplateEditorProps {
    previewString: string
    template?: Template
    isNew?: boolean
    templateType: 'originalPage' | 'examplePage'
    isPreviewLoading: TaskState
    previewErrorMessage?: string | JSX.Element

    onClickSave: () => void
    onClickCancel: () => void
    onClickDelete: () => void
    onClickHowto: () => void

    onTitleChange: (s: string) => void
    onOutputFormatChange: (s: Template['outputFormat']) => void
    onCodeChange: (s: string) => void
    getRootElement: () => HTMLElement
    changeTemplateType: (templateType: 'originalPage' | 'examplePage') => void
}

const TemplateButtonOptions = [
    {
        buttonText: 'Page Title',
        insertedText: `{{{PageTitle}}} `,
        TooltipText: 'Adds the page title',
    },
    {
        buttonText: 'Page Url',
        insertedText: `{{{PageUrl}}} `,
        TooltipText: 'Adds the page URL',
    },
    {
        buttonText: 'Page Meta Title',
        insertedText: `{{{PageMetaTitle}}} `,
        TooltipText: 'Adds the meta title of the page',
    },
    {
        buttonText: 'Page Annotation',
        insertedText: `{{{PageAnnotation}}} `,
        TooltipText: 'Adds the annotation of the page',
    },
    {
        buttonText: 'Page Source Name',
        insertedText: `{{{PageSourceName}}} `,
        TooltipText: 'Adds the source name of the page',
    },
    {
        buttonText: 'PDF Journal Name',
        insertedText: `{{{PageJournalName}}} `,
        TooltipText: 'Adds the journal name of the page',
    },
    {
        buttonText: 'PDF DOI',
        insertedText: `{{{PageDOI}}} `,
        TooltipText: 'Adds the DOI of the page',
    },
    {
        buttonText: 'PDF Journal Page',
        insertedText: `{{{PageJournalPage}}} `,
        TooltipText: 'Adds the journal page of the page',
    },
    {
        buttonText: 'PDF Journal Issue',
        insertedText: `{{{PageJournalIssue}}} `,
        TooltipText: 'Adds the journal issue of the page',
    },
    {
        buttonText: 'PDF Journal Volume',
        insertedText: `{{{PageJournalVolume}}} `,
        TooltipText: 'Adds the journal volume of the page',
    },
    {
        buttonText: 'PDF Journal Release Date',
        insertedText: `{{#PageReleaseDate}}YYYY-MM-DD{{/PageReleaseDate}} `,
        TooltipText: 'Adds the release date of the page',
    },
    {
        buttonText: 'Access Date',
        insertedText: `{{#PageAccessDate}}YYYY-MM-DD{{/PageAccessDate}} `,
        TooltipText: 'Adds the access date of the page',
    },
    {
        buttonText: 'Authors List',
        insertedText: `{{#PageEntities}}{{{.}}} {{/PageEntities}} `,
        TooltipText:
            'Loops through and adds all entities associated with the page',
    },
    {
        buttonText: 'Author First Name',
        insertedText: `{{{EntityAdditionalName}}} `,
        TooltipText: 'The first name of the Author',
    },
    {
        buttonText: 'Author First Name Short',
        insertedText: `{{{EntityAdditionalNameShort}}} `,
        TooltipText: 'The first name of the Author, abbreviated with a dot',
    },
    {
        buttonText: 'Author Last Name',
        insertedText: `{{{EntityName}}} `,
        TooltipText: 'The first name of the Author',
    },
    {
        buttonText: 'Author Last Name Short',
        insertedText: `{{{EntityNameShort}}} `,
        TooltipText: 'The first name of the Author, abbreviated with a dot',
    },
    {
        buttonText: 'Add et al.',
        insertedText: `{{#showEtAl}}, et al. {{/showEtAl}} `,
        TooltipText:
            'a string you can include that shows instead of secondary authors',
    },
    {
        buttonText: 'Page Link',
        insertedText: `{{{PageLink}}} `,
        TooltipText: (
            <span>
                The last created shareable page link <br /> with annotations
            </span>
        ),
    },
    {
        buttonText: 'Page Spaces',
        insertedText: `{{{PageSpaces}}} `,
        TooltipText: (
            <span>
                Outputs your Spaces with tags and [[WikiLinks]]:
                <br /> #Space1 [[Space 2]]
            </span>
        ),
    },
    {
        buttonText: 'Page Spaces (custom)',
        insertedText: `{{#PageSpacesList}}{{{.}}} {{/PageSpacesList}} `,
        TooltipText: (
            <span>
                The `{'{{{'}.{'}}}'}` represents a placeholder for every
                asscociated space.
                <br /> You can modify the text around this placeholder. <br />{' '}
                Default output: space1 space2
            </span>
        ),
    },
    {
        buttonText: 'Page Notes',
        insertedText: `{{#Notes}}
{{{NoteHighlight}}} 
{{{NoteText}}}
{{/Notes}} `,
        TooltipText: (
            <span>
                Needed to loop through notes. <br />
                Always wrap this around your exported Notes.
            </span>
        ),
    },
    {
        buttonText: 'Page HAS Notes',
        insertedText: `{{#HasNotes}} Text and/or {{{VariableName1}}} {{/HasNotes}} `,
        TooltipText: (
            <span>
                Export text <br /> only there are notes on the page
            </span>
        ),
    },
    {
        buttonText: 'Notes Highlight',
        insertedText: `{{{NoteHighlight}}} `,
        TooltipText: <span>The Highlight Text of the note</span>,
    },
    {
        buttonText: 'Notes Text',
        insertedText: `{{{NoteText}}} `,
        TooltipText: <span>The text of the note, not the highlight</span>,
    },
    {
        buttonText: 'Note Link',
        insertedText: `{{{NoteLink}}} `,
        TooltipText: (
            <span>
                A sharable/referencable link <br /> to this annotations
            </span>
        ),
    },
    {
        buttonText: 'Note Spaces',
        insertedText: `{{{NoteSpaces}}} `,
        TooltipText: (
            <span>
                Outputs your Spaces with tags and [[WikiLinks]]:
                <br /> #Space1 [[Space 2]]
            </span>
        ),
    },
    {
        buttonText: 'Note Spaces (custom)',
        insertedText: `{{#NoteSpacesList}}{{{.}}} {{/NoteSpacesList}} `,
        TooltipText: (
            <span>
                The `{'{{{'}.{'}}}'}` represents a placeholder for every
                associated space.
                <br /> You can modify the text around this placeholder. <br />{' '}
                Default output: space1 space2
            </span>
        ),
    },
    {
        buttonText: 'Text Literal',
        insertedText: `{{#literal}} {{/literal}} `,
        TooltipText: (
            <span>
                The text between between elements <br /> will be shown as is
            </span>
        ),
    },
    {
        buttonText: 'HAS variable X',
        insertedText: `{{#ReplaceWithX}} {{/ReplaceWithX}} `,
        TooltipText: (
            <span>
                The text between between elements will be shown
                <br /> if the select variable is available
            </span>
        ),
    },
    {
        buttonText: 'HAS NOT variable X',
        insertedText: `{{^ReplaceWithX}} {{/ReplaceWithX}} `,
        TooltipText: (
            <span>
                The text between between elements will be shown
                <br /> if the select variable is NOT available
            </span>
        ),
    },
    {
        buttonText: 'Bold Text',
        insertedText: `{{#b}} {{/b}} `,
        TooltipText: (
            <span>
                The text between between will be bold. <br /> Only include 1
                variable at a time. <br /> You can also use double underscore __
            </span>
        ),
    },
    {
        buttonText: 'Italic Text',
        insertedText: `{{#i}} {{/i}} `,
        TooltipText: (
            <span>
                The text between between will be bold. <br /> Only include 1
                variable at a time. <br /> You can also use single underscore _
            </span>
        ),
    },
]

interface State {
    confirmDelete: boolean
    draggedButton: number | null
    showPremadeTemplatesModal: boolean
}
export default class TemplateEditor extends PureComponent<
    TemplateEditorProps,
    State
> {
    premadeTemplateButtonRef = React.createRef<HTMLDivElement>()

    private get isSaveDisabled(): boolean {
        return (
            !this.props.template?.title.length ||
            !this.props.template?.code.length
        )
    }

    state = {
        confirmDelete: false,
        draggedButton: null,
        showPremadeTemplatesModal: false,
    }

    componentDidMount(): void {
        let textarea

        const sidebarContainer = document.getElementById(
            'memex-sidebar-container',
        )
        const sidebar = sidebarContainer?.shadowRoot.getElementById(
            'annotationSidebarContainer',
        )
        const test = sidebarContainer?.shadowRoot.getElementById(
            'CopyPasterTextArea',
        )

        if (sidebar != null) {
            textarea = sidebar.querySelector('#CopyPasterTextArea')
        } else {
            textarea = document.getElementById('CopyPasterTextArea')
        }

        if (textarea != null) {
            textarea.style.height = 'auto'
            textarea.style.height = textarea.scrollHeight + 'px'
        }
    }

    handleConfirmDelete = () => {
        this.props?.onClickDelete()
        this.setState({ confirmDelete: false })
    }

    renderPremadeTemplatesList() {
        if (this.state.showPremadeTemplatesModal) {
            return (
                <PopoutBox
                    getPortalRoot={this.props.getRootElement}
                    placement={'bottom-end'}
                    targetElementRef={this.premadeTemplateButtonRef.current}
                    closeComponent={() => {
                        this.setState({ showPremadeTemplatesModal: false })
                    }}
                >
                    <TemplateInsertContainer>
                        {DEFAULT_TEMPLATES.map((template) => {
                            return (
                                <TemplateRow
                                    onClick={() => {
                                        this.setState({
                                            showPremadeTemplatesModal: false,
                                        })
                                        this.insertIntoEditor(template.code)
                                    }}
                                >
                                    {template.title}
                                    <HoverOverlay>
                                        Add to template Editor
                                    </HoverOverlay>
                                </TemplateRow>
                            )
                        })}
                    </TemplateInsertContainer>
                </PopoutBox>
            )
        }
    }

    insertIntoEditor = (templateText: string) => {
        this.props.onCodeChange(templateText)
    }

    render() {
        const { template } = this.props

        return (
            <EditorContainer>
                <Header>
                    <SectionTitle>
                        {this.props.isNew
                            ? 'Add New Template'
                            : 'Edit Template'}
                    </SectionTitle>
                    <ButtonBox>
                        <TutorialBox
                            tutorialId="useTemplates"
                            getRootElement={this.props.getRootElement}
                        />
                        {!this.props.isNew && !this.state.confirmDelete ? (
                            <PrimaryAction
                                onClick={() =>
                                    this.setState({
                                        confirmDelete: true,
                                    })
                                }
                                label="Delete"
                                type={'tertiary'}
                                size={'small'}
                                icon={'trash'}
                            />
                        ) : (
                            !this.props.isNew && (
                                <ConfirmText>Sure?</ConfirmText>
                            )
                        )}
                        <PrimaryAction
                            label={'Cancel'}
                            type={'tertiary'}
                            size={'small'}
                            icon={'removeX'}
                            padding={'3px 10px 3px 5px'}
                            onClick={
                                this.state.confirmDelete
                                    ? this.handleConfirmDelete
                                    : this.props.onClickCancel
                            }
                        />
                        {!this.isSaveDisabled && (
                            <PrimaryAction
                                label={
                                    this.state.confirmDelete ? 'Delete' : 'Save'
                                }
                                type={'primary'}
                                size={'small'}
                                icon={'check'}
                                disabled={this.isSaveDisabled}
                                padding={'3px 10px 3px 5px'}
                                onClick={
                                    this.state.confirmDelete
                                        ? this.handleConfirmDelete
                                        : this.props.onClickSave
                                }
                            />
                        )}
                    </ButtonBox>
                </Header>

                <TextInputBox>
                    <TextInput
                        type="text"
                        placeholder="Title"
                        value={template?.title}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.metaKey) {
                                this.props.onClickSave()
                            } else if (e.key === 'Escape') {
                                this.props.onClickCancel()
                            }
                            e.stopPropagation()
                        }}
                        onChange={(e) =>
                            this.props.onTitleChange(
                                (e.target as HTMLInputElement).value,
                            )
                        }
                        height="30px"
                        width="fill-available"
                        background="greyScale3"
                    />
                    <EditorContainers>
                        <EditorBox>
                            <HeaderBox>
                                <OutputSwitcherContainer>
                                    <TooltipBox
                                        tooltipText={
                                            <span>
                                                Text in the output will retain
                                                <br />
                                                formatting and links
                                            </span>
                                        }
                                        placement="bottom"
                                        strategy="fixed"
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <OutputSwitcher
                                            onClick={() =>
                                                this.props.onOutputFormatChange(
                                                    'rich-text',
                                                )
                                            }
                                            outputFormatSelected={
                                                this.props.template
                                                    ?.outputFormat ===
                                                'rich-text'
                                            }
                                        >
                                            Rich Text
                                        </OutputSwitcher>
                                    </TooltipBox>
                                    <TooltipBox
                                        tooltipText={
                                            <span>
                                                Text in the output will be
                                                <br />
                                                copied as-is
                                            </span>
                                        }
                                        placement="bottom"
                                        strategy="fixed"
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <OutputSwitcher
                                            onClick={() =>
                                                this.props.onOutputFormatChange(
                                                    'markdown',
                                                )
                                            }
                                            outputFormatSelected={
                                                this.props.template
                                                    ?.outputFormat ===
                                                    'markdown' ||
                                                this.props.template
                                                    ?.outputFormat == null
                                            }
                                        >
                                            Plain Text
                                        </OutputSwitcher>
                                    </TooltipBox>
                                </OutputSwitcherContainer>
                                <AddDefaultTemplateButton>
                                    {this.renderPremadeTemplatesList()}
                                    <PrimaryAction
                                        label={'Prefill with Template'}
                                        type={'tertiary'}
                                        size={'small'}
                                        icon={'copy'}
                                        innerRef={this.premadeTemplateButtonRef}
                                        padding={'3px 10px 3px 5px'}
                                        onClick={() =>
                                            this.setState({
                                                showPremadeTemplatesModal: true,
                                            })
                                        }
                                    />
                                </AddDefaultTemplateButton>
                            </HeaderBox>

                            <TemplateInput
                                value={template?.code ?? ''}
                                placeholder="Write or drag & drop the placeholders here"
                                onChange={(e) => {
                                    this.props.onCodeChange(e.target.value)
                                }}
                                onDragOver={(event) => {
                                    ;(event.target as HTMLTextAreaElement).focus()
                                    const target = event.target as HTMLTextAreaElement
                                    target.selectionStart = target.selectionEnd
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Tab') {
                                        e.preventDefault()
                                        const start = (e.target as HTMLTextAreaElement)
                                            .selectionStart
                                        const end = (e.target as HTMLTextAreaElement)
                                            .selectionEnd
                                        const value = (e.target as HTMLTextAreaElement)
                                            .value
                                        let newValue, newCursorPos
                                        if (!e.shiftKey) {
                                            newValue =
                                                value.substring(0, start) +
                                                '  ' +
                                                value.substring(end)
                                            newCursorPos = start + 2
                                        } else {
                                            const beforeTab = value.substring(
                                                0,
                                                start,
                                            )
                                            const lastTwoChars = beforeTab.slice(
                                                -2,
                                            )
                                            if (lastTwoChars === '  ') {
                                                newValue =
                                                    beforeTab.slice(0, -2) +
                                                    value.substring(end)
                                                newCursorPos = start - 2
                                            } else {
                                                newValue = value
                                                newCursorPos = start
                                            }
                                        }
                                        this.props.onCodeChange(newValue)
                                        // Move the cursor to the right of the inserted tab or back if shift+tab
                                        setTimeout(() => {
                                            ;(e.target as HTMLTextAreaElement).selectionStart = (e.target as HTMLTextAreaElement).selectionEnd = newCursorPos
                                        }, 0)
                                    }
                                    if (e.key === 'Enter' && e.metaKey) {
                                        this.props.onClickSave()
                                    } else if (e.key === 'Escape') {
                                        this.props.onClickCancel()
                                    }
                                    e.stopPropagation()
                                }}
                            />
                        </EditorBox>
                        <EditorBox>
                            <HeaderBox>
                                <LeftSidePreviewBar>
                                    <Title>Preview from selected item(s)</Title>
                                    <TooltipBox
                                        tooltipText={
                                            <span>
                                                This is how it will look when
                                                used.
                                                <br />
                                                If multiple items selected they
                                                will be looped.
                                            </span>
                                        }
                                        placement="bottom"
                                        strategy="fixed"
                                        getPortalRoot={
                                            this.props.getRootElement
                                        }
                                    >
                                        <Icon
                                            filePath={icons.helpIcon}
                                            heightAndWidth="16px"
                                            hoverOff
                                        />
                                    </TooltipBox>
                                    {this.props.isPreviewLoading ===
                                        'running' && (
                                        <LoadingBox>
                                            <LoadingIndicator size={16} />
                                        </LoadingBox>
                                    )}
                                </LeftSidePreviewBar>
                            </HeaderBox>
                            <PreviewEditorBox>
                                {this.props.isPreviewLoading === 'error' ? (
                                    <ErrorContainer>
                                        <Icon
                                            icon={'warning'}
                                            heightAndWidth="24px"
                                            hoverOff
                                            color={'warning'}
                                        />
                                        <ErrorText>
                                            {this.props.previewErrorMessage}
                                        </ErrorText>
                                    </ErrorContainer>
                                ) : (
                                    <>
                                        {this.props.template?.outputFormat ===
                                        'markdown' ? (
                                            <PreviewInput
                                                value={this.props.previewString}
                                                readOnly
                                                onKeyDown={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        ) : (
                                            <PreviewRichText
                                                ref={(element) => {
                                                    if (element) {
                                                        element.innerHTML = this.props.previewString
                                                    }
                                                }}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            />
                                        )}
                                    </>
                                )}
                            </PreviewEditorBox>
                        </EditorBox>
                    </EditorContainers>
                </TextInputBox>
                <DragButtonsContainer>
                    <HeaderBox>
                        <Title>Drag & Drop Placeholders</Title>
                        <HowtoBox onClick={this.props.onClickHowto}>
                            <Icon
                                filePath={icons.helpIcon}
                                heightAndWidth="16px"
                                hoverOff
                            />
                            How to write templates
                        </HowtoBox>
                    </HeaderBox>
                    {TemplateButtonOptions.map((button, i) => (
                        <TooltipBox
                            tooltipText={button.TooltipText}
                            key={button.buttonText}
                            placement="bottom"
                            strategy="fixed"
                            getPortalRoot={this.props.getRootElement}
                        >
                            <DragButton
                                draggable="true"
                                onDrag={(e) => {
                                    e.preventDefault()
                                    null
                                }}
                                onDragStart={(e) => {
                                    // Create a custom drag image (optional)
                                    const dragIcon = document.createElement(
                                        'div',
                                    )
                                    const value = button.insertedText
                                    dragIcon.style.opacity = '1'
                                    dragIcon.style.pointerEvents = 'none'
                                    dragIcon.style.top = '-10000px'
                                    dragIcon.style.fontSize = '16px'
                                    dragIcon.style.color = '#11C278'
                                    dragIcon.style.position = 'absolute' // Move out of the viewport
                                    document.body.appendChild(dragIcon)

                                    dragIcon.style.cursor = 'grabbing'
                                    // Set the custom drag image and offset it from the cursor
                                    dragIcon.innerText = value // Customize as needed
                                    e.dataTransfer.setDragImage(
                                        dragIcon,
                                        230,
                                        100,
                                    ) // Adjust these values as needed

                                    e.dataTransfer.setData('text/plain', value)
                                    setTimeout(
                                        () =>
                                            document.body.removeChild(dragIcon),
                                        0,
                                    )
                                }}
                            >
                                {button.buttonText}
                            </DragButton>
                        </TooltipBox>
                    ))}
                </DragButtonsContainer>
            </EditorContainer>
        )
    }
}

const ConfirmText = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale6};
`

const LeftSidePreviewBar = styled.div`
    display: flex;
    align-items: center;
    grid-gap: 5px;
    justify-content: flex-start;
    position: relative;
    width: fill-available;
    width: -moz-available;
`

const PreviewEditorBox = styled.div`
    height: 100%;
    width: 100%;
    position: relative;
    flex: 1;
    min-height: 10%;
    min-width: 10%;
`

const LoadingBox = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    right: 10px;
`

const DragButtonsContainer = styled.div`
    display: flex;
    grid-gap: 6px;
    flex-wrap: wrap;
    width: 100%;
    padding: 10px 0px;
    position: relative;
    max-width: 900px;
`
const DragButton = styled.div<{}>`
    color: ${(props) => props.theme.colors.greyScale5};
    background: ${(props) => props.theme.colors.greyScale1};
    font-size: 13px;
    padding: 5px 10px;
    border-radius: 5px;
    z-index: 10;
    cursor: grab;
`
const HeaderBox = styled.div`
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: fill-available;
    width: -moz-available;
`
const TextInputBox = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 10px 0 10px;
    grid-gap: 5px;
    width: 100%;
    flex: 1;
    height: fill-available;
    height: -moz-available;
    min-height: 40%;
`

const Header = styled.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    padding: 0px 15px 0px 15px;
    height: 30px;
    width: 100%;
    align-items: center;
`

const SectionTitle = styled.div`
    color: ${(props) => props.theme.colors.greyScale4};
    font-size: 16px;
    font-weight: 400;
`

const TextInput = styled(TextField)`
    outline: none;
    height: fill-available;
    width: fill-available;
    color: ${(props) => props.theme.colors.greyScale6};
    font-size: 14px;
    border: none;
    margin-bottom: 10px;
    background: ${(props) => props.theme.colors.greyScale2};

    &:focus-within {
        outline: 1px solid ${(props) => props.theme.colors.greyScale4};
        color: ${(props) => props.theme.colors.white};
    }

    &::placeholder {
        color: ${(props) => props.theme.colors.greyScale5};
    }
`

const HowtoBox = styled.div`
    font-size: 14px;
    color: ${(props) => props.theme.colors.greyScale6};
    font-weight: 400;
    display: flex;
    grid-gap: 5px;
    align-items: centeR;
    cursor: pointer;

    & * {
        cursor: pointer;
    }
`

const OutputSwitcherContainer = styled.div`
    display: flex;
    border-radius: 6px;
    border: 1px solid ${(props) => props.theme.colors.greyScale2};
    width: fit-content;
`

const OutputSwitcher = styled.div<{
    outputFormatSelected: boolean
}>`
    display: flex;
    color: ${(props) => props.theme.colors.greyScale7};
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
    border-radius: 5px;

    ${(props) =>
        props.outputFormatSelected &&
        css`
            background: ${(props) => props.theme.colors.greyScale3};
        `}

    ${(props) =>
        props.theme.variant === 'light' &&
        css`
            color: ${(props) => props.theme.colors.greyScale5};
        `};
`

const ButtonBox = styled.div`
    display: flex;
    grid-gap: 10px;
    align-items: center;
    justify-self: flex-end;
`
const EditorContainer = styled.div`
    display: flex;
    min-width: 850px;
    height: 650px;
    max-height: 90%;
    max-width: 900px;
    align-items: center;
    justify-self: center;
    flex-direction: column;

    padding: 20px;
    border-radius: 10px;

    padding: 10px 15px;

    * {
        opacity: 1;
    }
`

const Title = styled.div`
    font-size: 18px;
    font-weight: 700;
    color: ${(props) => props.theme.colors.greyScale7};
    height: 24px;
    vertical-align: middle;
    display: flex;
    align-items: center;
`

const EditorContainers = styled.div`
    display: flex;
    flex-direction: row;
    width: fill-available;
    width: -moz-available;
    flex-grow: 1;
    min-height: 10%;
    & > * {
        flex: 1;
    }
    grid-gap: 10px;
`

const PreviewInput = styled.textarea`
    height: fill-available;
    height: -moz-available;
    width: 100%;
    border: none;
    text-align: left;
    color: ${(props) => props.theme.colors.greyScale6};
    background: none;
    padding: 10px;
    width: fill-available;
    line-height: 21px;
    font-size: 14px;
    overflow: scroll;
    resize: none;
    outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    border-radius: 8px;
    flex: 1;
    min-height: 60%;
    text-overflow: nowrap;

    scrollbar-width: none;

    & em {
        font-style: italic;
        font-weight: inherit;
    }
`

const ErrorText = styled.div`
    color: ${(props) => props.theme.colors.greyScale6};
    text-align: center;
    line-height: 21px;
    font-size: 16px;
`

const ErrorContainer = styled.div`
    height: fill-available;
    height: -moz-available;
    width: fill-available;
    width: -moz-available;
    border: none;
    background: none;
    padding: 10px;
    width: fill-available;
    resize: none;
    outline: 1px solid ${(props) => props.theme.colors.greyScale2};
    border-radius: 8px;
    min-height: 60%;
    text-overflow: nowrap;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    grid-gap: 10px;

    scrollbar-width: none;
`
const PreviewRichText = styled.div`
    height: fill-available;
    height: -moz-available;
    width: 100%;
    border: none;
    text-align: left;
    color: ${(props) => props.theme.colors.greyScale6};
    background: none;
    padding: 10px;
    width: fill-available;
    line-height: 21px;
    font-size: 14px;
    overflow: scroll;
    resize: none;
    outline: 1px solid ${(props) => props.theme.colors.greyScale4};
    border-radius: 8px;
    min-height: 60%;
    text-overflow: nowrap;
    flex: 1;

    &:focus {
        background: none;
        outline: none;
    }

    p {
        margin: 3px 0;
    }

    a {
        color: ${(props) => props.theme.colors.prime1};
    }

    & em {
        font-style: italic;
        font-weight: inherit;
    }

    em {
        font-style: italic;
        font-weight: inherit;
    }

    scrollbar-width: none;
`
const TemplateInput = styled.textarea`
    height: 100%;
    width: fill-available;
    border: none;
    text-align: left;
    color: white;
    background: none;
    outline: 1px solid ${(props) => props.theme.colors.greyScale2};
    border-radius: 8px;
    padding: 10px;
    background: ${(props) => props.theme.colors.greyScale1}50;
    line-height: 21px;
    font-size: 14px;
    &:focus {
        background: ${(props) => props.theme.colors.greyScale1}60;
    }
    overflow-x: scroll;
    resize: none;
    flex: 1;
    min-height: 10%;

    scrollbar-width: none;
`

const EditorBox = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 5px;
    min-height: 10%;
    flex: 1;
    min-width: 10%;
`

const AddDefaultTemplateButton = styled.div``

const HoverOverlay = styled.div`
    display: none;
    position: absolute;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${(props) => props.theme.colors.black};
    backdrop-filter: blur(10px);
    box-sizing: border-box;
    border-radius: 8px;
    color: ${(props) => props.theme.colors.greyScale7};
`

const TemplateRow = styled.div`
    display: flex;
    align-items: center;
    width: 100%;
    box-sizing: border-box;
    border-radius: 8px;
    padding: 0 10px;
    height: 34px;
    position: relative;
    width: 200px;
    color: ${(props) => props.theme.colors.greyScale6};

    &:hover ${HoverOverlay} {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
    }

    &:hover {
        outline: 1px solid ${(props) => props.theme.colors.greyScale2};
    }
`
const TemplateInsertContainer = styled.div`
    display: flex;
    flex-direction: column;
    grid-gap: 2px;
    padding: 10px;
`

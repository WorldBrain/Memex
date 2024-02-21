import React from 'react'
import analytics from 'src/analytics'
import type { Template } from './types'
import CopyPaster from './components/CopyPaster'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import * as Raven from 'src/util/raven'
import type { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
import MarkdownIt from 'markdown-it'
import type { TaskState } from 'ui-logic-core/lib/types'
import {
    defaultOrderableSorter,
    insertOrderedItemBeforeIndex,
    pushOrderedItem,
} from '@worldbrain/memex-common/lib/utils/item-ordering'
import type { UITaskState } from '@worldbrain/memex-common/lib/main-ui/types'

interface State {
    isLoading: boolean
    copySuccess: boolean
    templates: Template[]
    tmpTemplate: Template | undefined
    isNew: boolean
    previewString: string
    templateType: 'originalPage' | 'examplePage'
    isPreviewLoading: TaskState
    previewErrorMessage?: string | JSX.Element
    renderedTextBuffered: string
    errorCopyToClipboard: boolean
}

const md = new MarkdownIt()
export interface Props {
    initTemplates?: Template[]
    onClickOutside?: React.MouseEventHandler
    renderTemplate: (id: number) => Promise<string>
    renderPreview: (
        template: Template,
        templateType: 'originalPage' | 'examplePage',
    ) => Promise<string>
    copyPasterBG: RemoteCopyPasterInterface
    preventClosingBcEditState?: (state) => void
    getRootElement: () => HTMLElement
    setLoadingState?: (loading: UITaskState) => void
}

export default class CopyPasterContainer extends React.PureComponent<
    Props,
    State
> {
    static DEF_TEMPLATE: Template = {
        id: -1,
        title: '',
        code: '',
        order: 1,
        isFavourite: false,
        outputFormat: 'rich-text',
    }

    state: State = {
        isLoading: false,
        tmpTemplate: undefined,
        templates: this.props.initTemplates ?? [],
        isNew: undefined,
        copySuccess: false,
        previewString: '',
        templateType: 'originalPage',
        isPreviewLoading: 'pristine',
        previewErrorMessage: undefined,
        renderedTextBuffered: '',
        errorCopyToClipboard: false,
    }

    async componentDidMount() {
        await this.syncTemplates()
        this.setState({ isNew: undefined })
    }

    private async syncTemplates() {
        this.setState({ isLoading: true })
        const templates = await this.props.copyPasterBG.findAllTemplates()
        const sortedTemplates = templates.sort(defaultOrderableSorter)
        this.setState({ templates: sortedTemplates, isLoading: false })
    }

    private findTemplateForId(id: number): Template {
        const template = this.state.templates.find((t) => t.id === id)

        if (!template) {
            // TODO: error UI state
            throw new Error(`Can't find template for ${id}`)
        }

        return template
    }

    private handleTemplateDelete = async () => {
        // NOTE: delete btn only appears in edit view, hence `state.tmpTemplate.id`
        //  will be set to the template currently being edited
        await this.props.copyPasterBG.deleteTemplate({
            id: this.state.tmpTemplate.id,
        })
        this.setState({ tmpTemplate: undefined })
        await this.syncTemplates()
    }

    async copyRichTextToClipboard(html: string) {
        // Create a hidden content-editable div
        const hiddenDiv = document.createElement('div')

        hiddenDiv.contentEditable = 'true'
        hiddenDiv.style.position = 'absolute'
        hiddenDiv.style.left = '-9999px'
        hiddenDiv.innerHTML = html

        // Append the hidden div to the body
        document.body.appendChild(hiddenDiv)

        // Select the content of the hidden div
        const range = document.createRange()
        range.selectNodeContents(hiddenDiv)
        const selection = window.getSelection()
        selection.removeAllRanges()
        selection.addRange(range)

        // Copy the selected content to the clipboard
        const copiedContent = document.execCommand('copy')

        // Remove the hidden div from the body
        document.body.removeChild(hiddenDiv)
    }

    private handleDefaultTemplateCopy = async () => {
        const id = this.state.templates[0].id
        await this.handleTemplateCopy(id)
    }

    private copyExistingRenderedToClipboard = async (
        rendered: string,
        templateId: number,
    ) => {
        const item = this.state.templates?.find(
            (item: Template) => item.id === templateId,
        )
        if (item.outputFormat === 'markdown' || item.outputFormat == null) {
            await copyToClipboard(rendered)
        }
        if (item.outputFormat === 'rich-text') {
            const htmlString = md.render(rendered)
            await this.copyRichTextToClipboard(htmlString)
        }
        this.setState({ errorCopyToClipboard: false })
        this.setState({ isLoading: false, copySuccess: true })
        this.props.setLoadingState?.('success')
        setTimeout(() => {
            this.setState({ copySuccess: false })
            this.props.setLoadingState?.('pristine')
        }, 3000)
    }

    private handleTemplateCopy = async (templateId: number) => {
        this.setState({ isLoading: true })
        this.props.setLoadingState?.('running')
        let rendered

        try {
            try {
                rendered = (await this.props.renderTemplate(templateId)) ?? null
                this.setState({ renderedTextBuffered: rendered })
            } catch (e) {
                console.error(e)
                this.props.setLoadingState?.('error')
            }
            try {
                await this.copyExistingRenderedToClipboard(rendered, templateId)
            } catch (e) {
                this.setState({ errorCopyToClipboard: true })
            }
        } catch (err) {
            console.error('Something went really bad copying:', err.message)
            Raven.captureException(err)
        } finally {
            analytics.trackEvent({
                category: 'TextExporter',
                action: 'copyToClipboard',
            })
            this.setState({ isLoading: false, copySuccess: true })
            this.props.setLoadingState?.('success')
            setTimeout(() => {
                this.setState({ copySuccess: false })
                this.props.setLoadingState?.('pristine')
            }, 3000)
        }
    }

    private handleTemplatePreview = async (
        template: Template,
        templateTypeInput?: 'originalPage' | 'examplePage',
        exportMode?: 'markdown' | 'rich-text',
    ) => {
        let templateType = this.state.templateType
        if (templateTypeInput != null) {
            templateType = templateTypeInput
        }

        if (templateType === 'originalPage') {
            this.setState({ isPreviewLoading: 'running' })
        }
        try {
            const rendered = await this.props.renderPreview(
                template,
                templateType,
            )

            if (this.state.templateType === 'originalPage') {
                this.setState({ isPreviewLoading: 'success' })
            }

            const outputFormat = exportMode ?? template.outputFormat

            if (outputFormat === 'markdown') {
                return rendered
            } else if (outputFormat === 'rich-text') {
                const htmlString = md.render(rendered)
                return htmlString
            }
        } catch (err) {
            this.setState({
                previewErrorMessage: (
                    <span>
                        Syntax error in the template. <br /> Usually a missing
                        bracket
                    </span>
                ),
                isPreviewLoading: 'error',
            })
        }
    }

    private handleTemplateReorder = async (
        id: number,
        oldIndex: number,
        newIndex: number,
    ) => {
        const templateToReorder = { ...this.findTemplateForId(id) }

        const orderedItems = this.state.templates.map((template) => ({
            id: template.id,
            key: template.order,
        }))
        // Moving an item "forwards" requires a +1 offset due to the algo inserting _before_ an index (see usage)
        const indexOffset = oldIndex < newIndex ? 1 : 0
        const changes =
            newIndex + 1 === orderedItems.length
                ? pushOrderedItem(orderedItems, id)
                : insertOrderedItemBeforeIndex(
                      orderedItems,
                      id,
                      newIndex + indexOffset,
                  )
        templateToReorder.order = changes.create.key

        this.setState({
            tmpTemplate: undefined,
            isNew: undefined,
            templates: [
                ...this.state.templates
                    .map((t) => (t.id === id ? templateToReorder : t))
                    .sort(defaultOrderableSorter),
            ],
        })

        await this.props.copyPasterBG.updateTemplate(templateToReorder)
    }

    private handleTemplateSave = async () => {
        const { tmpTemplate } = this.state

        if (tmpTemplate.id === -1) {
            const orderedItems = this.state.templates.map((template) => ({
                id: template.id,
                key: template.order,
            }))
            // Order new templates at the start of the list
            const changes =
                orderedItems.length === 0
                    ? pushOrderedItem(orderedItems, -1)
                    : insertOrderedItemBeforeIndex(orderedItems, -1, 0)
            tmpTemplate.order = changes.create.key
            await this.props.copyPasterBG.createTemplate(tmpTemplate)
        } else {
            await this.props.copyPasterBG.updateTemplate(tmpTemplate)
        }
        this.setState({ tmpTemplate: undefined, isNew: undefined })
        await this.syncTemplates()
    }

    render() {
        return (
            <CopyPaster
                isNew={this.state.isNew}
                templates={this.state.templates}
                isLoading={this.state.isLoading}
                isPreviewLoading={this.state.isPreviewLoading}
                templateType={this.state.templateType}
                copySuccess={this.state.copySuccess}
                onClickCopy={this.handleTemplateCopy}
                onClickSave={this.handleTemplateSave}
                onReorder={this.handleTemplateReorder}
                onClickDelete={this.handleTemplateDelete}
                copyExistingRenderedToClipboard={
                    this.copyExistingRenderedToClipboard
                }
                renderedTextBuffered={this.state.renderedTextBuffered}
                errorCopyToClipboard={this.state.errorCopyToClipboard}
                onClickOutside={this.props.onClickOutside}
                previewString={this.state.previewString}
                previewErrorMessage={this.state.previewErrorMessage}
                copyPasterEditingTemplate={this.state.tmpTemplate}
                onClickEdit={async (id) => {
                    const template = this.findTemplateForId(id)
                    let previewString = await this.handleTemplatePreview(
                        template,
                    )

                    this.setState({
                        tmpTemplate: template,
                        isNew: false,
                        previewString: previewString,
                    })
                }}
                onClickCancel={() => {
                    this.setState({
                        tmpTemplate: undefined,
                        isNew: undefined,
                    })
                }}
                onClickNew={() => {
                    this.setState({
                        previewString: null,
                    })
                    this.setState({
                        tmpTemplate: CopyPasterContainer.DEF_TEMPLATE,
                        isNew: true,
                    })
                }}
                onClickHowto={() => {
                    window.open(
                        'https://links.memex.garden/tutorials/text-exporter',
                    )
                }}
                onTitleChange={(title) => {
                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            title,
                        },
                    }))
                }}
                onOutputFormatChange={async (outputFormat) => {
                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            outputFormat,
                        },
                    }))
                    const previewString = await this.handleTemplatePreview(
                        this.state.tmpTemplate,
                        null,
                        outputFormat,
                    )
                    this.setState({
                        previewString: previewString,
                    })
                }}
                onCodeChange={async (code) => {
                    let templates = this.state.templates

                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            code,
                        },
                    }))

                    templates = templates.map((template) =>
                        template.id === this.state.tmpTemplate.id
                            ? this.state.tmpTemplate
                            : template,
                    )

                    this.setState({
                        templates: templates,
                    })

                    let currentTemplate = this.state.tmpTemplate

                    currentTemplate.code = code

                    try {
                        const previewString = await this.handleTemplatePreview(
                            currentTemplate,
                        )

                        this.setState({ previewString: previewString })
                    } catch (err) {
                        this.setState({ previewString: err.message })
                    }
                }}
                changeTemplateType={async (
                    templateType: 'originalPage' | 'examplePage',
                ) => {
                    this.setState({ templateType: templateType })
                    const previewString = await this.handleTemplatePreview(
                        this.state.tmpTemplate,
                        templateType,
                    )

                    this.setState({ previewString: previewString })
                }}
                getRootElement={this.props.getRootElement}
            />
        )
    }
}

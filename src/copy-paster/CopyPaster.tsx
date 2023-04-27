import React from 'react'

import analytics from 'src/analytics'
import { Template } from './types'
import CopyPaster from './components/CopyPaster'
import { copyToClipboard } from 'src/annotations/content_script/utils'
import * as Raven from 'src/util/raven'
import { RemoteCopyPasterInterface } from 'src/copy-paster/background/types'
const { richTextFromMarkdown } = require('@contentful/rich-text-from-markdown')
import TurndownService from 'turndown'
import MarkdownIt from 'markdown-it'

interface State {
    isLoading: boolean
    templates: Template[]
    tmpTemplate: Template | undefined
    isNew: boolean
}

const turndownService = new TurndownService({
    headingStyle: 'atx',
    hr: '---',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
})
const md = new MarkdownIt()
export interface Props {
    initTemplates?: Template[]
    onClickOutside: React.MouseEventHandler
    renderTemplate: (id: number) => Promise<string>
    copyPaster?: RemoteCopyPasterInterface
}

export default class CopyPasterContainer extends React.PureComponent<
    Props,
    State
> {
    static DEF_TEMPLATE: Template = {
        id: -1,
        title: '',
        code: '',
        isFavourite: false,
        outputFormat: 'markdown',
    }

    private copyPasterBG: RemoteCopyPasterInterface

    constructor(props: Props) {
        super(props)
        this.copyPasterBG = props.copyPaster
    }

    state: State = {
        isLoading: false,
        tmpTemplate: undefined,
        templates: this.props.initTemplates ?? [],
        isNew: undefined,
    }

    async componentDidMount() {
        await this.syncTemplates()
        this.setState({ isNew: undefined })
    }

    private async syncTemplates() {
        this.setState({ isLoading: true })
        const templates = await this.copyPasterBG.findAllTemplates()
        this.setState({ templates, isLoading: false })
    }

    private findTemplateForId(id: number): Template {
        const template = this.state.templates.find((t) => t.id === id)

        if (!template) {
            // TODO: error UI state
            console.error(`can't find template for ${id}`)
            return
        }

        return template
    }

    private handleTemplateFavourite = async (
        id: number,
        isFavourite: boolean,
    ) => {
        const template = this.findTemplateForId(id)

        await this.copyPasterBG.updateTemplate({
            ...template,
            isFavourite,
        })
        await this.syncTemplates()
    }
    private handleTemplateFormatChange = async (
        id: number,
        outputFormat: string,
    ) => {
        const template = this.findTemplateForId(id)

        await this.copyPasterBG.updateTemplate({
            ...template,
            outputFormat,
        })
        await this.syncTemplates()
    }

    private handleTemplateDelete = async () => {
        // NOTE: delete btn only appears in edit view, hence `state.tmpTemplate.id`
        //  will be set to the template currently being edited
        await this.copyPasterBG.deleteTemplate({
            id: this.state.tmpTemplate.id,
        })
        this.setState({ tmpTemplate: undefined })
        await this.syncTemplates()
    }

    async copyRichTextToClipboard(html) {
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
        document.execCommand('copy')

        // Remove the hidden div from the body
        document.body.removeChild(hiddenDiv)
    }

    private handleTemplateCopy = async (id: number) => {
        this.setState({ isLoading: true })

        try {
            const rendered = await this.props.renderTemplate(id)
            const item = this.state.templates.find((item) => item.id === id)

            if (item) {
                if (
                    item.outputFormat === 'markdown' ||
                    item.outputFormat == null
                ) {
                    await copyToClipboard(rendered)
                }
                if (item.outputFormat === 'richText') {
                    const htmlString = md.render(rendered)
                    await this.copyRichTextToClipboard(htmlString)
                }
            }
        } catch (err) {
            console.error('Something went really bad copying:', err.message)
            Raven.captureException(err)
        } finally {
            analytics.trackEvent({
                category: 'TextExporter',
                action: 'copyToClipboard',
            })
            this.setState({ isLoading: false })
        }
    }

    private handleTemplateSave = async () => {
        const { tmpTemplate } = this.state

        if (tmpTemplate.id === -1) {
            await this.copyPasterBG.createTemplate(tmpTemplate)
        } else {
            await this.copyPasterBG.updateTemplate(tmpTemplate)
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
                onClick={this.handleTemplateCopy}
                onClickSave={this.handleTemplateSave}
                onClickDelete={this.handleTemplateDelete}
                onClickOutside={this.props.onClickOutside}
                onSetIsFavourite={this.handleTemplateFavourite}
                copyPasterEditingTemplate={this.state.tmpTemplate}
                onClickEdit={(id) => {
                    const template = this.findTemplateForId(id)
                    this.setState({ tmpTemplate: template, isNew: false })
                }}
                onClickCancel={() => {
                    this.setState({
                        tmpTemplate: undefined,
                        isNew: undefined,
                    })
                }}
                onClickNew={() => {
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
                onOutputFormatChange={(outputFormat) => {
                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            outputFormat,
                        },
                    }))
                }}
                onCodeChange={(code) => {
                    this.setState((state) => ({
                        tmpTemplate: {
                            ...state.tmpTemplate,
                            code,
                        },
                    }))
                }}
            />
        )
    }
}

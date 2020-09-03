import React from 'react'

import { Template } from './types'
import CopyPaster from './components/CopyPaster'
import { copyPaster } from 'src/util/remote-functions-background'

interface State {
    isLoading: boolean
    templates: Template[]
    tmpTemplate: Template | undefined
}

export interface Props {
    onClickOutside: () => void
    normalizedPageUrls: string[]
    annotationUrls?: string[]
    initTemplates?: Template[]
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
    }

    static defaultProps: Partial<Props> = {
        annotationUrls: [],
    }

    private copyPasterBG = copyPaster

    state: State = {
        isLoading: false,
        tmpTemplate: undefined,
        templates: this.props.initTemplates ?? [],
    }

    async componentDidMount() {
        await this.syncTemplates()
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

    private handleTemplateDelete = async () => {
        // NOTE: delete btn only appears in edit view, hence `state.tmpTemplate.id`
        //  will be set to the template currently being edited
        await this.copyPasterBG.deleteTemplate({
            id: this.state.tmpTemplate.id,
        })
        this.setState({ tmpTemplate: undefined })
        await this.syncTemplates()
    }

    private handleTemplateCopy = async (id: number) => {
        this.setState({ isLoading: true })

        try {
            const rendered = await this.copyPasterBG.renderTemplate({
                id,
                annotationUrls: this.props.annotationUrls,
                normalizedPageUrls: this.props.normalizedPageUrls,
            })

            await navigator.clipboard.writeText(rendered)
        } catch (err) {
            console.error('Something went really bad copying:', err.message)
        } finally {
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

        this.setState({ tmpTemplate: undefined })
        await this.syncTemplates()
    }

    render() {
        return (
            <CopyPaster
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
                    this.setState({ tmpTemplate: template })
                }}
                onClickCancel={() => {
                    this.setState({ tmpTemplate: undefined })
                }}
                onClickNew={() => {
                    this.setState({
                        tmpTemplate: CopyPasterContainer.DEF_TEMPLATE,
                    })
                }}
                onClickHowto={() => {
                    window.open(
                        'https://worldbrain.io/tutorials/copy-templates',
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

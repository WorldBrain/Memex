import React from 'react'

import { Template, TemplateDoc } from './types'
import { renderTemplate } from './utils'
import CopyPaster from './components/CopyPaster'
import { copyPaster } from 'src/util/remote-functions-background'

interface State {
    tmpTemplate: Template | undefined
    templates: Template[]
}

export interface Props {
    onClickOutside: () => void
    initTemplates?: Template[]
    templateDoc: TemplateDoc
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

    private copyPasterBG = copyPaster

    state: State = {
        tmpTemplate: undefined,
        templates: this.props.initTemplates ?? [],
    }

    async componentDidMount() {
        await this.syncTemplates()
    }

    private async syncTemplates() {
        const templates = await this.copyPasterBG.findAllTemplates()
        this.setState({ templates })
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

    private handleTemplateCopy = (id: number) => {
        const template = this.findTemplateForId(id)
        const rendered = renderTemplate(template, this.props.templateDoc)

        navigator.clipboard.writeText(rendered).catch((e) => {
            console.error(e)
        })
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
                copyPasterEditingTemplate={this.state.tmpTemplate}
                templates={this.state.templates}
                onClick={this.handleTemplateCopy}
                onClickSave={this.handleTemplateSave}
                onClickDelete={this.handleTemplateDelete}
                onSetIsFavourite={this.handleTemplateFavourite}
                onClickOutside={this.props.onClickOutside}
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

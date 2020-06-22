import Storex from '@worldbrain/storex'
import { bindMethod } from 'src/util/functions'
import { BrowserSettingsStore } from 'src/util/settings'
import CopyPasterStorage from './storage'
import { RemoteCopyPasterInterface } from './types'
import { Template } from '../types'
import { makeRemotelyCallable } from 'src/util/webextensionRPC'

export default class CopyPasterBackground {
    storage: CopyPasterStorage
    remoteFunctions: RemoteCopyPasterInterface

    constructor(
        private options: {
            storageManager: Storex
        },
    ) {
        // makes the custom copy paster table in indexed DB
        this.storage = new CopyPasterStorage({
            storageManager: options.storageManager,
        })

        this.remoteFunctions = {
            createTemplate: bindMethod(this, 'createTemplate'),
            findTemplate: bindMethod(this, 'findTemplate'),
            updateTemplate: bindMethod(this, 'updateTemplate'),
            deleteTemplate: bindMethod(this, 'deleteTemplate'),
            findAllTemplates: bindMethod(this, 'findAllTemplates'),
        }

        makeRemotelyCallable(this.remoteFunctions)
    }

    async createTemplate(params: Omit<Template, 'id'>) {
        return this.storage.createTemplate(params)
    }

    async findTemplate(params: { id: number }) {
        return this.storage.findTemplate(params)
    }

    async updateTemplate(params: Template) {
        return this.storage.updateTemplate(params)
    }

    async deleteTemplate(params: { id: number }) {
        return this.storage.deleteTemplate(params)
    }

    async findAllTemplates() {
        return this.storage.findAllTemplates()
    }
}

import Storex from '@worldbrain/storex'
import { bindMethod } from 'src/util/functions'
import { BrowserSettingsStore } from 'src/util/settings'
import CopyPasterStorage from './storage'
import { RemoteCopyPasterInterface } from './types'

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
    }

    async createTemplate({ title, code, isFavourite = false }) {
        return this.storage.createTemplate({
            title,
            code,
            isFavourite,
        })
    }

    async findTemplate({ id }) {
        return this.storage.findTemplate({
            id,
        })
    }

    async updateTemplate({ id, title, code, isFavourite = false }) {
        return this.storage.updateTemplate({
            id,
            title,
            code,
            isFavourite,
        })
    }

    async deleteTemplate({ id }) {
        return this.storage.deleteTemplate({
            id,
        })
    }

    async findAllTemplates() {
        return this.storage.findAllTemplates()
    }
}

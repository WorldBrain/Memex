import Storex from '@worldbrain/storex'

import CopyPasterStorage from './storage'
import { RemoteCollectionsInterface } from './types'

import { bindMethod } from 'src/util/functions'

import { BrowserSettingsStore } from 'src/util/settings'

export default class CopyPasterBackground {
    storage: CopyPasterStorage
    remoteFunctions: RemoteCollectionsInterface

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

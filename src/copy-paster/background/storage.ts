import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { Template } from '../types'

const COLLECTION_NAMES = {
    templates: 'templates',
}

export default class CopyPasterStorage extends StorageModule {
    getConfig = (): StorageModuleConfig => ({
        collections: {
            [COLLECTION_NAMES.templates]: {
                version: new Date('2020-06-03'),
                fields: {
                    id: { type: 'int' },
                    title: { type: 'string' },
                    code: { type: 'string' },
                    isFavourite: { type: 'boolean' },
                },
                indices: [
                    { field: 'id', pk: true },
                    { field: 'title' },
                    { field: 'code' },
                    { field: 'isFavourite' },
                ],
            },
        },
        operations: {
            createTemplate: {
                collection: COLLECTION_NAMES.templates,
                operation: 'createObject',
            },
            findTemplate: {
                collection: COLLECTION_NAMES.templates,
                operation: 'findObject',
                args: { id: '$id:pk' },
            },
            updateTemplate: {
                collection: COLLECTION_NAMES.templates,
                operation: 'updateObject',
                args: [
                    { id: '$id:pk' },
                    {
                        title: '$title:string',
                        code: '$code:string',
                        isFavourite: '$isFavourite:boolean',
                    },
                ],
            },
            deleteTemplate: {
                collection: COLLECTION_NAMES.templates,
                operation: 'deleteObject',
                args: { id: '$id:pk' },
            },

            findAllTemplates: {
                collection: COLLECTION_NAMES.templates,
                operation: 'findObjects',
                args: [],
            },
        },
    })

    private getId(): number {
        return Date.now()
    }

    async createTemplate({ title, code, isFavourite }: Omit<Template, 'id'>) {
        const { object } = await this.operation('createTemplate', {
            id: this.getId(),
            title,
            code,
            isFavourite,
        })

        return object.id
    }

    async findTemplate({ id }: { id: number }) {
        return this.operation('findTemplate', { id })
    }

    async updateTemplate({ id, title, code, isFavourite }: Template) {
        return this.operation('updateTemplate', {
            id,
            title,
            code,
            isFavourite,
        })
    }

    async deleteTemplate({ id }: { id: number }) {
        return this.operation('deleteTemplate', { id })
    }

    async findAllTemplates() {
        return this.operation('findAllTemplates', {})
    }
}

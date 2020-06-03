import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'

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
                    { field: 'id', pk: true, autoInc: true },
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

    async createTemplate({
        title,
        code,
        isFavourite = false,
    }: {
        title: string
        code: string
        isFavourite?: boolean
    }) {
        const { object } = await this.operation('createTemplate', {
            title,
            code,
            isFavourite,
        })

        return object.id
    }

    async findTemplate({ id }: { id: number }) {
        return this.operation('findTemplate', { id })
    }

    async updateTemplate({
        id,
        title,
        code,
        isFavourite = false,
    }: {
        id: number
        title: string
        code: string
        isFavourite?: boolean
    }) {
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

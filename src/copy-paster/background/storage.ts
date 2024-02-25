import {
    StorageModule,
    StorageModuleConfig,
    StorageModuleConstructorArgs,
} from '@worldbrain/storex-pattern-modules'
import {
    COLLECTION_DEFINITIONS,
    COLLECTION_NAMES,
} from '@worldbrain/memex-common/lib/storage/modules/copy-paster/constants'
import type { Template } from '../types'

export default class CopyPasterStorage extends StorageModule {
    constructor(private options: StorageModuleConstructorArgs) {
        super(options)
    }

    getConfig = (): StorageModuleConfig => ({
        collections: { ...COLLECTION_DEFINITIONS },
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
                        code: '$code:string',
                        title: '$title:string',
                        order: '$order:number',
                        outputFormat: '$outputFormat:string',
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

    async __createTemplateWithId(template: Template) {
        const { object } = await this.options.storageManager.backend.operation(
            'createObject',
            COLLECTION_NAMES.templates,
            template,
        )
        return object.id
    }

    async createTemplate({
        title,
        code,
        order,
        outputFormat,
    }: Omit<Template, 'id'>) {
        const { object } = await this.operation('createTemplate', {
            id: this.getId(),
            title,
            code,
            order,
            isFavourite: false,
            outputFormat,
        })

        return object.id
    }

    async findTemplate({ id }: { id: number }): Promise<Template | null> {
        return this.operation('findTemplate', { id })
    }

    async updateTemplate({ id, title, code, order, outputFormat }: Template) {
        return this.operation('updateTemplate', {
            id,
            code,
            title,
            order,
            outputFormat,
        })
    }

    async deleteTemplate({ id }: { id: number }) {
        return this.operation('deleteTemplate', { id })
    }

    async findAllTemplates(): Promise<Template[]> {
        return this.operation('findAllTemplates', {})
    }
}

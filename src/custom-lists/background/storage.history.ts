import { StorageModuleHistory } from '@worldbrain/storex-pattern-modules'

export default {
    collections: {
        customLists: [
            {
                version: new Date(2018, 6, 12),
                fields: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    isDeletable: { type: 'boolean' },
                    isNestable: { type: 'boolean' },
                    createdAt: { type: 'datetime' },
                },
                indices: [
                    { field: 'id', pk: true },
                    { field: 'name', unique: true },
                    { field: 'isDeletable' },
                    { field: 'isNestable' },
                    { field: 'createdAt' },
                ],
            },
            {
                version: new Date('2019-08-21'),
                fields: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    isDeletable: { type: 'boolean' },
                    isNestable: { type: 'boolean' },
                    createdAt: { type: 'datetime' },
                    updatedAt: { type: 'datetime', optional: true },
                },
                indices: [
                    { field: 'id', pk: true },
                    { field: 'name', unique: true },
                    { field: 'isDeletable' },
                    { field: 'isNestable' },
                    { field: 'createdAt' },
                ],
            },
        ],
    },
} as StorageModuleHistory

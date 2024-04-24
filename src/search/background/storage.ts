import {
    StorageModule,
    StorageModuleConfig,
} from '@worldbrain/storex-pattern-modules'
import { SuggestPlugin, SuggestType } from '../plugins/suggest'

export default class SearchStorage extends StorageModule {
    getConfig = (): StorageModuleConfig => ({
        operations: {
            [SuggestPlugin.SUGGEST_OP_ID]: {
                operation: SuggestPlugin.SUGGEST_OP_ID,
                args: {
                    query: '$query:string',
                    type: '$type:string',
                    limit: '$limit:number',
                },
            },
            [SuggestPlugin.SUGGEST_EXT_OP_ID]: {
                operation: SuggestPlugin.SUGGEST_EXT_OP_ID,
                args: {
                    notInclude: '$notInclude:string[]',
                    type: '$type:string',
                    limit: '$limit:number',
                },
            },
        },
    })

    suggest = (args: { query: string; type: SuggestType; limit?: number }) =>
        this.operation(SuggestPlugin.SUGGEST_OP_ID, args)

    suggestExtended = (args: {
        notInclude?: string[]
        type: SuggestType
        limit?: number
    }) => this.operation(SuggestPlugin.SUGGEST_EXT_OP_ID, args)
}

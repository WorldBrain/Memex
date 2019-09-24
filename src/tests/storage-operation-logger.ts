import {
    StorageMiddleware,
    StorageMiddlewareContext,
} from '@worldbrain/storex/lib/types/middleware'

export interface LoggedStorageOperation {
    operation: any[]
    result: any
}

export default class StorageOperationLogger {
    public enabled: boolean

    private loggedOperations: LoggedStorageOperation[] = []

    constructor(options: { enabled: boolean }) {
        this.enabled = options.enabled
    }

    popOperations(): any[] {
        const loggedOperations = this.loggedOperations
        this.loggedOperations = []
        return loggedOperations
    }

    asMiddleware(): StorageMiddleware {
        return {
            process: async (context: StorageMiddlewareContext) => {
                const result = await context.next.process({
                    operation: context.operation,
                })
                if (this.enabled) {
                    this.loggedOperations.push({
                        operation: context.operation,
                        result,
                    })
                }
                return result
            },
        }
    }
}

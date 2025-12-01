import { v4 as uuidv4 } from 'uuid'
import type { RPCRequest, RPCRequestHeaders, RpcSideName } from './types'

export const createRPCRequestObject = <T>(
    headers: Pick<
        RPCRequestHeaders,
        'name' | 'tabId' | 'proxy' | 'originSide' | 'recipientSide'
    >,
    payload: T,
): RPCRequest<T> => ({
    headers: {
        type: 'RPC_REQUEST',
        id: uuidv4(),
        name: headers.name,
        tabId: headers.tabId,
        proxy: headers.proxy,
        originSide: headers.originSide,
        recipientSide: headers.recipientSide,
    },
    payload,
})

export const createRPCResponseObject = <T>(
    params: Omit<RPCRequest<T>, 'headers'> & {
        request: { headers: Pick<RPCRequestHeaders, 'id' | 'name'> }
        originSide: RpcSideName
        recipientSide: RpcSideName
    },
): RPCRequest<T> => {
    const {
        request: { headers },
    } = params
    return {
        headers: {
            type: 'RPC_RESPONSE',
            id: headers.id,
            name: headers.name,
            originSide: params.originSide,
            recipientSide: params.recipientSide,
        },
        payload: params.payload,
        error: params.error,
        serializedError: params.serializedError,
    }
}

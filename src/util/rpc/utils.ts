import uuid from 'uuid/v1'
import type { RPCRequest, RPCRequestHeaders } from './types'

export const createRPCRequestObject = <T>(
    { name, tabId, proxy }: Pick<RPCRequestHeaders, 'name' | 'tabId' | 'proxy'>,
    payload: T,
): RPCRequest<T> => ({
    headers: {
        type: 'RPC_REQUEST',
        id: uuid(),
        name,
        tabId,
        proxy,
    },
    payload,
})

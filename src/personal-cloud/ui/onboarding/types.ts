import type { UIServices } from 'src/services/ui/types'

export interface Dependencies {
    services: Pick<UIServices, 'overlay' | 'device' | 'logicRegistry'>
}

export interface State {}

export interface Event {}

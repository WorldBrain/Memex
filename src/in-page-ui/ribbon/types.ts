import TypedEventEmitter from 'typed-emitter'

export interface RibbonControllerInterface {
    showRibbon(): void
    hideRibbon(): void
}

export interface RibbonControllerEvents {
    requestCloseSidebar(): void
    showRibbon(): void
    hideRibbon(): void
}
export type RibbonControllerEventEmitter = TypedEventEmitter<
    RibbonControllerEvents
>

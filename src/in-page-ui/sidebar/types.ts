import TypedEventEmitter from 'typed-emitter'

export interface SidebarControllerInterface {
    showSidebar(): void
    hideSidebar(): void
}

export interface SidebarControllerEvents {
    showSidebar(): void
    hideSidebar(): void
}
export type SidebarControllerEventEmitter = TypedEventEmitter<
    SidebarControllerEvents
>

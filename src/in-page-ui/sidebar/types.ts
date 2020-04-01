import TypedEventEmitter from 'typed-emitter'

export interface SidebarUIControllerInterface {
    showSidebar(): void
    hideSidebar(): void
}

export interface SidebarUIControllerEvents {
    showSidebar(): void
    hideSidebar(): void
}
export type SidebarUIControllerEventEmitter = TypedEventEmitter<
    SidebarUIControllerEvents
>

export interface ToolbarNotificationsInterface {
    showToolbarNotification(type: string, extraProps: any): Promise<void>
}

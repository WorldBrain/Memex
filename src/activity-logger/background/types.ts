export interface ActivityLoggerInterface {
    toggleLoggingPause(minutes?: number): void
    isLoggingPaused(): Promise<boolean>
}

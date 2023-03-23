export interface PageSummaryBackgroundEvents {
    startSummaryStream(): void
    newSummaryToken(event: { token: string }): void
}

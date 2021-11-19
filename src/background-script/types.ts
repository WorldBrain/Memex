export type GenerateServerID = (collectionName: string) => number | string
export interface LocalExtensionSettings {
    installTimestamp: number
}

export interface OpenTabParams {
    openInSameTab?: boolean
}

export interface RemoteBGScriptInterface {
    openOptionsTab: (query: string, params?: OpenTabParams) => Promise<void>
    openOverviewTab: (
        params?: OpenTabParams & { missingPdf?: boolean },
    ) => Promise<void>
    openLearnMoreTab: (params?: OpenTabParams) => Promise<void>
}

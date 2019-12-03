export type UserFeatureOptIn = 'Auth' | 'Sync'
const allFeatures: UserFeatureOptIn[] = ['Auth', 'Sync']
const featureDefaults = {
    Auth: true,
    Sync: false,
}
export type UserFeatureOptInMap = {
    [key in UserFeatureOptIn]: boolean
}
export interface FeaturesInterface {
    getFeatures(): UserFeatureOptInMap
    toggleFeature(feature: UserFeatureOptIn): void
    getFeature(feature: UserFeatureOptIn): boolean
}

export class FeatureOptIns implements FeaturesInterface {
    private keyPrefix = 'FeatureOptIn_'

    public getFeatures = (): UserFeatureOptInMap => {
        const allFeatureOptions = {} as UserFeatureOptInMap
        for (const feature of allFeatures) {
            allFeatureOptions[feature] = this.getFeature(feature)
        }
        return allFeatureOptions
    }

    public getFeature = (feature: UserFeatureOptIn): boolean => {
        const val = localStorage.getItem(`${this.keyPrefix}${feature}`)
        return val !== null ? JSON.parse(val) : featureDefaults[feature]
    }

    public toggleFeature = (feature: UserFeatureOptIn) => {
        const val = this.getFeature(feature)
        localStorage.setItem(
            `${this.keyPrefix}${feature}`,
            JSON.stringify(!val),
        )
    }
}

const allFeatures = ['Auth', 'Sync']

export interface FeaturesInterface {
    getFeatures(): { [key: string]: boolean }
    toggleFeature(feature): void
    getFeature(feature): boolean
}

export class FeatureOptIns implements FeaturesInterface {
    private keyPrefix = 'FeatureOptIn_'

    public getFeatures = () => {
        const allFeatureOptions = {}
        for (const feature of allFeatures) {
            allFeatureOptions[feature] = this.getFeature(feature)
        }
        return allFeatureOptions
    }

    public getFeature = (feature: string): boolean => {
        const val = localStorage.getItem(`${this.keyPrefix}${feature}`)
        return val !== null ? JSON.parse(val) : false
    }

    public toggleFeature = feature => {
        const val = this.getFeature(feature)
        localStorage.setItem(
            `${this.keyPrefix}${feature}`,
            JSON.stringify(!val),
        )
    }
}

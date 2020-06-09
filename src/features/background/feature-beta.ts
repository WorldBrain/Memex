export type UserBetaFeature = 'Reader View' | 'Copy Paster'

const allFeatures: UserBetaFeature[] = ['Reader View', 'Copy Paster']
const featureDefaults = {
    'Reader View': false,
    'Copy Paster': false,
}

export type UserBetaFeatureMap = {
    [key in UserBetaFeature]: boolean
}
export interface FeaturesBetaInterface {
    getFeatures(): Promise<UserBetaFeatureMap>
    toggleFeature(feature: UserBetaFeature): void
    getFeature(feature: UserBetaFeature): Promise<boolean>
}

export class FeaturesBeta implements FeaturesBetaInterface {
    private keyPrefix = 'BetaFeature_'

    public getFeatures = async (): Promise<UserBetaFeatureMap> => {
        const allFeatureOptions = {} as UserBetaFeatureMap
        for (const feature of allFeatures) {
            allFeatureOptions[feature] = await this.getFeature(feature)
        }
        return allFeatureOptions
    }

    public getFeature = async (feature: UserBetaFeature): Promise<boolean> => {
        const val = localStorage.getItem(`${this.keyPrefix}${feature}`)
        if (val !== null) {
            // If the user has saved a value, use that
            return JSON.parse(val)
        } else {
            // Otherwise use a static default
            return featureDefaults[feature]
        }
    }

    public toggleFeature = async (feature: UserBetaFeature) => {
        const val = await this.getFeature(feature)
        localStorage.setItem(
            `${this.keyPrefix}${feature}`,
            JSON.stringify(!val),
        )
    }
}

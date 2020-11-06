export type UserBetaFeatureId = 'pdf-annotations' | 'sharing-collections'

export interface UserBetaFeature {
    id: UserBetaFeatureId
    name: string
    description: string
    link: string
    enabled: boolean // (by default)
    available: boolean
}
const allFeatures: UserBetaFeature[] = [
    {
        id: 'pdf-annotations',
        name: 'PDF Annotations',
        description:
            'Annotate PDFs via the Memex extension (no phone support yet)',
        link: undefined,
        enabled: false,
        available: false,
    },
    // {
    //     id: 'reader',
    //     name: 'Offline-first Reader & Mobile Annotations',
    //     description:
    //         'Have local & clean-view copies of websites you read. Create annotations on your mobile phone',
    //     link: 'https://worldbrain.io/projects/reader',
    //     enabled: false,
    //     available: false,
    // },
    {
        id: 'sharing-collections',
        name: 'Sharing Collections & Annotations',
        description:
            'Easily share timeless repositories of quality content, feedback on articles, and create references to important text passages.',
        link: 'https://worldbrain.io/tutorials/share-research',
        enabled: true,
        available: true,
    },
]

export type UserBetaFeatureMap = {
    [key in UserBetaFeatureId]: boolean
}
export interface FeaturesBetaInterface {
    getFeatures(): Promise<UserBetaFeature[]>
    toggleFeature(feature: UserBetaFeatureId): Promise<void>
    getFeatureState(feature: UserBetaFeatureId): Promise<boolean>
}

export class FeaturesBeta implements FeaturesBetaInterface {
    private keyPrefix = 'BetaFeature_'

    public getFeatures = async (): Promise<UserBetaFeature[]> => {
        const allFeatureOptions = allFeatures
        for (const feature of allFeatures) {
            feature.enabled = await this.getFeatureState(feature.id)
        }
        return allFeatureOptions
    }

    public getFeatureState = async (
        featureId: UserBetaFeatureId,
    ): Promise<boolean> => {
        const val = localStorage.getItem(`${this.keyPrefix}${featureId}`)
        if (val !== null) {
            // If the user has saved a value, use that
            return JSON.parse(val)
        } else {
            // Otherwise use a static default
            return allFeatures.find((feature) => feature.id === featureId)
                .enabled
        }
    }

    public toggleFeature = async (featureId: UserBetaFeatureId) => {
        const val = await this.getFeatureState(featureId)
        localStorage.setItem(
            `${this.keyPrefix}${featureId}`,
            JSON.stringify(!val),
        )
    }
}

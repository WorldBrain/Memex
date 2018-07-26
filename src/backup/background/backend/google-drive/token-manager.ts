export class DriveTokenManager {
    public tokenStore: DriveTokenStore
    public accessToken: string
    public memexCloudOrigin: string
    private refreshToken: string
    private lastTokenRefresh: Date
    private tokenExpiryDate: Date

    constructor({ tokenStore, memexCloudOrigin }: { tokenStore: DriveTokenStore, memexCloudOrigin: string }) {
        this.tokenStore = tokenStore
        this.tokenStore.retrieveAccessToken().then(({ token, expiryDate }) => {
            if (token) {
                this.accessToken = token
                this.tokenExpiryDate = expiryDate
            }
        })
        this.tokenStore.retrieveRefreshToken().then(token => {
            if (token) {
                this.refreshToken = token
            }
        })
        this.memexCloudOrigin = memexCloudOrigin
    }

    async handleNewTokens({ accessToken, refreshToken, expiresInSeconds }: { accessToken: string, refreshToken?: string, expiresInSeconds: number }) {
        this.lastTokenRefresh = new Date()
        this.tokenExpiryDate = new Date(Date.now() + expiresInSeconds * 1000)
        this.accessToken = accessToken
        await this.tokenStore.storeAccessToken(this.accessToken, this.tokenExpiryDate)
        if (refreshToken) {
            this.refreshToken = refreshToken
            await this.tokenStore.storeRefreshToken(this.refreshToken)
        }
    }

    async refreshAccessToken({ force }: { force?: boolean } = {}) {
        if (!force && !this.isAccessTokenExpired()) {
            return
        }

        const response = await fetch(`${this.memexCloudOrigin}/auth/google/refresh`, {
            method: 'POST',
            credentials: 'include',
            body: JSON.stringify({
                refreshToken: this.refreshToken
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        const { accessToken, expiresInSeconds } = await response.json()
        await this.handleNewTokens({ accessToken, expiresInSeconds })
    }

    // margin says how much time before the actual expiry time in ms we actually want to refresh the token
    isAccessTokenExpired({ margin = 1000 * 60 * 10 } = {}): boolean {
        const conservateExpiryTime = this.tokenExpiryDate.getTime() - margin
        return Date.now() >= conservateExpiryTime
    }
}

export type DriveTokenType = 'access' | 'refresh'
export interface DriveTokenStore {
    storeAccessToken(token: string, expiryDate: Date): Promise<any>
    retrieveAccessToken(): Promise<{ token: string, expiryDate: Date }>

    storeRefreshToken(token: string): Promise<any>
    retrieveRefreshToken(): Promise<string>
}

export class LocalStorageDriveTokenStore implements DriveTokenStore {
    prefix: string

    constructor({ prefix }: { prefix: string }) {
        this.prefix = prefix
    }

    async storeAccessToken(token: string, expiryDate: Date): Promise<any> {
        localStorage.setItem(this.prefix + 'access', token)
        localStorage.setItem(this.prefix + 'access-expiry', expiryDate.getTime().toString())
    }

    async retrieveAccessToken() {
        const expiryString = localStorage.getItem(this.prefix + 'access-expiry')
        return {
            token: localStorage.getItem(this.prefix + 'access'),
            expiryDate: expiryString && new Date(parseFloat(expiryString)),
        }
    }

    async storeRefreshToken(token: string) {
        localStorage.setItem(this.prefix + 'refresh', token)
    }

    async retrieveRefreshToken() {
        return localStorage.getItem(this.prefix + 'refresh')
    }
}

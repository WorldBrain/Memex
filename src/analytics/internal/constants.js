export const API_HOST =
    'https://a8495szyaa.execute-api.eu-central-1.amazonaws.com/' +
    (process.env.NODE_ENV === 'production' ? 'production' : 'staging')

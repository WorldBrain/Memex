import path from 'path'
export const TEST_PDF_PATH = path.resolve(__dirname, 'test.pdf')
export const TEST_PDF_PAGE_TEXTS = [
    'What a wonderful PDF test monkey with banana!',
]
export const TEST_PDF_METADATA = {
    info: {
        IsAcroFormPresent: false,
        IsCollectionPresent: false,
        IsLinearized: false,
        IsXFAPresent: false,
        PDFFormatVersion: '1.4',
        Producer: 'Skia/PDF m93 Google Docs Renderer',
        Title: 'test',
    },
}

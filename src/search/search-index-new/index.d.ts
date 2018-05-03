import { PageAddRequest, VisitInteraction } from './types'

export function addPage(input: PageAddRequest): Promise<void>

export function addTag(url: string, tag: string): Promise<void>

export function updateTimestampMeta(
    url: string,
    timestamp: number,
    data: Partial<VisitInteraction>,
): Promise<void>

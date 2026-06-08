import { config } from '../config.ts'
import { categoryPromptList } from './categories.ts'

interface TxInput {
    id: number
    libelle: string
    type: string
}

interface AiCategoryResult {
    id: number
    categorie_id: string
}

function buildPrompt(transactions: TxInput[]): string {
    return `Tu es un assistant de catégorisation de dépenses bancaires.
    Pour chaque transaction, choisis UNE catégorie parmi cette liste exacte (utilise uniquement l'identifiant, pas le libellé) :
    ${categoryPromptList()}
    Transactions à catégoriser :
    ${JSON.stringify(transactions)}

    Réponds UNIQUEMENT avec un JSON valide de ce format exact :
    {"categories":[{"id":123,"categorie_id":"nourriture"}]}
    `
}

export async function categorizeWithOllama(
    transactions: Array<{ id: number; original_wording: string; transaction_type: string }>,
): Promise<AiCategoryResult[]> {
    if (transactions.length === 0) return []

    const inputs: TxInput[] = transactions.map((tx) => ({
        id: tx.id,
        libelle: tx.original_wording,
        type: tx.transaction_type,
    }))

    const url = `${config.ollama.host.replace(/\/$/, '')}/api/generate`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000)

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollama.model,
                prompt: buildPrompt(inputs),
                stream: false,
                format: 'json',
            }),
            signal: controller.signal,
        })

        const body = await response.text()
        if (!response.ok)
            throw new Error(`ollama returned ${response.status}: ${body}`)

        const ollamaResp = JSON.parse(body) as { response: string }
        const payload = JSON.parse(ollamaResp.response) as { categories: AiCategoryResult[] }
        return payload.categories ?? []
    } finally {
        clearTimeout(timeout)
    }
}

export const allowedCategories: Record<string, string> = {
    nourriture: 'Nourriture (restaurants, courses, supermarchés)',
    abonnement: 'Abonnements (streaming, télécom, salle de sport)',
    loisirs: 'Loisirs (cinéma, jeux, vacances, spectacles)',
    transport: 'Transport (essence, train, taxi, parking)',
    logement: 'Logement (loyer, électricité, eau, charges)',
    sante: 'Santé (pharmacie, médecin, mutuelle)',
    shopping: 'Shopping (vêtements, électronique, décoration)',
    banque: 'Banque & frais (agios, commissions bancaires)',
    credit: 'Crédits (remboursements de prêts)',
    autre: 'Autre (si aucune catégorie ne convient)',
}

export function isValidCategory(category: string): boolean {
    return category in allowedCategories
}

export function categoryPromptList(): string {
    return Object.entries(allowedCategories)
        .map(([id, label]) => `- ${id}: ${label}`)
        .join('\n')
}

export function scanCategorieId(value: string | null | undefined): string {
    return value ?? ''
}

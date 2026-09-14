import type { CategorySlug } from './lib/categories'

// All user-facing French copy lives here — nothing hard-coded in components.
export const strings = {
  appName: 'Inventaire',
  // Enrolment
  enrolTitle: 'Bienvenue',
  enrolIntro: 'Entrez votre prénom et le mot de passe partagé.',
  firstName: 'Prénom',
  passphrase: 'Mot de passe',
  enrolSubmit: 'Commencer',
  enrolWrongPassphrase: 'Mot de passe incorrect.',
  enrolOffline:
    'Impossible de vérifier le mot de passe hors ligne. Réessayez avec du réseau.',
  // List
  searchPlaceholder: 'Rechercher un article…',
  addItem: 'Ajouter',
  emptyList: 'Aucun article. Ajoutez-en un.',
  noResults: 'Aucun résultat.',
  showAll: 'Tout',
  showShoppingList: 'Liste de courses',
  shoppingListEmpty: 'Rien à racheter.',
  // Form
  formAddTitle: 'Nouvel article',
  formEditTitle: 'Modifier l’article',
  name: 'Nom',
  category: 'Catégorie',
  quantity: 'Quantité',
  unit: 'Unité (optionnel)',
  save: 'Enregistrer',
  cancel: 'Annuler',
  // Sync
  syncing: 'Synchronisation…',
  syncOffline: 'Hors ligne',
  syncError: 'Échec de la synchronisation',
  // PWA
  updateAvailable: 'Une nouvelle version est disponible.',
  reload: 'Recharger',
} as const

export const categoryLabels: Record<CategorySlug, string> = {
  alimentation: 'Alimentation',
  boissons: 'Boissons',
  entretien: 'Entretien',
  hygiene: 'Hygiène',
  cuisine: 'Cuisine',
  outils: 'Outils',
  other: 'Autre',
}

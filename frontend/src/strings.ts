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
  enrolTooManyAttempts: 'Trop de tentatives. Réessayez dans quelques minutes.',
  reenrolTitle: 'Mot de passe à ressaisir',
  reenrolIntro:
    'Le serveur a refusé la connexion. Ressaisissez le mot de passe partagé pour reprendre la synchronisation. Vos modifications sont conservées.',
  // List
  searchLabel: 'Rechercher un article',
  searchPlaceholder: 'Rechercher un article…',
  addItem: 'Ajouter',
  emptyList: 'Aucun article. Ajoutez-en un.',
  noResults: 'Aucun résultat.',
  showAll: 'Tout',
  showShoppingList: 'Liste de courses',
  shoppingListEmpty: 'Rien à racheter.',
  categoryEmpty: 'Aucun article dans cette catégorie.',
  updatedOn: 'Modifié le',
  updatedBy: 'par',
  decrease: (name: string) => `Retirer 1 à ${name}`,
  increase: (name: string) => `Ajouter 1 à ${name}`,
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
  syncUnauthorized: 'Synchronisation suspendue : mot de passe à ressaisir.',
  reenrolAction: 'Ressaisir',
  // PWA
  updateAvailable: 'Une nouvelle version est disponible.',
  reload: 'Recharger',
} as const

export const categoryLabels: Record<CategorySlug, string> = {
  alimentation: 'Alimentation',
  boissons: 'Boissons',
  entretien: 'Entretien',
  hygiene: 'Hygiène',
  outils: 'Outils',
  other: 'Autre',
}

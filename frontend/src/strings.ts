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
  searchPlaceholder: 'Rechercher un article',
  addItem: 'Ajouter un article',
  filterLabel: 'Filtrer les articles',
  lastSynced: (when: string) => `Mis à jour ${when}`,
  neverSynced: 'Pas encore synchronisé',
  emptyList: 'Aucun article. Ajoutez-en un.',
  noResults: 'Aucun résultat.',
  showAll: 'Tout',
  showEmpty: (count: number) => `Épuisés · ${count}`,
  shoppingListEmpty: 'Rien à racheter.',
  categoryEmpty: 'Aucun article dans cette catégorie.',
  // Form
  formAddTitle: 'Nouvel article',
  formEditTitle: 'Modifier l’article',
  name: 'Nom',
  category: 'Catégorie',
  quantity: 'Quantité au chalet',
  unit: 'Unité',
  optional: '(facultatif)',
  noUnit: 'sans unité',
  stepDown: 'Moins un',
  stepUp: 'Plus un',
  save: 'Enregistrer',
  lastEdited: (when: string, who: string) => `Modifié ${when} par ${who}`,
  // Sync
  syncing: 'Synchronisation…',
  syncError: 'Échec de la synchronisation',
  syncUnauthorized: 'Synchronisation suspendue : mot de passe à ressaisir.',
  reenrolAction: 'Ressaisir',
  // Shared components (design)
  close: 'Fermer',
  pending: 'Pas encore envoyé',
  empty: 'Épuisé',
  minusOne: (name: string) => `${name} : moins un`,
  plusOne: (name: string) => `${name} : plus un`,
  offlineTitle: 'Pas de réseau, tout marche quand même',
  offlinePending: (n: number) =>
    n === 1
      ? '1 changement est gardé sur ce téléphone. Il partira dès que vous aurez du réseau.'
      : `${n} changements sont gardés sur ce téléphone. Ils partiront dès que vous aurez du réseau.`,
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
  other: 'Autres',
}

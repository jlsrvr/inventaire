import type { CategorySlug } from './lib/categories'

// All user-facing French copy lives here — nothing hard-coded in components.
export const strings = {
  appName: 'Inventaire',
  // Enrolment
  enrolTagline: 'Ce qu’il y a au chalet, pour savoir quoi acheter avant de monter.',
  enrolHelp: 'Pas de mot de passe ? Demandez-le à la personne qui vous a envoyé le lien.',
  enrolOfflineNote: 'Une fois connecté, l’application marche aussi sans réseau, au chalet.',
  showPassword: 'Afficher',
  hidePassword: 'Masquer',
  firstName: 'Prénom',
  passphrase: 'Mot de passe',
  enrolSubmit: 'Entrer',
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
  namePlaceholder: 'Ex. : café, piles, éponges',
  unitPlaceholder: 'Ex. : kg, bouteilles, paquets',
  addSubmit: 'Ajouter à l’inventaire',
  addNote: 'Gardé sur ce téléphone, puis envoyé aux autres dès qu’il y a du réseau.',
  duplicateWarning: (name: string, category: string) => `« ${name} » existe déjà dans ${category}.`,
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
  // Synchronisation
  syncTitle: 'Synchronisation',
  syncButton: (state: string, pending: number) =>
    pending === 0
      ? `Synchronisation : ${state}`
      : `Synchronisation : ${state}, ${pending} changement${pending > 1 ? 's' : ''} en attente`,
  syncState: {
    offline: 'hors ligne',
    syncing: 'envoi en cours',
    unauthorized: 'mot de passe à ressaisir',
    failed: 'échec',
    pending: 'en attente d’envoi',
    done: 'à jour',
  },
  syncOfflineTitle: 'En attente de réseau',
  syncOfflineBody: (n: number) =>
    n === 0
      ? 'Aucun changement en attente sur ce téléphone.'
      : n === 1
        ? '1 changement est gardé sur ce téléphone. Rien n’est perdu : il partira dès que vous aurez du réseau.'
        : `${n} changements sont gardés sur ce téléphone. Rien n’est perdu : ils partiront dès que vous aurez du réseau.`,
  syncingTitle: 'Envoi en cours…',
  syncDoneTitle: 'Tout est à jour',
  syncFailedBody: 'Vos changements sont gardés sur ce téléphone. Réessayez dans un moment.',
  syncPendingTitle: 'Changements à envoyer',
  syncPendingBody: (n: number) =>
    n === 1 ? '1 changement part dans un instant.' : `${n} changements partent dans un instant.`,
  lastSent: (when: string) => `Dernier envoi : ${when}`,
  neverSent: 'Dernier envoi : jamais',
  retry: 'Réessayer',
  changeNew: 'Nouvel article',
  changeEdited: 'Modifié',
  changeQuantity: (from: string, to: string, unit: string | null) =>
    `${from} → ${to}${unit ? ` ${unit}` : ''}`,
  // Aide
  helpTitle: 'Aide',
  helpLink: 'Comment ça marche ?',
  helpHowTitle: 'Comment les changements sont envoyés',
  helpSteps: [
    {
      title: 'Au chalet, sans réseau',
      body: 'Comptez normalement. Tout est gardé sur votre téléphone, même si vous fermez l’application.',
    },
    {
      title: 'De retour avec du réseau',
      body: 'Ouvrez l’application. Vos changements partent tout seuls vers les autres téléphones.',
    },
    {
      title: 'C’est envoyé',
      body: 'L’icône du nuage disparaît des articles et la date « Mis à jour » change.',
    },
  ],
  helpConflictNote: 'Si deux personnes comptent le même article, l’application s’en occupe toute seule.',
  helpWarning:
    'Ne supprimez pas l’application avant d’avoir du réseau : les changements pas encore envoyés seraient perdus.',
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

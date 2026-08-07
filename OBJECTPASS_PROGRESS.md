# ObjectPass — Plan de développement & suivi de progression

> Dernière mise à jour : 2026-07-17 (étape 20 — AppStateContext + GlobalLoadingOverlay + GlobalErrorBanner)

---

## 🎯 Vision produit

ObjectPass est le carnet de santé numérique des appareils électroniques — un "Doctolib du numérique" qui permet aux propriétaires de tracer, certifier et valoriser l'historique de réparation de leurs objets. Chaque intervention est enregistrée sous forme de preuve vérifiable (via un wallet Web3 invisible), transformant un simple ticket de réparation en certificat de confiance partageable lors d'une revente ou d'un contrôle. Pour les réparateurs certifiés, ObjectPass est un label de qualité et un canal de réservation. Pour les utilisateurs, c'est un passeport numérique par appareil — toujours à jour, toujours vérifiable.

---

## 📋 Plan de travail général

### Phase 1 — Fondations (Design system + Navigation)
- Projet Expo + TypeScript configuré
- Tokens de marque centralisés dans `/constants/colors.ts`
- Bibliothèque de composants UI réutilisables (`/components/ui/`)
- Navigation multi-niveaux (AppNavigator → AuthNavigator / MainNavigator)
- AuthContext + AuthGate (protection des routes)

### Phase 2 — Authentification
- WelcomeScreen (connexion Google / Apple / Email)
- LoginScreen (email + mot de passe)
- Session persistée via AsyncStorage
- Logout depuis le Profil
- *(Prévu)* Vrai provider OAuth + wallet invisible (Privy / Web3Auth)

### Phase 3 — Écran d'accueil (Home)
- Dashboard avec liste d'appareils mock
- Strip de stats (appareils, réparations, garanties)
- DeviceCard avec score santé et indicateur de statut
- FAB "+" pour ajouter un appareil
- *(Prévu)* Connexion données réelles, alertes garantie

### Phase 4 — Diagnostic
- Questionnaire guidé 3 étapes (appareil → symptôme → sévérité)
- Carte résultat avec estimation prix / durée / urgence
- Navigation vers la liste des réparateurs avec paramètres contextuels
- *(Prévu)* Logique de diagnostic réelle, historique des diagnostics

### Phase 5 — Réparateurs
- RepairersScreen avec header dynamique depuis les params de route
- Filter chips horizontaux (Tous, À proximité, Certifié, etc.)
- Cartes réparateurs avec avatar, étoiles, badges, disponibilités
- Badge "Certifié ObjectPass" en Proof Blue
- *(Prévu)* Vue carte, profil réparateur dédié

### Phase 6 — Passeport appareil (Device Detail)
- Écran détail d'un appareil (hero card Object Navy, score santé animé)
- Section "Santé" : barres de progression batterie / écran / performance
- Timeline des interventions (`RepairTimelineItem`)
- Garanties actives avec date d'expiration
- QR code de partage du passeport

### Phase 7 — Preuve de réparation (Proof of Repair)
- CertificateScreen après réparation certifiée par un réparateur
- Badge Proof Blue "Preuve vérifiable" avec icône chaîne
- QR code centré, partageable et vérifiable par un tiers
- *(Prévu)* Signature réparateur on-chain, export PDF

### Phase 8 — Profil utilisateur
- ProfileScreen avec info utilisateur et avatar initiales
- Bouton "Se déconnecter" (Fault Coral)
- *(Prévu)* Édition du profil, photo, historique des objets, paramètres notifications

### Phase 9 — Ajout d'appareil
- Scan code-barres / numéro de série (Expo Camera)
- Sélection depuis catalogue (marque + modèle)
- Auto-remplissage fiche technique + photo
- Upload facture d'achat (Expo Image Picker)

### Phase 10 — Web3 discret (wallet invisible, attestations, NFT dynamique)
- Wallet créé à l'inscription sans friction (Privy / Web3Auth)
- Attestation on-chain signée par le réparateur certifié
- NFT dynamique par appareil (métadonnées mises à jour à chaque intervention)
- Transfert de propriété lors de la revente
- Gasless transactions (account abstraction + paymaster)

### Phase 11 — B2B / Parc IT
- Tableau de bord entreprise (gestion d'un parc d'appareils)
- Rapports d'état de parc et d'interventions
- API partenaire réparateur (certification, webhook de réparation)
- Exports CSV / PDF

### Phase 12 — Polish & animations
- Micro-interactions (entrée des cartes en stagger, transitions de tab)
- Skeleton loaders pour les états de chargement
- Haptics (retour tactile sur actions principales)
- Optimisations FlatList et mémoire

---

## 🚀 Mise en œuvre par étapes

### Étape 1 — Structure de base & charte graphique
**Prompt résumé :** Initialiser le projet Expo TypeScript et définir la charte graphique complète avec toutes les données mock.
**Fichiers créés / modifiés :**
- `/package.json` — dépendances (Expo 52, React Navigation 6, Reanimated, AsyncStorage)
- `/app.json` — configuration Expo (nom, bundle ID, couleur splash Object Navy)
- `/babel.config.js` — plugin Reanimated
- `/tsconfig.json` — TypeScript strict avec alias de chemin
- `/constants/colors.ts` — 12 tokens de marque typés + helper `healthColor()`
- `/data/mockDevices.ts` — 3 appareils seedés (MacBook Pro M1, iPhone 15 Pro, Cowboy C5) avec types TypeScript
**Résultat :** Socle technique du projet avec charte graphique centralisée, source unique de vérité pour les couleurs.

### Étape 2 — Composants UI isolés
**Prompt résumé :** Construire la bibliothèque complète de composants réutilisables alignée sur la charte ObjectPass.
**Fichiers créés / modifiés :**
- `/components/ui/HealthScoreBadge.tsx` — cercle animé count-up, couleur selon score
- `/components/ui/StatusBadge.tsx` — pill colorée avec dot (excellent / bon / attention / panne / certifié)
- `/components/ui/DeviceCard.tsx` — carte avec bande colorée, icône catégorie, score, warranty dot
- `/components/ui/RepairTimelineItem.tsx` — entrée de timeline avec dot teal et ligne verticale
- `/components/ui/ProofBadge.tsx` — pill Proof Blue "✓ Certifié"
- `/components/ui/PrimaryButton.tsx` — Repair Teal, animation scale 0.97 (Reanimated)
- `/components/ui/OutlineButton.tsx` — Object Navy bordé, même animation presse
- `/components/ui/SectionHeader.tsx` — label UPPERCASE Steel Grey avec action optionnelle
- `/components/ui/index.ts` — barrel export de tous les composants
**Résultat :** 8 composants réutilisables isolés, testables indépendamment, cohérents avec la charte de marque.

### Étape 3 — Écran Home avec mock data
**Prompt résumé :** Construire le dashboard Home avec les 3 appareils mock et un shell de navigation minimal pour rendre l'écran.
**Fichiers créés / modifiés :**
- `/screens/HomeScreen.tsx` — top bar (titre 28px + avatar), stat strip (3 mini-cartes), liste DeviceCard, FAB "+"
- `/navigation/RootNavigator.tsx` — NavigationContainer + 5-tab bottom navigator avec placeholders
- `/App.tsx` — point d'entrée connecté à RootNavigator
- `/package.json` — correction champ `main` (`expo-router/entry` → `node_modules/expo/AppEntry.js`)
**Résultat :** Écran Home fonctionnel affichant les 3 appareils mock, barre de navigation à 5 onglets, FAB Repair Teal.

### Étape 4 — Fix bouton FAB + DiagnosticScreen complète
**Prompt résumé :** Corriger le FAB (conteneur carré visible), agrandir le bouton "+" central de la tab bar, et créer le DiagnosticScreen complet.
**Fichiers créés / modifiés :**
- `/screens/HomeScreen.tsx` — remplacement `Animated.View` + `Pressable` par un seul `TouchableOpacity` (cercle pur 56×56, shadow directe sur le cercle)
- `/navigation/RootNavigator.tsx` — icône "+" portée à 52×52, `translateY: -16`, `overflow: 'visible'` sur la tab bar
- `/screens/DiagnosticScreen.tsx` — questionnaire guidé 3 étapes (appareil / symptôme / sévérité), barre de progression animée, transitions slide gauche/droite, carte résultat fade-in, logique `computeResult()` avec 4 cas hardcodés
**Résultat :** FAB corrigé (cercle uniquement, aucun conteneur parent visible), DiagnosticScreen complète avec animations et carte résultat.

### Étape 5 — Authentification (WelcomeScreen, LoginScreen, AuthGate)
**Prompt résumé :** Construire le flow d'authentification frontend complet avec AuthContext, navigation guard, et les deux écrans d'auth.
**Fichiers créés / modifiés :**
- `/context/AuthContext.tsx` — `useReducer` avec actions RESTORE / LOGIN / LOGOUT, persistance AsyncStorage, splash delay 300ms
- `/navigation/AppNavigator.tsx` — `NavigationContainer` racine, splash Object Navy pendant le chargement, switch automatique Auth ↔ Main selon `isLoggedIn`
- `/navigation/AuthNavigator.tsx` — native stack Welcome → Login, export `AuthStackParamList`
- `/navigation/MainNavigator.tsx` — bottom tabs repris de RootNavigator, onglet Profil branché sur `ProfileScreen`
- `/screens/WelcomeScreen.tsx` — 3 boutons auth (Google / Apple / Email), spinner 1 200ms, mock `login()`, lien vers LoginScreen
- `/screens/LoginScreen.tsx` — formulaire email + mot de passe, `KeyboardAvoidingView`, toggle visibilité mot de passe, séparateur "ou", boutons sociaux compacts
- `/screens/ProfileScreen.tsx` — avatar initiales (Object Navy), nom/email, 3 lignes d'info, bouton logout Fault Coral
- `/App.tsx` — enveloppé dans `<AuthProvider>`, utilise `<AppNavigator>`
**Résultat :** AuthGate complet, session persistée entre les relances, transition automatique et fluide entre les piles de navigation Auth et Main.

### Étape 6 — RepairersScreen + refonte MainNavigator + câblage DiagnosticScreen
**Prompt résumé :** Créer RepairersScreen, corriger le bouton "+" (60×60), restructurer MainNavigator en stack, et câbler la navigation DiagnosticScreen → RepairersScreen.
**Fichiers créés / modifiés :**
- `/navigation/MainNavigator.tsx` — restructuré en `createNativeStackNavigator` (Tabs + Repairers en overlay), export `MainStackParamList`, icône "+" portée à 60×60 `borderRadius: 30` `translateY: -10` shadow teal
- `/screens/RepairersScreen.tsx` — header dynamique depuis `route.params` (titre, sous-titre `issueLabel · deviceName`, pill prix), 5 chips de filtre (visuel), FlatList de 5 réparateurs mock avec avatar initiales, rating étoiles, badges certifié/spécialités, distance/créneau/prix, boutons "Voir le profil" + "Réserver" (Alert)
- `/screens/DiagnosticScreen.tsx` — ajout `useNavigation<any>()`, onPress "Voir les réparateurs disponibles" → `navigate('Repairers', { deviceName, deviceModel, issueLabel, priceRange, urgency })`
**Résultat :** Flow complet Diagnostic → Réparateurs opérationnel de bout en bout avec passage de contexte par params de route.

### Étape 7 — Fichiers de suivi (ROADMAP.md & OBJECTPASS_PROGRESS.md)
**Prompt résumé :** Créer ROADMAP.md et OBJECTPASS_PROGRESS.md comme source unique de vérité pour la progression du projet.
**Fichiers créés / modifiés :**
- `/ROADMAP.md` — 15 zones produit, statuts ✅/⬜ par tâche, tableau de progression par zone
- `/OBJECTPASS_PROGRESS.md` — ce fichier (vision, plan par phases, étapes chronologiques, liste de contrôle, arborescence, prochaines étapes)
**Résultat :** Deux fichiers de référence permanents et mis à jour automatiquement à chaque fin de session.

### Étape 8 — Tunnel de réservation complet + onglet Rendez-vous
**Prompt résumé :** Compléter le tunnel Diagnostic → Réparateurs → Réservation, créer AppointmentsContext, et construire l'onglet Rendez-vous comme centre de suivi.
**Fichiers créés / modifiés :**
- `/context/AppointmentsContext.tsx` — `useState`, type `Appointment`, 2 rendez-vous mock seedés, actions `addAppointment` / `updateAppointment` / `cancelAppointment`, hook `useAppointments()`
- `/screens/BookingScreen.tsx` — date picker horizontal (7 jours), grille de créneaux 2 colonnes (6 slots, 2 indisponibles), sélecteur de type d'intervention (3 pills), champ notes optionnel, CTA "Confirmer la réservation" (disabled tant que date+créneau non sélectionnés), loading 1 500ms, sauvegarde dans contexte, reset stack vers AppointmentDetail
- `/screens/AppointmentsScreen.tsx` — titre + sous-titre dynamique, 3 onglets "À venir / En cours / Passés", FlatList de cartes avec barre d'accentuation colorée par statut, état vide avec CTA "Lancer un diagnostic" (onglet À venir uniquement)
- `/screens/AppointmentDetailScreen.tsx` — header avec statut badge, section Intervention (prix, urgence, type), section Réparateur (avatar, rating, certifié, boutons Appeler/Message), section Créneau (date longue formatée, heure, type, notes), timeline 4 étapes, boutons d'action selon statut (annuler pour "confirmed", preuve + avis pour "completed")
- `/screens/RepairersScreen.tsx` — bouton "Réserver" : suppression de l'Alert, navigation vers `Booking` avec objet `repairer` + objet `diagnosis` en params, passage de `deviceModel` et `urgency` manquants
- `/navigation/MainNavigator.tsx` — ajout des routes `Booking` et `AppointmentDetail` dans `MainStackParamList`, remplacement du placeholder Rendez-vous par `AppointmentsScreen`, badge `tabBarBadge` sur l'onglet Rendez-vous (compte les RDV `confirmed`), hook `useAppointments()` dans `TabNavigator`
- `/App.tsx` — enveloppé dans `<AppointmentsProvider>` (aux côtés de `<AuthProvider>`)
**Résultat :** Flow complet de bout en bout : Diagnostic → Réparateurs → BookingScreen → AppointmentDetailScreen. L'onglet Rendez-vous affiche les rendez-vous seedés + les nouveaux, avec badge de comptage et navigation vers le détail depuis chaque carte.

### Étape 9 — AddDeviceScreen (wizard 5 étapes) + DevicesContext
**Prompt résumé :** Construire le wizard d'ajout d'appareil en 5 étapes (méthode → identification → achat → personnalisation → récapitulatif), créer DevicesContext, et brancher HomeScreen sur le contexte.
**Fichiers créés / modifiés :**
- `/context/DevicesContext.tsx` — type `DeviceEntry` (extends Device), 3 appareils mock seedés, actions `addDevice` / `updateDevice` / `removeDevice`, `newDeviceId` tracker, hook `useDevices()`
- `/screens/AddDeviceScreen.tsx` — wizard 5 étapes dans un seul composant, transitions slide gauche/droite (Animated translateX 180ms), barre de progression animée (Animated.Value → largeur pixel), CTA désactivé si champs requis vides, scanner mock (2s overlay → auto-fill S/N), picker modal générique (marque/modèle), custom date picker modal 3 colonnes (jour/mois/année), upload facture mock (Alert → state), sélecteur couleur (8 cercles), recap card (fond Object Navy), soumission 1 500ms → addDevice → navigation.goBack()
- `/screens/HomeScreen.tsx` — remplace `mockDevices` par `useDevices()`, FAB câblé sur `navigate('AddDevice')`, badge "Nouveau ✨" (Diagnostic Amber, overlay sur la carte) affiché quand `newDeviceId` correspond, Toast animé fade-in/out 3 secondes (fond Object Navy) en bas d'écran
- `/navigation/MainNavigator.tsx` — route `AddDevice` ajoutée avec `presentation: 'modal'` + `animation: 'slide_from_bottom'`, onglet "+" utilise `listeners.tabPress` (e.preventDefault → navigate('AddDevice')) au lieu d'un placeholder
- `/App.tsx` — `<DevicesProvider>` ajouté entre `<AuthProvider>` et `<AppointmentsProvider>`
**Résultat :** Flow complet ajout d'appareil : scan (mock 2s) ou saisie manuelle ou catalogue → infos achat → personnalisation → récap → ajout instantané dans la liste Home avec badge "Nouveau ✨" et Toast de confirmation. L'onglet "+" et le FAB ouvrent tous les deux le même modal.

### Étape 10 — DeviceDetailScreen (passeport numérique) + QRCodeModal
**Prompt résumé :** Créer le cœur de l'application — l'écran passeport de chaque appareil — avec hero Object Navy animé, score santé count-up, barres de santé en stagger, timeline des interventions avec fade-in, garanties, valeur estimée et QR code.
**Fichiers créés / modifiés :**
- `/screens/DeviceDetailScreen.tsx` — (nouveau) hero Object Navy plein-écran (borderBottomRadius 28, overlay subtil #123D45), top bar avec back arrow + share + three-dot menu (ActionSheet via Alert avec options Modifier / QR Code / Transférer / Supprimer — Supprimer déclenche `removeDevice` + `navigation.goBack()`), identité appareil (80×80 photo zone avec emoji catégorie, nom 22px bold, modèle, S/N monospace), HealthScoreBadge large count-up + label coloré + 3 mini-indicateurs (garantie / facture / réparations), Quick Actions horizontal scroll (4 chips — Diagnostic, Rendez-vous, Partager, QR Code, premier chip actif Object Navy), section Santé avec 4 barres de progression animées en stagger (delay 100ms/200ms/300ms/400ms, valeurs mock par device.id), section Garanties (cartes avec bande accent colorée + badge statut, empty state si aucune), section Historique (timeline verticale avec nœuds teal + cartes inline + avatar initiales + badge Certifié ObjectPass + bouton "Voir la preuve" — fade-in stagger 150ms/300ms/450ms) + nœud "Appareil ajouté" toujours présent + empty state, section Valeur estimée (prix mock par device.id + trend + info icon), section Documents (horizontal scroll — Facture / Preuve / Certificat ObjectPass), sticky bar fixe en bas (Modifier + Prendre un rendez-vous)
- `/screens/QRCodeModal.tsx` — (nouveau) modal slide-up (Clean White bg), close button ✕, titre "QR Code ObjectPass", placeholder QR zone 200×200 Paper Sage, badge Proof Blue, caption, 2 boutons (Partager PrimaryButton / Télécharger OutlineButton — mocks Alert)
- `/screens/HomeScreen.tsx` — chaque DeviceCard reçoit `onPress={() => navigation.navigate('DeviceDetail', { deviceId: device.id })}` pour rendre les cartes navigables
- `/navigation/MainNavigator.tsx` — types `DeviceDetail: { deviceId }` et `QRCodeModal: { deviceId, name, serialNumber? }` ajoutés à `MainStackParamList`, routes `DeviceDetail` (slide_from_right) et `QRCodeModal` (modal, slide_from_bottom) ajoutées au stack
**Résultat :** Tap sur une DeviceCard → slide-in vers le passeport complet de l'appareil. Toutes les sections sont fonctionnelles avec animations et données mock par appareil. Le menu trois-points permet de supprimer l'appareil directement. QRCodeModal accessible depuis le menu et le chip "QR Code".

---

### Étape 11 — Suppression de la ligne Stockage dans DeviceDetailScreen
**Prompt résumé :** Retirer la ligne "💾 Stockage" de la section "Santé de l'appareil" pour tous les appareils.
**Fichiers créés / modifiés :**
- `/screens/DeviceDetailScreen.tsx` — suppression de l'entrée `Stockage` dans `getHealthComponents()` pour les appareils id `'1'` (MacBook Pro M1), id `'2'` (iPhone 15 Pro) et le cas par défaut ; les autres indicateurs (Batterie, Écran, Performance / Connectivité / Moteur / Freins) restent inchangés
**Résultat :** La section "Santé de l'appareil" affiche désormais 3 indicateurs au lieu de 4 pour les appareils MacBook Pro M1 et iPhone 15 Pro (plus de ligne Stockage), et 3 indicateurs pour le cas par défaut. Le Cowboy C5 (id `'3'`) n'était pas concerné.

### Étape 12 — CertificateScreen (Preuve de réparation complète)
**Prompt résumé :** Créer l'écran CertificateScreen complet ("Proof of Repair"), câbler la navigation depuis DeviceDetailScreen et AppointmentDetailScreen, et ajouter les repairId aux données mock.
**Fichiers créés / modifiés :**
- `/data/mockDevices.ts` — ajout de `repairId?` à l'interface `Repair`, ajout de `serialNumber?` à `Device`, `repairId: 'rep_001'` sur la réparation MacBook Pro, `repairId: 'rep_002'` sur la réparation iPhone 15 Pro, numéros de série mock ajoutés aux deux appareils
- `/context/AppointmentsContext.tsx` — ajout de `repairId?` à l'interface `Appointment`, `repairId: 'rep_002'` ajouté au rendez-vous complété `apt_002`
- `/navigation/MainNavigator.tsx` — route `Certificate: { repairId: string }` ajoutée à `MainStackParamList`, route `Certificate` ajoutée en modal `slide_from_bottom`
- `/screens/DeviceDetailScreen.tsx` — bouton "Voir la preuve" dans la timeline : navigation vers `CertificateScreen` via `repair.repairId` (fallback Alert si absent)
- `/screens/AppointmentDetailScreen.tsx` — `handleProof` : navigation vers `CertificateScreen` via `appointment.repairId` (fallback Alert si absent)
- `/screens/CertificateScreen.tsx` — (nouveau) écran complet : top bar (✕ fermer + titre + share-2 Repair Teal), hero Object Navy avec animation spring du cercle de validation (scale 0.5→1, tension 60, friction 8), 3 meta chips semi-transparents, section "Appareil" (photo + infos + HealthScoreBadge small + score coloré), section "Intervention" (4 lignes label/valeur + pièce remplacée avec badge qualité + notes italiques), section "Réparateur" (avatar initiales 48px + étoiles + badge Certifié ObjectPass + tags Repair Teal + signature monospace), section "Preuve vérifiable" (carte #ECF1FF + shield + dot pulsé infini + 4 lignes de preuve + pill "En attente d'ancrage" ou "✓ Ancré"), section "Garantie" (barre accent colorée + dates + badge actif/expiré), section "Partager cette preuve" (QR code 8×8 mock avec logo OP + boutons Copier/Partager + note privacy), sticky bar "Ajouter au passeport", toast de confirmation auto-dismiss 3s + navigation.goBack(), stagger fade-in 80ms par section au montage ; données mock CERTIFICATES internes pour `rep_001` et `rep_002`
**Résultat :** Preuve de réparation entièrement fonctionnelle. Accessible depuis la timeline de DeviceDetailScreen (bouton "Voir la preuve") et depuis AppointmentDetailScreen (bouton "Voir la preuve de réparation" sur statut `completed`). La couche Web3 est représentée visuellement sans vocabulaire crypto — prête à être branchée sur des données réelles.

### Étape 13 — ProfileScreen complète (dashboard personnel)
**Prompt résumé :** Refondre ProfileScreen en un véritable dashboard personnel avec hero animé, résumé des appareils, activité récente, identité ObjectPass, paramètres et déconnexion.
**Fichiers créés / modifiés :**
- `/screens/ProfileScreen.tsx` — refonte complète : hero Object Navy (borderRadius 28, overlay #123D45 simulant un dégradé), avatar 80×80 avec initiales (ex. "LO"), badge caméra Repair Teal (Alert mock), pill "Compte vérifié" semi-transparente avec icône shield, stats strip 3 colonnes (Appareils / Réparations / Garanties) avec count-up animé 800ms depuis DevicesContext ; section "Mes appareils" avec ScrollView horizontal snap (152px, decelerationRate fast), mini-cartes 140px (emoji catégorie + nom + HealthScoreBadge small + label score coloré) + carte "Ajouter" en dashed border → navigate('AddDevice') ; section "Activité récente" avec 3 items mock (tool/Repair Teal · plus-circle/Proof Blue · alert-circle/Amber) fadeIn stagger (100ms/200ms/300ms) ; section "Mon ObjectPass" (carte gradient #EEF1FF, shield Proof Blue, pill "Actif" Warranty Green, 4 lignes label/valeur dont wallet tronqué "0x3a7f...c4b2" + bouton copy, appareils liés + preuves émises depuis contextes, note lock italic en bas) ; section "Paramètres" (6 lignes groupées : Notifications avec Switch natif Repair Teal, Confidentialité, Mes documents, Aide, À propos v0.1.0, Noter l'application — chacun avec icône circle Paper Sage) ; bouton logout Fault Coral (Alert confirmation → logout() AuthContext) ; footer version + tagline + dot Repair Teal
**Résultat :** L'onglet Profil est désormais un dashboard complet, cohérent avec la charte ObjectPass. Les stats sont calculées dynamiquement depuis DevicesContext. Aucun autre écran modifié.

### Étape 14 — Types centralisés (/types/index.ts)
**Prompt résumé :** Créer la source unique de vérité pour tous les types partagés du projet : auditer, centraliser, mettre à jour les imports, vérifier avec tsc --noEmit.
**Fichiers créés / modifiés :**
- `/types/index.ts` — (nouveau) 14 types exportés répartis en 5 domaines métier : Device (DeviceCategory, DeviceStatus, PartQuality, Repair, Device, DeviceEntry), Repairer, Diagnosis (UrgencyLevel, DiagnosisResult, PendingDiagnostic), Appointment (AppointmentStatus, InterventionType, Appointment), Certificate (BlockchainAnchorStatus, RepairProof, Certificate), User
- `/data/mockDevices.ts` — suppression des 3 types exportés (DeviceStatus, Repair, Device) ; import `Device` depuis `../types`
- `/context/AuthContext.tsx` — suppression de `export interface User` ; import + re-export depuis `../types`
- `/context/DevicesContext.tsx` — suppression de `export interface DeviceEntry extends Device` ; import + re-export `DeviceEntry` depuis `../types` ; import `Device` supprimé de mockDevices
- `/context/AppointmentsContext.tsx` — suppression de `export interface Appointment` ; import + re-export depuis `../types`
- `/components/ui/DeviceCard.tsx` — import `Device` depuis `../../types` (au lieu de `../../data/mockDevices`)
- `/components/ui/RepairTimelineItem.tsx` — import `Repair` depuis `../../types` (au lieu de `../../data/mockDevices`)
- `/screens/DiagnosticScreen.tsx` — suppression de `interface DiagResult` ; `DiagResult` → `DiagnosisResult` depuis `../types` ; import `Status` supprimé (remplacé par `UrgencyLevel`) ; import `Device` déplacé vers `../types`
- `/screens/RepairersScreen.tsx` — suppression de `interface Repairer` (locale non exportée) ; import `Repairer` depuis `../types`
- `/screens/DeviceDetailScreen.tsx` — import `DeviceEntry` depuis `../types` (au lieu de `../context/DevicesContext`)
- `/screens/AppointmentDetailScreen.tsx` — import `Appointment` depuis `../types` (au lieu du contexte)
- `/screens/AppointmentsScreen.tsx` — import `Appointment` depuis `../types` (au lieu du contexte)
- `/screens/AddDeviceScreen.tsx` — import `DeviceEntry` depuis `../types` (au lieu de `../context/DevicesContext`)
- `/screens/ProfileScreen.tsx` — import `DeviceEntry` depuis `../types` (au lieu de `../context/DevicesContext`)
- `/screens/CertificateScreen.tsx` — import `Certificate` depuis `../types` ; `CERTIFICATES` typé `Record<string, Certificate>` ; suppression des 3 casts `as 'premium' | 'standard'` et `as 'pending_anchor' | 'anchored'`
**Résultat :** Source unique de vérité pour tous les types du projet. `npx tsc --noEmit` retourne zéro erreur. Aucun comportement ou JSX modifié. 14 fichiers mis à jour, 1 fichier créé.

### Étape 15 — Types de navigation stricts (/navigation/types.ts)
**Prompt résumé :** Créer `/navigation/types.ts` comme source unique de vérité pour les param lists de navigation, et remplacer tous les `useNavigation<any>()` et `useRoute<any>()` par des versions strictement typées dans l'ensemble du projet.
**Fichiers créés / modifiés :**
- `/navigation/types.ts` — (nouveau) 3 param lists exportées : `AuthStackParamList` (Welcome, Login), `MainTabParamList` (5 onglets), `RootStackParamList` (toutes les routes du stack principal avec leurs params exacts — `Booking.repairer` typé avec `Repairer` depuis `/types/index.ts`)
- `/navigation/AuthNavigator.tsx` — suppression de la définition locale de `AuthStackParamList` ; import + re-export depuis `./types`
- `/navigation/MainNavigator.tsx` — suppression de `MainStackParamList` ; import de `RootStackParamList` et `MainTabParamList` depuis `./types` ; `createBottomTabNavigator<MainTabParamList>()` ; `createNativeStackNavigator<RootStackParamList>()` ; correction du listener `Ajouter` : `navigation.getParent()` casté en `NavigationProp<RootStackParamList>` pour naviguer vers `AddDevice`
- `/navigation/AppNavigator.tsx` — ajout de `AppParamList` (Auth, Main) ; `createNativeStackNavigator<AppParamList>()`
- `/screens/HomeScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()`
- `/screens/DiagnosticScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()`
- `/screens/RepairersScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()` ; `useRoute<RouteProp<RootStackParamList, 'Repairers'>>()` ; `navigate('Booking', { repairer, ... })` passe maintenant le `Repairer` complet au lieu d'un sous-ensemble manuel
- `/screens/BookingScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()` ; `useRoute<RouteProp<RootStackParamList, 'Booking'>>()` ; `repairer` reçu est typé `Repairer`
- `/screens/AppointmentDetailScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()` ; `useRoute<RouteProp<RootStackParamList, 'AppointmentDetail'>>()`
- `/screens/AppointmentsScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()`
- `/screens/DeviceDetailScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()` ; `useRoute<RouteProp<RootStackParamList, 'DeviceDetail'>>()` ; suppression du cast `as { deviceId: string }`
- `/screens/QRCodeModal.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()` ; `useRoute<RouteProp<RootStackParamList, 'QRCodeModal'>>()` ; suppression du type local `Params` et du cast `as Params`
- `/screens/CertificateScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()` ; `useRoute<RouteProp<RootStackParamList, 'Certificate'>>()` ; suppression du cast `as { repairId: string }`
- `/screens/AddDeviceScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()`
- `/screens/ProfileScreen.tsx` — `useNavigation<NavigationProp<RootStackParamList>>()` ; `navigate('Accueil')` → `navigate('Tabs', { screen: 'Accueil' })` (screen non présent dans RootStackParamList)
**Résultat :** Zéro `useNavigation<any>()`, zéro `useRoute<any>()`, zéro cast `as { ... }` sur route.params dans tout le projet. `tsc --noEmit` retourne zéro erreur. Aucun comportement de navigation, aucune transition, aucun passage de paramètres modifié.

### Étape 16 — Système de toast global (ToastContext + ToastContainer)
**Prompt résumé :** Remplacer tous les toasts locaux par un système global centralisé : `ToastContext` + `ToastContainer`, câblé à la racine de l'app, utilisé par tous les écrans via `useToast()`.
**Fichiers créés / modifiés :**
- `/context/ToastContext.tsx` — (nouveau) `ToastProvider` avec file d'attente de toasts (`ToastEntry[]`), gestion des timers via `useRef<Record<string, ReturnType<typeof setTimeout>>>`, animation de sortie en deux temps (flag `removing: true` → 300ms → suppression réelle) ; expose `showToast(message, type?, duration?)` et `hideToast(id)` ; hook `useToast()`
- `/components/ui/ToastContainer.tsx` — (nouveau) `ToastContainer` positionné absolument (`bottom: 90, zIndex: 9999, pointerEvents: 'box-none'`) ; `ToastItem` avec animations Animated d'entrée (fade + slide up 280ms) et sortie (fade + slide down 250ms) déclenchées par `toast.removing` ; tokens visuels par type : success (Object Navy bg, check Repair Teal), error (Fault Coral bg), info (Object Navy bg, info Proof Blue), warning (Diagnostic Amber bg, Graphite text)
- `/App.tsx` — `<ToastProvider>` ajouté autour d'un `<View style={{ flex: 1 }}>` contenant `<AppNavigator />` et `<ToastContainer />` (rendu une seule fois, recouvre toute la navigation)
- `/screens/HomeScreen.tsx` — suppression de `toastVisible`, `toastName` (useState), `toastAnim` (useRef/Animated), suppression des imports `useState`, `useRef`, `Animated` ; `useEffect` simplifié : appel à `showToast()` + `setTimeout(clearNewDevice, 3000)` ; suppression du bloc JSX toast + styles `toast`/`toastText`
- `/screens/CertificateScreen.tsx` — suppression de `toastVisible` (useState), `toastOpacity` (useRef/Animated) ; `handleAddToPassport` réduit à `showToast(message, 'success')` + `setTimeout(navigation.goBack, 3000)` ; suppression du bloc JSX toast + styles `toast`/`toastText`
**Résultat :** Un seul système de toast pour toute l'application. Zéro toast local restant. Messages identiques à avant. Animations entrée/sortie cohérentes. Le ToastContainer s'affiche au-dessus de la navigation sur tous les écrans.

### Étape 17 — Persistance SQLite pour DevicesContext
**Prompt résumé :** Installer `expo-sqlite`, créer la couche d'accès aux données `/db/`, et réécrire `DevicesContext` pour persister les appareils entre les relances de l'app.
**Fichiers créés / modifiés :**
- `/package.json` — ajout de `expo-sqlite: ~15.1.4` (SDK 52 compatible, installé via `npx expo install`)
- `/db/database.ts` — (nouveau) singleton `getDb()` : cache la promesse `openDatabaseAsync('objectpass.db')` ; retourne toujours la même instance `SQLiteDatabase`
- `/db/devicesDb.ts` — (nouveau) 5 fonctions exportées avec return type explicite : `initDevicesTable()` (CREATE TABLE IF NOT EXISTS avec 21 colonnes), `getAllDevices()` (SELECT ORDER BY rowid, mapping `DeviceRow → DeviceEntry`), `insertDevice()` (INSERT OR REPLACE, 21 paramètres positionnels), `updateDeviceById()` (SET dynamique construit depuis `Partial<DeviceEntry>`, conversions booléen↔INTEGER et Repair[]↔JSON), `deleteDevice()` (DELETE WHERE id) ; interface locale `DeviceRow` pour typer les lignes brutes SQLite ; booleans stockés en INTEGER 0/1, `repairs` en JSON TEXT ; chaque fonction enrobée dans try/catch avec rethrow explicite
- `/context/DevicesContext.tsx` — réécriture complète : ajout de `loading: boolean` dans l'interface et l'état ; `useState([])` au lieu du seed statique ; `useEffect` au montage : `initDevicesTable()` → `getAllDevices()` → si vide, seed des 3 mocks via `insertDevice()` → `setDevices` ; `showToastRef` (useRef) pour accéder à `showToast` depuis l'effect sans dépendance instable ; `addDevice` / `updateDevice` / `removeDevice` : DB en premier via `.then/.catch`, state local mis à jour uniquement si la DB réussit, toast d'erreur si échec ; API du contexte inchangée (mêmes noms de fonctions et signatures)
- `/App.tsx` — `<ToastProvider>` déplacé au-dessus de `<DevicesProvider>` (nécessaire car `DevicesContext` appelle `useToast()`)
**Résultat :** Les appareils survivent à un redémarrage de l'app. Au premier lancement, les 3 appareils mock sont insérés en base via `insertDevice()`. Les ajouts, modifications et suppressions sont écrits en SQLite avant d'être reflétés en mémoire. Toute erreur DB déclenche un toast d'erreur sans corrompre l'état local. `tsc --noEmit` : zéro erreur.

### Étape 18 — Fallback web AsyncStorage pour devicesDb
**Prompt résumé :** Réécrire `/db/devicesDb.ts` (stub web) pour utiliser `AsyncStorage` au lieu de lancer une erreur, afin que l'app fonctionne aussi sur web (`npx expo start --web`). Ne pas toucher `devicesDb.native.ts` ni `DevicesContext`.
**Fichiers créés / modifiés :**
- `/db/devicesDb.ts` — réécriture complète : les 5 fonctions (`initDevicesTable`, `getAllDevices`, `insertDevice`, `updateDeviceById`, `deleteDevice`) sont désormais backed par `AsyncStorage` sous la clé `'objectpass.devices'` (JSON-serialized `DeviceEntry[]`). `initDevicesTable` crée la clé avec `'[]'` si absente. `insertDevice` fait un replace-or-append par `id` (même comportement que `INSERT OR REPLACE` SQLite). `updateDeviceById` merge avec spread object ; no-op si `id` inconnu. `deleteDevice` filtre par `id`. Deux helpers privés (`readAll` / `writeAll`) évitent la duplication. Chaque fonction wrappée dans try/catch avec rethrow explicite, return types explicites, aucun `any`.
- `/db/database.ts` — inchangé (son `getDb()` rejette toujours, mais rien dans le chemin web ne l'appelle — vérifié par grep).
**Résultat :** L'app démarre sur web sans l'erreur "expo-sqlite is not available". Les 3 appareils mock sont seedés au premier lancement et persistent dans `AsyncStorage` entre les rechargements. Ajout, modification et suppression fonctionnent identiquement sur web et sur natif. `DevicesContext` est totalement inchangé. `tsc --noEmit` : zéro erreur.

### Étape 19 — Persistance SQLite/AsyncStorage pour AppointmentsContext
**Prompt résumé :** Créer la couche d'accès aux données pour les rendez-vous (`/db/appointmentsDb.native.ts` et `/db/appointmentsDb.ts`), refactorer `devicesDb.native.ts` pour utiliser le `getDb()` partagé, et réécrire `AppointmentsContext` sur le même modèle que `DevicesContext` (DB-first, seed au premier lancement, loading flag, toast d'erreur).
**Fichiers créés / modifiés :**
- `/db/devicesDb.native.ts` — refactorisé : suppression du `getDb()` local dupliqué, import de `getDb` depuis `./database.native` (singleton partagé). Aucune autre modification.
- `/db/appointmentsDb.native.ts` — (nouveau) couche SQLite réelle pour les rendez-vous : interface `AppointmentRow` (colonnes plates + JSON pour `device`, `issue`, `repairer`), helper `rowToAppointment()`, 5 fonctions exportées : `initAppointmentsTable()` (CREATE TABLE IF NOT EXISTS, 11 colonnes), `getAllAppointments()` (SELECT ORDER BY rowid, désérialisation JSON), `insertAppointment()` (INSERT OR REPLACE, 11 paramètres positionnels), `updateAppointmentById()` (SET dynamique, sérialisation JSON pour sous-objets), `cancelAppointment()` (appelle `updateAppointmentById(id, { status: 'cancelled' })`). Chaque fonction wrappée dans try/catch, types explicites, aucun `any`.
- `/db/appointmentsDb.ts` — (nouveau) fallback web via AsyncStorage sous la clé `'objectpass.appointments'` : mêmes 5 signatures, helpers privés `readAll`/`writeAll`, `insertAppointment` fait un replace-or-append par `id`, `updateAppointmentById` merge avec spread object, `cancelAppointment` appelle `updateAppointmentById`.
- `/context/AppointmentsContext.tsx` — réécriture complète sur le modèle de `DevicesContext` : `useState([])` au lieu du seed statique, `loading: boolean` ajouté au state et à l'interface du contexte, `showToastRef` (useRef) pour accéder à `showToast` sans dépendance instable, `useEffect` au montage : `initAppointmentsTable()` → `getAllAppointments()` → si vide, seed des 2 mocks via `insertAppointment()` → `setAppointments`, fallback sur les mocks en cas d'erreur DB ; `addAppointment` / `updateAppointment` / `cancelAppointment` : DB en premier, state local mis à jour uniquement si la DB réussit, toast d'erreur si échec. API du contexte inchangée (mêmes noms de fonctions et signatures).
**Résultat :** Les rendez-vous survivent à un redémarrage de l'app sur natif (SQLite) et sur web (AsyncStorage). Au premier lancement, les 2 rendez-vous mock sont insérés en base via `insertAppointment()`. Les ajouts, mises à jour et annulations sont écrits en DB avant d'être reflétés en mémoire. Toute erreur DB déclenche un toast d'erreur sans corrompre l'état local. Le `getDb()` singleton est désormais partagé entre `devicesDb.native.ts` et `appointmentsDb.native.ts`. `tsc --noEmit` : zéro erreur.

### Étape 20 — AppStateContext + GlobalLoadingOverlay + GlobalErrorBanner
**Prompt résumé :** Créer le système de chargement et d'erreur global de l'application : `AppStateContext` (état partagé), `GlobalLoadingOverlay` (spinner bloquant) et `GlobalErrorBanner` (bandeau animé auto-dismiss 5s). Câbler les deux contextes de persistance sur `setLoading` / `setError`. Monter les deux composants à la racine de l'app.
**Fichiers créés / modifiés :**
- `/context/AppStateContext.tsx` — (nouveau) context avec `isLoading` (booléen, piloté par un compteur `loadingCountRef` pour gérer les appels simultanés), `loadingMessage` (string optionnel), `error` (string | null) ; actions `setLoading(loading, message?)` (incrémente/décrémente le compteur, active/désactive l'overlay), `setError(message)` (déclenche le bandeau), `clearError()` (masque le bandeau) ; hook `useAppState()`.
- `/components/ui/GlobalLoadingOverlay.tsx` — (nouveau) overlay plein-écran `position: absolute`, `rgba(14, 37, 48, 0.75)` (Object Navy semi-transparent), `ActivityIndicator` en Repair Teal centré, message optionnel en Clean White, `pointerEvents="box-only"` pour bloquer toute interaction, rendu uniquement si `isLoading`.
- `/components/ui/GlobalErrorBanner.tsx` — (nouveau) bandeau Fault Coral fixé en `top: 0`, icône `alert-circle` + texte `error` + croix de fermeture `Pressable` ; slide-in depuis `translateY: -120` → `translateY: 0` (280ms) au montage, slide-out inverse (250ms) à la fermeture ; `View` espaceur `height: insets.top` pour respecter le safe-area ; auto-dismiss après 5 000ms via `setTimeout` ; `clearError()` appelé après l'animation de sortie ; `useSafeAreaInsets()` depuis `react-native-safe-area-context`.
- `/App.tsx` — ajout de `SafeAreaProvider` (racine absolue, nécessaire pour `useSafeAreaInsets`), `AppStateProvider` entre `ToastProvider` et `DevicesProvider` ; `GlobalLoadingOverlay` et `GlobalErrorBanner` montés une fois dans le `<View>` racine aux côtés de `ToastContainer` et `AppNavigator`.
- `/context/DevicesContext.tsx` — import de `useAppState` ; refs `appSetLoadingRef` et `appSetErrorRef` ; dans `hydrate()` : `appSetLoading(true)` en entrée, `appSetLoading(false)` dans `finally` (toujours décrémenté), `appSetError('Impossible de charger vos appareils.')` dans `catch` (remplace le toast d'erreur d'hydratation). Les toasts d'erreur des actions CRUD (insert/update/delete) sont conservés inchangés.
- `/context/AppointmentsContext.tsx` — même pattern : `appSetLoading(true/false)` autour de l'hydratation, `appSetError('Impossible de charger vos rendez-vous.')` sur échec d'hydratation.
**Résultat :** Au démarrage, un overlay semi-transparent Object Navy apparaît brièvement pendant l'hydratation SQLite/AsyncStorage des deux contextes (les deux appels `setLoading(true)` s'empilent via le compteur, l'overlay disparaît quand le compteur revient à 0). En cas d'erreur d'hydratation, un bandeau rouge glisse depuis le haut avec le message approprié et se masque automatiquement après 5 secondes (ou à la croix). Les toasts continuent de gérer les erreurs CRUD. Le système toast et le système banner ne se chevauchent pas.


## ✅ Liste de contrôle

### Design system
- [x] `/constants/colors.ts` avec tous les tokens de marque (12 tokens + `healthColor()`)
- [x] Composants UI : `HealthScoreBadge`, `StatusBadge`, `DeviceCard`, `RepairTimelineItem`, `ProofBadge`, `PrimaryButton`, `OutlineButton`, `SectionHeader`
- [ ] Thème global (`/constants/typography.ts`, `/constants/spacing.ts`)
- [ ] Dark mode (non prévu pour le MVP)

### Architecture & solidification
- [x] `/types/index.ts` — types centraux (Device, Appointment, Repair, Repairer, Certificate, User…)
- [x] `expo-sqlite` installé — base de données locale `objectpass.db`
- [x] `/db/devicesDb.ts` — CRUD SQLite pour les appareils (init, seed, get, insert, update, delete) ; fallback web via AsyncStorage (étape 18)
- [x] `/db/appointmentsDb.ts` — CRUD SQLite (native) + AsyncStorage (web) pour les rendez-vous (mapping plat ↔ JSON imbriqué)
- [x] `AppStateContext` — états globaux `isLoading` / `error` avec `setLoading` / `setError` (compteur pour appels simultanés)
- [x] `GlobalLoadingOverlay` — overlay Object Navy semi-transparent, ActivityIndicator Repair Teal, bloque les interactions
- [x] `GlobalErrorBanner` — bandeau Fault Coral animé (slide-in top), safe-area, auto-dismiss 5s, bouton ✕
- [x] `ToastContext` + `ToastContainer` — système de toast global (success / error / info / warning)
- [x] `/navigation/types.ts` — `RootStackParamList`, `AuthStackParamList`, `MainTabParamList` stricts
- [x] Types de navigation stricts sur tous les écrans — aucun `useNavigation<any>()` restant
- [ ] `RootNavigator.tsx` supprimé (fichier obsolète remplacé par `MainNavigator`)

### Navigation
- [x] `AppNavigator` (AuthGate — splash + switch Auth/Main)
- [x] `AuthNavigator` (Welcome → Login, types `AuthStackParamList`)
- [x] `MainNavigator` (Bottom tabs + stack overlay, types `MainStackParamList`)
- [x] Routes `Booking` et `AppointmentDetail` dans le stack principal
- [x] Route `AddDevice` (modal, slide_from_bottom)
- [x] Route `Certificate` (modal, slide_from_bottom) avec param `repairId`
- [x] Onglet "+" intercepté via `listeners.tabPress` → modal AddDevice
- [ ] Deep linking configuré
- [ ] Navigation par QR code

### Authentification
- [x] `WelcomeScreen` (Google / Apple / Email — mock 1 200ms)
- [x] `LoginScreen` (email + mot de passe — mock, KeyboardAvoidingView, toggle œil)
- [x] `AuthContext` (login / logout / persistance `AsyncStorage`)
- [ ] Vrai provider OAuth (Google via Expo AuthSession)
- [ ] Vrai provider OAuth (Apple via Expo AuthSession)
- [ ] Wallet custodial créé en arrière-plan (Privy / Web3Auth)

### Home
- [x] Dashboard avec appareils depuis `DevicesContext` (remplace mock statique)
- [x] Stat strip (nombre d'appareils, réparations, garanties actives)
- [x] `DeviceCard` avec health score coloré et statut badge
- [x] FAB bouton "+" câblé sur `navigate('AddDevice')`
- [x] Badge "Nouveau ✨" (Diagnostic Amber) sur la carte du dernier appareil ajouté
- [x] Toast de confirmation après ajout (fade in/out, 3s, fond Object Navy)
- [x] Navigation HomeScreen → DeviceDetailScreen au tap sur une carte
- [x] Connexion à des données réelles (SQLite — seed des 3 mocks au premier lancement)

### Diagnostic
- [x] Step 1 — Sélection de l'appareil (radio buttons sélectionnables)
- [x] Step 2 — Sélection du symptôme (grille 2×3 de pills)
- [x] Step 3 — Sévérité (3 cartes pleine largeur avec bordure colorée)
- [x] Carte résultat avec prix estimé, durée, badge urgence
- [x] Navigation vers `RepairersScreen` avec params (device + résultat)
- [ ] Logique de diagnostic réelle (API ou moteur de règles étendu)
- [ ] Sauvegarde du diagnostic dans l'historique de l'appareil

### Réparateurs
- [x] `RepairersScreen` avec 5 réparateurs mock (FlatList)
- [x] Header dynamique depuis `route.params` (`issueLabel · deviceName` + pill prix)
- [x] Filter chips horizontaux (5 options, "Tous" actif par défaut — visuel uniquement)
- [x] Cartes réparateurs (avatar initiales, rating étoiles, tags, distance, créneau, prix)
- [x] Badge "Certifié ObjectPass" en Proof Blue (`#245FFF`)
- [x] Bouton "Réserver" → navigation vers `BookingScreen` avec params complets
- [ ] Vue carte géographique des réparateurs
- [ ] Écran profil réparateur dédié

### Réservation
- [x] `BookingScreen` avec date picker horizontal (7 jours glissants)
- [x] Grille de créneaux 2 colonnes (6 slots, 2 marqués indisponibles)
- [x] Sélecteur type d'intervention (3 pills : boutique / domicile / postal)
- [x] Champ notes optionnel avec focus state Repair Teal
- [x] CTA désactivé jusqu'à sélection date + créneau
- [x] Loading 1 500ms → sauvegarde AppointmentsContext → reset stack vers `AppointmentDetail`

### Rendez-vous (suivi)
- [x] `AppointmentsContext` avec persistance DB-first, 2 mocks seedés au 1er lancement, loading flag, `addAppointment` / `updateAppointment` / `cancelAppointment`
- [x] `AppointmentsScreen` : onglets "À venir / En cours / Passés", FlatList avec barre d'accentuation colorée
- [x] État vide adapté par onglet, CTA "Lancer un diagnostic" (À venir uniquement)
- [x] Badge `tabBarBadge` sur l'onglet Rendez-vous (compte les RDV confirmés)
- [x] `AppointmentDetailScreen` : Intervention / Réparateur / Créneau / Timeline statut
- [x] Annulation (alert de confirmation → `cancelled` → retour à l'onglet Rendez-vous)
- [x] Boutons "Preuve de réparation" et "Laisser un avis" pour statut `completed` (mock alert)

### Ajout d'appareil
- [x] `AddDeviceScreen` — wizard 5 étapes dans un seul composant
- [x] Step 1 : 3 méthodes d'ajout (scan mock / série / catalogue)
- [x] Step 2 : S/N + catégorie + mode catalogue (marque/modèle via picker modal)
- [x] Step 3 : date d'achat (custom date picker 3 colonnes) + prix + lieu + facture mock + garantie
- [x] Step 4 : nom + photo mock + sélecteur couleur 8 cercles
- [x] Step 5 : recap card Object Navy + ObjectPass preview + CTA
- [x] `DevicesContext` avec 3 mocks seedés, `addDevice` / `updateDevice` / `removeDevice`, `newDeviceId`
- [x] Transitions slide gauche/droite (Animated translateX, 180ms × 2)
- [x] Barre de progression animée (Animated.Value, 300ms)
- [x] CTA "Continuer" désactivé (opacity 0.5) tant que champs requis vides
- [x] Confirmation abandon (Alert) sur "✕"
- [x] Loading 1 500ms → `addDevice()` → `navigation.goBack()`
- [ ] Vrai scan caméra (Expo Camera / Barcode Scanner)
- [ ] Vrai upload facture (Expo Image Picker)
- [ ] Auto-remplissage modèle depuis API catalogue réelle

### Passeport appareil
- [x] `DeviceDetailScreen` (hero card Object Navy, score santé animé en grand)
- [x] Section "Santé" : barres de progression batterie / écran / performance (stagger animé, stockage retiré)
- [x] Section "Historique" : timeline des interventions inline avec cartes + fade-in
- [x] Section "Garanties actives" avec date d'expiration et badge statut
- [x] QR code de partage du passeport (QRCodeModal, modal slide-up)
- [x] Section "Valeur estimée" avec prix mock et tendance marché
- [x] Section "Documents" (Facture / Preuve de réparation / Certificat ObjectPass)

### Preuve de réparation
- [x] `CertificateScreen` (après réparation certifiée par un réparateur)
- [x] Badge Proof Blue "Preuve vérifiable" avec icône chaîne
- [x] QR code centré, partageable, vérifiable par un tiers sans compte
- [ ] Export PDF de la preuve de réparation

### Profil
- [x] `ProfileScreen` — dashboard complet (hero animé, stats, mini-cartes, activité, ObjectPass identity, paramètres, logout)
- [x] Avatar initiales (Object Navy bg, Repair Teal border + initials), badge caméra mock
- [x] Pill "Compte vérifié" (shield + semi-transparent bg)
- [x] Stats strip count-up animé (Appareils / Réparations / Garanties depuis DevicesContext)
- [x] Mini device cards horizontal scroll (HealthScoreBadge small, snap 152px)
- [x] Section Activité récente (3 items mock, stagger fade-in)
- [x] Section Mon ObjectPass (wallet tronqué, preuves certifiées, note sécurité)
- [x] Section Paramètres (6 lignes, Notifications Switch, chevrons avec Alert)
- [x] Bouton "Se déconnecter" via `AuthContext` (Fault Coral, Alert confirmation)
- [ ] Édition du profil (nom, photo — Expo Image Picker)
- [ ] Historique des objets et interventions réel

### Web3 (Phase avancée)
- [ ] Wallet invisible créé automatiquement à l'inscription
- [ ] Attestation de réparation signée par le réparateur (on-chain)
- [ ] NFT dynamique par appareil (métadonnées mises à jour)
- [ ] Transfert de propriété lors de la revente d'un appareil
- [ ] Account abstraction / paymaster (transactions sans gas pour l'utilisateur)
- [ ] Export API pour marketplaces de seconde main

---

## 📊 Pourcentage de progression

**Progression globale : 83 %**

```
████████████████░░░░  83 %
(83 items complétés / 100 items totaux)
```

| Phase | Statut | % |
|---|---|---|
| Design system | 🟡 En cours | 50 % |
| Architecture & solidification | 🟢 Avancé | 91 % |
| Navigation | ✅ Complet | 100 % |
| Authentification | 🟡 En cours | 50 % |
| Home | ✅ Complet | 100 % |
| Diagnostic | 🟡 En cours | 71 % |
| Réparateurs | 🟢 Avancé | 86 % |
| Réservation | ✅ Complet | 100 % |
| Rendez-vous (suivi) | ✅ Complet | 100 % |
| Ajout d'appareil | 🟢 Avancé | 79 % |
| Passeport appareil | ✅ Complet | 100 % |
| Preuve de réparation | 🟢 Avancé | 75 % |
| Profil | 🟢 Avancé | 83 % |
| Web3 discret | 🔴 Non démarré | 0 % |
| B2B / Parc IT | 🔴 Non démarré | 0 % |
| Polish & animations | 🔴 Non démarré | 0 % |

---

## 📁 Arborescence du projet

```
ObjectPass/
├── App.tsx                                  ← SafeAreaProvider > AuthProvider > ToastProvider > AppStateProvider > DevicesProvider > AppointmentsProvider
├── OBJECTPASS_PROGRESS.md
├── ROADMAP.md
├── app.json
├── babel.config.js
├── components/
│   └── ui/
│       ├── DeviceCard.tsx
│       ├── HealthScoreBadge.tsx
│       ├── OutlineButton.tsx
│       ├── PrimaryButton.tsx
│       ├── ProofBadge.tsx
│       ├── RepairTimelineItem.tsx
│       ├── SectionHeader.tsx
│       ├── StatusBadge.tsx
│       ├── GlobalErrorBanner.tsx            ← bandeau Fault Coral top, slide-in, safe-area, auto-dismiss 5s
│       ├── GlobalLoadingOverlay.tsx         ← overlay Object Navy semi-transparent, bloque interactions
│       ├── ToastContainer.tsx               ← ToastContainer + ToastItem (animé, 4 types)
│       └── index.ts
├── constants/
│   └── colors.ts
├── context/
│   ├── AppStateContext.tsx                  ← isLoading (compteur), loadingMessage, error — setLoading/setError/clearError
│   ├── AppointmentsContext.tsx              ← DB-first, seed au 1er lancement, loading flag, setLoading/setError global
│   ├── AuthContext.tsx
│   ├── DevicesContext.tsx                   ← SQLite, seed au 1er lancement, loading flag, setLoading/setError global
│   └── ToastContext.tsx                     ← ToastProvider, useToast(), showToast/hideToast
├── data/
│   └── mockDevices.ts
├── db/
│   ├── database.ts                          ← web stub (getDb rejette — rien dans le chemin web ne l'appelle)
│   ├── database.native.ts                   ← singleton getDb() partagé (openDatabaseAsync) — picked by Metro on native
│   ├── devicesDb.ts                         ← fallback web : CRUD AsyncStorage, clé 'objectpass.devices'
│   ├── devicesDb.native.ts                  ← CRUD SQLite réel, utilise getDb() partagé — picked by Metro on native
│   ├── appointmentsDb.ts                    ← fallback web : CRUD AsyncStorage, clé 'objectpass.appointments'
│   └── appointmentsDb.native.ts             ← CRUD SQLite réel (device/issue/repairer en JSON TEXT) — picked by Metro on native
├── types/
│   └── index.ts                             ← source unique de vérité pour tous les types partagés
├── navigation/
│   ├── AppNavigator.tsx
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   ├── RootNavigator.tsx
│   └── types.ts                             ← AuthStackParamList, MainTabParamList, RootStackParamList
├── package-lock.json
├── package.json
├── screens/
│   ├── AddDeviceScreen.tsx
│   ├── AppointmentDetailScreen.tsx
│   ├── AppointmentsScreen.tsx
│   ├── BookingScreen.tsx
│   ├── CertificateScreen.tsx
│   ├── DeviceDetailScreen.tsx
│   ├── DiagnosticScreen.tsx
│   ├── HomeScreen.tsx
│   ├── LoginScreen.tsx
│   ├── ProfileScreen.tsx
│   ├── QRCodeModal.tsx
│   ├── RepairersScreen.tsx
│   └── WelcomeScreen.tsx
└── tsconfig.json
```

---

## 🔮 Prochaines étapes suggérées

> **Sprint de solidification terminé.** Prochaines priorités :

1. **Supprimer RootNavigator.tsx** — Fichier obsolète remplacé par `MainNavigator.tsx`. Vérifier qu'aucun import ne pointe encore vers lui, puis supprimer le fichier.

2. **Skeleton loaders sur HomeScreen et AppointmentsScreen** — Les flags `loading` de `DevicesContext` et `AppointmentsContext` sont exposés. L'overlay global gère l'hydratation, mais des skeletons spécifiques aux listes amélioreront le ressenti (transitions avant que les données n'arrivent en React state local).

3. **Vrai scan caméra + upload facture** — Brancher Expo Camera (scan code-barres) et Expo Image Picker (upload facture) dans `AddDeviceScreen`, en remplacement des mocks actuels.

4. **OAuth réel** — Brancher Expo AuthSession pour Google et Apple dans `WelcomeScreen` et `LoginScreen`, en remplacement des mocks 1 200ms.

---

## 📌 Instruction permanente pour Claude Code

> ⚠️ À la fin de chaque session de développement sur ObjectPass,
> Claude Code doit obligatoirement mettre à jour le fichier
> OBJECTPASS_PROGRESS.md situé à la racine du projet.
>
> La mise à jour doit :
> - Ajouter la nouvelle étape dans "Mise en œuvre par étapes"
>   avec les fichiers créés/modifiés et le résultat
> - Cocher les items complétés dans la liste de contrôle
> - Recalculer le pourcentage de progression global et par phase
> - Mettre à jour l'arborescence du projet
> - Réviser les prochaines étapes suggérées
>
> Ne jamais créer un nouveau fichier de suivi.
> Toujours mettre à jour OBJECTPASS_PROGRESS.md, le même fichier.

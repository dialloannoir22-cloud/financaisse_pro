# AnnoirFinancePro — Reçus Clients Numériques & Thermiques (Partageables & Imprimables)

Génération instantanée de tickets de reçu professionnels au format thermique (58mm/80mm) et numérique téléchargeable/partageable pour chaque transaction de transfert (RIA, Western Union, MoneyGram) et règlement Partenaire Seddo, garantissant une traçabilité irréprochable au guichet.

## User Review & Critical Decisions

> [!IMPORTANT]
> Les choix d'arbitrage confirmés en Phase 1 avec l'utilisateur orientent cette mise à niveau :

- **Fonctionnalité prioritaire retenue** : Module d'émission de reçus client pour chaque opération individuelle au guichet (retraits, envois et ventes Seddo).
- **Format d'édition retenu** : Ticket thermique compact et moderne (norme 58mm / 80mm), disponible sous double format : **numérique téléchargeable en haute résolution / partageable (WhatsApp, téléchargement PNG/PDF)** et **imprimable directement en un clic via le pilote d'impression standard ou thermique**.
- **Sécurité d'encaisse** : Module d'alerte de seuil de trésorerie non requis pour le moment (maintien du focus exclusif sur les reçus guichet et la comptabilité temps réel).

---

## 1. Overview & Core Concept

### Ce que la fonctionnalité apporte
À chaque validation d'un transfert (Retrait ou Envoi RIA, WU, MG) ou d'un règlement Seddo, un bouton d'action **"Reçu / Ticket"** permet d'ouvrir immédiatement un aperçu fidèle du ticket de caisse. Le caissier ou le client peut en un clic :
1. **Télécharger le ticket sous forme d'image PNG haute netteté** prête pour envoi par WhatsApp ou archivage client.
2. **Imprimer le ticket en direct** sur n'importe quelle imprimante thermique (58mm/80mm) ou imprimante de bureau sans marge parasite.
3. **Consulter l'historique des reçus** depuis le journal des opérations du jour ou de l'historique cloud.

### Public cible
- Caissiers et gérants d'agences multiservices en quête de professionnalisme et de rapidité au guichet.
- Clients finaux ayant besoin d'une preuve d'opération officielle avec horodatage, code MTCN, identité de l'agence et détail net/taxe.

---

## 2. User Experience & Visual Design

### Parcours utilisateur (Workflow Guichet)
1. **Saisie rapide habituelle** : Le caissier valide un retrait ou un envoi (ex. Western Union, 105 000 F CFA avec 5 000 F CFA de taxe).
2. **Action immédiate ou différée** : 
   - Une option "Générer Reçu" est proposée lors de la validation.
   - Une icône "Ticket / Reçu" apparaît sur chaque ligne du journal des opérations du jour.
3. **Modal Reçu Interactif** : 
   - Aperçu visuel réaliste du ticket thermique (papier blanc texturé, bordures dentelées discrètes, typographie `JetBrains Mono` et `Plus Jakarta Sans`, code-barres / QR code SVG de validation).
   - Bouton **"Imprimer Ticket"** (déclenche l'impression thermique avec style `@media print` calibré à 80mm).
   - Bouton **"Télécharger Image / Partager"** (génère un rendu visuel net en PNG haute résolution prêt à être envoyé par smartphone / WhatsApp Web).

### Charte graphique du Ticket
- **En-tête** : Wordmark de l'agence `AnnoirFinancePro`, agence multiservices, date et heure précises (ex. `26/10/2026 à 14:32`).
- **Corps de transaction** :
  - Opérateur (badge distinctif : RIA, Western Union, MoneyGram, Seddo).
  - Nature du flux : **RETRAIT CLIENT (Décaissement)** ou **ENVOI CLIENT (Encaissement)**.
  - Nom du client & Numéro de référence / Code MTCN.
  - Pour les retraits : Montant principal net ($M2$), Taxe de transfert ($M1 - M2$), Total versé au client ($M1$).
  - Pour les envois : Montant total avec taxe encaissé ($M1$).
- **Pied de ticket** : Identifiant unique de transaction, signature guichet, mention *"Merci de votre confiance — Conservez ce reçu"*.

---

## 3. Key Product Decisions & Trade-Offs

### Décision 1 : Génération de l'image de reçu sans dépendances lourdes externes
- **Approche choisie** : Utilisation du rendu vectoriel DOM/Canvas natif HTML5 (`toDataURL('image/png')` ou SVG Blob) pour l'export image numérique.
- **Pourquoi** : Zéro dépendance npm volumineuse, exécution instantanée sur navigateur, compatibilité 100% avec les téléphones et tablettes.
- **Alternative écartée** : Les bibliothèques PDF lourdes côté client qui alourdissent le bundle et dégradent les polices de caractères locales.

### Décision 2 : Séparation stricte de l'impression du Ticket et du Bordereau journalier
- **Approche choisie** : Deux modes d'impression distincts :
  - `PrintableDailySheet` : Grand format A4 pour la clôture générale de journée.
  - `PrintableReceipt` : Format ticket thermique 80mm compact avec sélecteur de portée d'impression (`window.print()` ciblé via classe CSS dédiée).
- **Pourquoi** : Évite toute collision de mise en page entre le bilan de fin de journée de l'agence et les tickets individuels des clients.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Composants

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AnnoirFinancePro                              │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌─────────────────────────────────┐                 ┌─────────────────────┐
│  TransferOperatorsSection       │                 │ SeddoPartnersSection│
│  - Bouton "Reçu" par opération  │                 │ - Bouton "Reçu"     │
└──────────────────┬──────────────┘                 └──────────┬──────────┘
                   │                                           │
                   └─────────────────┬─────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │       ReceiptModal.tsx          │
                    │ - Aperçu ticket thermique 80mm  │
                    │ - Téléchargement PNG haute net. │
                    │ - Impression directe            │
                    │ - Partage rapide                │
                    └────────────────┬────────────────┘
                                     ▼
                    ┌─────────────────────────────────┐
                    │      PrintableReceipt.tsx       │
                    │ - Format thermique CSS @media   │
                    │ - Masqué à l'écran, actif print │
                    └─────────────────────────────────┘
```

### Modèle de données du Reçu
Le composant `ReceiptModal` consommera directement les objets existants `OperatorTransferTransaction` et `SeddoPartnerEntry`, sans altérer la persistance cloud existante.

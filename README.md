# Cartes Flex pour Home Assistant

Cinq cartes personnalisables pour piloter votre maison depuis vos tableaux de bord.

## Télécharger les cartes

[![Télécharger les 5 cartes (ZIP)](https://img.shields.io/badge/T%C3%A9l%C3%A9charger_les_5_cartes-ZIP-0075ca?style=for-the-badge&logo=github)](https://github.com/jfk84/cartes-flex-home-assistant/archive/refs/heads/main.zip)
## Les 5 cartes en images

Clique sur une capture pour ouvrir l’exemple de configuration correspondant.

### Boutons Flex

Regroupe les lumières, interrupteurs, scènes et scripts d’une pièce.

[![Capture de Boutons Flex](./boutons-flex-card/docs/apercu.png)](./boutons-flex-card/README.md#configurer-la-carte)

[Voir la configuration de Boutons Flex](./boutons-flex-card/README.md#configurer-la-carte)

### Clim Flex

Règle le chauffage ou la climatisation depuis un cadran animé.

[![Capture de Clim Flex](./clim-flex-card/docs/apercu.png)](./clim-flex-card/README.md#configurer-la-carte)

[Voir la configuration de Clim Flex](./clim-flex-card/README.md#configurer-la-carte)

### Garage Flex

Montre la porte fermée, ouverte ou en mouvement.

[![Capture de Garage Flex](./garage-flex-card/docs/apercu.png)](./garage-flex-card/README.md#configurer-la-carte)

[Voir la configuration de Garage Flex](./garage-flex-card/README.md#configurer-la-carte)

### Portail Flex

Affiche et commande un portail battant ou coulissant.

[![Capture de Portail Flex](./portail-flex-card/docs/apercu.png)](./portail-flex-card/README.md#configurer-la-carte)

[Voir la configuration de Portail Flex](./portail-flex-card/README.md#configurer-la-carte)

### Volet Flex

Commande un volet roulant et affiche les raccourcis de la pièce.

[![Capture de Volet Flex](./volet-flex-card/docs/apercu.png)](./volet-flex-card/README.md#configurer-la-carte)

[Voir la configuration de Volet Flex](./volet-flex-card/README.md#configurer-la-carte)

## Installer une carte dans Home Assistant

1. Télécharge le ZIP et décompresse-le. Chaque carte a son propre dossier.
2. Pour une installation manuelle, copie le fichier `*-flex-card.js` de la carte choisie dans le dossier `www` de ta configuration Home Assistant.
3. Dans **Paramètres → Tableaux de bord → ⋮ → Ressources**, ajoute le fichier comme **Module JavaScript**. Par exemple, pour Volet Flex, utilise `/local/volet-flex-card.js`. Recharge la page, puis ajoute une carte manuelle avec l’exemple YAML de sa fiche.

## ☕ Soutenir le projet

Les Cartes Flex sont gratuites. Si elles te sont utiles, tu peux soutenir leur développement en m’offrant un café. Merci !

[![Buy Me a Coffee — soutenir les Cartes Flex](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/jfk84)

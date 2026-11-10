# Publier Cartes Flex dans le Marketplace

Les cinq cartes sont regroupées dans le dépôt `jfk84/cartes-flex-home-assistant`. Le Marketplace lit `hacs.json` à la racine et installe le module `dist/cartes-flex-home-assistant.js`.

Après une modification dans l’un des cinq dossiers, reconstruis le module avec `node scripts/build-marketplace.mjs` et enregistre le fichier généré dans Git. Clim Flex conserve [la licence MIT de Climate Cluster Card](clim-flex-card/LICENSE).

1. Teste le pack dans Home Assistant via [Ouvrir dans le Marketplace](https://my.home-assistant.io/redirect/marketplace_repository/?owner=jfk84&repository=cartes-flex-home-assistant&category=plugin).
2. Pour proposer le pack au catalogue, ajoute une licence pour les cartes dont la licence reste à définir. Ajoute les mots-clés `home-assistant` et `lovelace` dans GitHub, puis configure la validation HACS avec la catégorie `plugin`.
3. Une fois la validation réussie, publie une version GitHub et propose le dépôt dans la liste `plugin` de `hacs/default`.

[Guide officiel de publication des cartes](https://contributors.home-assistant.io/marketplace/guides/dashboard/) · [Soumettre au catalogue](https://contributors.home-assistant.io/marketplace/guides/catalog/)

# Mettre les cartes Flex sur GitHub

Le [README de la collection](README.md) présente les cinq cartes. Pour le Marketplace, publie chaque dossier de carte dans un dépôt GitHub distinct.

| Dépôt GitHub | Première version proposée |
| --- | --- |
| `boutons-flex-card` | `v1.0.0` |
| `clim-flex-card` | `v2.2.0` |
| `garage-flex-card` | `v1.1.0` |
| `portail-flex-card` | `v1.2.0` |
| `volet-flex-card` | `v1.7.0` |

1. Crée un dépôt sur ton compte GitHub avec le nom indiqué. Choisis la visibilité **Public** quand tu souhaites le rendre installable dans le Marketplace.
2. Envoie **le contenu du dossier de la carte** à la racine du dépôt, avec le dossier caché `.github`. Le `README.md` et le `hacs.json` doivent être visibles à la racine.
3. Ajoute une description et les mots-clés `home-assistant` et `lovelace`, et active les **Issues**. Clim Flex inclut la licence MIT de Climate Cluster Card. Choisis et ajoute une licence pour chacune des quatre autres cartes avant de les proposer au catalogue.
4. Dans Home Assistant, ouvre **Paramètres → Marketplace → Ajouter depuis un lien** et teste l’installation à partir du lien du dépôt public. Connecte GitHub si Home Assistant le demande.
5. Pour apparaître dans la recherche du Marketplace, attends que la validation GitHub Actions passe, puis publie une **Release**. Ensuite, propose le dépôt dans le fichier `plugin` de `hacs/default`.

[Guide officiel de publication des cartes](https://contributors.home-assistant.io/marketplace/guides/dashboard/) · [Soumettre au catalogue](https://contributors.home-assistant.io/marketplace/guides/catalog/)

La présentation commune peut aussi être publiée dans un dépôt séparé. Si tu la publies seule, remplace ses liens vers les dossiers locaux par les liens des dépôts et conserve les fichiers d’aperçu aux chemins utilisés par la page.

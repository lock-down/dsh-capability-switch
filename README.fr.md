<p align="right"><a href="README.md">中文</a> | <a href="README.en.md">English</a> | <a href="README.ja.md">日本語</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.de.md">Deutsch</a> | <a href="README.ru.md">Русский</a> | <a href="README.pt.md">Português</a></p>

# Gestion des Skills et MCP DSH

Un plugin de la barre latérale DSH pour gérer les Skills locaux et les serveurs MCP. L'interface utilise les jetons de thème DSH, n'intègre pas d'iframe et conserve l'entrée `Skills et MCP`.

Le répertoire global `~/.agents/skills` n'entre pas dans le catalogue de Skills du modèle. Seuls les Skills synchronisés explicitement sont ajoutés à DSH.

![Gestion des Skills](docs/screenshots/overview.png)

## Fonctionnalités

- Rechercher, créer, modifier, activer, désactiver et supprimer des Skills utilisateur et projet.
- Masquer le répertoire Agent global du catalogue du modèle et ne synchroniser que les Skills choisis.
- Synchronisation par lien symbolique ou copie, affichage du mode, aperçu et sauvegarde avant remplacement.
- Sélection multiple par cases et suppression par lot.
- Importer des paquets de Skill `.zip` par glisser-déposer ou sélection de fichier.
- Modifier les entrées du MCP Manager et les MCP autonomes en formulaire ou JSON, tester la connexion, reconnecter, importer et demander l'approbation du Host.
- Mise à jour automatique des installations npm et notes GitHub Releases.

## Installation

```bash
dsh plugin --profile desktop add dsh-capability-switch
```

Pour une installation depuis les sources, clonez le dépôt, exécutez `npm install --ignore-scripts`, puis sélectionnez le dossier dans DSH via **Plugins → Ajouter un plugin**. La version actuelle est vérifiée pour DSH `0.2.3-alpha.2`.

## Langues

L'interface suit **Paramètres DSH → Général → Langue** et prend en charge les huit langues `zh`, `en`, `ja`, `es`, `fr`, `de`, `ru` et `pt`. Le changement de langue actualise automatiquement l'interface.

Les listes de Skills et MCP ne sont pas traduites. Les noms, descriptions, contenus SKILL.md, commandes et URL restent dans leur langue d'origine.

## Données et autorisations

Accès aux fichiers locaux `~/.dsh/skills`, `~/.agents/skills`, `~/.dsh/capability-switch` et au `cordis.patch.yml` du profil DSH actif. L'accès réseau se limite au registre npm (mise à jour automatique) et à l'API GitHub Releases (notes de version). Aucun Skill, configuration MCP ou identifiant n'est envoyé.

## Documentation

La documentation complète est disponible en [English](README.en.md) ou [中文](README.md).

## Licence

[MIT](LICENSE)

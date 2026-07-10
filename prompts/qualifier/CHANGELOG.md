# Changelog — prompts/qualifier

## v1 (2026-07-10)
- Version initiale. Rôle borné "preneur d'informations", interdictions
  prix/délai/conseil technique, 3 questions max, sortie JSON stricte,
  classification d'urgence HIGH/NORMAL/LOW.
- Toute modification = nouvelle version (v2.system.md), jamais d'édition en
  place d'une version déjà utilisée en production (traçabilité
  `Conversation.promptVersion`), et passage de la suite
  `npm run test:prompts` AVANT activation.

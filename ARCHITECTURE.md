# 🔐 Architecture Hermes ↔ Claude Code — Système de contrôle

```
╔══════════════════════════════════════════╗
║           FONDATEUR (Telegram)           ║
╠══════════════════════════════════════════╣
║  ↓ Rapports / Décisions ↑ Approbations  ║
╠═══════╦══════════════════════╦═══════════╣
║       ║                      ║           ║
║ HERMES║      ↔ via GitHub ↔  ║CLAUDE CODE║
║ (COO) ║  push / pull / merge ║   (CTO)   ║
║       ║                      ║           ║
╠═══════╩══════════════════════╩═══════════╣
║ ↓ Monitoring 24/7   ↓ Code & Features   ║
║ - 7 crons actifs    - Landing page       ║
║ - Santé VPS         - Stripe paiement    ║
║ - Rapports Telegram - Tests Playwright   ║
║ - Backups           - Chatbot Telegram   ║
╚══════════════════════════════════════════╝
```

## Règles de synchronisation absolues
1. **Claude Code** = responsable du CODE exclusivement
2. **Hermes** = responsable des OPS exclusivement
3. **GitHub** = point de passage unique (Hermes ne push PAS de code sans revue)
4. **Pull d'abord** avant tout push (évite les conflits)
5. **Jamais de credentials** dans le repo (`.env` = VPS uniquement)

## Pipeline
```
Claude Code push → GitHub → Hermes détecte → pull + rebuild ? → OK
                                                      ↓ non
                                              Rapporte au fondateur
```

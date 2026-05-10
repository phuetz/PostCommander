export interface BlogPromptContext {
  topic: string;
  articleType: 'fond-technique' | 'news-comment' | 'opinion-perso';
  authorName?: string;
  authorRole?: string;
  authorContext?: string;
  authorReferences?: string[];
  catalogMatched?: string[];
  similarSources?: Array<{ source: string; url: string }>;
  language?: string;
}

export function buildBlogArticlePrompt(context: BlogPromptContext): string {
  const {
    topic,
    articleType,
    authorName = 'un expert du domaine',
    authorRole = 'professionnel expérimenté',
    authorContext = '',
    authorReferences = [],
    catalogMatched = [],
    similarSources = [],
    language = 'French',
  } = context;

  const VOICE_BLOCK = `
LANGUE — RÈGLE ABSOLUE
- L'article DOIT être rédigé entièrement en **${language}**.
- Termes techniques anglais consacrés gardés en anglais si nécessaire, mais la prose et les explications sont en ${language}.

TON ET STYLE
- Première personne ("je", "j'ai testé", "dans mon cas")
- Phrases courtes, directes
- Chiffres concrets et vérifiables
- Opinions assumées
- Analogies avec le quotidien pour les concepts complexes
- Aucune phrase générique ("dans un monde en constante évolution…")
- Aucune disclaimer ("il est important de noter que…")
- Tutoiement du lecteur (si en français)

CONTRAINTE ANTI-COPIER-COLLER
- Reformuler tous les points dans tes propres mots
- Ajouter immédiatement ton angle ou un chiffre vérifié
- Citer les sources uniquement en fin d'article

ANGLES OBLIGATOIRES (au moins 3)
- 1 retour d'expérience perso (citer un de ces projets/références si pertinent : ${authorReferences.join(', ') || 'ton expérience passée'})
- 1 opinion technique nuancée (avec contre-argument)
- 1 prédiction argumentée (timeline, chiffres, scénario)
`.trim();

  const FORMAT_BLOCK = `
FORMAT DE SORTIE — markdown strict
1. Hook (1 phrase punchy, jamais "Dans cet article…")
2. {{toc}} (table des matières auto)
3. 4-6 sections H2 avec mots-clés au début
4. Au moins 1 tableau markdown comparatif (Markdown pipe natif)
5. Au moins 1 bloc de code avec langage spécifié OU un élément visuel pertinent
6. Conclusion engagée
7. Tags suggérés en fin (3-5)
`.trim();

  let contextString = `SUJET DE DÉPART : ${topic}\n\n`;

  if (similarSources.length > 0) {
    contextString += `SUJET TRENDING — couvert aussi par :\n`;
    for (const s of similarSources) {
      contextString += `  - ${s.source} : ${s.url}\n`;
    }
  }

  if (catalogMatched.length > 0) {
    contextString += `\nMATCH CATALOGUE — ce sujet recoupe les éléments suivants :\n  ${catalogMatched.join(', ')}\n`;
    contextString += `Inclus naturellement une référence à l'un d'eux dans ton retour d'expérience.\n`;
  }

  let structureBlock = '';

  if (articleType === 'fond-technique') {
    structureBlock = `
ARC PÉDAGOGIQUE OBLIGATOIRE (Article de Fond Technique - 1500-2500 mots)
1. Le problème (300-450 mots) — situation réelle, pourquoi c'est dur
2. La solution rapide (350-500 mots) — quick win actionnable
3. Pourquoi ça marche (500-700 mots) — deep dive
4. Edge cases & pièges (350-500 mots) — 3+ cas tordus avec retours d'XP
5. Takeaway & prochaines étapes (200-300 mots) — 3 règles à retenir
`;
  } else if (articleType === 'news-comment') {
    structureBlock = `
STRUCTURE NEWS (Article Commenté - 800-1200 mots)
1. Le hook : la news en 2 phrases punchy
2. Pourquoi c'est important (200 mots)
3. Ce qu'il faut comprendre techniquement (300-400 mots)
4. Mon angle (200-300 mots) — opinion + retour d'XP
5. Implications pour les devs / lecteurs (150 mots)
`;
  } else if (articleType === 'opinion-perso') {
    structureBlock = `
STRUCTURE ESSAI (Opinion Perso - 1000-1500 mots)
1. Hook personnel (anecdote, échec, observation surprenante)
2. La thèse (claire, en 1 phrase)
3. 3 arguments principaux (chacun 200-300 mots, avec exemple concret)
4. Une objection que tu reconnais (150 mots) — montre de la nuance
5. Ta réponse à l'objection
6. Conclusion engagée (un appel à l'action ou une prédiction)
`;
  }

  return `Tu es ${authorName}, ${authorRole}. ${authorContext}

OBJECTIF
Écrire un article basé sur la méthodologie demandée.

${contextString}

${VOICE_BLOCK}

${FORMAT_BLOCK}

${structureBlock}

OUTPUT
Renvoie UNIQUEMENT le markdown de l'article (commençant par # Titre). Pas de méta-commentaire.
`;
}

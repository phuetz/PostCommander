import { eq, and, gt, sql } from 'drizzle-orm';
import { getDrizzle } from '../db/connection.js';
import { posts, postPublications } from '../db/schema.js';
import { generateText } from 'ai';
import { createModel } from '../services/llm/provider-factory.js';
import { nanoid } from 'nanoid';

/**
 * Moteur Evergreen de PostCommander.
 * Cherche des posts vieux de plus de X jours avec un bon engagement,
 * et les réécrit pour les reprogrammer dans le futur.
 */
export async function runEvergreenRecycling() {
  const db = getDrizzle();
  console.log('[Evergreen Worker] Démarrage du recyclage...');

  // 1. Trouver les posts avec un bon engagement (ex: views > 100 ou likes > 5)
  // et qui n'ont pas déjà été recyclés récemment (pour simplifier, on prend des originaux)
  const candidates = await db
    .select({
      id: posts.id,
      content: posts.content,
      userId: posts.userId,
      workspaceId: posts.workspaceId,
      platforms: posts.platforms,
      tone: posts.tone,
      likes: postPublications.likes,
      views: postPublications.views,
    })
    .from(posts)
    .innerJoin(postPublications, eq(postPublications.postId, posts.id))
    .where(
      and(
        gt(postPublications.likes, 0), // au moins 1 like pour la démo
        sql`posts.original_post_id IS NULL`, // Ne pas recycler un post déjà recyclé
      ),
    )
    .limit(5);

  if (candidates.length === 0) {
    console.log('[Evergreen Worker] Aucun post candidat trouvé pour le recyclage.');
    return;
  }

  console.log(`[Evergreen Worker] Trouvé ${candidates.length} posts candidats.`);

  // 2. Réécrire et reprogrammer
  for (const post of candidates) {
    console.log(`[Evergreen Worker] Recyclage du post ${post.id}...`);

    try {
      const model = await createModel('openai', 'gpt-4o', post.userId || undefined);

      const systemPrompt = `You are an expert social media manager.
Your task is to take a previously successful post and REWRITE it completely to give it a fresh angle.
If the original post was a listicle, make it a personal story.
If it was a story, make it an actionable tip format.
Keep the same core message, but make it feel new.
Maintain the requested tone: ${post.tone}.
Return ONLY the new post text.`;

      const { text: newContent } = await generateText({
        model,
        system: systemPrompt,
        prompt: `Original post:\n"""\n${post.content}\n"""\n\nRewrite it with a fresh angle.`,
      });

      const newPostId = nanoid();
      // On planifie pour +7 jours (pour l'exemple on met une date future)
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 7);

      await db.insert(posts).values({
        id: newPostId,
        userId: post.userId,
        workspaceId: post.workspaceId,
        content: newContent.trim(),
        originalPostId: post.id, // Lien vers l'original !
        tone: post.tone,
        llmProvider: 'openai',
        llmModel: 'gpt-4o',
        platforms: post.platforms,
        status: 'scheduled',
        scheduledAt: scheduledDate.toISOString(),
      });

      // On insère aussi les publications futures
      const platformsArr = JSON.parse(post.platforms as unknown as string);
      for (const platform of platformsArr) {
        await db.insert(postPublications).values({
          id: nanoid(),
          postId: newPostId,
          platform: platform,
          status: 'pending',
        });
      }

      console.log(
        `[Evergreen Worker] Post ${post.id} recyclé avec succès -> Nouveau ID: ${newPostId}`,
      );
    } catch (e) {
      console.error(`[Evergreen Worker] Erreur lors du recyclage du post ${post.id}:`, e);
    }
  }

  console.log('[Evergreen Worker] Terminé.');
}

import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';

console.log('PostCommander: LinkedIn Content Script Injected.');

// Define a simple floating action button component
function FloatingActionButton() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleScrape = async () => {
    setStatus('loading');

    try {
      // Best-effort generic scraping for LinkedIn comments
      // LinkedIn frequently changes classes, so this tries a few common patterns
      const commentElements = document.querySelectorAll(
        '.comments-comment-item, .update-components-comment, article.comment',
      );

      const leads: Array<{ name: string; headline: string; content: string }> = [];

      commentElements.forEach((el) => {
        const nameEl = el.querySelector(
          '.comments-post-meta__name-text, .update-components-actor__name, span.hoverable-link-text',
        );
        const headlineEl = el.querySelector(
          '.comments-post-meta__headline, .update-components-actor__description',
        );
        const contentEl = el.querySelector(
          '.comments-comment-item__main-content, .update-components-text',
        );

        if (nameEl && contentEl) {
          leads.push({
            name: nameEl.textContent?.trim() || 'Unknown',
            headline: headlineEl?.textContent?.trim() || '',
            content: contentEl.textContent?.trim() || '',
          });
        }
      });

      if (leads.length === 0) {
        alert('PostCommander: No comments found on this page. Make sure the comments are visible.');
        setStatus('idle');
        return;
      }

      // Send to PostCommander backend
      // Note: we're using a dummy authorization token for MVP testing.
      const response = await fetch('http://localhost:3001/api/agent/scrape-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mvp_extension_token_123',
        },
        body: JSON.stringify({
          leads,
          sourceUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      console.log('PostCommander Scraping Result:', result);

      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('PostCommander Scraping Error:', err);
      alert('PostCommander: Failed to send leads to the server. Is localhost:3001 running?');
      setStatus('idle');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: status === 'success' ? '#10b981' : '#3b82f6',
        color: 'white',
        borderRadius: '9999px',
        width: '56px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        cursor: status === 'loading' ? 'wait' : 'pointer',
        zIndex: 99999,
        transition: 'background-color 0.3s',
      }}
      onClick={status === 'idle' ? handleScrape : undefined}
      title="Hijack Audience & Scrape Leads"
    >
      {status === 'idle' && <Sparkles size={24} />}
      {status === 'loading' && <Loader2 size={24} className="animate-spin" />}
      {status === 'success' && <CheckCircle2 size={24} />}
    </div>
  );
}

// ── Ghostwrite Copilot (/ai) ──
document.addEventListener('input', async (e) => {
  const target = e.target as HTMLElement;

  // LinkedIn uses contenteditable divs with .ql-editor classes usually
  if (!target || (!target.isContentEditable && target.tagName !== 'TEXTAREA')) return;

  const textContent = target.isContentEditable
    ? target.innerText
    : (target as HTMLTextAreaElement).value;

  if (textContent.endsWith('/ai')) {
    console.log('PostCommander: Ghostwrite trigger detected!');

    // Attempt to grab context from the nearest post
    const postElement = target.closest('.feed-shared-update-v2, .update-components-article');
    const postContext = postElement
      ? (postElement as HTMLElement).innerText.substring(0, 500)
      : 'General LinkedIn Context';

    try {
      const response = await fetch('http://localhost:3001/api/agent/ghostwrite-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer mvp_extension_token_123',
        },
        body: JSON.stringify({ context: postContext }),
      });

      if (response.ok) {
        const { data } = await response.json();
        const newText = textContent.replace('/ai', data.text);

        if (target.isContentEditable) {
          target.innerText = newText;
          // Note: for React-controlled components in LinkedIn, setting innerText might not trigger their state update.
          // In a real app, we'd need to simulate input events or use document.execCommand
        } else {
          (target as HTMLTextAreaElement).value = newText;
        }
      }
    } catch (err) {
      console.error('PostCommander Ghostwrite Error:', err);
    }
  }

  // ── Virality Checker ──
  // Check if we are typing a post (usually inside a modal)
  const isPostEditor =
    target.closest('.share-creation-state__share-box-v2') ||
    target.closest('.share-box-v2__wrapper');
  if (isPostEditor && target.isContentEditable) {
    const textLength = textContent.length;
    let score = 0;

    // Simple heuristic
    if (textLength > 100) score += 30; // Good length
    if (textLength > 500) score += 20; // Great length
    if (textContent.includes('?')) score += 20; // Question hook
    if (textContent.split('\n\n').length > 2) score += 30; // Well-spaced

    // Ensure score is capped
    score = Math.min(100, score);

    // Look for our injected UI, or create it
    let scoreIndicator = document.getElementById('pc-virality-score');
    if (!scoreIndicator) {
      const editorWrapper = target.closest('.share-creation-state__share-box-v2') as HTMLElement;
      if (editorWrapper) {
        scoreIndicator = document.createElement('div');
        scoreIndicator.id = 'pc-virality-score';
        scoreIndicator.style.cssText = `
          padding: 8px 12px;
          margin-bottom: 12px;
          border-radius: 8px;
          background-color: #f3f4f6;
          font-family: system-ui;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 4px solid #3b82f6;
        `;
        editorWrapper.prepend(scoreIndicator);
      }
    }

    if (scoreIndicator) {
      let color = '#ef4444'; // red
      if (score > 50) color = '#f59e0b'; // yellow
      if (score > 80) color = '#10b981'; // green

      scoreIndicator.innerHTML = `
        <strong>PostCommander Virality:</strong> 
        <div style="flex:1; height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden;">
          <div style="width: ${score}%; height: 100%; background: ${color}; transition: width 0.3s ease;"></div>
        </div>
        <span style="font-weight:bold; color: ${color}">${score}/100</span>
      `;
    }
  }
});

// Create a host element for the React app
const host = document.createElement('div');
host.id = 'postcommander-extension-root';
document.body.appendChild(host);

// Create a Shadow DOM to isolate styles from LinkedIn
const shadowRoot = host.attachShadow({ mode: 'open' });

// Create a container inside the shadow DOM
const rootContainer = document.createElement('div');
shadowRoot.appendChild(rootContainer);

// Render the React component
const root = createRoot(rootContainer);
root.render(<FloatingActionButton />);

// ── Shadow Profiling CRM ──
// If the user navigates to a LinkedIn profile, quietly capture their info.
if (window.location.href.includes('linkedin.com/in/')) {
  // LinkedIn is a SPA, so we wait a bit for the profile to render.
  setTimeout(async () => {
    try {
      const nameEl = document.querySelector('h1.text-heading-xlarge');
      const headlineEl = document.querySelector('.text-body-medium.break-words');

      if (nameEl && nameEl.textContent) {
        const name = nameEl.textContent.trim();
        const headline = headlineEl ? headlineEl.textContent?.trim() : '';

        console.log('PostCommander: Capturing Shadow Profile for', name);

        await fetch('http://localhost:3001/api/agent/shadow-profile', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer mvp_extension_token_123',
          },
          body: JSON.stringify({
            profileUrl: window.location.href,
            name,
            headline,
          }),
        });
      }
    } catch (e) {
      console.error('PostCommander Shadow Profile Error:', e);
    }
  }, 3000); // Wait 3s after navigating to the profile
}

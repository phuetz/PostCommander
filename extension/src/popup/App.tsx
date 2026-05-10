import { useState } from 'react';
import { Sparkles, Activity, Settings } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ padding: '16px', backgroundColor: '#ffffff', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Sparkles size={24} color="#3b82f6" />
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#111827' }}>PostCommander</h1>
      </header>
      
      <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
        {activeTab === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Quick Actions</h2>
              <button 
                onClick={async () => {
                  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                  if (tab.id) {
                    try {
                      const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                          return {
                            title: document.title,
                            url: window.location.href,
                            content: document.body.innerText.substring(0, 5000) // Get first 5k chars for MVP
                          };
                        }
                      });

                      if (results && results[0].result) {
                        const payload = results[0].result;
                        const response = await fetch('http://localhost:3001/api/posts/repurpose-url', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer mvp_extension_token_123'
                          },
                          body: JSON.stringify(payload)
                        });
                        
                        if (response.ok) {
                          alert('Draft saved successfully!');
                        } else {
                          alert('Failed to save draft.');
                        }
                      }
                    } catch (e) {
                      console.error('Failed to clip page', e);
                      alert('Error clipping page.');
                    }
                  }
                }}
                style={{ width: '100%', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 500, cursor: 'pointer' }}
              >
                Save Page as Draft
              </button>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Agent Status</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#10b981' }}>
                <Activity size={16} /> Active and listening
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}>
            <h2 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 500, color: '#374151' }}>Configuration</h2>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Configure your PostCommander API key here.</p>
          </div>
        )}
      </main>

      <footer style={{ display: 'flex', borderTop: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
        <button 
          onClick={() => setActiveTab('home')}
          style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderBottom: activeTab === 'home' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'home' ? '#3b82f6' : '#6b7280', fontWeight: 500 }}
        >
          Home
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderBottom: activeTab === 'settings' ? '2px solid #3b82f6' : '2px solid transparent', color: activeTab === 'settings' ? '#3b82f6' : '#6b7280', fontWeight: 500 }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px' }}>
            <Settings size={16} /> Settings
          </div>
        </button>
      </footer>
    </div>
  );
}

import React, { useState } from 'react';
import { Mic, Loader2, Sparkles } from 'lucide-react';
import { useAudioGenerator } from '../hooks/useAudioGenerator';
import { AudioPlayer } from '../components/ui/AudioPlayer';
import { motion } from 'framer-motion';

const VOICES = [
  { id: 'af_bella', name: 'Bella', gender: 'Female', language: 'English (US)', traits: 'Warm, professional' },
  { id: 'af_sarah', name: 'Sarah', gender: 'Female', language: 'English (US)', traits: 'Energetic, young' },
  { id: 'am_adam', name: 'Adam', gender: 'Male', language: 'English (US)', traits: 'Deep, authoritative' },
  { id: 'am_michael', name: 'Michael', gender: 'Male', language: 'English (US)', traits: 'Clear, engaging' },
  { id: 'bf_emma', name: 'Emma', gender: 'Female', language: 'English (UK)', traits: 'Sophisticated, calm' },
  { id: 'bm_george', name: 'George', gender: 'Male', language: 'English (UK)', traits: 'Classic, narrative' },
];

export default function VoiceStudioPage() {
  const [text, setText] = useState('Welcome to PostCommander. This is a demonstration of the Kokoro Text-To-Speech engine running entirely on our backend without external APIs.');
  const [selectedVoice, setSelectedVoice] = useState('af_bella');
  const { generateAudio, isGenerating, audioUrl } = useAudioGenerator();

  const handleGenerate = () => {
    generateAudio(text, selectedVoice);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Mic className="text-primary" />
          Studio Vocal (Kokoro)
        </h1>
        <p className="text-muted-foreground mt-2">
          Générez des voix-off ultra-réalistes pour vos vidéos, podcasts ou carrousels animés. 
          Ce moteur tourne en local, garantissant une confidentialité totale et l'absence de frais d'API tierce.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6 bg-card rounded-xl border border-border p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium mb-2">Texte à prononcer</label>
            <textarea
              rows={6}
              className="w-full bg-background border border-input rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary focus:border-transparent resize-y"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Saisissez le script de votre voix-off ici..."
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Supporte l'anglais principalement pour l'instant avec ce modèle.</span>
              <span>{text.length} caractères</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || text.trim() === ''}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 flex items-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Générer la Voix
                </>
              )}
            </button>
          </div>

          {audioUrl && (
            <div className="pt-6 border-t border-border mt-6">
              <h3 className="text-sm font-medium mb-4">Résultat :</h3>
              <AudioPlayer audioUrl={audioUrl} title={`Voix-off (${VOICES.find(v => v.id === selectedVoice)?.name})`} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Choix de la Voix</h3>
          <div className="flex flex-col gap-3">
            {VOICES.map((voice) => (
              <label 
                key={voice.id}
                className={`
                  flex flex-col p-4 rounded-xl border cursor-pointer transition-all
                  ${selectedVoice === voice.id 
                    ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                    : 'border-border bg-card hover:bg-accent/50 hover:border-accent'}
                `}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="voice" 
                      value={voice.id} 
                      checked={selectedVoice === voice.id}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="sr-only"
                    />
                    <span className="font-semibold">{voice.name}</span>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-secondary text-secondary-foreground">
                    {voice.language}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {voice.gender} • {voice.traits}
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

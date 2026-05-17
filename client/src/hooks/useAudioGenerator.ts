import { useState } from 'react';
import { synthesizeAudio } from '../services/audio';
import toast from 'react-hot-toast';

export function useAudioGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generateAudio = async (text: string, voice?: string) => {
    if (!text.trim()) {
      toast.error('Le texte est vide.');
      return;
    }
    
    setIsGenerating(true);
    // Revoke previous URL to prevent memory leaks
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    try {
      // Show loading toast because the first time it will download the model
      const tId = toast.loading('Génération vocale en cours... (Le premier lancement peut prendre du temps)');
      
      const url = await synthesizeAudio(text, voice);
      
      toast.dismiss(tId);
      toast.success('Voix générée avec succès !');
      setAudioUrl(url);
    } catch (err: any) {
      toast.dismiss();
      toast.error(err.response?.data?.message || 'Erreur lors de la génération vocale.');
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAudio,
    isGenerating,
    audioUrl,
  };
}

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3002/api',
  withCredentials: true,
});

export const synthesizeAudio = async (text: string, voice?: string): Promise<string> => {
  const response = await api.post('/audio/synthesize', { text, voice }, {
    responseType: 'blob', // IMPORTANT: We expect binary data
  });
  
  // Create an object URL from the Blob
  const blob = new Blob([response.data], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
};

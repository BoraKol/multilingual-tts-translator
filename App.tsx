
import React, { useState, useCallback } from 'react';
import { TTSVoice } from './types';
import { translateText, generateSpeech } from './services/geminiService';
import AudioPlayer from './components/AudioPlayer';
import { TranslateIcon, LoaderIcon } from './components/Icons';

const languageOptions: { [key: string]: string } = {
  'English': 'en-US',
  'German': 'de-DE',
  'Russian': 'ru-RU',
  'Spanish': 'es-ES',
};

interface FormData {
  inputText: string;
  targetLanguageName: string;
}

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    inputText: 'Hello world, this is a test of a multilingual text-to-speech application.',
    targetLanguageName: 'Spanish',
  });

  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setTranslatedText(null);
    setAudioData(null);

    try {
      const { inputText, targetLanguageName } = formData;
      const targetLanguageCode = languageOptions[targetLanguageName];
      const ttsVoiceName = TTSVoice.Charon; // Hardcoded smooth male voice

      if (!inputText || !targetLanguageName || !targetLanguageCode) {
        throw new Error("All fields are required.");
      }

      // Step 1: Translate Text
      const translation = await translateText(inputText, targetLanguageName, targetLanguageCode);
      setTranslatedText(translation);

      // Step 2: Generate Speech
      const audio = await generateSpeech(translation, targetLanguageName, targetLanguageCode, ttsVoiceName);
      setAudioData(audio);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Failed to process request: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-500">
            Multilingual TTS Translator
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto">
            Translate text to any language and hear it spoken naturally with Gemini.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="inputText" className="block text-sm font-medium text-slate-300 mb-2">Text to Translate</label>
                <textarea
                  id="inputText"
                  name="inputText"
                  rows={5}
                  value={formData.inputText}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                  placeholder="e.g., Hello world"
                />
              </div>

              <div>
                <label htmlFor="targetLanguageName" className="block text-sm font-medium text-slate-300 mb-2">Target Language</label>
                <select
                  id="targetLanguageName"
                  name="targetLanguageName"
                  value={formData.targetLanguageName}
                  onChange={handleInputChange}
                  className="w-full bg-slate-900/50 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                >
                  {Object.keys(languageOptions).map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500"
              >
                {isLoading ? (
                  <>
                    <LoaderIcon className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <TranslateIcon className="w-6 h-6" />
                    Translate & Synthesize
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 flex flex-col space-y-4">
            <h2 className="text-2xl font-bold text-slate-100">Result</h2>
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <LoaderIcon className="w-12 h-12 animate-spin text-cyan-500" />
                <p className="mt-4 text-lg">Generating response...</p>
              </div>
            )}
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg">
                <p className="font-semibold">Error</p>
                <p>{error}</p>
              </div>
            )}
            {!isLoading && !error && (
              <>
                {translatedText ? (
                  <div className="space-y-4 flex-grow flex flex-col">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-300 mb-2">Translated Text</h3>
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 min-h-[100px]">
                        <p>{translatedText}</p>
                      </div>
                    </div>
                    {audioData && (
                        <AudioPlayer base64Audio={audioData} />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-center">
                    <p>Your translated text and synthesized audio will appear here.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

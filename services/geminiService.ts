
import { GoogleGenAI, Modality } from "@google/genai";
import { TTSVoice } from '../types';

let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable is not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

export const translateText = async (
  inputText: string,
  targetLanguageName: string,
  targetLanguageCode: string
): Promise<string> => {
  const ai = getAI();
  const prompt = `Translate this text into ${targetLanguageName} (${targetLanguageCode}): ${inputText}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ parts: [{text: prompt}] }],
      config: {
        systemInstruction: "You are an expert translator. Your sole purpose is to translate the user's input text into the target language provided. Only output the final translated text and nothing else.",
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Translation API error:", error);
    throw new Error("Failed to translate text.");
  }
};

export const generateSpeech = async (
  translatedText: string,
  targetLanguageName: string,
  targetLanguageCode: string,
  ttsVoiceName: TTSVoice
): Promise<string> => {
  const ai = getAI();
  const prompt = `Say clearly and naturally in ${targetLanguageName}: ${translatedText}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: ttsVoiceName } },
          languageCode: targetLanguageCode,
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      throw new Error("No audio data received from API.");
    }
    
    return base64Audio;
  } catch (error) {
    console.error("TTS API error:", error);
    throw new Error("Failed to generate speech.");
  }
};

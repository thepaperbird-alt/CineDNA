import { GoogleGenAI, Type } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export interface CharacterNode {
  id: string;
  name: string;
  role: string;
  iconType: 'hero' | 'villain' | 'sidekick' | 'mentor' | 'love-interest' | 'other';
}

export interface CharacterLink {
  source: string;
  target: string;
  type: string;
}

export interface CharacterTreeData {
  nodes: CharacterNode[];
  links: CharacterLink[];
  summary: string;
}

export async function getCharacterTree(title: string, year?: string): Promise<CharacterTreeData> {
  const prompt = `Generate a character relationship tree for the movie or TV show "${title}" ${year ? `(${year})` : ''}. 
  
  CRITICAL INSTRUCTIONS:
  1. Identify the main characters in the STRICT ORDER OF THEIR FIRST APPEARANCE in the story.
  2. For each character, assign an iconType from: hero, villain, sidekick, mentor, love-interest, other.
  3. Create links between characters. For each link, provide a short "type" description (max 3 words) explaining the connection (e.g., "Father", "Arch-Nemesis", "Best Friend").
  4. Keep it to the most important 10-15 characters.
  5. The first character in the "nodes" array MUST be the very first significant character to appear on screen.
  6. Provide a 2-3 line summary of the show/movie's plot in the "summary" field.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nodes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                role: { type: Type.STRING },
                iconType: { 
                  type: Type.STRING,
                  enum: ['hero', 'villain', 'sidekick', 'mentor', 'love-interest', 'other']
                }
              },
              required: ['id', 'name', 'role', 'iconType']
            }
          },
          links: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                source: { type: Type.STRING },
                target: { type: Type.STRING },
                type: { type: Type.STRING }
              },
              required: ['source', 'target', 'type']
            }
          },
          summary: { type: Type.STRING }
        },
        required: ['nodes', 'links', 'summary']
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    throw new Error("Invalid data received from AI");
  }
}

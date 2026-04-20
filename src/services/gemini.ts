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

export interface PlotPoint {
  order: number;
  event: string;
  description: string;
}

export interface CharacterTreeData {
  nodes: CharacterNode[];
  links: CharacterLink[];
  summary: string;
  plotPoints: PlotPoint[];
}

export async function getCharacterTree(title: string, year?: string): Promise<CharacterTreeData> {
  const prompt = `Generate a character relationship tree and major plot points for the movie or TV show "${title}" ${year ? `(${year})` : ''}. 
  
  CRITICAL INSTRUCTIONS:
  1. Identify the main characters in the STRICT ORDER OF THEIR FIRST APPEARANCE in the story.
  2. For each character, assign an iconType from: hero, villain, sidekick, mentor, love-interest, other.
  3. Create links between characters. For each link, provide a short "type" description (max 3 words) explaining the connection (e.g., "Father", "Arch-Nemesis", "Best Friend").
  4. Keep it to the most important 10-15 characters.
  5. Provide a 2-3 line summary of the show/movie's plot in the "summary" field.
  6. Identify 5-8 MAJOR PLOT POINTS in chronological order. Each point should have:
     - order: sequential number.
     - event: a short title of the event (e.g., "The Rebellion Begins").
     - description: a 1-sentence summary of what happens.`;

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
          summary: { type: Type.STRING },
          plotPoints: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                order: { type: Type.INTEGER },
                event: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['order', 'event', 'description']
            }
          }
        },
        required: ['nodes', 'links', 'summary', 'plotPoints']
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

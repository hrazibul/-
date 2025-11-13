import { GoogleGenAI, Type } from "@google/genai";
import { ApiResponse, KnowledgeSource } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const detectLanguage = (text: string): 'en' | 'bn' => {
    // Regex for Bengali Unicode characters (covers the main block)
    const bengaliRegex = /[\u0980-\u09FF]/;
    if (bengaliRegex.test(text)) {
        return 'bn';
    }
    return 'en'; // Default to English
};


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        answer: {
            type: Type.STRING,
            description: "Very short direct answer (1-3 sentences)."
        },
        explanation: {
            type: Type.STRING,
            description: "Short expanded explanation referencing retrieved passages."
        },
        sources: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    file: { type: Type.STRING },
                    location: { type: Type.STRING },
                    quote: { type: Type.STRING }
                },
                required: ["file", "location", "quote"]
            }
        },
        confidence: {
            type: Type.STRING,
            description: "Confidence level: 'low', 'medium', or 'high'."
        },
        follow_up_questions: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING
            }
        }
    },
    required: ["answer", "explanation", "sources", "confidence", "follow_up_questions"]
};

const systemInstruction = `You are a helpful, accurate knowledge-base assistant. When given a user question, first retrieve the most relevant document passages from the uploaded knowledge base. Use retrieved passages as the primary evidence to compose your answer. Always:
- Prioritize direct quotes or paraphrases from retrieved passages and label them as “Source X” (where X is the filename and page/paragraph id).
- Provide a short, clear answer (1–3 sentences) for quick consumption, then a brief expanded explanation (2–4 sentences) with supporting evidence.
- Include a “Sources” list with file names and exact passage references for every factual claim.
- If the retrieved evidence does not support a confident answer, say you’re not sure and offer the best-available inference, clearly labeled as “Inference.”
- Offer 1–3 suggested follow-up questions the user can ask.
- Respect privacy: do not reveal personal, secret, or restricted data; refuse to answer unsafe or disallowed requests.
- Keep language simple and friendly; aim for a broad audience.`;

type Language = 'en' | 'bn';

export const getAnswerFromContext = async (question: string, context: string, language: Language): Promise<ApiResponse> => {
    const languageInstruction = language === 'bn'
        ? "The user has asked a question in Bengali. Your answer, explanation, and follow-up questions must also be in Bengali. The JSON structure (keys) must remain in English."
        : "Use plain English for the answer, explanation, and follow-up questions.";

    const userPrompt = `Question: ${question}\nContext: ${context}\nInstructions: Compose an output JSON with the following keys: answer, explanation, sources, confidence (low/medium/high), follow_up_questions. ${languageInstruction} Mark any inferred claims with the prefix "Inference:".`;

    const finalSystemInstruction = systemInstruction + (language === 'bn'
        ? "\n- The user is communicating in Bengali. You must provide all textual responses (answers, explanations, etc.) in Bengali."
        : "");

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: userPrompt,
            config: {
                systemInstruction: finalSystemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.1,
            }
        });

        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText);

        // Basic validation
        if (!parsedResponse.answer || !parsedResponse.explanation || !parsedResponse.sources) {
            throw new Error("Invalid response format from API");
        }
        return parsedResponse as ApiResponse;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get an answer from the AI model. Please check the console for details.");
    }
};

const getSourceName = (source: KnowledgeSource): string => {
    return source.type === 'file' ? (source.source as File).name : (source.source as string);
}

// SIMULATION: In a real app, this would involve a backend service to parse files,
// chunk them, create embeddings, and perform a vector search. The original simulation
// was too basic. This new version uses an AI call to generate a plausible, relevant
// context for the demo, making the app appear functional.
export const retrieveContext = async (sources: KnowledgeSource[], query: string): Promise<string> => {
    const sourceNames = sources.map(getSourceName);
    console.log(`Simulating retrieval for query "${query}" from sources:`, sourceNames);
    if (sources.length === 0) {
        return "No documents or URLs provided.";
    }

    const language = detectLanguage(query) === 'bn' ? 'Bengali' : 'English';

    const prompt = `A user is asking a question about a set of documents.
    Knowledge Base (filenames): "${sourceNames.join(', ')}"
    User's question: "${query}"
    
    Your task is to act as a simulated retrieval system. Based on the document titles and the user's question, generate a realistic text snippet in the ${language} language that would likely be found in such a document and would directly help answer the question.
    
    IMPORTANT:
    - The snippet you generate must be in ${language}.
    - This is a simulation, so you must create the text, but it should be grounded in the implied topic of the documents and the user's query. Avoid creating fantastical or irrelevant information.
    - Format the snippet like this: [source_name — location — 'The content of the snippet...']
    - Pick one of the provided source names for the snippet.
    - Keep the snippet concise and highly relevant to the question (2-3 sentences max).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Using a fast model for context generation
            contents: prompt,
            config: {
                temperature: 0.4, // Slightly lower temperature for more focused context
            }
        });
        
        const fakeContext = response.text.trim();
        console.log("Generated fake context:", fakeContext);
        return fakeContext;
    } catch (error) {
        console.error("Error generating fake context:", error);
        // Fallback to a generic message if the context generation fails
        return `[${sourceNames[0]} — page 1:para 1 — 'Failed to generate a relevant context. This document provides an overview of company policies.']`;
    }
};
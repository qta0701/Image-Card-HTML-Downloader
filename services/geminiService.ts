import { GoogleGenAI } from "@google/genai";

export const generateArtifactsFromText = async (prompt: string): Promise<string> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Using a model capable of good reasoning and code generation
    const modelId = 'gemini-2.5-flash'; 

    const systemInstruction = `
      You are an expert Frontend Developer and UI Designer. 
      Your task is to generate high-quality, modern, and aesthetic HTML/CSS code artifacts based on the user's description.
      
      Requirements:
      1. Return valid HTML5 code blocks.
      2. Embed ALL CSS within <style> tags in the <head>. Do not use external CSS files (CDN links for fonts/libraries are okay).
      3. The design should be responsive but primarily optimized for a fixed card size (e.g., 1080x1080 or 1280x1280) as these will be converted to images.
      4. Use a container div with a specific class or ID to wrap the content.
      5. If the user asks for multiple slides/cards (e.g., for Instagram), generate multiple HTML code blocks, one for each card.
      6. Use 'Pretendard' or 'Inter' or system fonts for modern typography.
      7. Ensure high contrast and readability.
      
      Return ONLY the code blocks formatted as markdown:
      \`\`\`html
      ... code ...
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, // Slight creativity for design
      },
    });

    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

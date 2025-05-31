import OpenAI from 'openai';

// Initialisiere den OpenAI Client
const openai = new OpenAI({
  apiKey: process.env['REACT_APP_OPENAI_API_KEY'],
  dangerouslyAllowBrowser: true // Nur für Entwicklung, in Produktion sollte dies über einen Backend-Service laufen
});

/**
 * Reformuliert einen Text mithilfe von GPT
 * @param text Der zu reformulierende Text
 * @returns Der reformulierte Text
 */
export async function reformulateText(text: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Du bist ein Assistent, der dabei hilft, Texte professionell und klar zu formulieren. Behalte den Inhalt bei, verbessere aber die Formulierung."
        },
        {
          role: "user",
          content: `Bitte formuliere den folgenden Text professionell und klar um:\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    return completion.choices[0]?.message?.content || text;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Fehler bei der Textumformulierung');
  }
} 
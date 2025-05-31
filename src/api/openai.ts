interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function reformulateText(text: string): Promise<string> {
  try {
    const response = await fetch('/api/openai/reformulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('API-Anfrage fehlgeschlagen');
    }

    const data: OpenAIResponse = await response.json();
    const reformulatedText = data.choices[0]?.message?.content;

    if (!reformulatedText) {
      throw new Error('Keine Antwort von der KI erhalten');
    }

    return reformulatedText;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
} 
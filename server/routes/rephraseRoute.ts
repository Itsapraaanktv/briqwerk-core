import { Router, RequestHandler } from 'express';

interface RephraseRequest {
  note: string;
}

interface RephraseResponse {
  revisedNote: string;
}

interface ErrorResponse {
  error: string;
}

const router = Router();

const rephraseHandler: RequestHandler<{}, RephraseResponse | ErrorResponse, RephraseRequest> = async (req, res) => {
  const { note } = req.body;

  if (!note) {
    res.status(400).json({ error: 'Note text is required' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env["OPENAI_API_KEY"]}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Du bist ein Assistent, der dabei hilft, Texte professionell und klar zu formulieren. Der Fokus liegt auf Baustellendokumentation."
          },
          {
            role: "user",
            content: `Formuliere diesen Baustellentext professionell, aber klar verständlich: "${note}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API');
    }

    res.json({ 
      revisedNote: data.choices[0].message.content.trim() 
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to process text' });
  }
};

router.post('/rephrase', rephraseHandler);

export default router; 
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req, res) {
  // CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    console.log('=== REQUEST START ===');
    console.log('Body type:', typeof req.body);
    console.log('Body:', JSON.stringify(req.body));

    const body = req.body;

    // Получаем сообщение от Яндекс Диалогов
    const userMessage = body?.request?.original_utterance || body?.request?.command || '';
    console.log('User message:', userMessage);

    if (!userMessage) {
      res.status(200).json({
        version: '1.0',
        response: {
          text: 'Я вас не слышу. Повторите, пожалуйста.',
          tts: 'Я вас не слышу. Повторите, пожалуйста.',
          end_session: false
        }
      });
      return;
    }

    const openrouterKey = process.env.OPENROUTER_API_KEY;
    
    if (!openrouterKey) {
      console.error('OPENROUTER_API_KEY not set');
      res.status(200).json({
        version: '1.0',
        response: {
          text: 'Ошибка: ключ API не настроен.',
          tts: 'Ошибка: ключ API не настроен.',
          end_session: false
        }
      });
      return;
    }

    // Системный промпт
    const messages = [
      { 
        role: 'system', 
        content: 'Ты — дружелюбный голосовой ассистент Алиса. Отвечай кратко, по делу, на русском языке. Максимум 2-3 предложения. Не используй markdown и специальные символы.' 
      },
      { role: 'user', content: userMessage }
    ];

    console.log('Calling OpenRouter...');

    // Запрос к OpenRouter
    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://alice-gemini-serper-amber-pi.vercel.app',
        'X-Title': 'Alice Skill'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3-8b-instruct:free',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7
      })
    });

    const aiData = await aiRes.json();
    console.log('AI response:', JSON.stringify(aiData));

    let reply = 'Извините, я не смогла ответить. Попробуйте ещё раз.';
    
    if (aiData?.choices?.[0]?.message?.content) {
      reply = aiData.choices[0].message.content.trim();
    } else if (aiData?.error) {
      console.error('AI error:', aiData.error);
      reply = 'Произошла ошибка при обращении к AI.';
    }

    // Ограничиваем длину
    if (reply.length > 1024) {
      reply = reply.substring(0, 1021) + '...';
    }

    console.log('Final reply:', reply);

    res.status(200).json({
      version: '1.0',
      response: {
        text: reply,
        tts: reply,
        end_session: false
      }
    });

  } catch (error) {
    console.error('ERROR:', error.message, error.stack);
    res.status(200).json({
      version: '1.0',
      response: {
        text: 'Произошла ошибка на сервере.',
        tts: 'Произошла ошибка на сервере.',
        end_session: false
      }
    });
  }
}

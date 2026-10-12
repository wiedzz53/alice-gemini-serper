export default async function handler(request, response) {
  // Разрешаем CORS для Яндекс Диалогов
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = request.body;
    const userMessage = body?.command?.original_text || body?.request?.command?.original_text || '';
    const sessionId = body?.session?.session_id || '';

    // Получаем историю из хранилища (если есть)
    const history = body?.state?.session?.history || [];

    // Формируем промпт с историей
    const messages = [
      { role: 'system', content: 'Ты — дружелюбный голосовой ассистент Алиса. Отвечай кратко, по делу, на русском языке. Максимум 2-3 предложения.' },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: 'user', content: userMessage }
    ];

    // Запрос к OpenRouter
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const serperKey = process.env.SERPER_API_KEY;

    let finalMessage = userMessage;

    // Если есть Serper — ищем в интернете
    if (serperKey && userMessage.length > 2) {
      try {
        const searchRes = await fetch('https://google.serper.dev/search', {
          method: 'POST',
          headers: {
            'X-API-KEY': serperKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ q: userMessage, num: 3 })
        });
        const searchData = await searchRes.json();
        if (searchData.organic && searchData.organic.length > 0) {
          const snippets = searchData.organic.slice(0, 3).map(r => `${r.title}: ${r.snippet}`).join('\n');
          finalMessage = `Вопрос: ${userMessage}\n\nРезультаты поиска:\n${snippets}\n\nОтветь на вопрос, используя эти данные.`;
        }
      } catch (e) {
        console.error('Serper error:', e);
      }
    }

    messages[messages.length - 1].content = finalMessage;

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://alice-gemini-serper.vercel.app',
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

    let reply = 'Извините, я не смогла ответить. Попробуйте ещё раз.';
    if (aiData?.choices?.[0]?.message?.content) {
      reply = aiData.choices[0].message.content.trim();
    }

    // Ограничиваем длину ответа для Алисы
    if (reply.length > 1024) {
      reply = reply.substring(0, 1021) + '...';
    }

    // Формируем ответ для Яндекс Диалогов
    const newHistory = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: reply }
    ].slice(-10); // храним последние 10 сообщений

    return response.status(200).json({
      version: '1.0',
      response: {
        text: reply,
        tts: reply,
        end_session: false
      },
      session_state: {
        history: newHistory
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({
      version: '1.0',
      response: {
        text: 'Произошла ошибка. Попробуйте позже.',
        tts: 'Произошла ошибка. Попробуйте позже.',
        end_session: false
      }
    });
  }
}

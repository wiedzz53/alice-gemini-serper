export default async function handler(req, res) {
  try {
    // Правильный парсинг тела запроса
    let body;
    
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else if (req.body && typeof req.body === 'object') {
      body = req.body;
    } else {
      // Читаем raw body
      const text = await req.text();
      body = JSON.parse(text);
    }

    console.log('Parsed body:', JSON.stringify(body));

    const userMessage = body?.request?.original_utterance || body?.request?.command || 'тест';
    
    const reply = `Вы написали: ${userMessage}. Я работаю!`;

    res.status(200).json({
      version: '1.0',
      response: {
        text: reply,
        tts: reply,
        end_session: false
      }
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({
      version: '1.0',
      response: {
        text: 'Ошибка сервера',
        tts: 'Ошибка сервера',
        end_session: false
      }
    });
  }
}

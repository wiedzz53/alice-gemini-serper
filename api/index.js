export default async function handler(req, res) {
  try {
    // Логируем всё
    console.log('Method:', req.method);
    console.log('Headers:', JSON.stringify(req.headers));
    
    let body = req.body;
    console.log('Body type:', typeof body);
    console.log('Body:', JSON.stringify(body));

    // Если body строка - парсим
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        console.log('Parse error:', e);
      }
    }

    const userMessage = body?.request?.original_utterance || body?.request?.command || 'тест';
    console.log('User message:', userMessage);

    const reply = `Тест ответ. Вы написали: ${userMessage}`;

    const response = {
      version: '1.0',
      response: {
        text: reply,
        tts: reply,
        end_session: false
      }
    };

    console.log('Response:', JSON.stringify(response));
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(200).json({
      version: '1.0',
      response: {
        text: 'Ошибка',
        tts: 'Ошибка',
        end_session: false
      }
    });
  }
}

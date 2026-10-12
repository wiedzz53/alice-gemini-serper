export default async function handler(request, response) {
  // CORS заголовки
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
    console.log('Request received:', JSON.stringify(request.body));

    // Возвращаем простой ответ без обращения к AI
    return response.status(200).json({
      version: '1.0',
      response: {
        text: 'Привет! Я работаю.',
        tts: 'Привет! Я работаю.',
        end_session: false
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return response.status(500).json({
      version: '1.0',
      response: {
        text: 'Ошибка сервера.',
        tts: 'Ошибка сервера.',
        end_session: false
      }
    });
  }
}

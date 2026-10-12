export default function handler(req, res) {
  res.status(200).json({
    version: '1.0',
    response: {
      text: 'Работает!',
      tts: 'Работает!',
      end_session: false
    }
  });
}

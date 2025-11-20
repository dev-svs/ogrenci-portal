const OpenAI = require("openai");
const pool = require("../config/db");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 1) DB’den kulüpleri çekiyoruz
async function getClubList() {
  const [rows] = await pool.query("SELECT name FROM clubs");
  return rows.map((r) => r.name);
}

// 🔥 2) Chatbot ana fonksiyonu
exports.chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ ok: false, error: "Mesaj eksik" });
    }

    const clubList = await getClubList(); // DB’den kulüpler

    // GPT'ye bu kulüpler dışında öneri YASAK diyoruz
    const systemPrompt = `
Sen bir öğrenci kulüp öneri asistanısın.
Kullanıcının ilgi alanını analiz et ve SADECE aşağıdaki kulüpler arasından öneri yap:

Mevcut kulüpler: ${clubList.join(", ")}

❗ Bu listedeki olmayan kulüpleri ASLA ÖNERME.
Eğer kullanıcı "yüzme", "su sporları", "boks" gibi mevcut olmayan bir kulüp sorarsa:

1) "Maalesef bu kulübümüz yok." de.
2) Ardından mevcut kulüplerden ilgi alanına en yakın olanları öner.

Her zaman kısa, nazik ve doğal cevap ver.
`;

    // 🔥 GPT ÇAĞRISI
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
    });

    const reply = completion.choices[0].message.content;

    return res.json({ ok: true, reply });

  } catch (err) {
    console.error("🔥 CHATBOT ERROR:", err);
    return res.status(500).json({
      ok: false,
      error: "Chatbot çalışırken hata oluştu."
    });
  }
};

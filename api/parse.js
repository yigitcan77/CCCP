import { callLLM } from "./_llm.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }
  const { text } = req.body || {};
  if (!text) {
    res.status(400).json({ error: "text is required" });
    return;
  }
  try {
    const result = await callLLM(text);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

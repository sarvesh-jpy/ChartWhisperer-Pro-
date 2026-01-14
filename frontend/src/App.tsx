import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string>("Give me some setup");
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // --- 1. VOICE FUNCTIONS (These were missing before!) ---
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find(voice => voice.name.includes('Google US English')) || voices[0];
      utterance.rate = 1.1; 
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setAnalysis("");
    handleStopSpeaking();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("strategy", strategy);

    try {
      // ⚠️ USING LOCALHOST FOR TESTING
      const response = await axios.post("https://chartwhisperer-pro.onrender.com/analyze", formData);
      const resultText = response.data.analysis;
      setAnalysis(resultText);
      speakText(resultText.replace(/[*#]/g, '')); 
    } catch (error) {
      console.error("Error analyzing chart:", error);
      setAnalysis("**Error:** Could not analyze. Check backend terminal.");
    } finally {
      setLoading(false);
    }
  };

  // ... inside App function ...

  const handleSaveAndAlert = async () => {
    if (!analysis) return;
    setSaving(true);

    // 1. Helper function to find text between two words
    const extractValue = (text: string, label: string) => {
      const regex = new RegExp(`${label}:\\s*(.*?)(?=\\n|$)`, "i");
      const match = text.match(regex);
      return match ? match[1].trim() : "N/A";
    };

    // 2. Extract the Real Numbers from the AI text
    // (Matches the "ENTRY:", "SL:", "TP:" format from your System Prompt)
    const realEntry = extractValue(analysis, "ENTRY");
    const realSL = extractValue(analysis, "SL");
    const realTP = extractValue(analysis, "TP");
    const realPair = extractValue(analysis, "PAIR") || "XAU/USD";
    const realBias = extractValue(analysis, "BIAS") || "Neutral";

    const payload = {
        pair: realPair, 
        bias: realBias,
        entry: realEntry,         // <--- Now sends "2024.50" instead of "See Analysis"
        stop_loss: realSL,        // <--- Now sends "2020.00"
        take_profit: realTP,      // <--- Now sends "2030.00"
        analysis_text: analysis
    };

    try {
        // Use your RENDER URL here
        await axios.post("https://chartwhisperer-pro.onrender.com/save", payload);
        alert("✅ Sent Real Numbers to Telegram!");
    } catch (error) {
        console.error(error);
        alert("❌ Failed to save.");
    } finally {
        setSaving(false);
    }
};
  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400">ChartWhisperer Pro 🚀</h1>
          {isSpeaking && (
            <button onClick={handleStopSpeaking} className="bg-red-500 px-4 py-2 rounded-full animate-pulse font-bold">Stop Speaking 🔇</button>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <label className="block text-green-400 font-bold mb-2">My Trading Strategy</label>
              <textarea className="w-full h-32 bg-gray-900 text-gray-300 p-3 rounded border border-gray-600 outline-none resize-none" value={strategy} onChange={(e) => setStrategy(e.target.value)} />
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <input type="file" onChange={handleFileChange} className="block w-full text-sm text-gray-400 mb-4" />
              {preview && <img src={preview} className="w-full rounded-md border border-gray-600 mb-4 max-h-[300px] object-cover" />}
              <button onClick={handleAnalyze} disabled={loading || !file} className={`w-full py-3 rounded-md font-bold text-lg ${loading ? "bg-gray-600" : "bg-green-500 hover:bg-green-600"}`}>{loading ? "Analyzing..." : "Analyze & Speak"}</button>
            </div>
          </div>
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 h-[700px] overflow-y-auto relative">
            <h2 className="text-2xl font-semibold mb-4 text-green-400">Analysis Report</h2>
            <div className="prose prose-invert prose-lg mb-20"><ReactMarkdown>{analysis}</ReactMarkdown></div>
            {analysis && (
                <div className="absolute bottom-6 right-6">
                    <button onClick={handleSaveAndAlert} disabled={saving} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-full font-bold shadow-lg">{saving ? "Saving..." : "📢 Save & Alert Telegram"}</button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;
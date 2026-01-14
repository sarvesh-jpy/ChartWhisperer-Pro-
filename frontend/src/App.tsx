import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string>("Look for a Liquidity Sweep of the Asian High/Low, then a Change of Character (CHoCH) on the 5m timeframe. Entry on the Fair Value Gap.");
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // --- 1. VOICE FUNCTIONS ---
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to pick a Google voice if available
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

  // --- 2. ANALYZE FUNCTION (Cloud) ---
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setAnalysis("");
    handleStopSpeaking();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("strategy", strategy);

    try {
      // Points to your LIVE Render Backend
      const response = await axios.post("https://chartwhisperer-pro.onrender.com/analyze", formData);
      
      const resultText = response.data.analysis;
      setAnalysis(resultText);
      
      // Clean text for speech (remove * and # symbols)
      speakText(resultText.replace(/[*#]/g, '')); 
      
    } catch (error) {
      console.error("Error analyzing chart:", error);
      setAnalysis("**Error:** Could not analyze. Check if the Render backend is awake.");
    } finally {
      setLoading(false);
    }
  };

  // --- 3. SAVE & ALERT FUNCTION (Smart Regex Extraction) ---
  // ... inside App function ...

  const handleSaveAndAlert = async () => {
    if (!analysis) return;
    setSaving(true);

    // IMPROVED HELPER: Handles bolding (**ENTRY**) and case sensitivity
    const extractValue = (text: string, label: string) => {
      // Regex explanation:
      // 1. (?:^|\n|[\*\s])  -> Start of line, newline, or star/space (to avoid partial matches)
      // 2. \**?             -> Optional starting bold stars (**)
      // 3. ${label}         -> The word we look for (e.g., ENTRY)
      // 4. \**?             -> Optional ending bold stars (**)
      // 5. [:]?             -> Optional colon
      // 6. \s* -> Any amount of whitespace
      // 7. (.*?)            -> CAPTURE THIS: The actual value
      // 8. (?=\n|$)         -> Stop at the next new line or end of string
      const regex = new RegExp(`(?:^|\\n|[\\*\\s])\\**${label}\\**[:]\\s*(.*?)(?=\\n|$)`, "i");
      
      const match = text.match(regex);
      return match ? match[1].trim().replace(/\*\*/g, '') : "N/A";
    };

    // Extract values more reliably
    const realEntry = extractValue(analysis, "ENTRY");
    const realSL = extractValue(analysis, "SL");
    const realTP = extractValue(analysis, "TP");
    
    // Fallback logic: If regex fails, send a default message so it doesn't crash
    const payload = {
        pair: extractValue(analysis, "PAIR") || "XAU/USD", 
        bias: extractValue(analysis, "BIAS") || "Neutral",
        entry: realEntry !== "N/A" ? realEntry : "See Chart", 
        stop_loss: realSL !== "N/A" ? realSL : "See Chart",
        take_profit: realTP !== "N/A" ? realTP : "See Chart",
        analysis_text: analysis
    };

    console.log("Sending Payload:", payload); // Debugging: Check console to see what is being sent

    try {
        await axios.post("https://chartwhisperer-pro.onrender.com/save", payload);
        alert(`✅ Sent to Telegram!\nEntry: ${payload.entry}\nTP: ${payload.take_profit}`);
    } catch (error) {
        console.error(error);
        alert("❌ Failed to save. Check the Console (F12) for the exact error.");
    } finally {
        setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-400">ChartWhisperer Pro 🚀</h1>
          {isSpeaking && (
            <button onClick={handleStopSpeaking} className="bg-red-500 px-4 py-2 rounded-full animate-pulse font-bold shadow-lg hover:bg-red-600 transition">
              Stop Speaking 🔇
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md">
              <label className="block text-green-400 font-bold mb-2">My Trading Strategy</label>
              <textarea 
                className="w-full h-32 bg-gray-900 text-gray-300 p-3 rounded border border-gray-600 outline-none resize-none focus:border-green-500 transition"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
              />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-md">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange} 
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4 cursor-pointer"
              />
              
              {preview && (
                <img src={preview} alt="Chart Preview" className="w-full rounded-md border border-gray-600 mb-4 max-h-[300px] object-cover" />
              )}

              <button 
                onClick={handleAnalyze} 
                disabled={loading || !file}
                className={`w-full py-3 rounded-md font-bold text-lg transition-all ${
                  loading ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:shadow-lg transform hover:-translate-y-0.5"
                }`}
              >
                {loading ? "Analyzing Chart..." : "Analyze & Speak"}
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 h-[700px] overflow-y-auto relative shadow-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-green-400 border-b border-gray-700 pb-2">Analysis Report</h2>
            
            {analysis ? (
              <div className="prose prose-invert prose-lg mb-20">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 opacity-50">
                <p className="italic text-lg">Upload a chart to begin...</p>
              </div>
            )}

            {/* Floating Save Button */}
            {analysis && (
                <div className="absolute bottom-6 right-6 z-10">
                    <button 
                        onClick={handleSaveAndAlert}
                        disabled={saving}
                        className={`px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all ${
                            saving ? "bg-gray-600 cursor-wait" : "bg-blue-600 hover:bg-blue-500 hover:scale-105"
                        }`}
                    >
                        {saving ? "Sending..." : "📢 Save & Alert Telegram"}
                    </button>
                </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
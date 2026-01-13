import { useState, ChangeEvent, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string>("Look for a Liquidity Sweep of the Asian High/Low, then a Change of Character (CHoCH) on the 5m timeframe. Entry on the Fair Value Gap.");
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Voice Function: Uses the Browser's built-in AI Voice
  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Select a good voice (English)
      const voices = window.speechSynthesis.getVoices();
      utterance.voice = voices.find(voice => voice.name.includes('Google US English')) || voices[0];
      utterance.rate = 1.1; // Slightly faster for efficiency
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text-to-speech!");
    }
  };

  const handleStopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

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
    handleStopSpeaking(); // Stop talking if it's currently talking

    const formData = new FormData();
    formData.append("file", file);
    formData.append("strategy", strategy); // Sending your strategy to Python

    try {
      // Example (Use your REAL Render URL)
const response = await axios.post("https://chartwhisperer-pro.onrender.com/analyze", formData);
      const resultText = response.data.analysis;
      setAnalysis(resultText);
      
      // Automatically speak the result when it arrives
      speakText(resultText.replace(/[*#]/g, '')); // Remove Markdown symbols so it reads cleanly
      
    } catch (error) {
      console.error("Error analyzing chart:", error);
      setAnalysis("**Error:** Could not analyze the chart. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Load voices on mount (fix for some browsers)
  useEffect(() => {
    window.speechSynthesis.getVoices();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-blue-400">ChartWhisperer Pro 🗣️</h1>
            <p className="text-gray-400">Personalized Strategy Analysis & Voice Agent</p>
          </div>
          {isSpeaking && (
            <button onClick={handleStopSpeaking} className="bg-red-500 px-4 py-2 rounded-full animate-pulse font-bold">
              Stop Speaking 🔇
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Inputs */}
          <div className="space-y-6">
            
            {/* 1. Strategy Input */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <label className="block text-green-400 font-bold mb-2">My Trading Strategy</label>
              <textarea 
                className="w-full h-32 bg-gray-900 text-gray-300 p-3 rounded border border-gray-600 focus:border-green-500 outline-none resize-none"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                placeholder="Paste your exact strategy rules here..."
              />
            </div>

            {/* 2. Image Upload */}
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 mb-4"
              />
              
              {preview && (
                <img src={preview} alt="Chart Preview" className="w-full rounded-md border border-gray-600 mb-4 max-h-[300px] object-cover" />
              )}

              <button 
                onClick={handleAnalyze} 
                disabled={loading || !file}
                className={`w-full py-3 rounded-md font-bold text-lg transition-colors ${
                  loading ? "bg-gray-600 cursor-not-allowed" : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                }`}
              >
                {loading ? "Analyzing with Your Strategy..." : "Analyze & Speak"}
              </button>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 h-[700px] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-green-400 border-b border-gray-700 pb-2">Analysis Report</h2>
            {analysis ? (
              <div className="prose prose-invert prose-lg">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                <p className="italic text-lg">Upload a chart + define your strategy.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
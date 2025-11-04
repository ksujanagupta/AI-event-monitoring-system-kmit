import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadIcon, FileIcon, MessageSquareIcon, SendIcon, XIcon, ArrowLeftIcon, PaperclipIcon } from 'lucide-react';
export function AdminAISummary() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>(['Event_Report_2024.pdf', 'Incident_Log.xlsx']);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([{
    role: 'assistant',
    content: 'Hello! Upload your event documents or images and ask me questions about them.'
  }]);
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileNames = Array.from(files).map(file => file.name);
      setUploadedFiles([...uploadedFiles, ...fileNames]);
    }
  };
  const handleRemoveFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };
  const handleSendMessage = () => {
    if (message.trim()) {
      setChatHistory([...chatHistory, {
        role: 'user',
        content: message
      }]);
      setMessage('');
      setTimeout(() => {
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: 'I am analyzing your question based on the uploaded documents. This is a simulated response.'
        }]);
      }, 1000);
    }
  };
  return <div className="p-6 space-y-6 h-[calc(100vh-48px)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Summary & Analysis
        </h1>
        <p className="text-slate-400">
          Upload documents or images and ask questions
        </p>
      </div>
      {/* Chat Interface */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        {/* Uploaded Files Header */}
        {uploadedFiles.length > 0 && <div className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <FileIcon className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">
                Uploaded Files
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-white text-xs">{file}</span>
                  <button onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-300 transition-colors">
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>)}
            </div>
          </div>}
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.map((msg, index) => <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                {msg.content}
              </div>
            </div>)}
        </div>
        {/* Input Area */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" className="hidden" multiple onChange={handleFileUpload} />
              <div className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all">
                <PaperclipIcon className="w-5 h-5" />
              </div>
            </label>
            <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="Ask about your uploaded files..." className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            <button onClick={handleSendMessage} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>;
}
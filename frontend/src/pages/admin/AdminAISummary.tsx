// // frontend/src/pages/admin/AdminAISummary.tsx

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { FileIcon, SendIcon, XIcon, PaperclipIcon } from 'lucide-react';
// import axios from 'axios'; // Import axios for making API calls

// // --- Interface Definitions ---
// interface ChatMessage {
//   role: 'user' | 'assistant';
//   content: string;
// }

// // --- Main Component ---
// export function AdminAISummary() {
//   const navigate = useNavigate();
  
//   // NOTE: Log files are pre-loaded on the server, so this list is primarily visual
//   const [uploadedFiles, setUploadedFiles] = useState<string[]>([]); 
//   const [message, setMessage] = useState('');
//   const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  
//   const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
//     role: 'assistant',
//     content: 'Hello! Your log files are pre-loaded on the server. Ask me questions about fire, violence, lost objects, and person detection events.'
//   }]);

//   // --- File Handling Functions ---
//   const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (files) {
//       // NOTE: In a complete app, files would be sent to the backend here.
//       const fileNames = Array.from(files).map(file => file.name);
//       setUploadedFiles([...uploadedFiles, ...fileNames]);
//     }
//   };

//   const handleRemoveFile = (index: number) => {
//     setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
//   };

//   // --- API Communication Function ---
//   const handleSendMessage = async () => {
//     if (message.trim() && !isLoading) {
//       const userMessage = message.trim();
      
//       // 1. Add user message to history
//       const newChatHistory = [...chatHistory, { role: 'user', content: userMessage }] as ChatMessage[];
//       setChatHistory(newChatHistory);
//       setMessage('');
//       setIsLoading(true);

//       try {
//         // 2. Call the Express backend (Running on port 5000 in your 'backend' folder)
//         const response = await axios.post('http://localhost:5000/api/summary/chat', {
//           userMessage: userMessage,
//           chatHistory: newChatHistory // Send the current history for context
//         });

//         // 3. Add assistant response to history
//         setChatHistory(prev => [...prev, {
//           role: 'assistant',
//           content: response.data.response
//         }]);

//       } catch (error) {
//         console.error('Error sending message to backend:', error);
//         setChatHistory(prev => [...prev, {
//           role: 'assistant',
//           content: 'Error: Could not get a response from the AI server. Check the backend console or server port (expected 5000).'
//         }]);
//       } finally {
//         setIsLoading(false);
//       }
//     }
//   };

//   // --- JSX Render ---
//   return (
//     <div className="p-6 space-y-6 h-[calc(100vh-48px)] flex flex-col">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-white mb-2">
//           AI Summary & Analysis
//         </h1>
//         <p className="text-slate-400">
//           Logs pre-loaded. Ask questions about the events!
//         </p>
//       </div>

//       {/* Chat Interface Container */}
//       <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        
//         {/* Uploaded Files Header */}
//         {uploadedFiles.length > 0 && (
//           <div className="p-4 border-b border-slate-800">
//             <div className="flex items-center gap-2 mb-2">
//               <FileIcon className="w-4 h-4 text-blue-400" />
//               <span className="text-white text-sm font-medium">
//                 Uploaded Files (Visual only)
//               </span>
//             </div>
//             <div className="flex flex-wrap gap-2">
//               {uploadedFiles.map((file, index) => (
//                 <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
//                   <span className="text-white text-xs">{file}</span>
//                   <button onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-300 transition-colors">
//                     <XIcon className="w-3 h-3" />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* Chat Messages */}
//         <div className="flex-1 overflow-y-auto p-6 space-y-4">
//           {chatHistory.map((msg, index) => (
//             <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
//               <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
//                 {msg.content}
//               </div>
//             </div>
//           ))}
          
//           {/* Loading Indicator */}
//           {isLoading && (
//             <div className="flex justify-start">
//               <div className="bg-slate-800 text-slate-200 rounded-lg p-4 max-w-[80%]">
//                 <div className="flex items-center space-x-2">
//                   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
//                   <span>AI is analyzing logs...</span>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Input Area */}
//         <div className="p-4 border-t border-slate-800">
//           <div className="flex gap-2">
//             {/* File Upload Button */}
//             <label className="cursor-pointer">
//               <input type="file" className="hidden" multiple onChange={handleFileUpload} />
//               <div className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all">
//                 <PaperclipIcon className="w-5 h-5" />
//               </div>
//             </label>

//             {/* Message Input */}
//             <input 
//               type="text" 
//               value={message} 
//               onChange={e => setMessage(e.target.value)} 
//               onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
//               placeholder="Ask about fire, violence, and object detection events..." 
//               className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" 
//               disabled={isLoading}
//             />
            
//             {/* Send Button */}
//             <button 
//               onClick={handleSendMessage} 
//               className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:bg-blue-800"
//               disabled={isLoading || !message.trim()}
//             >
//               <SendIcon className="w-5 h-5" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
// frontend/src/pages/admin/AdminAISummary.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileIcon, SendIcon, XIcon, PaperclipIcon } from 'lucide-react';
import axios from 'axios'; // Import axios for making API calls

// --- Interface Definitions ---
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// --- Helper Function: Extract Concise Summary (for display) ---
const extractConciseSummary = (fullText: string): string => {
  // 1. Clean up excessive whitespace and split by line
  const lines = fullText.trim().split('\n').filter(line => line.trim().length > 0);

  let summary = '';
  let lineCount = 0;
  let hasFoundContent = false;

  // 2. Iterate through lines, prioritizing narrative (non-markdown structure)
  for (const line of lines) {
    // Skip lines that look like Markdown structure (tables, headers, lists, HR)
    if (line.match(/^(\s*\-\-\-|\s*#|\s*\|\s*|\s*\*|\s*[0-9]\.)/)) {
      continue;
    }

    // Found a clean line of text
    hasFoundContent = true;
    
    // Remove bolding/emojis for the concise summary and append
    // Note: We keep the original content clean in chatHistory for full view
    summary += line.replace(/(\*\*|#|🔎|💥|🔥|🗑️)/g, '').trim() + ' '; 
    lineCount++;

    if (lineCount >= 3) {
      break; // Limit to 3 key lines
    }
  }

  // Fallback: If no clean lines found (e.g., response is only a table), use the first 150 chars.
  if (!hasFoundContent && fullText.length > 0) {
      const fallback = fullText.substring(0, 150).trim();
      return fallback.length < fullText.length ? fallback + '...' : fullText;
  }

  return summary.trim() + (fullText.length > summary.length ? '...' : '');
};


// --- Main Component ---
export function AdminAISummary() {
  const navigate = useNavigate();
  
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]); 
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for loading indicator
  
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([{
    role: 'assistant',
    content: 'Hello! Your security logs are ready. Ask me for a summary of fire, violence, or lost object events.'
  }]);

  // --- File Handling Functions ---
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

  // --- API Communication Function ---
  const handleSendMessage = async () => {
    if (message.trim() && !isLoading) {
      const userMessage = message.trim();
      
      // 1. Add user message to history
      const newChatHistory = [...chatHistory, { role: 'user', content: userMessage }] as ChatMessage[];
      setChatHistory(newChatHistory);
      setMessage('');
      setIsLoading(true);

      try {
        // 2. Call the Express backend (Running on port 5000 in your 'backend' folder)
        const response = await axios.post('http://localhost:5000/api/summary/chat', {
          userMessage: userMessage,
          chatHistory: newChatHistory // Send the current history for context
        });
        
        const fullContent = response.data.response;

        // 3. Add assistant's FULL response to history
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: fullContent
        }]);

      } catch (error) {
        console.error('Error sending message to backend:', error);
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          content: 'Error: Could not connect to the AI server. Check the backend console (port 5000).'
        }]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // --- JSX Render ---
  return (
    <div className="p-6 space-y-6 h-[calc(100vh-48px)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          AI Summary & Analysis
        </h1>
        <p className="text-slate-400">
          Logs pre-loaded. Ask for concise summaries of events!
        </p>
      </div>

      {/* Chat Interface Container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
        
        {/* Uploaded Files Header (Kept for completeness) */}
        {uploadedFiles.length > 0 && (
          <div className="p-4 border-b border-slate-800">
            {/* ... (File rendering logic) ... */}
            <div className="flex items-center gap-2 mb-2">
              <FileIcon className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm font-medium">
                Uploaded Files (Visual only)
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <span className="text-white text-xs">{file}</span>
                  <button onClick={() => handleRemoveFile(index)} className="text-red-400 hover:text-red-300 transition-colors">
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {chatHistory.map((msg, index) => {
            
            // Apply the concise summary logic ONLY to the assistant's long response
            const isLongAssistantResponse = msg.role === 'assistant' && msg.content.split('\n').length > 5;

            const displayContent = isLongAssistantResponse 
                ? extractConciseSummary(msg.content)
                : msg.content;

            return (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-4 whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                  
                  {displayContent}

                  {/* Button to indicate more details are available for long responses */}
                  {isLongAssistantResponse && (
                    <div className="text-sm mt-2 pt-2 border-t border-slate-700">
                      <span className="text-blue-400 italic">
                        Click to view full report details.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 text-slate-200 rounded-lg p-4 max-w-[80%]">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>AI is analyzing logs...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex gap-2">
            {/* File Upload Button */}
            <label className="cursor-pointer">
              <input type="file" className="hidden" multiple onChange={handleFileUpload} />
              <div className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all">
                <PaperclipIcon className="w-5 h-5" />
              </div>
            </label>

            {/* Message Input */}
            <input 
              type="text" 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()} 
              placeholder="Ask for a 2-3 line summary..." 
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" 
              disabled={isLoading}
            />
            
            {/* Send Button */}
            <button 
              onClick={handleSendMessage} 
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:bg-blue-800"
              disabled={isLoading || !message.trim()}
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
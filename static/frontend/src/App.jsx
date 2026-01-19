import React, { useState, useRef, useEffect } from 'react';
import { request, invoke, view } from '@forge/bridge';
import { token } from '@atlaskit/tokens';
import { Mic, Square, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import AdminPage from './components/AdminPage';
import IssueReview from './components/IssueReview';

function App() {
  const [context, setContext] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('idle'); // idle, recording, processing, success, error
  const [message, setMessage] = useState('');
  const [suggestions, setSuggestions] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    view.getContext().then(setContext);
  }, []);

  if (!context) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-slate-400"/></div>;
  }

  // Check if we are in the Admin Page module
  if (context.moduleKey === 'dr-jira-dictate-admin') {
      return <AdminPage />;
  }

  const playChime = (type = 'start') => {
      try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const createNote = (freq, startTime, duration = 0.5) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        osc.type = 'triangle'; // Softer than sine, but more presence
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        
        // Envelope: Quick attack, smooth exponential decay
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        
        osc.stop(startTime + duration);
      };

      if (type === 'start') {
        // Ascending Harp Arpeggio (C Major scale segments)
        createNote(523.25, now + 0.0, 0.6); // C5
        createNote(659.25, now + 0.1, 0.6); // E5
        createNote(783.99, now + 0.2, 0.8); // G5
        createNote(1046.50, now + 0.3, 1.0); // C6
      } else {
        // Reset/Stop sound (Descending/Resolving)
        createNote(659.25, now + 0.0, 0.4); // E5
        createNote(523.25, now + 0.1, 0.6); // C5
      }

    } catch (e) {
      console.error("Audio feedback failed", e);
    }
  };

  const startRecording = async () => {
    try {
      playChime('start'); 
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = handleStop;
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setProcessingStatus('recording');
      setMessage('Recording... (Max 15s)');

      // Auto-stop after 15 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          stopRecording();
        }
      }, 15000);

    } catch (err) {
      console.error('Error accessing microphone:', err);
      setProcessingStatus('error');
      setMessage('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      playChime('end');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleStop = async () => {
    setProcessingStatus('processing');
    setMessage('Processing audio...');
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result.split(',')[1];
      await sendToN8n(base64Audio);
    };
  };

  const sendToN8n = async (base64Audio) => {
    try {
      // Invoke the backend resolver which handles the secure call with JWT
      const data = await invoke('sendAudioToN8n', { audio: base64Audio });
      
      console.log("N8n Response:", data); // Debugging

      // Handle Array Response (Suggestions)
      if (Array.isArray(data)) {
          setSuggestions(data);
          setProcessingStatus('reviewing');
          return;
      }
      
      // Handle Object Response with "confirm" status and "preview" data
      // This maps the single preview object into an array for the IssueReview component
      if (data && data.status === 'confirm' && data.preview) {
          const suggestion = {
              summary: data.preview.summary,
              issue_type: data.preview.issue_type,
              description: data.preview.description,
              priority: data.preview.priority
          };
          setSuggestions([suggestion]);
          setProcessingStatus('reviewing');
          return;
      }

      // Handle Legacy/Single Object Response
      if (data && data.status === 'ignored') {
        setProcessingStatus('idle'); // or 'warning' if you want a different visual state
        setMessage(data.message || data.reason || "I didn't catch that. Could you try again?");
      } else if (data && data.status === 'success') {
          setProcessingStatus('success');
          setMessage('Processed successfully!');
      } else {
          // Fallback for other success cases or if structure is different
          setProcessingStatus('success');
          setMessage('Sent to n8n!');
      }

      setTimeout(() => {
        if (data.status !== 'ignored') {
            setMessage('');
            setProcessingStatus('idle');
        }
      }, 3000);
    } catch (error) {
      console.error('Error sending audio:', error);
      setProcessingStatus('error');
      setMessage('Failed to send audio.');
    } finally {
      setIsRecording(false);
      // Clean up clean up
      if (mediaRecorderRef.current) {
         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  const handleIssueCreated = (result) => {
      setSuggestions(null);
      setProcessingStatus('success');
      setMessage(`Issue created: ${result.key}`);
      
      setTimeout(() => {
          setProcessingStatus('idle');
          setMessage('');
      }, 3000);
  };

  const handleCancelReview = () => {
      setSuggestions(null);
      setProcessingStatus('idle');
      setMessage('');
  };

  if (suggestions && processingStatus === 'reviewing') {
      return (
          <IssueReview 
              suggestions={suggestions} 
              onCancel={handleCancelReview}
              onIssueCreated={handleIssueCreated}
              context={context}
          />
      );
  }

  return (
    <div 
      className="p-4 flex flex-col items-center justify-center space-y-4 font-sans"
      style={{
        backgroundColor: token('elevation.surface'),
        color: token('color.text')
      }}
    >
      
      <div className="relative">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={processingStatus === 'processing'}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 animate-pulse shadow-lg ring-4 ring-red-200' 
              : 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
          } ${processingStatus === 'processing' ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-white text-fill-white" fill="currentColor" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>
      </div>

      <div className="text-center min-h-[3rem]">
        {processingStatus === 'processing' && (
          <div className="flex items-center space-x-2 text-blue-600">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        
        {processingStatus === 'success' && (
          <div className="flex items-center space-x-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}

        {processingStatus === 'error' && (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span>{message}</span>
          </div>
        )}

        {(processingStatus === 'idle' || processingStatus === 'recording') && (
          <p className="text-sm" style={{ color: token('color.text.subtlest') }}>{message || 'Click mic to record (max 15s)'}</p>
        )}
      </div>
    </div>
  );
}

export default App;

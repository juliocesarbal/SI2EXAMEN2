"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
        confidence: number;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }
}

export default function AdminVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [rawTranscript, setRawTranscript] = useState("");
  const [correctedTranscript, setCorrectedTranscript] = useState("");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "¡Hola! Soy tu asistente para generar reportes. Escribe o usa el micrófono para pedirme reportes de Alertas, Bitácora, Clientes o Facturas en PDF, Excel o HTML.",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Only show on admin pages
  const isAdminPage = pathname?.startsWith("/admin");

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  const startRecording = async () => {
    setRawTranscript("");
    setCorrectedTranscript("");
    setError(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];

    try {
      console.log("🎤 Solicitando permiso de micrófono...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      console.log("✅ Permiso concedido, iniciando grabación...");

      // Create MediaRecorder with webm audio
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log("📦 Audio chunk recibido:", event.data.size, "bytes");
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log("🛑 Grabación detenida, procesando audio...");

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Clear timer
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }

        // Process audio
        if (audioChunksRef.current.length > 0) {
          await processAudioRecording();
        } else {
          setError("No se grabó audio. Intenta de nuevo.");
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("❌ Error en MediaRecorder:", event);
        setError("Error al grabar audio");
        setIsRecording(false);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every 1 second
      setIsRecording(true);

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      console.log("🎙️ Grabación iniciada con formato:", mimeType);

    } catch (err) {
      console.error("❌ Error al acceder al micrófono:", err);
      setError("No se pudo acceder al micrófono. Verifica los permisos.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      console.log("⏹️ Deteniendo grabación...");
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudioRecording = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      // Combine audio chunks into single blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log("🎵 Audio blob creado:", audioBlob.size, "bytes");

      // Convert to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64Audio.split(',')[1];

        console.log("📤 Enviando audio a Gemini para transcripción...");

        // Send to backend for transcription
        const response = await fetch("/api/admin/voice-assistant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            audio: base64Data,
            mimeType: "audio/webm",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "Error al procesar el audio");
        }

        const data = await response.json();

        console.log("✅ Respuesta recibida:", data);

        // Show corrected transcript
        if (data.correctedCommand) {
          setCorrectedTranscript(data.correctedCommand);
        }

        // Add user message (the transcribed text if available)
        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: data.transcript || "Comando de voz procesado",
        };
        setMessages((prev) => [...prev, userMessage]);

        // Add assistant response
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response || "Comando procesado exitosamente",
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Handle file download if applicable
        if (data.fileData && data.fileName && data.mimeType) {
          const byteCharacters = atob(data.fileData);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: data.mimeType });

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = data.fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }

        // Clear after delay
        setTimeout(() => {
          setRawTranscript("");
          setCorrectedTranscript("");
        }, 3000);

      };

      reader.onerror = () => {
        throw new Error("Error al convertir audio a base64");
      };

    } catch (err) {
      console.error("❌ Error procesando audio:", err);
      setError(err instanceof Error ? err.message : "Error al procesar el audio");
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const processCommand = async (transcriptToProcess?: string) => {
    // Use the provided transcript or the current rawTranscript
    const commandText = transcriptToProcess || rawTranscript.trim();

    console.log("[Frontend] processCommand called with:", {
      transcriptToProcess,
      rawTranscript,
      commandText,
    });

    if (!commandText) {
      setError("No se detectó ningún comando");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const requestBody = { command: commandText };
      console.log("[Frontend] Sending request with body:", requestBody);

      // Send the raw transcript to backend
      // Gemini will correct and process it
      const response = await fetch("/api/admin/voice-assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      console.log("[Frontend] Response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error al procesar el comando de voz"
        );
      }

      const data = await response.json();

      // Show the corrected transcript if available
      if (data.correctedCommand) {
        setCorrectedTranscript(data.correctedCommand);
      }

      // Add user message with the command that was sent
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: commandText,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add assistant response
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Comando procesado exitosamente",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Handle file download if applicable
      if (data.fileData && data.fileName && data.mimeType) {
        // Convert base64 to blob and download
        const byteCharacters = atob(data.fileData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.mimeType });

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = data.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Clear transcripts after a delay
      setTimeout(() => {
        setRawTranscript("");
        setCorrectedTranscript("");
      }, 3000);
    } catch (err) {
      console.error("Error processing command:", err);
      setError(
        err instanceof Error ? err.message : "Error al procesar el comando"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAdminPage) return null;

  return (
    <>
      {/* Floating button - responsive positioning */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-full p-4 sm:p-5 shadow-lg transition-transform active:scale-95 hover:shadow-xl"
          aria-label="Abrir asistente de voz"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6 sm:w-7 sm:h-7"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
            />
          </svg>
        </button>
      )}

      {/* Assistant panel - responsive design */}
      {isOpen && (
        <div
          className="fixed z-50 right-3 left-3 bottom-3 sm:left-auto sm:right-6 sm:bottom-6 w-auto sm:w-96 max-w-md mx-auto h-[70vh] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col border border-emerald-200 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Asistente de voz"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-3 sm:p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                🎙️
              </div>
              <div className="truncate">
                <h3 className="font-semibold leading-tight truncate">
                  Asistente de Voz Admin
                </h3>
                <p className="text-[11px] sm:text-xs text-emerald-100">
                  Genera reportes por voz
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsOpen(false);
                if (isRecording) stopRecording();
              }}
              className="text-white/90 hover:bg-white/20 rounded-full p-1.5 transition"
              aria-label="Cerrar asistente de voz"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-emerald-50/30">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[92%] sm:max-w-[80%] text-[13px] sm:text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white"
                      : "bg-white border border-emerald-200"
                  } rounded-2xl p-2.5 sm:p-3 shadow-sm`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-white border border-emerald-200 rounded-2xl p-3 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Raw transcript display */}
          {rawTranscript && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-blue-50 border-t border-blue-200">
              <p className="text-[11px] sm:text-xs text-blue-800 font-medium mb-1">
                🎙️ Transcripción:
              </p>
              <p className="text-[12px] sm:text-sm text-gray-800 break-words">
                {rawTranscript}
              </p>
            </div>
          )}

          {/* Corrected transcript display */}
          {correctedTranscript && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-green-50 border-t border-green-200">
              <p className="text-[11px] sm:text-xs text-green-800 font-medium mb-1">
                ✓ Comando interpretado:
              </p>
              <p className="text-[12px] sm:text-sm text-gray-800 font-medium break-words">
                {correctedTranscript}
              </p>
            </div>
          )}

          {/* Recording indicator */}
          {isRecording && (
            <div className="px-3 sm:px-4 py-2 sm:py-3 bg-red-50 border-t border-red-200">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-600 rounded-full animate-pulse shrink-0"></div>
                  <p className="text-[11px] sm:text-xs text-red-800 font-medium">
                    Grabando... habla ahora
                  </p>
                </div>
                <p className="text-[11px] sm:text-xs text-red-600 font-mono font-semibold">
                  {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="px-3 sm:px-4 py-2 bg-red-50 border-t border-red-200">
              <p className="text-[11px] sm:text-xs text-red-600 break-words">
                ❌ {error}
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="p-3 sm:p-4 bg-white border-t border-emerald-200 rounded-b-2xl">
            {/* Text input area */}
            {!isRecording && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (inputText.trim() && !isProcessing) {
                    processCommand(inputText.trim());
                    setInputText("");
                  }
                }}
                className="flex gap-2 items-end mb-2"
              >
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (inputText.trim() && !isProcessing) {
                        processCommand(inputText.trim());
                        setInputText("");
                      }
                    }
                  }}
                  placeholder="Escribe tu comando: 'genera reporte de alertas en PDF'"
                  className="flex-1 resize-none border border-emerald-300 rounded-lg p-2 text-[13px] sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 max-h-24 min-h-[40px]"
                  rows={2}
                  disabled={isProcessing}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition disabled:bg-gray-400 disabled:cursor-not-allowed shrink-0"
                  aria-label="Enviar comando"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                    />
                  </svg>
                </button>
              </form>
            )}

            {/* Voice controls */}
            <div className="flex gap-2 items-center">
              {!isRecording && !isProcessing ? (
                <>
                  <div className="flex-1 text-[11px] sm:text-xs text-gray-500 text-center">
                    o usa el micrófono
                  </div>
                  <button
                    onClick={startRecording}
                    className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-emerald-700 active:bg-emerald-800 transition flex items-center gap-2 shrink-0"
                    aria-label="Iniciar grabación"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"
                      />
                    </svg>
                    <span className="hidden sm:inline">Voz</span>
                  </button>
                </>
              ) : isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-red-700 active:bg-red-800 transition flex items-center justify-center gap-2"
                  aria-label="Detener y procesar grabación"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                  >
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Detener y Procesar
                </button>
              ) : (
                <div className="flex-1 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  Procesando con Gemini...
                </div>
              )}
            </div>

            {/* Safe area for mobile notch */}
            <div className="pt-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      )}
    </>
  );
}

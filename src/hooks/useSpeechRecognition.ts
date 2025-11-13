import { useState, useEffect, useRef, useCallback} from 'react'

// Note: SpeechRecognition types are defined globally in @/types/speech-recognition.d.ts

export interface UseSpeechRecognitionReturn {
  transcript: string
  listening: boolean
  supported: boolean
  error: string | null
  startListening: () => void
  stopListening: () => void
  resetTranscript: () => void
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  useEffect(() => {
    // Verificar si el navegador soporta Web Speech API
    if (typeof window !== 'undefined') {
      const SpeechRecognitionAPI =
        window.SpeechRecognition || window.webkitSpeechRecognition

      if (SpeechRecognitionAPI) {
        setSupported(true)
        const recognition = new SpeechRecognitionAPI()

        // Configuración
        recognition.continuous = true // Sigue escuchando hasta que se detenga
        recognition.interimResults = true // Muestra resultados parciales
        recognition.lang = 'es-ES' // Español

        // Manejadores de eventos
        recognition.onstart = () => {
          console.log('🎤 Reconocimiento de voz iniciado')
          setListening(true)
          setError(null)
        }

        recognition.onend = () => {
          console.log('🛑 Reconocimiento de voz finalizado')
          setListening(false)
        }

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('❌ Error en reconocimiento de voz:', event.error)
          let errorMessage = 'Error al reconocer voz'

          switch (event.error) {
            case 'no-speech':
              errorMessage = 'No se detectó voz. Intenta hablar más cerca del micrófono.'
              break
            case 'audio-capture':
              errorMessage = 'No se pudo acceder al micrófono. Verifica los permisos.'
              break
            case 'not-allowed':
              errorMessage = 'Permiso de micrófono denegado. Permite el acceso al micrófono.'
              break
            case 'network':
              errorMessage = 'Error de red. Verifica tu conexión.'
              break
            case 'aborted':
              errorMessage = 'Reconocimiento de voz cancelado.'
              break
          }

          setError(errorMessage)
          setListening(false)
        }

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let interimTranscript = ''
          let finalTranscript = ''

          // Procesar todos los resultados
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            const transcriptPiece = result[0].transcript

            if (result.isFinal) {
              finalTranscript += transcriptPiece + ' '
            } else {
              interimTranscript += transcriptPiece
            }
          }

          // Actualizar el transcript con el texto completo
          if (finalTranscript) {
            setTranscript(prev => (prev + ' ' + finalTranscript).trim())
          } else if (interimTranscript) {
            // Mostrar resultados intermedios (opcional)
            console.log('📝 Transcripción parcial:', interimTranscript)
          }
        }

        recognitionRef.current = recognition
      } else {
        console.warn('⚠️ Web Speech API no soportada en este navegador')
        setSupported(false)
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start()
      } catch (err) {
        console.error('Error al iniciar reconocimiento:', err)
        setError('No se pudo iniciar el reconocimiento de voz')
      }
    }
  }, [listening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop()
    }
  }, [listening])

  const resetTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  return {
    transcript,
    listening,
    supported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  }
}

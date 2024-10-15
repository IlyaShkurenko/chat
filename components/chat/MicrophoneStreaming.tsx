import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button"
import RecordRTC from 'recordrtc';

const SAMPLE_RATE = 48000;
const SOCKET_URL = 'wss://api.gladia.io/audio/text/audio-transcription';

const MicrophoneStreaming: React.FC = () => {
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState({ final: '', partial: '' });
  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<RecordRTC | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

	const gladiaKey = '178fe0b3-b849-4c80-8080-fb14e5c35e1d'
  useEffect(() => {
    listAudioDevices();
    return () => {
      stopRecording();
    };
  }, []);

  const listAudioDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = devices.filter(d => d.kind === 'audioinput' && d.deviceId);
      setInputDevices(audioDevices);
      if (audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0].deviceId);
      }
    } catch (error) {
      console.error('Error listing audio devices:', error);
    }
  };

  const startRecording = async () => {
    if (!gladiaKey || !selectedDevice) {
      console.error('Gladia API key and input device are required');
      return;
    }

    try {
      const socketPromise = new Promise<void>((resolve, reject) => {
        socketRef.current = new WebSocket(SOCKET_URL);
        socketRef.current.onopen = () => {
          const configuration = {
            x_gladia_key: gladiaKey,
            frames_format: 'bytes',
            language_behaviour: 'automatic single language',
            sample_rate: SAMPLE_RATE
          };
          socketRef.current?.send(JSON.stringify(configuration));
        };
        socketRef.current.onerror = () => reject(new Error("Couldn't connect to the server"));
        socketRef.current.onclose = (event) => reject(new Error(`Server refuses the connection: [${event.code}] ${event.reason}`));
        socketRef.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log(data)
          if (data?.event === 'connected') {
            resolve();
          } else {
            reject(new Error(`Server sent an unexpected message: ${event.data}`));
          }
        };
      });

      streamRef.current = await navigator.mediaDevices.getUserMedia({
				audio: {
					deviceId: { exact: selectedDevice },
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
					voiceIsolation: true,
					// Можно также указать ideal значения для частоты дискретизации и количества каналов
					sampleRate: SAMPLE_RATE,
					sampleSize: 16,
					channelCount: 1,
				}
			});

			const audioTrack = streamRef.current.getAudioTracks()[0];
console.log('Applied constraints:', audioTrack.getSettings());

const supportedConstraints = navigator.mediaDevices.getSupportedConstraints();
console.log('Supported Constraints:', supportedConstraints);

      recorderRef.current = new RecordRTC(streamRef.current, {
        type: 'audio',
        mimeType: 'audio/wav',
        recorderType: RecordRTC.StereoAudioRecorder,
        timeSlice: 1000,
        ondataavailable: async (blob: Blob) => {
          const buffer = await blob.arrayBuffer();
          const modifiedBuffer = buffer.slice(44); // Remove WAV header
          socketRef.current?.send(modifiedBuffer);
        },
        sampleRate: SAMPLE_RATE,
        desiredSampRate: SAMPLE_RATE,
        numberOfAudioChannels: 1
      });

      await socketPromise;

      socketRef.current!.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data?.event === 'transcript' && data.transcription) {
          setTranscription(prev => ({
            final: data.type === 'final' ? prev.final + data.transcription : prev.final,
            partial: data.type === 'partial' ? data.transcription : ''
          }));
        }
      };

      recorderRef.current.startRecording();
      setIsRecording(true);
    } catch (err) {
      console.error('Error during recording initialization:', err);
      stopRecording();
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stopRecording(() => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      socketRef.current?.close();
    });
    setIsRecording(false);
    setTranscription({ final: '', partial: '' });
  };

  return (
    <div>
      <div>
        <label htmlFor="input_device">Audio input device</label>
        <select
          id="input_device"
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          required
        >
          {inputDevices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label || 'Default'}
            </option>
          ))}
        </select>
      </div>
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={!gladiaKey || !selectedDevice}
      >
        {isRecording ? 'Stop recording' : 'Start recording'}
      </Button>
      {(transcription.final || transcription.partial) && (
        <div>
          <h3>Transcription:</h3>
          <p>{transcription.final}</p>
          <p style={{ color: 'red' }}>{transcription.partial}</p>
        </div>
      )}
    </div>
  );
};

export default MicrophoneStreaming;

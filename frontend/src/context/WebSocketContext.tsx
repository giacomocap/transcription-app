import React, { createContext, useState, useEffect, useContext } from 'react';

interface WebSocketContextType {
  ws: WebSocket | null;
  connectWebSocket: () => void;
  sendMessage: (message: object) => void;
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
  micSources: any[];
  systemSources: any[];
  setSources: (sources: any[]) => void;
  setOnRecordingComplete: (onRecordingComplete: (audioBlob: Blob) => void) => void;
  isAppInstalled: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
    children: React.ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
}) => {
    console.log('WebSocketProvider component rendered')
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [micSources, setMicSources] = useState<any[]>([]);
    const [systemSources, setSystemSources] = useState<any[]>([]);
    const [onRecordingComplete, setOnRecordingComplete] = useState<(audioBlob: Blob) => void>(() => () => {});
    const [isAppInstalled, setIsAppInstalled] = useState(true);



    const connectWebSocket = () => {
        if (ws) {
            console.log('WebSocket already connected');
            return;
        }

        const newWs = new WebSocket('ws://localhost:8080');
        setWs(newWs);

        newWs.onopen = () => {
            console.log('[WebSocket] onopen event triggered');
            console.log('[WebSocket] readyState:', newWs.readyState);
            setTimeout(() => {
                sendMessage({ type: 'GET_SOURCES' });
            }, 1000);
        }

        newWs.onmessage = async (event) => {
            console.log('[WebSocket] onmessage event triggered');
            try {
                const data = JSON.parse(event.data)
                console.log('[WebSocket] Received data:', data)

                if (data.type === 'SOURCES') {
                    setMicSources(data.payload.micSources)
                    setSystemSources(data.payload.systemSources)
                } else if (data.type === 'RECORDING_COMPLETE') {
                    // Assuming the payload contains a single audio buffer
                    const audioBlob = new Blob([data.payload.mic], { type: 'audio/webm' })
                    onRecordingComplete(audioBlob)
                } else if (data.type === 'ERROR') {
                    console.error('[WebSocket] Error from companion app:', data.payload)
                    alert(
                        'Failed to start audio capture. Please make sure you have granted the necessary permissions.'
                    )
                    setIsRecording(false)
                }
            } catch (error) {
                console.error('[WebSocket] Error:', error)
            }
        }

        newWs.onclose = () => {
            console.log('[WebSocket] onclose event triggered');
            console.log('[WebSocket] readyState:', newWs.readyState);
            setIsRecording(false)
        }

        newWs.onerror = (event) => {
            console.log('[WebSocket] onerror event triggered');
            console.log('[WebSocket] readyState:', newWs.readyState);
            console.error('[WebSocket] Error event:', event);
            setIsAppInstalled(false);
        }
    }

    const sendMessage = (message: object) => {
        console.log('[WebSocket] Sending message:', message);
        if (ws) {
            ws.send(JSON.stringify(message))
        }
    }

    useEffect(() => {
        connectWebSocket();
    }, []);

    useEffect(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            // Send the GET_SOURCES message once the connection is open
            sendMessage({ type: 'GET_SOURCES' })
        }
    }, [ws])

    const contextValue: WebSocketContextType = {
        ws,
        connectWebSocket,
        sendMessage,
        isRecording,
        setIsRecording,
        micSources,
        systemSources,
        setSources: (sources: any[]) => {
            setMicSources(sources.filter(s => s.type === 'mic'))
            setSystemSources(sources.filter(s => s.type === 'system'))
        },
    setOnRecordingComplete,
    isAppInstalled,
  };


    return (
        <WebSocketContext.Provider value={contextValue}>
            {children}
        </WebSocketContext.Provider>
    );
    console.log('WebSocketProvider component unmounted')
};

export const useWebSocket = () => {
    const context = useContext(WebSocketContext);
    if (!context) {
        throw new Error('useWebSocket must be used within a WebSocketProvider');
    }
    return context;
};

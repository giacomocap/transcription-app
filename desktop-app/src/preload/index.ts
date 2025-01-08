// src/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron'

let micStream: MediaStream | null = null
let systemStream: MediaStream | null = null
let micRecorder: MediaRecorder | null = null
let systemRecorder: MediaRecorder | null = null
let micChunks: Blob[] = []
let systemChunks: Blob[] = []

contextBridge.exposeInMainWorld('audioRecorder', {
  getMicrophones: async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const microphones = devices
        .filter(device => device.kind === 'audioinput')
        .map(device => ({
          id: device.deviceId,
          name: device.label || `Microphone ${device.deviceId}`,
          type: 'mic' as const
        }))
      return { success: true, microphones }
    } catch (error: any) {
      console.error('Error getting microphones:', error)
      return { success: false, error: error.message }
    }
  },

  startRecording: async (micId: string, systemId: string) => {
    try {
      // Reset chunks
      micChunks = []
      systemChunks = []

      // Get microphone stream
      micStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: micId }
      })
      ipcRenderer.send('log', `micStream: ${micStream}`)
      micStream.getTracks().forEach((track) => {
        ipcRenderer.send('log', `Mic track: ${track}`)
        ipcRenderer.send('log', `Mic track state: ${track.readyState}`)
      })
      // Get system audio stream
      systemStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: systemId
        }
      } as any)
      ipcRenderer.send('log', `systemStream: ${systemStream}`)
      systemStream.getTracks().forEach((track) => {
        ipcRenderer.send('log', `System track: ${track}`)
        ipcRenderer.send('log', `System track state: ${track.readyState}`)
      })

      // Setup microphone recorder
      micRecorder = new MediaRecorder(micStream)
      micRecorder.ondataavailable = (e) => {
        ipcRenderer.send('log', `micRecorder ondataavailable: ${e.data}`)
        ipcRenderer.send('log', `micRecorder ondataavailable size: ${e.data.size}`)
        ipcRenderer.send('log', `micRecorder ondataavailable type: ${e.data.type}`)
        micChunks.push(e.data)
      }

      // Setup system audio recorder
      systemRecorder = new MediaRecorder(systemStream)
      systemRecorder.ondataavailable = (e) => {
        ipcRenderer.send('log', `systemRecorder ondataavailable: ${e.data}`)
        ipcRenderer.send(
          'log',
          `systemRecorder ondataavailable size: ${e.data.size}`
        )
        ipcRenderer.send(
          'log',
          `systemRecorder ondataavailable type: ${e.data.type}`
        )
        systemChunks.push(e.data)
      }

      // Start both recorders with a timeslice of 1000ms (1 second)
      micRecorder.start(1000)
      systemRecorder.start(1000)

      return { success: true }
    } catch (error: any) {
      console.error('Error starting recording:', error)
      return { success: false, error: error.message }
    }
  },

  stopRecording: async () => {
    try {
      return new Promise((resolve) => {
        let stoppedCount = 0

        const finishStop = async () => {
          stoppedCount++;
          if (stoppedCount === 2) {
            // Clean up streams
            if (micStream) {
              micStream.getTracks().forEach((track) => track.stop());
              micStream = null;
            }
            if (systemStream) {
              systemStream.getTracks().forEach((track) => track.stop());
              systemStream = null;
            }

            // Log the chunks before resolving
            ipcRenderer.send('log', `micChunks before resolving: ${micChunks.length}`);
            micChunks.forEach((chunk, index) => {
              ipcRenderer.send('log', `micChunk ${index}: size=${chunk.size}, type=${chunk.type}`);
            });
            ipcRenderer.send('log', `systemChunks before resolving: ${systemChunks.length}`);
            systemChunks.forEach((chunk, index) => {
              ipcRenderer.send('log', `systemChunk ${index}: size=${chunk.size}, type=${chunk.type}`);
            });

            // Introduce a delay before resolving
            // Convert chunks to ArrayBuffers
            const micBuffers = await Promise.all(micChunks.map(chunk => chunk.arrayBuffer()))
            const systemBuffers = await Promise.all(systemChunks.map(chunk => chunk.arrayBuffer()))

            // Resolve with ArrayBuffers instead of Blobs
            setTimeout(() => {
              resolve({ success: true, micChunks: micBuffers, systemChunks: systemBuffers });
            }, 1000); // 1-second delay
          }
        }

        if (micRecorder && micRecorder.state !== 'inactive') {
          micRecorder.onstop = finishStop
          micRecorder.stop()
        } else {
          finishStop()
        }

        if (systemRecorder && systemRecorder.state !== 'inactive') {
          systemRecorder.onstop = finishStop
          systemRecorder.stop()
        } else {
          finishStop()
        }
      })
    } catch (error: any) {
      console.error('Error stopping recording:', error)
      return { success: false, error: error.message }
    }
  }
})

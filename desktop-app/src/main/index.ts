import { app, shell, BrowserWindow, ipcMain, desktopCapturer } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { WebSocket, WebSocketServer } from 'ws'
import { OpusStreamMerger } from './helpers/AudioMerger'

interface WSMessage {
  type: 'GET_SOURCES' | 'START_RECORDING' | 'STOP_RECORDING'
  payload?: any
}

class AudioRecorder {
  private wss: WebSocketServer | null = null
  private connections: Set<WebSocket>
  private mainWindow: BrowserWindow | null = null

  constructor() {
    this.connections = new Set()
    this.setupWSServer()
    this.createWindow()
    this.setupIpcListeners();
  }

  private setupWSServer() {
    this.wss = new WebSocketServer({ port: 8080 });

    this.wss.on('connection', (ws) => {
      console.log('New WebSocket connection');
      this.connections.add(ws);

      ws.on('message', async (message) => {
        console.log('Received message:', message.toString());
        try {
          const parsed: WSMessage = JSON.parse(message.toString());
          await this.handleMessage(parsed, ws);
        } catch (err: any) {
          console.error('Error handling message:', err);
          ws.send(JSON.stringify({ type: 'ERROR', payload: err.message }));
        }
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
        this.connections.delete(ws);
      });
    });
  }

  private setupIpcListeners() {
    ipcMain.on('recording-complete', (event, { micChunks, systemChunks }) => {
      // Handle final recording data
      this.connections.forEach((ws) => {
        ws.send(
          JSON.stringify({
            type: 'RECORDING_COMPLETE',
            payload: {
              mic: micChunks,
              system: systemChunks,
            },
          })
        );
      });
    });
    // Handle logs from preload
    ipcMain.on('log', (event, message) => {
      console.log('[Preload log]:', message)
    })
  }

  private async handleMessage(message: WSMessage, ws: WebSocket) {
    switch (message.type) {
      case 'GET_SOURCES':
        await this.getSources(ws);
        break;

      case 'START_RECORDING':
        const { micId, systemId } = message.payload;
        await this.startRecording(micId, systemId, ws);
        break;

      case 'STOP_RECORDING':
        await this.stopRecording();
        break;
    }
  }

  private async getSources(ws: WebSocket) {
    try {
      // Get system audio sources
      const sources = await desktopCapturer.getSources({
        types: ['window', 'screen'],
        thumbnailSize: { width: 0, height: 0 }
      })
      const systemSources = sources
        .filter(source => {
          const name = source.name.toLowerCase()
          return name.includes('zoom') ||
            name.includes('teams') ||
            name.includes('meet') ||
            name.includes('chrome') ||
            name.includes('firefox') ||
            name.includes('safari') ||
            name.includes('system audio')
        })
        .map(source => ({
          id: source.id,
          name: source.name,
          type: 'system' as const
        }))

      // Get microphone sources using preload script
      if (this.mainWindow) {
        const result = await this.mainWindow.webContents.executeJavaScript(
          'window.audioRecorder.getMicrophones()'
        )
        // console.log('result:', result)

        if (result.success) {
          ws.send(JSON.stringify({
            type: 'SOURCES',
            payload: {
              micSources: result.microphones,
              systemSources
            }
          }))
        } else {
          throw new Error(result.error)
        }
      }
    } catch (err: any) {
      console.error('Error getting sources:', err)
      ws.send(JSON.stringify({ type: 'ERROR', payload: err.message }))
    }
  }

  private async startRecording(micId: string, systemId: string, ws: WebSocket) {
    try {
      if (!this.mainWindow) {
        throw new Error('Window not initialized')
      }

      const result = await this.mainWindow.webContents.executeJavaScript(
        `window.audioRecorder.startRecording("${micId}", "${systemId}")`
      )

      if (result.success) {
        ws.send(JSON.stringify({ type: 'RECORDING_STARTED' }))
      } else {
        throw new Error(result.error)
      }
    } catch (err: any) {
      console.error('Error starting recording:', err)
      ws.send(JSON.stringify({ type: 'ERROR', payload: err.message }))
    }
  }

  private async stopRecording() {
    try {
      if (!this.mainWindow) {
        throw new Error('Window not initialized');
      }

      const result = await this.mainWindow.webContents.executeJavaScript(
        'window.audioRecorder.stopRecording()'
      );

      if (!result.success) {
        throw new Error(result.error);
      }
      const mergedData = await OpusStreamMerger.mergeStreams(
        result.micChunks,
        result.systemChunks
      );
      // Send the complete recording to the web app
      this.connections.forEach((ws) => {
        ws.send(
          JSON.stringify({
            type: 'RECORDING_COMPLETE',
            payload: {
              mergedData
            },
          })
        );
      });
    } catch (err: any) {
      console.error('Error stopping recording:', err);
      this.connections.forEach((ws) => {
        ws.send(JSON.stringify({ type: 'ERROR', payload: err.message }))
      });
    }
  }


  public createWindow(): void {
    // Create the browser window.
    this.mainWindow = new BrowserWindow({
      width: 900,
      height: 670,
      show: false,
      autoHideMenuBar: true,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false
      }
    });

    this.mainWindow.on('ready-to-show', () => {
      this.mainWindow?.show();
    });

    this.mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });

    // Handle system audio error
    ipcMain.on('system-audio-error', (event, errorMessage) => {
      console.error('System audio error:', errorMessage);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('system-audio-error', errorMessage);
      }
    });

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      this.mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
}



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  const recorder = new AudioRecorder()

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) recorder.createWindow();
  });
});

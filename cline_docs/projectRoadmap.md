## Project Goals

- [ ] Implement a companion desktop app (Electron) for enhanced audio capture.
- [ ] Enhance the web app (React/Vite) to detect and utilize the companion app.
- [ ] Modify the backend service to receive audio data from both the web app and the companion app.
- [ ] Ensure robust testing and refinement of the entire system.
- [ ] Update the algorithm for web app-desktop app communication to support simultaneous recording of multiple sources and merging them into a single audio file.

## Key Features

## Key Features

- [ ] Capture system audio using platform-specific APIs in the Electron app.
- [ ] Capture microphone audio using a library like `node-audio` or `naudiodon` in the Electron app.
- [ ] Implement a local WebSocket server in the Electron app for communication.
- [ ] Define a JSON-based control protocol for the web app to interact with the Electron app.
- [ ] Encode audio streams using a web-friendly format like Opus or MP3.
- [ ] Detect the companion app in the web app and use it for recording if available.
- [ ] Fallback to `getDisplayMedia()` and `getUserMedia()` if the companion app is not available.
- [ ] Provide clear UI/UX feedback to the user about the recording process.
- [ ] Ensure the backend can receive audio data via HTTP POST requests.
- [ ] Implement audio synchronization if combining streams on the server-side.
- [ ] Implement robust error handling at each stage.

## Completion Criteria

- [ ] The companion app can capture and stream audio to the web app.
- [ ] The web app can detect and use the companion app for recording.
- [ ] The web app can fallback to browser-based recording if the companion app is not available.
- [ ] The backend can receive and process audio data from both the web app and the companion app.
- [ ] The entire system is tested and refined for performance and stability.
- [ ] The web app can request and receive available audio sources from the desktop app.
- [ ] The web app can instruct the desktop app to start and stop recording multiple sources simultaneously.
- [ ] The desktop app can merge the recorded audio sources into a single file and send it to the web app.

## Completed Tasks

## Completed Tasks

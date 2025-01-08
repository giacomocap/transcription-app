**Phase 1: Companion Desktop App (Electron)**

1. **Core Functionality (Electron App):**
    *   **Audio Capture:**
        *   Use platform-specific APIs (e.g., WASAPI on Windows, Core Audio on macOS) to capture system audio.
        *   Use a library like `node-audio` or `naudiodon` (if needed for lower-level control) to capture microphone audio.
        *   Provide options to select specific audio input/output devices.
    *   **Stream Handling:** Capture both microphone and system audio.
    *   **IPC Server:** Implement a local WebSocket server (e.g., using `ws` library) within the Electron app.
    *   **Control Protocol:** Define a simple JSON-based protocol for the web app to send commands (start, stop, get status) and receive responses/data.
    *   **Audio Encoding:** Encode the combined audio stream or send them separately (depending if you decide to merge them in the client or the server) using a web-friendly format like Opus or MP3.
2. **Communication:**
    *   The Electron app listens for connections from the web app on a predefined local port.
    *   The web app initiates the connection when it needs to start recording.
    *   The web app sends commands (start, stop) and receives the encoded audio data through the WebSocket connection, to send to the backend via HTTP once the recording is done.

**Phase 2: Web App (React/Vite) Enhancements**

1. **Companion App Detection:**
    *   On startup or when the user initiates recording, attempt to connect to the Electron app's WebSocket server on the predefined local port.
    *   If the connection is successful, the companion app is considered installed and active.
    *   Store the connection status for later use.
2. **Recording Logic:**
    *   **Companion App Available:**
        *   Send "start" command to the Electron app via WebSocket, along with any configuration (e.g., selected devices if you implement device selection).
        *   Receive encoded audio data from the WebSocket connection. Store it temporarily.
        *   Send "stop" command when the user finishes recording.
        *   Upload the complete audio to the backend via HTTP.
    *   **Companion App Not Available (Fallback):**
        *   Use `getDisplayMedia()` to capture system audio (prompting the user to select the source).
        *   Use `getUserMedia()` to capture microphone audio.
        *   Use `MediaRecorder` to record the streams.
        *   Store the audio blobs.
        *   Upload the recorded audio to the backend when finished.
    *   **Microphone Only (Last Resort):**
        *   Use `getUserMedia()` to capture microphone audio.
        *   Use `MediaRecorder` to record the stream.
        *   Upload the recorded audio to the backend when finished.
3. **UI/UX:**
    *   Clearly indicate to the user whether the companion app is being used.
    *   Provide instructions for installing the companion app if it's not detected.
    *   If using `getDisplayMedia()`, guide the user through selecting the correct audio source.

**Phase 3: Backend Service Modifications**

1. **Audio Receiving:**
    *   Ensure your backend can receive the audio data via HTTP POST requests.
2. **Stream Handling (if needed):**
    *   If you choose to combine audio streams on the server-side, use a library like FFmpeg to merge the microphone and system audio, ensuring synchronization.
3. **Integration with Existing Pipeline:**
    *   Pass the received (and potentially combined) audio to your "Audio Processing Worker" for transcription and LLM refinement.

**Phase 4: Testing and Refinement**

1. **Thorough Testing:** Test the entire system rigorously on different browsers, operating systems, and with various audio configurations.
2. **Synchronization:** Pay close attention to audio synchronization, especially if combining streams on the server-side. Consider adding timestamps or other synchronization mechanisms if necessary.
3. **Error Handling:** Implement robust error handling at each stage to gracefully handle cases where:
    *   The companion app cannot be connected to.
    *   Audio capture fails.
    *   Permissions are denied.
    *   Network issues occur.

**Key Considerations:**

*   **Security:** Secure the WebSocket connection between the web app and the Electron app, even though it's local. Consider using a secure WebSocket protocol (WSS) with a self-signed certificate.
*   **Performance:** Optimize the audio encoding and transmission to minimize latency and resource usage.
*   **User Experience:** Make the recording process as seamless as possible for the user, providing clear instructions and feedback.

This plan provides a solid foundation for building your hybrid audio recording solution. Remember to break down each phase into smaller, manageable tasks and iterate based on testing and feedback.
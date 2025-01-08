## Current Objective

Update the algorithm for web app-desktop app communication to support simultaneous recording of multiple sources and merging them into a single audio file.

## Context

- This task corresponds to the "Update the algorithm for web app-desktop app communication to support simultaneous recording of multiple sources and merging them into a single audio file" goal in `projectRoadmap.md`.
- The web app needs to be able to request and receive available audio sources from the desktop app.
- The user should be able to select the sources they want to record.
- The desktop app should be able to record multiple sources simultaneously.
- The desktop app should merge the recordings into a single audio file and send it back to the web app.

## Changes to be Made

- Modify the `useWebSocket` hook in `frontend/src/context/WebSocketContext.tsx` to handle the new communication flow.
- Update `desktop-app/src/main/index.ts` to handle the new messages and implement the recording and merging logic.
- Update `frontend/src/components/AudioRecordingSetup.tsx` to integrate with the changes in `useWebSocket` and provide UI for source selection.

## Next Steps

- [ ] Modify the `useWebSocket` hook to send a "request sources" message to the desktop app.
- [ ] Handle the "receive sources" message in `useWebSocket` and store the available sources.
- [ ] Update `AudioRecordingSetup.tsx` to display the available sources and allow user selection.
- [ ] Implement logic in `useWebSocket` to send "start recording" and "stop recording" messages with the selected sources.
- [ ] Handle the "start recording" and "stop recording" messages in `index.ts`.
- [ ] Implement the logic to record multiple sources simultaneously in `index.ts`.
- [ ] Implement the logic to merge the recordings into a single audio file in `index.ts`.
- [ ] Handle the "recording finished" message in `useWebSocket` and receive the merged audio file.
- [ ] Test the entire implementation.

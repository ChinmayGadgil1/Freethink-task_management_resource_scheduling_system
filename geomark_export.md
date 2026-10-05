# AR Mountain Peak App - Context Export

**Original Request:**
Build a mobile application (Flutter) featuring an Augmented Reality (AR) camera view that overlays geographical features—specifically mountain peaks and landmarks—onto the live camera feed based on the user's real-time GPS location and device orientation.

## High-Level Architecture & Tech Stack
*   **`camera`**: For accessing the device's camera feed and displaying it as a background.
*   **`geolocator`**: For high-accuracy GPS location (latitude, longitude, altitude).
*   **`motion_sensors`**: For accurate heading (azimuth) and orientation (pitch, roll) data.
*   **`sqflite`** & **`path_provider`**: For an offline local database to store POIs.

## Implementation Plan

### Phase 1: Project Setup & Foundations
1. Initialize Flutter Project.
2. Add dependencies (`camera`, `geolocator`, `motion_sensors`, `sqflite`, `path_provider`) to `pubspec.yaml`.
3. Configure native permissions (Camera, Location) for Android (`AndroidManifest.xml`) and iOS (`Info.plist`).

### Phase 2: Local Data & Database
1. Create a SQLite database helper class using `sqflite`.
2. Define a `peaks` table (id, name, lat, lon, elevation).
3. Write a function to inject mock data for testing.

### Phase 3: Sensor Integration & Math Engine
1. Implement `geolocator` to get the user's current Position.
2. Implement `motion_sensors` to listen to absolute orientation (Yaw, Pitch, Roll).
3. Create math utility functions for distance, bearing, and low-pass filtering.

### Phase 4: Camera & AR Overlay
1. Initialize `CameraController` and `CameraPreview`.
2. Create an `AROverlayPainter` extending `CustomPainter`.
3. Map `deltaAzimuth` (TargetBearing - DeviceAzimuth) to screen X-coordinates using the Camera FOV.

### Phase 5: Refinement & UX Polish
1. FOV Culling (don't draw what's not on screen).
2. Distance Filtering (don't draw peaks > 20km away).
3. Add a slider to calibrate FOV manually.

***
*Note to new Agent session: The user has already run `flutter create` in a folder called `geomark`. Please start by reviewing `pubspec.yaml` in the `geomark` project and proceeding with Phase 1.*

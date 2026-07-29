# 📍 Live Location Tracking — API & Flutter Integration Guide
> Uber / Zomato style real-time technician tracking
> Uses **REST API** + **WebSocket (Socket.IO)**

---

## 🧠 How It Works (Simple Explanation)

```
1. Technician taps "Start Journey"  →  Backend sets status: EN_ROUTE
                                    →  Customer gets SMS: "Technician is on the way"
                                    →  Customer app connects to WebSocket room

2. Technician app sends GPS every 5s  →  Backend saves location to DB
                                       →  Broadcasts to Customer via WebSocket in real-time

3. Customer sees technician pin moving on Google Maps (live!)

4. Technician taps "I have arrived"  →  Status: ARRIVED
                                     →  Customer gets SMS: "Technician has arrived!"
                                     →  WebSocket fires arrival event
                                     →  Customer app shows alert popup
```

---

## 🔌 WebSocket Connection (Socket.IO)

**WebSocket URL:**
```
ws://localhost:3000/tracking           (local)
wss://your-app.railway.app/tracking   (production)
```

**Flutter package to use:**
```yaml
# pubspec.yaml
dependencies:
  socket_io_client: ^2.0.3+1
```

---

## 📡 REST API Endpoints

All technician routes require `TECHNICIAN` role JWT token.

---

### 1. Technician: Start Journey
```
PATCH /api/v1/technician/jobs/:jobId/enroute
```
**Auth required (TECHNICIAN)**

**No request body.**

**Response:**
```json
{
  "job": {
    "id": "uuid",
    "status": "EN_ROUTE",
    ...
  },
  "message": "Journey started. Customer has been notified."
}
```

---

### 2. Technician: Push Live GPS (call every 5 seconds)
```
POST /api/v1/technician/jobs/:jobId/location
```
**Auth required (TECHNICIAN)**

**Request Body:**
```json
{
  "lat": 22.0651,
  "lng": 88.0612,
  "heading": 270.5,
  "speed_kmh": 35.2
}
```

**Response:**
```json
{
  "id": "uuid",
  "lat": 22.0651,
  "lng": 88.0612,
  "heading": 270.5,
  "speed_kmh": 35.2,
  "updated_at": "2026-07-29T05:49:00.000Z"
}
```
> This also instantly broadcasts to the customer's WebSocket room.

---

### 3. Technician: Mark as Arrived
```
PATCH /api/v1/technician/jobs/:jobId/arrived
```
**Auth required (TECHNICIAN)**

**No request body.**

**Response:**
```json
{
  "job": { "id": "uuid", "status": "ARRIVED" },
  "message": "Marked as arrived. Customer has been notified."
}
```

---

### 4. Customer: Get Current Location (REST — for initial screen load)
```
GET /api/v1/service-requests/:jobId/tracking
```
**Auth required (CUSTOMER)**

**Response (tracking active):**
```json
{
  "tracking_active": true,
  "lat": 22.0651,
  "lng": 88.0612,
  "heading": 270.5,
  "speed_kmh": 35.2,
  "updated_at": "2026-07-29T05:50:00.000Z",
  "technician_name": "Rajesh Kumar",
  "job_status": "EN_ROUTE"
}
```

**Response (tracking not started):**
```json
{
  "tracking_active": false,
  "message": "Technician has not started journey yet"
}
```

---

## 📲 WebSocket Events Reference

### Events customer app **listens to:**

| Event | When it fires | Payload |
|---|---|---|
| `location-update` | Every ~5 seconds while EN_ROUTE | `{ lat, lng, heading, speed_kmh, technician_name, updated_at }` |
| `technician-en-route` | When tech taps "Start Journey" | `{ message, started_at }` |
| `technician-arrived` | When tech taps "I have arrived" | `{ message, arrived_at }` |
| `joined` | After joining a room | `{ room, message }` |

### Events customer app **emits:**

| Event | When to emit | Payload |
|---|---|---|
| `join-job-room` | When tracking screen opens | `{ jobId: "uuid" }` |
| `leave-job-room` | When tracking screen closes | `{ jobId: "uuid" }` |

---

## 💻 Flutter Code — Customer App (Live Tracking Screen)

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:google_maps_flutter/google_maps_flutter.dart';

class TrackingScreen extends StatefulWidget {
  final String jobId;
  const TrackingScreen({required this.jobId});

  @override
  State<TrackingScreen> createState() => _TrackingScreenState();
}

class _TrackingScreenState extends State<TrackingScreen> {
  late IO.Socket socket;
  LatLng? technicianLocation;
  String status = 'Waiting for technician...';
  GoogleMapController? mapController;

  @override
  void initState() {
    super.initState();
    connectWebSocket();
  }

  void connectWebSocket() {
    socket = IO.io(
      'wss://your-app.railway.app/tracking',
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .build(),
    );

    socket.connect();

    socket.onConnect((_) {
      // Join the room for THIS specific job
      socket.emit('join-job-room', {'jobId': widget.jobId});
    });

    // ✅ Receive live location updates
    socket.on('location-update', (data) {
      setState(() {
        technicianLocation = LatLng(data['lat'], data['lng']);
        status = '🚗 ${data['technician_name']} is on the way...';
      });

      // Move camera to follow technician
      mapController?.animateCamera(
        CameraUpdate.newLatLng(technicianLocation!),
      );
    });

    // ✅ Technician started journey
    socket.on('technician-en-route', (data) {
      setState(() => status = '🚀 ${data['message']}');
    });

    // ✅ Technician arrived!
    socket.on('technician-arrived', (data) {
      setState(() => status = '✅ ${data['message']}');
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: Text('Technician Arrived!'),
          content: Text(data['message']),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('OK'),
            ),
          ],
        ),
      );
    });
  }

  @override
  void dispose() {
    socket.emit('leave-job-room', {'jobId': widget.jobId});
    socket.disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Tracking Technician')),
      body: Column(
        children: [
          // Status Banner
          Container(
            color: Colors.blue,
            padding: EdgeInsets.all(12),
            width: double.infinity,
            child: Text(status, style: TextStyle(color: Colors.white)),
          ),

          // Google Map
          Expanded(
            child: GoogleMap(
              initialCameraPosition: CameraPosition(
                target: LatLng(22.0667, 88.0667), // Haldia default
                zoom: 14,
              ),
              onMapCreated: (controller) => mapController = controller,
              markers: technicianLocation == null
                  ? {}
                  : {
                      Marker(
                        markerId: MarkerId('technician'),
                        position: technicianLocation!,
                        icon: BitmapDescriptor.defaultMarkerWithHue(
                          BitmapDescriptor.hueBlue,
                        ),
                        infoWindow: InfoWindow(title: 'Technician'),
                      ),
                    },
            ),
          ),
        ],
      ),
    );
  }
}
```

---

## 💻 Flutter Code — Technician App (Location Sender)

```dart
import 'dart:async';
import 'package:geolocator/geolocator.dart';
import 'package:dio/dio.dart';

class TechnicianTracker {
  final Dio _dio;
  final String jobId;
  Timer? _locationTimer;

  TechnicianTracker({required Dio dio, required this.jobId}) : _dio = dio;

  // Step 1: Start journey
  Future<void> startJourney() async {
    await _dio.patch('/technician/jobs/$jobId/enroute');
    startSendingLocation(); // Start GPS loop
  }

  // Step 2: Send GPS every 5 seconds
  void startSendingLocation() {
    _locationTimer = Timer.periodic(Duration(seconds: 5), (_) async {
      try {
        final pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
        );

        await _dio.post('/technician/jobs/$jobId/location', data: {
          'lat': pos.latitude,
          'lng': pos.longitude,
          'heading': pos.heading,
          'speed_kmh': (pos.speed * 3.6), // m/s to km/h
        });
      } catch (e) {
        print('Location update failed: $e');
      }
    });
  }

  // Step 3: Arrived at customer home
  Future<void> markArrived() async {
    _locationTimer?.cancel(); // Stop sending location
    await _dio.patch('/technician/jobs/$jobId/arrived');
  }

  void dispose() {
    _locationTimer?.cancel();
  }
}
```

---

## 🗺️ Job Status Flow (Updated)

```
RAISED → ASSIGNED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED
                        ↑           ↑
               Tech taps        Tech taps
             "Start Journey"  "I Arrived"
             (GPS starts)    (GPS stops)
```

---

## 📦 Flutter Packages Needed

```yaml
# pubspec.yaml
dependencies:
  socket_io_client: ^2.0.3+1      # WebSocket live tracking
  google_maps_flutter: ^2.5.0     # Map display
  geolocator: ^11.0.0             # Get device GPS
  dio: ^5.4.0                     # HTTP API calls
  shared_preferences: ^2.2.0      # Store JWT token
```

**Android permissions** (add to `AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.FOREGROUND_SERVICE"/>
```

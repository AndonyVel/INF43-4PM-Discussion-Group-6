Deliverable: What to Turn In

S1 -- Architectural Summary - Paragraph: comments, connectors, design styles, and where each
  runs (laptop, server, cloud).

S2 + S3 -- Platforms & Languages - Hardware/OS/runtime + languages, with benefit/tradeoff 
  analysis for each choice/

S4 -- Communication Protocols - What messages flow between components and how (HTTP, RPC,
  sockets, etc.).

S5 -- Component Functions + Connector Examples - For each use-case flow: function names + 
  data passed across each connector.

S6 -- Prototype + Reflection - Stub client + server (faked is fine) + a short reflection on what 
  you learned

# SportsZone — Architectural Documentation

## Sections S1 – S5

---

## S1 — Architectural Summary

SportsZone is a two-tier mobile application built on a client–server model. The client tier is a cross-platform React Native app that runs on users' iOS or Android smartphones. The server tier is a Node.js/Express REST API hosted on Google Cloud Run (a serverless container platform), backed by a Cloud Firestore document database and Firebase Authentication. A dedicated Socket.io process—also on Cloud Run—handles all real-time chat and presence events. Google Maps Platform provides geocoding, map rendering, and the spatial distance calculations required for the matching algorithm.

### Component Inventory

| Component | Description |
|---|---|
| **React Native App** | Cross-platform mobile client (iOS & Android). Runs entirely on the user's smartphone. Handles UI, GPS sampling, push-notification delivery, and local caching. |
| **Node.js / Express API** | Stateless REST service deployed as a Docker container on Google Cloud Run. Executes matching logic, writes/reads Firestore, proxies Google Maps calls, and issues Firebase Auth tokens. |
| **Socket.io Server** | Separate Cloud Run service maintaining persistent WebSocket connections per active user. Broadcasts chat messages, typing indicators, and presence changes in real time. |
| **Cloud Firestore** | NoSQL document store hosted in Google Cloud. Stores user profiles, sport preferences, availability windows, match records, chat history, and activity logs. Scales automatically. |
| **Firebase Authentication** | Managed identity service. Issues JWTs for email/password sign-up, handles age-verification flag in custom claims, and provides token refresh. |
| **Google Maps Platform** | Third-party mapping API. Used for map tile rendering inside the app, reverse geocoding a GPS coordinate to a human-readable area, and calculating driving/walking distances. |
| **Firebase Cloud Messaging** | Push-notification delivery network. The API server publishes notification events; FCM fans them out to each device's OS notification layer. |

### Design Styles

| Pattern | Description |
|---|---|
| **Layered Architecture** | Presentation (React Native) → Application Logic (REST API) → Data (Firestore). Each layer communicates only with its immediate neighbor, keeping concerns separated. |
| **Stateless API** | Every HTTP request carries a Firebase JWT; the API server holds no session state. This allows Cloud Run to scale to zero when idle and horizontally under load. |
| **Event-Driven Messaging** | Chat and presence updates travel over a persistent WebSocket channel rather than polling. This reduces latency and battery drain on mobile devices. |
| **Privacy-by-Design** | Exact GPS coordinates are never stored. The API applies configurable Gaussian noise before persisting a user's location, satisfying the privacy requirement. |

### Where Each Component Runs

| Location | Components |
|---|---|
| **User's Smartphone** | React Native App — iOS (Swift runtime) or Android (JVM/ART). The GPS sensor, local storage, and push-notification receiver all live here. |
| **Google Cloud Run** | Node.js REST API and Socket.io server — each in its own auto-scaling container. Cloud Run bills per request; idle containers cost nothing. |
| **Google Cloud (managed)** | Cloud Firestore, Firebase Auth, Firebase Cloud Messaging — fully managed services with no servers to operate. |
| **Google Maps CDN** | Map tiles and geocoding results are served from Google's global edge network. The app only calls this API from the device; no tiles are stored server-side. |

---

## S2 — Hardware & OS / Runtime Environment

| Platform | Benefit | Tradeoff |
|---|---|---|
| **iOS** (iPhone 12+, iOS 16+) | Largest addressable audience for sports apps; Expo/React Native provides direct native module access to Core Location (GPS). | Apple review process adds 1–3 day release delays; stricter background-location permission requirements. |
| **Android** (API 31+, Android 12+) | Broader global device range; sideloading allows faster internal testing cycles. | Fragmented hardware means GPS accuracy varies across OEMs; battery-optimization policies (Doze) can delay background location updates. |
| **Google Cloud Run** (Linux container) | Auto-scales to zero; pay-per-use pricing fits a startup budget; built-in HTTPS and load balancing. | Cold-start latency (~200–400 ms) on first request after idle; maximum 60-minute request timeout limits very long streaming operations. |
| **Cloud Firestore** (managed NoSQL) | Real-time listeners; automatic horizontal scaling; strong consistency within a single document. | Document-size limit (1 MB) requires careful chat-message pagination; relational queries (JOIN-style) are not natively supported. |
| **Firebase Auth** (managed IdP) | Drop-in JWT lifecycle management; custom claims allow embedding age-verification status directly in the token. | Vendor lock-in to Firebase; custom SMTP for branded email requires additional configuration. |

---

## S3 — Languages

| Language / Runtime | Benefit | Tradeoff |
|---|---|---|
| **TypeScript (React Native)** | Single codebase for iOS + Android; strong static typing catches interface mismatches at compile time; huge npm ecosystem. | JavaScript runtime is single-threaded — CPU-intensive matching previews must be offloaded to the API; ~15% larger APK/IPA than native apps. |
| **TypeScript (Node.js / Express)** | Shared type definitions between client and server reduce contract drift; non-blocking I/O handles thousands of concurrent connections efficiently. | Not ideal for CPU-heavy computation; garbage-collection pauses can cause p99 latency spikes under sustained load. |
| **Firestore Rules** (custom DSL) | Declarative security rules enforced at the database layer, independent of the API server, preventing direct client writes to sensitive fields. | Limited expressiveness — complex business-logic checks (e.g., age verification gate) must still be enforced in the API layer. |

---

## S4 — Communication Protocols

SportsZone uses three distinct communication mechanisms, each chosen for a specific data-flow characteristic.

### HTTPS / REST — Primary API Protocol

All client-to-server data operations (profile creation, preference updates, match queries, activity history) travel over HTTPS using standard REST semantics. Every request carries an `Authorization: Bearer <Firebase JWT>` header. The API validates the token on each request (stateless). JSON is the wire format for all request and response bodies. Cloud Run terminates TLS at its ingress layer, so the Express server receives plain HTTP internally.

| Property | Value |
|---|---|
| **Verb** | `POST`, `GET`, `PATCH`, `DELETE` mapped to resource operations |
| **Auth header** | `Authorization: Bearer <JWT>` (Firebase-issued, RS256-signed) |
| **Body format** | `application/json` |
| **TLS** | TLS 1.3 enforced by Cloud Run ingress; HTTP/2 supported |
| **Base URL** | `https://api.sportszone.app/v1/` |

### WebSocket (Socket.io) — Real-Time Chat & Presence

After authentication, the React Native app opens a persistent Socket.io connection to the Socket.io server. Messages, typing indicators, and online/offline presence events are pushed bidirectionally over this channel without polling. Socket.io falls back to long-polling automatically on networks that block WebSockets (e.g., some hotel Wi-Fi). Each connected socket joins a private room named after the user's UID, and a shared room for each active chat thread.

| Property | Value |
|---|---|
| **Transport** | WebSocket (`ws://`) with HTTP long-poll fallback |
| **Auth** | Socket.io handshake passes Firebase JWT in `auth.token` field |
| **Rooms** | `user:<uid>` (private) and `chat:<threadId>` (shared per match) |
| **Events emitted** | `message:send`, `message:read`, `presence:online`, `typing:start`, `typing:stop` |
| **Events received** | `message:receive`, `presence:update`, `match:new`, `notification:push` |

### Push Notifications — Firebase Cloud Messaging (FCM)

When the app is backgrounded or closed, the API server publishes a notification event to FCM via its HTTP v1 API. FCM routes the payload to APNs (iOS) or directly to the Android device. The React Native app registers a device token on first launch and refreshes it on FCM token rotation. This mechanism is one-way (server-to-device) and used only for non-interactive alerts.

| Property | Value |
|---|---|
| **Protocol** | HTTPS POST to FCM HTTP v1 endpoint (server-side only) |
| **Payload** | JSON notification object with `title`, `body`, and `data` fields |
| **Routing** | FCM → APNs (iOS) or FCM direct (Android) |
| **Use cases** | New match, incoming chat message, meetup reminder |

---

## S5 — Component Functions & Connector Examples

### Flow 1 — User Registration & Age Verification

| Step | Component | Function / Event | Data Passed |
|---|---|---|---|
| 1 | React Native App | `AuthScreen.handleRegister()` | `{ email, password, birthDate, displayName }` |
| 2 | Firebase Auth SDK | `createUserWithEmailAndPassword()` | `email, password` → returns `uid + JWT` |
| 3 | React Native App | `POST /v1/users` | `Bearer JWT + { uid, displayName, birthDate }` |
| 4 | Node.js API | `usersController.createUser()` | Validates `birthDate` → sets `isAdult` flag in Firestore |
| 5 | Firebase Auth Admin | `setCustomUserClaims(uid, {adult})` | `uid, { adult: true\|false }` |
| 6 | Cloud Firestore | `users.doc(uid).set()` | `{ uid, displayName, sports:[], location: null, adult }` |

### Flow 2 — Setting Availability & Sport Preferences

| Step | Component | Function / Event | Data Passed |
|---|---|---|---|
| 1 | React Native App | `PreferencesScreen.savePrefs()` | `{ sports: ['basketball','tennis'], radiusKm: 5, windows: [{day:'Mon', start:'18:00', end:'21:00'}] }` |
| 2 | Node.js API | `PATCH /v1/users/:uid/preferences` | `Bearer JWT + preferences payload` |
| 3 | Node.js API | `prefsController.updatePreferences()` | Validates `windows` array, normalizes sport slugs |
| 4 | Cloud Firestore | `users.doc(uid).update()` | `{ sports, radiusKm, availabilityWindows }` |

### Flow 3 — Location Update & Matching

| Step | Component | Function / Event | Data Passed |
|---|---|---|---|
| 1 | React Native App | `LocationService.startTracking()` | `Expo Location watchPositionAsync()` → `{ lat, lng, accuracy }` |
| 2 | React Native App | `POST /v1/locations` | `Bearer JWT + { lat, lng, timestamp }` |
| 3 | Node.js API | `locationController.updateLocation()` | Applies Gaussian noise (±200 m) → stores `fuzzyLat`, `fuzzyLng` |
| 4 | Node.js API | `matchingService.findCandidates(uid)` | Queries Firestore for users with overlapping sport + window + within `radiusKm` using Google Maps Distance Matrix |
| 5 | Google Maps API | `distancematrix GET` | `origins=[fuzzyLat,fuzzyLng]`, `destinations=[candidateLocs]` |
| 6 | Node.js API | `matchingService.rankAndNotify(uid, candidates)` | Filters by distance threshold → writes match records |
| 7 | Cloud Firestore | `matches.add()` | `{ user1, user2, sport, proposedTime, status:'pending' }` |
| 8 | FCM HTTP v1 | `POST /fcm/send` | `{ token: deviceToken, notification: { title:'New Match!', body:'...' } }` |

### Flow 4 — Real-Time Chat Between Matched Users

| Step | Component | Function / Event | Data Passed |
|---|---|---|---|
| 1 | React Native App | `ChatScreen.sendMessage()` | `socket.emit('message:send', { threadId, text, timestamp })` |
| 2 | Socket.io Server | `onMessageSend(socket, payload)` | Persists message to Firestore, emits to `chat:<threadId>` room |
| 3 | Cloud Firestore | `messages.add()` | `{ threadId, senderId, text, timestamp, readBy:[] }` |
| 4 | Socket.io Server | `socket.to(threadId).emit('message:receive',...)` | `{ messageId, senderId, text, timestamp }` |
| 5 | React Native App | `ChatScreen.onMessageReceive()` | Appends message to local state, triggers scroll-to-bottom |

### Flow 5 — Pre-Planning a Meetup

| Step | Component | Function / Event | Data Passed |
|---|---|---|---|
| 1 | React Native App | `MeetupScreen.proposeMeetup()` | `POST /v1/meetups + { matchId, proposedTime, locationName, lat, lng }` |
| 2 | Node.js API | `meetupController.createProposal()` | Writes proposal, emits Socket.io event to peer |
| 3 | Socket.io Server | `emit to user:<peerUid>` | `{ event:'meetup:proposed', meetupId, proposedTime, locationName }` |
| 4 | React Native App (peer) | `MeetupScreen.onProposalReceived()` | Displays Accept / Counter / Decline action sheet |
| 5 | React Native App (peer) | `PATCH /v1/meetups/:id` | `Bearer JWT + { action: 'accept'\|'counter'\|'decline', counterTime? }` |
| 6 | Node.js API | `meetupController.respondToProposal()` | Updates Firestore status; notifies original proposer via FCM or socket |

### Flow 6 — Activity History Lookup

| Step | Component | Function / Event | Data Passed |
|---|---|---|---|
| 1 | React Native App | `HistoryScreen.loadHistory()` | `GET /v1/users/:uid/history?limit=20` |
| 2 | Node.js API | `historyController.getHistory(uid)` | Queries Firestore `activities` collection ordered by date desc |
| 3 | Cloud Firestore | `activities.where('participants','array-contains',uid).orderBy('date','desc').limit(20)` | Returns `[ { activityId, sport, date, location, participants[] } ]` |
| 4 | React Native App | `HistoryScreen.renderHistory()` | Renders list; tap on entry shows participant profiles + 'Play Again?' button |
| 5 | React Native App | `ChatScreen.openThread(existingMatchId)` | Re-opens Socket.io room for that match thread |

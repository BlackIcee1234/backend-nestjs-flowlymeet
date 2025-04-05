# FlowlyMeet Backend

FlowlyMeet is a real-time video conferencing application built with NestJS, featuring WebRTC capabilities for peer-to-peer video communication.

## 🚀 Features

- Real-time video conferencing using WebRTC
- Room-based communication
- WebSocket-based signaling
- User authentication and authorization
- Room management and participant tracking
- Screen sharing capabilities
- Chat functionality

## 🏗️ Architecture

The application follows a modular architecture using NestJS best practices:

```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication module
│   ├── room/         # Room management module
│   └── app/          # Core application module
├── common/           # Shared components
├── config/           # Configuration files
├── utils/            # Utility functions
├── types/            # TypeScript type definitions
├── swagger/          # API documentation
├── shared/           # Shared resources
└── constants/        # Application constants
```

### Key Components

- **Room Gateway**: Handles WebSocket connections and real-time communication
- **Room Service**: Manages room state and participant interactions
- **Signal Routes**: Handles WebRTC signaling between peers
- **Room Repository**: Manages room data persistence

## 🛠️ Technology Stack

- **Framework**: NestJS
- **WebSocket**: Socket.io
- **Real-time Communication**: WebRTC
- **Database**: (Add your database)
- **Authentication**: (Add your auth method)

## 🚦 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- (Add other prerequisites)

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Start the development server:
```bash
npm run start:dev
```

## 📚 API Documentation

The API documentation is available through Swagger UI at `/api` when the server is running.

### WebSocket Events

#### Room Events
- `join-room`: Join a video conference room
- `leave-room`: Leave a video conference room
- `broadcast-message`: Send a message to all room participants

#### Video Events
- `share-video`: Start/stop video sharing
- `video-answer`: Handle WebRTC answer
- `ice-candidate`: Exchange ICE candidates
- `video-reconnect`: Handle video reconnection
- `video-state`: Update video state

## 🔒 Security

- All WebSocket connections are validated
- Room access is protected by guards
- User authentication is required for sensitive operations

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run e2e tests
npm run test:e2e
```

## 📝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

[Add your license]

## 👥 Authors

[Add authors]

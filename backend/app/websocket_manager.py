from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Map channel_slug -> List of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}
        # Map user_id -> WebSocket (for tracking online users, though a user might have multiple tabs)
        # A better approach for online users might be a set of user_ids per channel or globally
        self.online_users: Dict[str, str] = {} # user_id -> status (or just presence)

    async def connect(self, websocket: WebSocket, channel_slug: str, user_id: str):
        await websocket.accept()
        if channel_slug not in self.active_connections:
            self.active_connections[channel_slug] = []
        self.active_connections[channel_slug].append(websocket)
        self.online_users[user_id] = "online"

    def disconnect(self, websocket: WebSocket, channel_slug: str, user_id: str):
        if channel_slug in self.active_connections:
            if websocket in self.active_connections[channel_slug]:
                self.active_connections[channel_slug].remove(websocket)
                if not self.active_connections[channel_slug]:
                    del self.active_connections[channel_slug]
        
        # Check if user has other connections, if not remove from online_users
        # For simplicity, we'll just remove them for now, but in a real app we'd count connections
        # self.online_users.pop(user_id, None) 

    async def broadcast(self, message: dict, channel_slug: str):
        if channel_slug in self.active_connections:
            for connection in self.active_connections[channel_slug]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")
                    # Handle disconnected clients?

manager = ConnectionManager()

"""
WebSocket connection manager for real-time messaging.
Handles connection tracking, message broadcasting, and online user tracking.
"""
from typing import Dict, List, Optional
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections for real-time messaging."""
    
    def __init__(self):
        # Map of user_id -> WebSocket connection
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection for a user."""
        await websocket.accept()
        self.active_connections[user_id] = websocket
        # Broadcast online status
        await self.broadcast_all({
            "type": "user_online",
            "user_id": user_id
        }, exclude_user=user_id)
    
    async def disconnect(self, user_id: str):
        """Remove a WebSocket connection for a user."""
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            # Broadcast offline status
            await self.broadcast_all({
                "type": "user_offline",
                "user_id": user_id
            })
    
    async def broadcast_to_users(self, message: dict, user_ids: List[str]):
        """Send a message to specific users."""
        for user_id in user_ids:
            if user_id in self.active_connections:
                conn = self.active_connections[user_id]
                try:
                    await conn.send_json(message)
                except Exception:
                    # Don't await disconnect here to avoid modifying dict while iterating
                    pass
    
    async def broadcast_all(self, message: dict, exclude_user: Optional[str] = None):
        """Send a message to ALL connected clients."""
        disconnected = []
        for user_id, connection in self.active_connections.items():
            if user_id == exclude_user:
                continue
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(user_id)
        
        for user_id in disconnected:
            if user_id in self.active_connections:
                del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user."""
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
            except Exception:
                del self.active_connections[user_id]

    @property
    def online_users_list(self) -> List[str]:
        return list(self.active_connections.keys())

# Global manager instance
manager = ConnectionManager()

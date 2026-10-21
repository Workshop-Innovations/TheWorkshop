"""
WebSocket connection manager for real-time messaging.
Handles connection tracking, message broadcasting, and online user tracking.
"""

from typing import Dict, Iterable, List, Optional, Set
from fastapi import WebSocket


class ConnectionManager:
    """Manages WebSocket connections for real-time messaging."""

    def __init__(self):

        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection for a user."""
        await websocket.accept()
        first_connection = user_id not in self.active_connections
        self.active_connections.setdefault(user_id, set()).add(websocket)

        if first_connection:
            await self.broadcast_all(
                {"type": "user_online", "user_id": user_id}, exclude_user=user_id
            )

    async def disconnect(self, user_id: str, websocket: Optional[WebSocket] = None):
        """Remove one of a user's WebSocket connections (or all of them if none given)."""
        sockets = self.active_connections.get(user_id)
        if sockets is None:
            return
        if websocket is not None:
            sockets.discard(websocket)
        if websocket is None or not sockets:
            self.active_connections.pop(user_id, None)

            await self.broadcast_all({"type": "user_offline", "user_id": user_id})

    async def _send(self, user_id: str, message: dict):
        """Send to every socket of a user, dropping sockets that fail."""
        dead = []
        for conn in list(self.active_connections.get(user_id, ())):
            try:
                await conn.send_json(message)
            except Exception:
                dead.append(conn)
        if dead:
            sockets = self.active_connections.get(user_id)
            if sockets is not None:
                for conn in dead:
                    sockets.discard(conn)
                if not sockets:
                    self.active_connections.pop(user_id, None)

    async def broadcast_to_users(self, message: dict, user_ids: Iterable[str]):
        """Send a message to specific users."""
        for user_id in set(user_ids):
            await self._send(user_id, message)

    async def broadcast_all(self, message: dict, exclude_user: Optional[str] = None):
        """Send a message to ALL connected clients."""
        for user_id in list(self.active_connections.keys()):
            if user_id == exclude_user:
                continue
            await self._send(user_id, message)

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user."""
        await self._send(user_id, message)

    @property
    def online_users_list(self) -> List[str]:
        return list(self.active_connections.keys())


manager = ConnectionManager()

from fastapi import FastAPI, APIRouter, HTTPException, Depends, WebSocket, WebSocketDisconnect, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import json

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'midnight-social-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="Midnight Social API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}  # venue_id -> [websockets]
        self.user_connections: Dict[str, WebSocket] = {}  # user_id -> websocket
    
    async def connect(self, websocket: WebSocket, venue_id: str, user_id: str):
        await websocket.accept()
        if venue_id not in self.active_connections:
            self.active_connections[venue_id] = []
        self.active_connections[venue_id].append(websocket)
        self.user_connections[user_id] = websocket
    
    def disconnect(self, websocket: WebSocket, venue_id: str, user_id: str):
        if venue_id in self.active_connections:
            if websocket in self.active_connections[venue_id]:
                self.active_connections[venue_id].remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]
    
    async def broadcast_to_venue(self, venue_id: str, message: dict):
        if venue_id in self.active_connections:
            for connection in self.active_connections[venue_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_json(message)
            except:
                pass

manager = ConnectionManager()

# Pydantic Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    display_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    display_name: str
    bio: Optional[str] = ""
    avatar_url: Optional[str] = ""
    interests: List[str] = []
    age_range: Optional[str] = ""
    looking_for: Optional[str] = ""

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: str
    display_name: str
    bio: str = ""
    avatar_url: str = ""
    interests: List[str] = []
    age_range: str = ""
    looking_for: str = ""
    created_at: str
    is_visible: bool = True

class VenueCreate(BaseModel):
    name: str
    type: str  # bar, cafe, restaurant, club
    address: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""

class VenueResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    type: str
    address: str
    description: str = ""
    image_url: str = ""
    checked_in_count: int = 0

class CheckInResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    venue_id: str
    checked_in_at: str
    is_active: bool

class GlanceCreate(BaseModel):
    to_user_id: str
    venue_id: str

class DrinkTokenCreate(BaseModel):
    to_user_id: str
    venue_id: str
    drink_type: str  # cocktail, beer, wine, coffee, mocktail

class DrinkTokenResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    from_user_id: str
    from_user_name: str
    from_user_avatar: str
    to_user_id: str
    venue_id: str
    drink_type: str
    message: str = ""
    created_at: str
    is_accepted: bool = False

class MessageCreate(BaseModel):
    to_user_id: str
    content: str

class MessageResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    from_user_id: str
    from_user_name: str
    from_user_avatar: str
    to_user_id: str
    content: str
    created_at: str
    is_read: bool = False

class ConnectionResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    display_name: str
    avatar_url: str
    bio: str = ""
    connected_at: str
    venue_name: str

class WhoIsHereUser(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    display_name: str
    avatar_url: str
    bio: str = ""
    interests: List[str] = []
    checked_in_at: str
    has_glanced_at_me: bool = False
    i_glanced_at: bool = False
    is_connected: bool = False
    is_revealed: bool = False

# Helper Functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Auth Routes
@api_router.post("/auth/register")
async def register(data: UserCreate):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": data.email,
        "password": hash_password(data.password),
        "display_name": data.display_name,
        "bio": "",
        "avatar_url": "",
        "interests": [],
        "age_range": "",
        "looking_for": "",
        "is_visible": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user)
    token = create_token(user_id, data.email)
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": data.email,
            "display_name": data.display_name,
            "bio": "",
            "avatar_url": "",
            "interests": [],
            "age_range": "",
            "looking_for": "",
            "is_visible": True,
            "created_at": user["created_at"]
        }
    }

@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_token(user["id"], user["email"])
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "display_name": user["display_name"],
            "bio": user.get("bio", ""),
            "avatar_url": user.get("avatar_url", ""),
            "interests": user.get("interests", []),
            "age_range": user.get("age_range", ""),
            "looking_for": user.get("looking_for", ""),
            "is_visible": user.get("is_visible", True),
            "created_at": user["created_at"]
        }
    }

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.put("/auth/profile")
async def update_profile(data: UserProfile, current_user: dict = Depends(get_current_user)):
    update_data = data.model_dump(exclude_unset=True)
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    updated = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return updated

@api_router.put("/auth/visibility")
async def toggle_visibility(current_user: dict = Depends(get_current_user)):
    new_visibility = not current_user.get("is_visible", True)
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"is_visible": new_visibility}})
    return {"is_visible": new_visibility}

@api_router.delete("/auth/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    user_id = current_user["id"]
    # Delete user data
    await db.users.delete_one({"id": user_id})
    await db.checkins.delete_many({"user_id": user_id})
    await db.glances.delete_many({"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]})
    await db.drink_tokens.delete_many({"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]})
    await db.connections.delete_many({"$or": [{"user1_id": user_id}, {"user2_id": user_id}]})
    await db.messages.delete_many({"$or": [{"from_user_id": user_id}, {"to_user_id": user_id}]})
    return {"message": "Account deleted successfully"}

# Venue Routes
@api_router.get("/venues", response_model=List[VenueResponse])
async def get_venues(current_user: dict = Depends(get_current_user)):
    venues = await db.venues.find({}, {"_id": 0}).to_list(100)
    for venue in venues:
        count = await db.checkins.count_documents({"venue_id": venue["id"], "is_active": True})
        venue["checked_in_count"] = count
    return venues

@api_router.get("/venues/{venue_id}", response_model=VenueResponse)
async def get_venue(venue_id: str, current_user: dict = Depends(get_current_user)):
    venue = await db.venues.find_one({"id": venue_id}, {"_id": 0})
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    count = await db.checkins.count_documents({"venue_id": venue_id, "is_active": True})
    venue["checked_in_count"] = count
    return venue

@api_router.post("/venues", response_model=VenueResponse)
async def create_venue(data: VenueCreate, current_user: dict = Depends(get_current_user)):
    venue_id = str(uuid.uuid4())
    venue = {
        "id": venue_id,
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.venues.insert_one(venue)
    return {**venue, "checked_in_count": 0}

# Check-in Routes
@api_router.post("/checkin/{venue_id}")
async def check_in(venue_id: str, current_user: dict = Depends(get_current_user)):
    # Check out from any existing venue
    await db.checkins.update_many(
        {"user_id": current_user["id"], "is_active": True},
        {"$set": {"is_active": False, "checked_out_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    checkin_id = str(uuid.uuid4())
    checkin = {
        "id": checkin_id,
        "user_id": current_user["id"],
        "venue_id": venue_id,
        "checked_in_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    await db.checkins.insert_one(checkin)
    
    # Broadcast to venue
    await manager.broadcast_to_venue(venue_id, {
        "type": "user_checked_in",
        "user": {
            "id": current_user["id"],
            "display_name": current_user["display_name"],
            "avatar_url": current_user.get("avatar_url", ""),
            "bio": current_user.get("bio", ""),
            "interests": current_user.get("interests", [])
        }
    })
    
    return {"message": "Checked in successfully", "checkin_id": checkin_id}

@api_router.post("/checkout")
async def check_out(current_user: dict = Depends(get_current_user)):
    checkin = await db.checkins.find_one({"user_id": current_user["id"], "is_active": True})
    if checkin:
        await db.checkins.update_one(
            {"id": checkin["id"]},
            {"$set": {"is_active": False, "checked_out_at": datetime.now(timezone.utc).isoformat()}}
        )
        await manager.broadcast_to_venue(checkin["venue_id"], {
            "type": "user_checked_out",
            "user_id": current_user["id"]
        })
    return {"message": "Checked out successfully"}

@api_router.get("/checkin/current")
async def get_current_checkin(current_user: dict = Depends(get_current_user)):
    checkin = await db.checkins.find_one({"user_id": current_user["id"], "is_active": True}, {"_id": 0})
    if not checkin:
        return {"checked_in": False}
    venue = await db.venues.find_one({"id": checkin["venue_id"]}, {"_id": 0})
    return {"checked_in": True, "checkin": checkin, "venue": venue}

# Who's Here Routes
@api_router.get("/venues/{venue_id}/people", response_model=List[WhoIsHereUser])
async def get_people_at_venue(venue_id: str, current_user: dict = Depends(get_current_user)):
    checkins = await db.checkins.find({"venue_id": venue_id, "is_active": True}, {"_id": 0}).to_list(100)
    
    people = []
    for checkin in checkins:
        if checkin["user_id"] == current_user["id"]:
            continue
        
        user = await db.users.find_one({"id": checkin["user_id"], "is_visible": True}, {"_id": 0, "password": 0})
        if not user:
            continue
        
        # Check glance status
        has_glanced_at_me = await db.glances.find_one({
            "from_user_id": checkin["user_id"],
            "to_user_id": current_user["id"],
            "venue_id": venue_id
        }) is not None
        
        i_glanced_at = await db.glances.find_one({
            "from_user_id": current_user["id"],
            "to_user_id": checkin["user_id"],
            "venue_id": venue_id
        }) is not None
        
        # Check connection status
        is_connected = await db.connections.find_one({
            "$or": [
                {"user1_id": current_user["id"], "user2_id": checkin["user_id"]},
                {"user1_id": checkin["user_id"], "user2_id": current_user["id"]}
            ]
        }) is not None
        
        # Revealed if mutual glance
        is_revealed = has_glanced_at_me and i_glanced_at
        
        people.append({
            "id": user["id"],
            "display_name": user["display_name"] if is_revealed else "Someone",
            "avatar_url": user.get("avatar_url", "") if is_revealed else "",
            "bio": user.get("bio", "") if is_revealed else "",
            "interests": user.get("interests", []) if is_revealed else [],
            "checked_in_at": checkin["checked_in_at"],
            "has_glanced_at_me": has_glanced_at_me,
            "i_glanced_at": i_glanced_at,
            "is_connected": is_connected,
            "is_revealed": is_revealed
        })
    
    return people

# Glance Routes
@api_router.post("/glance")
async def send_glance(data: GlanceCreate, current_user: dict = Depends(get_current_user)):
    # Check if already glanced
    existing = await db.glances.find_one({
        "from_user_id": current_user["id"],
        "to_user_id": data.to_user_id,
        "venue_id": data.venue_id
    })
    if existing:
        return {"message": "Already glanced", "is_mutual": False}
    
    glance_id = str(uuid.uuid4())
    glance = {
        "id": glance_id,
        "from_user_id": current_user["id"],
        "to_user_id": data.to_user_id,
        "venue_id": data.venue_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.glances.insert_one(glance)
    
    # Check for mutual glance
    mutual = await db.glances.find_one({
        "from_user_id": data.to_user_id,
        "to_user_id": current_user["id"],
        "venue_id": data.venue_id
    })
    
    if mutual:
        # Create connection
        connection_id = str(uuid.uuid4())
        connection = {
            "id": connection_id,
            "user1_id": current_user["id"],
            "user2_id": data.to_user_id,
            "venue_id": data.venue_id,
            "connected_at": datetime.now(timezone.utc).isoformat()
        }
        await db.connections.insert_one(connection)
        
        # Notify both users
        await manager.send_to_user(data.to_user_id, {
            "type": "mutual_glance",
            "from_user": {
                "id": current_user["id"],
                "display_name": current_user["display_name"],
                "avatar_url": current_user.get("avatar_url", "")
            }
        })
        
        return {"message": "It's a match! You can now connect.", "is_mutual": True}
    
    # Notify target user of glance (anonymous)
    await manager.send_to_user(data.to_user_id, {
        "type": "new_glance",
        "message": "Someone glanced at you!"
    })
    
    return {"message": "Glance sent!", "is_mutual": False}

# Drink Token Routes
@api_router.post("/drink-token")
async def send_drink_token(data: DrinkTokenCreate, current_user: dict = Depends(get_current_user)):
    token_id = str(uuid.uuid4())
    drink_token = {
        "id": token_id,
        "from_user_id": current_user["id"],
        "to_user_id": data.to_user_id,
        "venue_id": data.venue_id,
        "drink_type": data.drink_type,
        "message": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_accepted": False
    }
    await db.drink_tokens.insert_one(drink_token)
    
    # Notify recipient
    await manager.send_to_user(data.to_user_id, {
        "type": "drink_token_received",
        "from_user": {
            "id": current_user["id"],
            "display_name": current_user["display_name"],
            "avatar_url": current_user.get("avatar_url", "")
        },
        "drink_type": data.drink_type
    })
    
    return {"message": f"Drink token sent!", "token_id": token_id}

@api_router.get("/drink-tokens/received", response_model=List[DrinkTokenResponse])
async def get_received_drink_tokens(current_user: dict = Depends(get_current_user)):
    tokens = await db.drink_tokens.find({"to_user_id": current_user["id"]}, {"_id": 0}).to_list(50)
    
    result = []
    for token in tokens:
        from_user = await db.users.find_one({"id": token["from_user_id"]}, {"_id": 0, "password": 0})
        if from_user:
            result.append({
                **token,
                "from_user_name": from_user["display_name"],
                "from_user_avatar": from_user.get("avatar_url", "")
            })
    
    return result

@api_router.post("/drink-token/{token_id}/accept")
async def accept_drink_token(token_id: str, current_user: dict = Depends(get_current_user)):
    token = await db.drink_tokens.find_one({"id": token_id, "to_user_id": current_user["id"]})
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")
    
    await db.drink_tokens.update_one({"id": token_id}, {"$set": {"is_accepted": True}})
    
    # Notify sender
    await manager.send_to_user(token["from_user_id"], {
        "type": "drink_token_accepted",
        "by_user": {
            "id": current_user["id"],
            "display_name": current_user["display_name"]
        }
    })
    
    return {"message": "Drink accepted! Cheers!"}

# Connection Routes
@api_router.get("/connections", response_model=List[ConnectionResponse])
async def get_connections(current_user: dict = Depends(get_current_user)):
    connections = await db.connections.find({
        "$or": [
            {"user1_id": current_user["id"]},
            {"user2_id": current_user["id"]}
        ]
    }, {"_id": 0}).to_list(100)
    
    result = []
    for conn in connections:
        other_user_id = conn["user2_id"] if conn["user1_id"] == current_user["id"] else conn["user1_id"]
        other_user = await db.users.find_one({"id": other_user_id}, {"_id": 0, "password": 0})
        venue = await db.venues.find_one({"id": conn["venue_id"]}, {"_id": 0})
        
        if other_user and venue:
            result.append({
                "id": conn["id"],
                "user_id": other_user["id"],
                "display_name": other_user["display_name"],
                "avatar_url": other_user.get("avatar_url", ""),
                "bio": other_user.get("bio", ""),
                "connected_at": conn["connected_at"],
                "venue_name": venue["name"]
            })
    
    return result

# Message Routes
@api_router.post("/messages")
async def send_message(data: MessageCreate, current_user: dict = Depends(get_current_user)):
    # Check if connected
    connection = await db.connections.find_one({
        "$or": [
            {"user1_id": current_user["id"], "user2_id": data.to_user_id},
            {"user1_id": data.to_user_id, "user2_id": current_user["id"]}
        ]
    })
    if not connection:
        raise HTTPException(status_code=403, detail="You must be connected to send messages")
    
    message_id = str(uuid.uuid4())
    message = {
        "id": message_id,
        "from_user_id": current_user["id"],
        "to_user_id": data.to_user_id,
        "content": data.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_read": False
    }
    await db.messages.insert_one(message)
    
    # Notify recipient
    await manager.send_to_user(data.to_user_id, {
        "type": "new_message",
        "message": {
            "id": message_id,
            "from_user_id": current_user["id"],
            "from_user_name": current_user["display_name"],
            "from_user_avatar": current_user.get("avatar_url", ""),
            "content": data.content,
            "created_at": message["created_at"]
        }
    })
    
    return {"message": "Message sent", "message_id": message_id}

@api_router.get("/messages/{user_id}", response_model=List[MessageResponse])
async def get_messages(user_id: str, current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find({
        "$or": [
            {"from_user_id": current_user["id"], "to_user_id": user_id},
            {"from_user_id": user_id, "to_user_id": current_user["id"]}
        ]
    }, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    # Mark as read
    await db.messages.update_many(
        {"from_user_id": user_id, "to_user_id": current_user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    result = []
    for msg in messages:
        from_user = await db.users.find_one({"id": msg["from_user_id"]}, {"_id": 0, "password": 0})
        if from_user:
            result.append({
                **msg,
                "from_user_name": from_user["display_name"],
                "from_user_avatar": from_user.get("avatar_url", "")
            })
    
    return result

@api_router.get("/messages/unread/count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.messages.count_documents({"to_user_id": current_user["id"], "is_read": False})
    return {"unread_count": count}

# Notifications (recent glances and drink tokens)
@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    # Get recent glances at me
    glances = await db.glances.find({"to_user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(20)
    
    # Get drink tokens
    tokens = await db.drink_tokens.find({"to_user_id": current_user["id"], "is_accepted": False}, {"_id": 0}).sort("created_at", -1).to_list(20)
    
    notifications = []
    for g in glances:
        # Check if mutual
        mutual = await db.glances.find_one({
            "from_user_id": current_user["id"],
            "to_user_id": g["from_user_id"],
            "venue_id": g["venue_id"]
        })
        from_user = await db.users.find_one({"id": g["from_user_id"]}, {"_id": 0, "password": 0})
        if mutual and from_user:
            notifications.append({
                "type": "mutual_glance",
                "user": {
                    "id": from_user["id"],
                    "display_name": from_user["display_name"],
                    "avatar_url": from_user.get("avatar_url", "")
                },
                "created_at": g["created_at"]
            })
        else:
            notifications.append({
                "type": "glance",
                "message": "Someone glanced at you",
                "created_at": g["created_at"]
            })
    
    for t in tokens:
        from_user = await db.users.find_one({"id": t["from_user_id"]}, {"_id": 0, "password": 0})
        if from_user:
            notifications.append({
                "type": "drink_token",
                "token_id": t["id"],
                "from_user": {
                    "id": from_user["id"],
                    "display_name": from_user["display_name"],
                    "avatar_url": from_user.get("avatar_url", "")
                },
                "drink_type": t["drink_type"],
                "created_at": t["created_at"]
            })
    
    # Sort by date
    notifications.sort(key=lambda x: x["created_at"], reverse=True)
    return notifications[:30]

# Seed Data Route (for development)
@api_router.post("/seed")
async def seed_data():
    # Check if already seeded
    venue_count = await db.venues.count_documents({})
    if venue_count > 0:
        return {"message": "Already seeded"}
    
    venues = [
        {
            "id": str(uuid.uuid4()),
            "name": "The Velvet Room",
            "type": "bar",
            "address": "123 Main St",
            "description": "Upscale cocktail bar with live jazz",
            "image_url": "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Brew & Bean",
            "type": "cafe",
            "address": "456 Oak Ave",
            "description": "Artisan coffee and craft beer",
            "image_url": "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Neon Nights",
            "type": "club",
            "address": "789 Dance Blvd",
            "description": "Electronic music and dancing",
            "image_url": "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Sunset Lounge",
            "type": "bar",
            "address": "321 Beach Rd",
            "description": "Rooftop bar with ocean views",
            "image_url": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "The Study",
            "type": "cafe",
            "address": "555 Library Lane",
            "description": "Quiet cafe with books and wine",
            "image_url": "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=800",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.venues.insert_many(venues)
    return {"message": "Seeded successfully", "venues_created": len(venues)}

# WebSocket endpoint
@app.websocket("/ws/{venue_id}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, venue_id: str, user_id: str):
    await manager.connect(websocket, venue_id, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle ping/pong for connection keep-alive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, venue_id, user_id)

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

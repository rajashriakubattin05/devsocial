from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.staticfiles import StaticFiles
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'devsocial-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 1 week

# Gemini API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Upload directory
UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="DevSocial API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    bio: Optional[str] = ""
    skills: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    email: str
    full_name: str
    bio: str = ""
    skills: List[str] = []
    avatar: str = ""
    followers_count: int = 0
    following_count: int = 0
    posts_count: int = 0
    created_at: str

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    avatar: Optional[str] = None

class PostCreate(BaseModel):
    content: str
    code_snippet: Optional[str] = None
    language: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None  # image, video
    hashtags: Optional[List[str]] = []

class PostResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    username: str
    user_avatar: str
    content: str
    code_snippet: Optional[str] = None
    language: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None
    hashtags: List[str] = []
    likes_count: int = 0
    comments_count: int = 0
    shares_count: int = 0
    is_liked: bool = False
    created_at: str

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    post_id: str
    user_id: str
    username: str
    user_avatar: str
    content: str
    created_at: str

class AICodeAnalysis(BaseModel):
    code: str
    language: Optional[str] = "python"

class AIContentCheck(BaseModel):
    content: str
    code_snippet: Optional[str] = None

class AICareerGuidance(BaseModel):
    skills: List[str]
    interests: Optional[str] = ""
    experience_level: Optional[str] = "beginner"

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

# ==================== HELPER FUNCTIONS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[dict]:
    if not credentials:
        return None
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
        return user
    except:
        return None

async def get_ai_chat():
    if not EMERGENT_LLM_KEY:
        raise HTTPException(status_code=500, detail="AI service not configured")
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are a helpful AI assistant for developers."
    )
    chat.with_model("gemini", "gemini-2.5-flash")
    return chat

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    # Check if user exists
    existing_user = await db.users.find_one({"$or": [{"email": user_data.email}, {"username": user_data.username}]})
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email or username already exists")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "username": user_data.username,
        "email": user_data.email,
        "password": hash_password(user_data.password),
        "full_name": user_data.full_name,
        "bio": user_data.bio or "",
        "skills": user_data.skills or [],
        "avatar": f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_data.username}",
        "followers_count": 0,
        "following_count": 0,
        "posts_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    user_doc.pop("password")
    user_doc.pop("_id", None)
    
    return TokenResponse(access_token=token, user=UserProfile(**user_doc))

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"])
    user.pop("password")
    user.pop("_id", None)
    
    return TokenResponse(access_token=token, user=UserProfile(**user))

@api_router.get("/auth/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(**current_user)

# ==================== USER ROUTES ====================

@api_router.get("/users/{user_id}", response_model=UserProfile)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(**user)

@api_router.get("/users/username/{username}", response_model=UserProfile)
async def get_user_by_username(username: str):
    user = await db.users.find_one({"username": username}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserProfile(**user)

@api_router.put("/users/profile", response_model=UserProfile)
async def update_profile(update_data: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.users.update_one({"id": current_user["id"]}, {"$set": update_dict})
    
    user = await db.users.find_one({"id": current_user["id"]}, {"_id": 0, "password": 0})
    return UserProfile(**user)

@api_router.post("/users/{user_id}/follow")
async def follow_user(user_id: str, current_user: dict = Depends(get_current_user)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    existing_follow = await db.follows.find_one({
        "follower_id": current_user["id"],
        "following_id": user_id
    })
    
    if existing_follow:
        # Unfollow
        await db.follows.delete_one({"follower_id": current_user["id"], "following_id": user_id})
        await db.users.update_one({"id": current_user["id"]}, {"$inc": {"following_count": -1}})
        await db.users.update_one({"id": user_id}, {"$inc": {"followers_count": -1}})
        return {"status": "unfollowed"}
    else:
        # Follow
        follow_doc = {
            "id": str(uuid.uuid4()),
            "follower_id": current_user["id"],
            "following_id": user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.follows.insert_one(follow_doc)
        await db.users.update_one({"id": current_user["id"]}, {"$inc": {"following_count": 1}})
        await db.users.update_one({"id": user_id}, {"$inc": {"followers_count": 1}})
        
        # Create notification
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "type": "follow",
            "from_user_id": current_user["id"],
            "from_username": current_user["username"],
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification_doc)
        
        return {"status": "followed"}

@api_router.get("/users/{user_id}/is-following")
async def is_following(user_id: str, current_user: dict = Depends(get_current_user)):
    existing_follow = await db.follows.find_one({
        "follower_id": current_user["id"],
        "following_id": user_id
    })
    return {"is_following": existing_follow is not None}

@api_router.get("/users/{user_id}/followers", response_model=List[UserProfile])
async def get_followers(user_id: str, skip: int = 0, limit: int = 20):
    follows = await db.follows.find({"following_id": user_id}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    follower_ids = [f["follower_id"] for f in follows]
    users = await db.users.find({"id": {"$in": follower_ids}}, {"_id": 0, "password": 0}).to_list(len(follower_ids))
    return [UserProfile(**u) for u in users]

@api_router.get("/users/{user_id}/following", response_model=List[UserProfile])
async def get_following(user_id: str, skip: int = 0, limit: int = 20):
    follows = await db.follows.find({"follower_id": user_id}, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    following_ids = [f["following_id"] for f in follows]
    users = await db.users.find({"id": {"$in": following_ids}}, {"_id": 0, "password": 0}).to_list(len(following_ids))
    return [UserProfile(**u) for u in users]

@api_router.get("/search/users", response_model=List[UserProfile])
async def search_users(q: str = Query(..., min_length=1), skip: int = 0, limit: int = 20):
    users = await db.users.find(
        {"$or": [
            {"username": {"$regex": q, "$options": "i"}},
            {"full_name": {"$regex": q, "$options": "i"}},
            {"skills": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0, "password": 0}
    ).skip(skip).limit(limit).to_list(limit)
    return [UserProfile(**u) for u in users]

# ==================== POST ROUTES ====================

@api_router.post("/posts", response_model=PostResponse)
async def create_post(post_data: PostCreate, current_user: dict = Depends(get_current_user)):
    post_id = str(uuid.uuid4())
    post_doc = {
        "id": post_id,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "user_avatar": current_user.get("avatar", ""),
        "content": post_data.content,
        "code_snippet": post_data.code_snippet,
        "language": post_data.language,
        "media_url": post_data.media_url,
        "media_type": post_data.media_type,
        "hashtags": post_data.hashtags or [],
        "likes_count": 0,
        "comments_count": 0,
        "shares_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.posts.insert_one(post_doc)
    await db.users.update_one({"id": current_user["id"]}, {"$inc": {"posts_count": 1}})
    
    post_doc.pop("_id", None)
    return PostResponse(**post_doc, is_liked=False)

@api_router.get("/posts", response_model=List[PostResponse])
async def get_posts(skip: int = 0, limit: int = 20, current_user: Optional[dict] = Depends(get_optional_user)):
    posts = await db.posts.find({}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        is_liked = False
        if current_user:
            like = await db.likes.find_one({"post_id": post["id"], "user_id": current_user["id"]})
            is_liked = like is not None
        result.append(PostResponse(**post, is_liked=is_liked))
    
    return result

@api_router.get("/posts/feed", response_model=List[PostResponse])
async def get_feed(skip: int = 0, limit: int = 20, current_user: dict = Depends(get_current_user)):
    # Get posts from users the current user follows
    follows = await db.follows.find({"follower_id": current_user["id"]}, {"_id": 0}).to_list(1000)
    following_ids = [f["following_id"] for f in follows]
    following_ids.append(current_user["id"])  # Include own posts
    
    posts = await db.posts.find(
        {"user_id": {"$in": following_ids}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        like = await db.likes.find_one({"post_id": post["id"], "user_id": current_user["id"]})
        is_liked = like is not None
        result.append(PostResponse(**post, is_liked=is_liked))
    
    return result

@api_router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(post_id: str, current_user: Optional[dict] = Depends(get_optional_user)):
    post = await db.posts.find_one({"id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    is_liked = False
    if current_user:
        like = await db.likes.find_one({"post_id": post_id, "user_id": current_user["id"]})
        is_liked = like is not None
    
    return PostResponse(**post, is_liked=is_liked)

@api_router.get("/users/{user_id}/posts", response_model=List[PostResponse])
async def get_user_posts(user_id: str, skip: int = 0, limit: int = 20, current_user: Optional[dict] = Depends(get_optional_user)):
    posts = await db.posts.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        is_liked = False
        if current_user:
            like = await db.likes.find_one({"post_id": post["id"], "user_id": current_user["id"]})
            is_liked = like is not None
        result.append(PostResponse(**post, is_liked=is_liked))
    
    return result

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post["user_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")
    
    await db.posts.delete_one({"id": post_id})
    await db.likes.delete_many({"post_id": post_id})
    await db.comments.delete_many({"post_id": post_id})
    await db.users.update_one({"id": current_user["id"]}, {"$inc": {"posts_count": -1}})
    
    return {"status": "deleted"}

@api_router.post("/posts/{post_id}/like")
async def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    existing_like = await db.likes.find_one({"post_id": post_id, "user_id": current_user["id"]})
    
    if existing_like:
        # Unlike
        await db.likes.delete_one({"post_id": post_id, "user_id": current_user["id"]})
        await db.posts.update_one({"id": post_id}, {"$inc": {"likes_count": -1}})
        return {"status": "unliked", "likes_count": post["likes_count"] - 1}
    else:
        # Like
        like_doc = {
            "id": str(uuid.uuid4()),
            "post_id": post_id,
            "user_id": current_user["id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.likes.insert_one(like_doc)
        await db.posts.update_one({"id": post_id}, {"$inc": {"likes_count": 1}})
        
        # Create notification if not own post
        if post["user_id"] != current_user["id"]:
            notification_doc = {
                "id": str(uuid.uuid4()),
                "user_id": post["user_id"],
                "type": "like",
                "from_user_id": current_user["id"],
                "from_username": current_user["username"],
                "post_id": post_id,
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.notifications.insert_one(notification_doc)
        
        return {"status": "liked", "likes_count": post["likes_count"] + 1}

# ==================== COMMENT ROUTES ====================

@api_router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(post_id: str, comment_data: CommentCreate, current_user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    comment_id = str(uuid.uuid4())
    comment_doc = {
        "id": comment_id,
        "post_id": post_id,
        "user_id": current_user["id"],
        "username": current_user["username"],
        "user_avatar": current_user.get("avatar", ""),
        "content": comment_data.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.comments.insert_one(comment_doc)
    await db.posts.update_one({"id": post_id}, {"$inc": {"comments_count": 1}})
    
    # Create notification if not own post
    if post["user_id"] != current_user["id"]:
        notification_doc = {
            "id": str(uuid.uuid4()),
            "user_id": post["user_id"],
            "type": "comment",
            "from_user_id": current_user["id"],
            "from_username": current_user["username"],
            "post_id": post_id,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.notifications.insert_one(notification_doc)
    
    comment_doc.pop("_id", None)
    return CommentResponse(**comment_doc)

@api_router.get("/posts/{post_id}/comments", response_model=List[CommentResponse])
async def get_comments(post_id: str, skip: int = 0, limit: int = 50):
    comments = await db.comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    return [CommentResponse(**c) for c in comments]

# ==================== SEARCH ROUTES ====================

@api_router.get("/search/posts", response_model=List[PostResponse])
async def search_posts(q: str = Query(..., min_length=1), skip: int = 0, limit: int = 20, current_user: Optional[dict] = Depends(get_optional_user)):
    posts = await db.posts.find(
        {"$or": [
            {"content": {"$regex": q, "$options": "i"}},
            {"hashtags": {"$regex": q, "$options": "i"}},
            {"code_snippet": {"$regex": q, "$options": "i"}}
        ]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        is_liked = False
        if current_user:
            like = await db.likes.find_one({"post_id": post["id"], "user_id": current_user["id"]})
            is_liked = like is not None
        result.append(PostResponse(**post, is_liked=is_liked))
    
    return result

@api_router.get("/hashtags/{hashtag}/posts", response_model=List[PostResponse])
async def get_posts_by_hashtag(hashtag: str, skip: int = 0, limit: int = 20, current_user: Optional[dict] = Depends(get_optional_user)):
    posts = await db.posts.find(
        {"hashtags": {"$regex": f"^{hashtag}$", "$options": "i"}},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    result = []
    for post in posts:
        is_liked = False
        if current_user:
            like = await db.likes.find_one({"post_id": post["id"], "user_id": current_user["id"]})
            is_liked = like is not None
        result.append(PostResponse(**post, is_liked=is_liked))
    
    return result

@api_router.get("/trending/hashtags")
async def get_trending_hashtags(limit: int = 10):
    pipeline = [
        {"$unwind": "$hashtags"},
        {"$group": {"_id": "$hashtags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    results = await db.posts.aggregate(pipeline).to_list(limit)
    return [{"hashtag": r["_id"], "count": r["count"]} for r in results]

# ==================== NOTIFICATION ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(skip: int = 0, limit: int = 50, current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return notifications

@api_router.post("/notifications/mark-read")
async def mark_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"], "read": False},
        {"$set": {"read": True}}
    )
    return {"status": "success"}

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": current_user["id"], "read": False})
    return {"count": count}

# ==================== AI ROUTES ====================

@api_router.post("/ai/check-content")
async def check_content(data: AIContentCheck, current_user: dict = Depends(get_current_user)):
    """Check if content is coding-related"""
    try:
        chat = await get_ai_chat()
        prompt = f"""Analyze if the following content is appropriate for a developer-focused social media platform.
The content should be related to programming, coding, technology, software development, or tech career.

Content: {data.content}
{f'Code snippet: {data.code_snippet}' if data.code_snippet else ''}

Respond with JSON format:
{{
    "is_appropriate": true/false,
    "reason": "brief explanation",
    "suggested_hashtags": ["list", "of", "relevant", "hashtags"]
}}"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Parse response
        import json
        try:
            # Try to extract JSON from response
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            result = json.loads(json_str.strip())
        except:
            result = {"is_appropriate": True, "reason": "Content analysis completed", "suggested_hashtags": []}
        
        return result
    except Exception as e:
        logger.error(f"AI content check error: {e}")
        return {"is_appropriate": True, "reason": "AI service unavailable", "suggested_hashtags": []}

@api_router.post("/ai/explain-code")
async def explain_code(data: AICodeAnalysis, current_user: dict = Depends(get_current_user)):
    """Explain code in simple words"""
    try:
        chat = await get_ai_chat()
        prompt = f"""Explain the following {data.language} code in simple, easy-to-understand words.
Break down what each part does. Use analogies if helpful.

Code:
```{data.language}
{data.code}
```

Provide:
1. A brief summary of what the code does
2. Step-by-step explanation
3. Key concepts used
4. Common use cases"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return {"explanation": response}
    except Exception as e:
        logger.error(f"AI code explanation error: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable")

@api_router.post("/ai/detect-bugs")
async def detect_bugs(data: AICodeAnalysis, current_user: dict = Depends(get_current_user)):
    """Detect bugs and suggest improvements"""
    try:
        chat = await get_ai_chat()
        prompt = f"""Analyze the following {data.language} code for potential bugs, issues, and improvements.

Code:
```{data.language}
{data.code}
```

Provide:
1. List of potential bugs or issues found
2. Code improvement suggestions
3. Best practices recommendations
4. Improved version of the code if applicable

Format your response clearly with sections."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return {"analysis": response}
    except Exception as e:
        logger.error(f"AI bug detection error: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable")

@api_router.post("/ai/generate-caption")
async def generate_caption(data: AIContentCheck, current_user: dict = Depends(get_current_user)):
    """Generate caption and hashtags for a post"""
    try:
        chat = await get_ai_chat()
        prompt = f"""Generate an engaging caption and relevant hashtags for a developer social media post.

Content/Description: {data.content}
{f'Code snippet: {data.code_snippet}' if data.code_snippet else ''}

Generate:
1. An engaging, concise caption (2-3 sentences max)
2. 5-7 relevant hashtags for developers

Respond in JSON format:
{{
    "caption": "your generated caption",
    "hashtags": ["hashtag1", "hashtag2", ...]
}}"""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        # Parse response
        import json
        try:
            json_str = response
            if "```json" in response:
                json_str = response.split("```json")[1].split("```")[0]
            elif "```" in response:
                json_str = response.split("```")[1].split("```")[0]
            result = json.loads(json_str.strip())
        except:
            result = {"caption": data.content, "hashtags": ["coding", "developer", "tech"]}
        
        return result
    except Exception as e:
        logger.error(f"AI caption generation error: {e}")
        return {"caption": data.content, "hashtags": ["coding", "developer", "tech"]}

@api_router.post("/ai/career-guidance")
async def career_guidance(data: AICareerGuidance, current_user: dict = Depends(get_current_user)):
    """Get AI career guidance based on skills and interests"""
    try:
        chat = await get_ai_chat()
        prompt = f"""Provide personalized career guidance for a developer with the following profile:

Skills: {', '.join(data.skills)}
Interests: {data.interests}
Experience Level: {data.experience_level}

Provide:
1. Career path recommendations (3-4 options)
2. Skills to learn next
3. Project ideas to build portfolio
4. Resources for learning
5. Industry trends relevant to their skills

Be specific and actionable in your advice."""
        
        message = UserMessage(text=prompt)
        response = await chat.send_message(message)
        
        return {"guidance": response}
    except Exception as e:
        logger.error(f"AI career guidance error: {e}")
        raise HTTPException(status_code=500, detail="AI service unavailable")

# ==================== FILE UPLOAD ====================

@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="File type not allowed")
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else ""
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Save file
    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)
    
    # Return URL
    media_type = "image" if file.content_type.startswith("image") else "video"
    return {
        "url": f"/api/uploads/{filename}",
        "media_type": media_type,
        "filename": filename
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "DevSocial API is running", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

# Mount uploads directory
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

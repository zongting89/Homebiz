from fastapi import FastAPI, HTTPException, Depends, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional, List
import os
import uuid
from datetime import datetime, timedelta
import hashlib
import jwt
from passlib.context import CryptContext
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Initialize FastAPI app
app = FastAPI(title="HomeBiz Directory API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URL)
db = client.homebiz_directory

# Stripe configuration
STRIPE_API_KEY = os.getenv("STRIPE_API_KEY")
if not STRIPE_API_KEY:
    print("Warning: STRIPE_API_KEY not found in environment")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = "homebiz-secret-key-change-in-production"
ALGORITHM = "HS256"

# Subscription packages
SUBSCRIPTION_PACKAGES = {
    "basic": {"name": "Basic Plan", "price": 19.99, "currency": "sgd", "duration_days": 30},
    "premium": {"name": "Premium Plan", "price": 39.99, "currency": "sgd", "duration_days": 30}
}

# Pydantic models
class User(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "buyer"  # "buyer" or "seller"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class BusinessCreate(BaseModel):
    name: str
    description: str
    address: str
    latitude: float
    longitude: float
    phone: str
    category: str

class ProductCreate(BaseModel):
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None

class SubscriptionRequest(BaseModel):
    package_id: str
    origin_url: str

# Helper functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(request: Request):
    token = request.headers.get("Authorization")
    if not token or not token.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No token provided")
    
    token = token.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user = await db.users.find_one({"user_id": user_id})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def check_active_subscription(user_id: str) -> bool:
    subscription = await db.subscriptions.find_one({
        "user_id": user_id,
        "status": "active",
        "expires_at": {"$gt": datetime.utcnow()}
    })
    return subscription is not None

# API Routes

@app.get("/")
async def root():
    return {"message": "HomeBiz Directory API"}

# Authentication endpoints
@app.post("/api/auth/register")
async def register(user: User):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user_id = str(uuid.uuid4())
    user_doc = {
        "user_id": user_id,
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "role": user.role,
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token({"user_id": user_id})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user_id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }

@app.post("/api/auth/login")
async def login(user_login: UserLogin):
    user = await db.users.find_one({"email": user_login.email})
    if not user or not verify_password(user_login.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token({"user_id": user["user_id"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "email": user["email"],
            "name": user["name"],
            "role": user["role"]
        }
    }

# Subscription endpoints
@app.get("/api/subscription/packages")
async def get_subscription_packages():
    return SUBSCRIPTION_PACKAGES

@app.post("/api/subscription/checkout")
async def create_subscription_checkout(subscription_req: SubscriptionRequest, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can subscribe")
    
    # Validate package
    if subscription_req.package_id not in SUBSCRIPTION_PACKAGES:
        raise HTTPException(status_code=400, detail="Invalid subscription package")
    
    package = SUBSCRIPTION_PACKAGES[subscription_req.package_id]
    
    # Create Stripe checkout session
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    success_url = f"{subscription_req.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{subscription_req.origin_url}/subscription/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=package["price"],
        currency=package["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "type": "subscription",
            "user_id": current_user["user_id"],
            "package_id": subscription_req.package_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Store pending subscription transaction
    transaction_doc = {
        "transaction_id": str(uuid.uuid4()),
        "user_id": current_user["user_id"],
        "session_id": session.session_id,
        "type": "subscription",
        "package_id": subscription_req.package_id,
        "amount": package["price"],
        "currency": package["currency"],
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    await db.payment_transactions.insert_one(transaction_doc)
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@app.get("/api/subscription/status/{session_id}")
async def check_subscription_status(session_id: str, current_user: dict = Depends(get_current_user)):
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=500, detail="Payment system not configured")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status_response = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    transaction = await db.payment_transactions.find_one({"session_id": session_id, "user_id": current_user["user_id"]})
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    if status_response.payment_status == "paid" and transaction["status"] == "pending":
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"status": "completed", "updated_at": datetime.utcnow()}}
        )
        
        # Create/update subscription
        package = SUBSCRIPTION_PACKAGES[transaction["package_id"]]
        expires_at = datetime.utcnow() + timedelta(days=package["duration_days"])
        
        subscription_doc = {
            "user_id": current_user["user_id"],
            "package_id": transaction["package_id"],
            "status": "active",
            "created_at": datetime.utcnow(),
            "expires_at": expires_at
        }
        
        await db.subscriptions.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": subscription_doc},
            upsert=True
        )
    
    return {
        "status": status_response.status,
        "payment_status": status_response.payment_status,
        "amount_total": status_response.amount_total,
        "currency": status_response.currency
    }

@app.get("/api/subscription/current")
async def get_current_subscription(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers have subscriptions")
    
    subscription = await db.subscriptions.find_one({"user_id": current_user["user_id"]})
    if not subscription:
        return {"has_subscription": False}
    
    is_active = subscription["status"] == "active" and subscription["expires_at"] > datetime.utcnow()
    
    return {
        "has_subscription": True,
        "is_active": is_active,
        "package_id": subscription["package_id"],
        "expires_at": subscription["expires_at"].isoformat(),
        "status": subscription["status"]
    }

# Business endpoints
@app.post("/api/businesses")
async def create_business(business: BusinessCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can create businesses")
    
    # Check active subscription
    if not await check_active_subscription(current_user["user_id"]):
        raise HTTPException(status_code=403, detail="Active subscription required")
    
    business_id = str(uuid.uuid4())
    business_doc = {
        "business_id": business_id,
        "owner_id": current_user["user_id"],
        **business.dict(),
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    await db.businesses.insert_one(business_doc)
    
    return {"business_id": business_id, "message": "Business created successfully"}

@app.get("/api/businesses")
async def get_businesses(latitude: Optional[float] = None, longitude: Optional[float] = None, radius: Optional[float] = 10.0):
    # Simple query - in production, use geospatial indexing
    query = {"status": "active"}
    
    businesses = await db.businesses.find(query).to_list(100)
    
    # Convert ObjectId to string and calculate distance if location provided
    result = []
    for business in businesses:
        business["_id"] = str(business["_id"])
        if latitude and longitude:
            # Simple distance calculation (replace with proper geospatial query)
            lat_diff = abs(business["latitude"] - latitude)
            lng_diff = abs(business["longitude"] - longitude)
            distance = (lat_diff ** 2 + lng_diff ** 2) ** 0.5
            business["distance"] = round(distance * 111, 2)  # Rough conversion to km
        result.append(business)
    
    return result

@app.get("/api/businesses/my")
async def get_my_businesses(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "seller":
        raise HTTPException(status_code=403, detail="Only sellers can view their businesses")
    
    businesses = await db.businesses.find({"owner_id": current_user["user_id"]}).to_list(100)
    
    for business in businesses:
        business["_id"] = str(business["_id"])
    
    return businesses

# Product endpoints
@app.post("/api/businesses/{business_id}/products")
async def create_product(business_id: str, product: ProductCreate, current_user: dict = Depends(get_current_user)):
    # Check if user owns the business
    business = await db.businesses.find_one({"business_id": business_id, "owner_id": current_user["user_id"]})
    if not business:
        raise HTTPException(status_code=404, detail="Business not found or not owned by user")
    
    product_id = str(uuid.uuid4())
    product_doc = {
        "product_id": product_id,
        "business_id": business_id,
        **product.dict(),
        "created_at": datetime.utcnow(),
        "status": "active"
    }
    
    await db.products.insert_one(product_doc)
    
    return {"product_id": product_id, "message": "Product created successfully"}

@app.get("/api/businesses/{business_id}/products")
async def get_business_products(business_id: str):
    products = await db.products.find({"business_id": business_id, "status": "active"}).to_list(100)
    
    for product in products:
        product["_id"] = str(product["_id"])
    
    return products

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
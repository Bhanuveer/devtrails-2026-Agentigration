from pydantic import BaseModel
from typing import Optional

# Worker schemas
class WorkerRegister(BaseModel):
    name       : str
    phone      : str
    partner_id : str
    pincode    : str
    city       : str
    language   : str = "hindi"
    upi_id     : Optional[str] = None

class WorkerLogin(BaseModel):
    phone : str

class WorkerResponse(BaseModel):
    id          : int
    name        : str
    phone       : str
    pincode     : str
    trust_score : float
    class Config:
        from_attributes = True

# Policy schemas
class PolicyCreate(BaseModel):
    worker_id  : int
    plan_type  : str  # basic / standard / premium

class PolicyResponse(BaseModel):
    id               : int
    worker_id        : int
    plan_type        : str
    base_premium     : float
    final_premium    : float
    max_daily_payout : float
    is_active        : bool
    class Config:
        from_attributes = True

# Claim schemas
class ClaimResponse(BaseModel):
    id            : int
    worker_id     : int
    trigger_type  : str
    payout_amount : float
    status        : str
    reference_id  : Optional[str]
    class Config:
        from_attributes = True

# Premium calculation
class PremiumRequest(BaseModel):
    worker_id : int
    plan_type : str

class PremiumResponse(BaseModel):
    base_premium  : float
    final_premium : float
    zone_risk     : float
    breakdown     : dict
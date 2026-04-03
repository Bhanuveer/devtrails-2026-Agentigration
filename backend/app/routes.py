from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.ml_model import calculate_premium
from app.trigger import check_weather_trigger
import random
import string
from datetime import datetime

router = APIRouter()

# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "GigSure API"}


# ─────────────────────────────────────────
# WORKER REGISTRATION
# ─────────────────────────────────────────

@router.post("/worker/register", response_model=schemas.WorkerResponse)
def register_worker(worker: schemas.WorkerRegister, db: Session = Depends(get_db)):

    # Check if phone already exists
    existing = db.query(models.Worker).filter(
        models.Worker.phone == worker.phone
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    # Check if partner_id already exists
    existing_partner = db.query(models.Worker).filter(
        models.Worker.partner_id == worker.partner_id
    ).first()
    if existing_partner:
        raise HTTPException(status_code=400, detail="Partner ID already registered")

    new_worker = models.Worker(
        name       = worker.name,
        phone      = worker.phone,
        partner_id = worker.partner_id,
        pincode    = worker.pincode,
        city       = worker.city,
        language   = worker.language,
        upi_id     = worker.upi_id,
        trust_score= 40.0
    )
    db.add(new_worker)
    db.commit()
    db.refresh(new_worker)
    return new_worker


# ─────────────────────────────────────────
# WORKER LOGIN
# ─────────────────────────────────────────

@router.post("/worker/login")
def login_worker(data: schemas.WorkerLogin, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(
        models.Worker.phone == data.phone
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {
        "message"   : "Login successful",
        "worker_id" : worker.id,
        "name"      : worker.name,
        "pincode"   : worker.pincode,
        "city"      : worker.city,
        "trust_score": worker.trust_score
    }


# ─────────────────────────────────────────
# WORKER PROFILE
# ─────────────────────────────────────────

@router.get("/worker/{worker_id}")
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(
        models.Worker.id == worker_id
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


# ─────────────────────────────────────────
# PREMIUM CALCULATION
# ─────────────────────────────────────────

@router.post("/premium/calculate", response_model=schemas.PremiumResponse)
def calculate_worker_premium(
    data: schemas.PremiumRequest,
    db : Session = Depends(get_db)
):
    worker = db.query(models.Worker).filter(
        models.Worker.id == data.worker_id
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    result = calculate_premium(
        plan_type   = data.plan_type,
        pincode     = worker.pincode,
        trust_score = worker.trust_score,
        city        = worker.city
    )
    return result


# ─────────────────────────────────────────
# POLICY CREATION
# ─────────────────────────────────────────

@router.post("/policy/create", response_model=schemas.PolicyResponse)
def create_policy(
    data: schemas.PolicyCreate,
    db : Session = Depends(get_db)
):
    worker = db.query(models.Worker).filter(
        models.Worker.id == data.worker_id
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Deactivate old policies
    db.query(models.Policy).filter(
        models.Policy.worker_id == data.worker_id,
        models.Policy.is_active == True
    ).update({"is_active": False})

    # Calculate premium
    premium_result = calculate_premium(
        plan_type   = data.plan_type,
        pincode     = worker.pincode,
        trust_score = worker.trust_score,
        city        = worker.city
    )

    # Plan payout limits
    plan_payouts = {
        "basic"   : 300.0,
        "standard": 450.0,
        "premium" : 650.0
    }

    new_policy = models.Policy(
        worker_id        = data.worker_id,
        plan_type        = data.plan_type,
        base_premium     = premium_result["base_premium"],
        final_premium    = premium_result["final_premium"],
        max_daily_payout = plan_payouts.get(data.plan_type, 300.0),
        is_active        = True
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    return new_policy


# ─────────────────────────────────────────
# GET ACTIVE POLICY
# ─────────────────────────────────────────

@router.get("/policy/active/{worker_id}")
def get_active_policy(worker_id: int, db: Session = Depends(get_db)):
    policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id,
        models.Policy.is_active  == True
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found")
    return policy


# ─────────────────────────────────────────
# TRIGGER CHECK — AUTO CLAIM
# ─────────────────────────────────────────

@router.post("/trigger/check/{worker_id}")
def check_trigger(worker_id: int, db: Session = Depends(get_db)):

    worker = db.query(models.Worker).filter(
        models.Worker.id == worker_id
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id,
        models.Policy.is_active  == True
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy")

    # Check weather triggers
    trigger_result = check_weather_trigger(worker.pincode, worker.city)

    if not trigger_result["triggered"]:
        return {
            "triggered"    : False,
            "message"      : "No disruption detected in your zone",
            "weather_data" : trigger_result
        }

    # Duplicate claim check
    existing_claim = db.query(models.Claim).filter(
        models.Claim.worker_id    == worker_id,
        models.Claim.trigger_type == trigger_result["trigger_type"],
        models.Claim.status.in_(["approved", "paid", "pending"])
    ).first()

    if existing_claim:
        return {
            "triggered": False,
            "message"  : "Claim already filed for this disruption event"
        }

    # Generate reference ID
    ref_id = "GS-" + "".join(random.choices(string.digits, k=8))

    # Auto-create claim
    new_claim = models.Claim(
        worker_id     = worker_id,
        policy_id     = policy.id,
        trigger_type  = trigger_result["trigger_type"],
        trigger_value = trigger_result["trigger_value"],
        payout_amount = policy.max_daily_payout,
        status        = "approved",
        fraud_score   = 0.0,
        reference_id  = ref_id
    )
    db.add(new_claim)

    # Update trust score slightly
    worker.trust_score = min(100.0, worker.trust_score + 2.0)
    db.commit()
    db.refresh(new_claim)

    return {
        "triggered"    : True,
        "message"      : "Disruption detected! Claim auto-approved.",
        "claim"        : {
            "reference_id" : ref_id,
            "trigger_type" : trigger_result["trigger_type"],
            "trigger_value": trigger_result["trigger_value"],
            "payout_amount": policy.max_daily_payout,
            "status"       : "approved"
        }
    }


# ─────────────────────────────────────────
# GET CLAIM HISTORY
# ─────────────────────────────────────────

@router.get("/claims/{worker_id}")
def get_claims(worker_id: int, db: Session = Depends(get_db)):
    claims = db.query(models.Claim).filter(
        models.Claim.worker_id == worker_id
    ).order_by(models.Claim.created_at.desc()).all()
    return claims


# ─────────────────────────────────────────
# DASHBOARD SUMMARY
# ─────────────────────────────────────────

@router.get("/dashboard/{worker_id}")
def get_dashboard(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(
        models.Worker.id == worker_id
    ).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id,
        models.Policy.is_active  == True
    ).first()

    claims = db.query(models.Claim).filter(
        models.Claim.worker_id == worker_id
    ).all()

    total_saved = sum(c.payout_amount for c in claims if c.status in ["approved", "paid"])

    return {
        "worker"        : {
            "name"        : worker.name,
            "pincode"     : worker.pincode,
            "city"        : worker.city,
            "trust_score" : worker.trust_score
        },
        "policy"        : {
            "active"          : policy is not None,
            "plan_type"       : policy.plan_type if policy else None,
            "final_premium"   : policy.final_premium if policy else None,
            "max_daily_payout": policy.max_daily_payout if policy else None
        },
        "stats"         : {
            "total_claims"   : len(claims),
            "total_saved"    : total_saved,
            "approved_claims": len([c for c in claims if c.status == "approved"])
        }
    }


# ─────────────────────────────────────────
# PAYOUT SIMULATION
# ─────────────────────────────────────────

@router.post("/payout/simulate/{claim_id}")
def simulate_payout(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status == "paid":
        return {"message": "Already paid", "status": "paid"}

    fraud_check = {
        "mock_gps_flag"      : False,
        "cell_tower_match"   : True,
        "platform_login_ok"  : True,
        "cluster_normal"     : True,
        "fraud_score"        : 0.05,
        "verdict"            : "CLEAN"
    }
    # Simulate UPI payout
    import random, string
    upi_ref = "UPI" + "".join(random.choices(string.digits, k=10))

    claim.status      = "paid"
    claim.fraud_score = fraud_check["fraud_score"]
    db.commit()

    return {
        "success"     : True,
        "claim_id"    : claim_id,
        "payout_amount": claim.payout_amount,
        "upi_reference": upi_ref,
        "fraud_check" : fraud_check,
        "pipeline"    : [
            {"step": 1, "name": "Trigger Detected",        "status": "✅", "time": "2:30 PM"},
            {"step": 2, "name": "Policy Verified",          "status": "✅", "time": "2:31 PM"},
            {"step": 3, "name": "Fraud Check Passed",       "status": "✅", "time": "2:33 PM"},
            {"step": 4, "name": "Payout Calculated",        "status": "✅", "time": "2:34 PM"},
            {"step": 5, "name": "UPI Transfer Initiated",   "status": "✅", "time": "2:35 PM"},
            {"step": 6, "name": "Record Updated",           "status": "✅", "time": "2:36 PM"},
        ],
        "message": f"₹{claim.payout_amount} transferred via UPI. Ref: {upi_ref}"
    }
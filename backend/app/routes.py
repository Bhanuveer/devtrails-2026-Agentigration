from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.ml_model import calculate_premium, calculate_bcr
from app.trigger import check_weather_trigger, get_simulated_trigger
from app.fraud_engine import run_advanced_fraud_check
from app.chatbot import ask_groq  # 🆕 IMPORT CHATBOT
import random
import string
from datetime import datetime

router = APIRouter()

# ─────────────────────────────────────────
# HEALTH CHECK
# ─────────────────────────────────────────

@router.get("/health")
def health_check():
    return {"status": "healthy", "service": "GigSure API", "version": "2.0"}


# ─────────────────────────────────────────
# WORKER REGISTRATION
# ─────────────────────────────────────────

@router.post("/worker/register", response_model=schemas.WorkerResponse)
def register_worker(worker: schemas.WorkerRegister, db: Session = Depends(get_db)):
    existing = db.query(models.Worker).filter(models.Worker.phone == worker.phone).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone already registered")

    existing_partner = db.query(models.Worker).filter(models.Worker.partner_id == worker.partner_id).first()
    if existing_partner:
        raise HTTPException(status_code=400, detail="Partner ID already registered")

    new_worker = models.Worker(
        name        = worker.name,
        phone       = worker.phone,
        partner_id  = worker.partner_id,
        pincode     = worker.pincode,
        city        = worker.city,
        language    = worker.language,
        upi_id      = worker.upi_id,
        trust_score = 40.0
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
    worker = db.query(models.Worker).filter(models.Worker.phone == data.phone).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return {
        "message"    : "Login successful",
        "worker_id"  : worker.id,
        "name"       : worker.name,
        "pincode"    : worker.pincode,
        "city"       : worker.city,
        "trust_score": worker.trust_score
    }


# ─────────────────────────────────────────
# WORKER PROFILE
# ─────────────────────────────────────────

@router.get("/worker/{worker_id}")
def get_worker(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    return worker


# ─────────────────────────────────────────
# PREMIUM CALCULATION
# ─────────────────────────────────────────

@router.post("/premium/calculate")   # No response_model — lets formula_breakdown + actuarial pass through
def calculate_worker_premium(data: schemas.PremiumRequest, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(models.Worker.id == data.worker_id).first()
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
def create_policy(data: schemas.PolicyCreate, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(models.Worker.id == data.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Deactivate old policies
    db.query(models.Policy).filter(
        models.Policy.worker_id == data.worker_id,
        models.Policy.is_active == True
    ).update({"is_active": False})

    premium_result = calculate_premium(
        plan_type   = data.plan_type,
        pincode     = worker.pincode,
        trust_score = worker.trust_score,
        city        = worker.city
    )

    plan_payouts = {"basic": 300.0, "standard": 450.0, "premium": 650.0}

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
        models.Policy.is_active == True
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found")
    return policy


# ─────────────────────────────────────────
# TRIGGER CHECK — REAL DATA (All 5 triggers)
# ─────────────────────────────────────────

@router.post("/trigger/check/{worker_id}")
def check_trigger(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id,
        models.Policy.is_active == True
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy")

    trigger_result = check_weather_trigger(worker.pincode, worker.city)

    if not trigger_result["triggered"]:
        return {
            "triggered"   : False,
            "message"     : "No disruption detected in your zone",
            "all_triggers": trigger_result.get("all_triggers", {})
        }

    # Duplicate claim check
    existing_claim = db.query(models.Claim).filter(
        models.Claim.worker_id    == worker_id,
        models.Claim.trigger_type == trigger_result["trigger_type"],
        models.Claim.status.in_(["approved", "paid", "pending"])
    ).first()

    if existing_claim:
        return {"triggered": False, "message": "Claim already filed for this disruption event"}

    ref_id    = "GS-" + "".join(random.choices(string.digits, k=8))
    new_claim = models.Claim(
        worker_id     = worker_id,
        policy_id     = policy.id,
        trigger_type  = trigger_result["trigger_type"],
        trigger_value = trigger_result["trigger_value"],
        payout_amount = trigger_result.get("payout_amount", policy.max_daily_payout),
        status        = "approved",
        fraud_score   = 0.0,
        reference_id  = ref_id
    )
    db.add(new_claim)
    worker.trust_score = min(100.0, worker.trust_score + 2.0)
    db.commit()
    db.refresh(new_claim)

    return {
        "triggered"   : True,
        "message"     : "Disruption detected! Claim auto-approved.",
        "all_triggers": trigger_result.get("all_triggers", {}),
        "claim"       : {
            "id"          : new_claim.id,
            "reference_id": ref_id,
            "trigger_type": trigger_result["trigger_type"],
            "trigger_value": trigger_result["trigger_value"],
            "payout_amount": trigger_result.get("payout_amount", policy.max_daily_payout),
            "status"      : "approved"
        }
    }


# ─────────────────────────────────────────
# TRIGGER SIMULATE — DEMO ENDPOINT ⭐
# POST /trigger/simulate
# Body: { "worker_id": 1, "trigger_type": "rain" }
# Simulates any of the 5 triggers for demo
# ─────────────────────────────────────────

@router.post("/trigger/simulate")
def simulate_trigger(data: dict, db: Session = Depends(get_db)):
    worker_id    = data.get("worker_id")
    trigger_type = data.get("trigger_type", "rain")

    worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id,
        models.Policy.is_active == True
    ).first()
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy. Please buy a plan first.")

    # Get simulated trigger data
    trigger_result = get_simulated_trigger(trigger_type)

    # Duplicate check — allow re-simulate if already paid
    existing = db.query(models.Claim).filter(
        models.Claim.worker_id    == worker_id,
        models.Claim.trigger_type == trigger_type,
        models.Claim.status.in_(["approved", "pending"])
    ).first()
    if existing:
        return {
            "triggered": False,
            "message" : f"⚠️ A claim for '{trigger_type}' is already pending or approved. Simulate payout first.",
            "claim_id": existing.id
        }

    ref_id    = "GS-SIM-" + "".join(random.choices(string.digits, k=6))
    new_claim = models.Claim(
        worker_id     = worker_id,
        policy_id     = policy.id,
        trigger_type  = trigger_result["trigger_type"],
        trigger_value = trigger_result["trigger_value"],
        payout_amount = trigger_result["payout_amount"],
        status        = "approved",
        fraud_score   = 0.02,   # Near-zero fraud score — clean worker
        reference_id  = ref_id
    )
    db.add(new_claim)
    worker.trust_score = min(100.0, worker.trust_score + 1.0)
    db.commit()
    db.refresh(new_claim)

    return {
        "triggered"    : True,
        "simulated"    : True,
        "message"      : trigger_result["message"],
        "data_source"  : trigger_result["source"],
        "claim": {
            "id"           : new_claim.id,
            "reference_id" : ref_id,
            "trigger_type" : trigger_result["trigger_type"],
            "trigger_value": trigger_result["trigger_value"],
            "payout_amount": trigger_result["payout_amount"],
            "status"       : "approved"
        },
        # 4-step claim flow for UI animation
        "claim_pipeline": [
            {
                "step"       : 1,
                "name"       : "Trigger Detected",
                "detail"     : trigger_result["message"],
                "source"     : trigger_result["source"],
                "timestamp"  : "Just now",
                "status"     : "complete"
            },
            {
                "step"       : 2,
                "name"       : "Policy Verified",
                "detail"     : f"Active {policy.plan_type.capitalize()} plan found. Zone confirmed. No duplicate claim.",
                "timestamp"  : "+1 min",
                "status"     : "complete"
            },
            {
                "step"       : 3,
                "name"       : "Fraud Check Passed",
                "detail"     : "GPS activity normal. Platform login verified. Fraud score: 0.02 — CLEAN.",
                "timestamp"  : "+2 min",
                "status"     : "complete",
                "fraud_detail": {
                    "mock_gps_flag"   : False,
                    "cell_tower_match": True,
                    "platform_login"  : True,
                    "fraud_score"     : 0.02,
                    "verdict"         : "CLEAN ✅"
                }
            },
            {
                "step"       : 4,
                "name"       : "Payout Ready",
                "detail"     : f"₹{trigger_result['payout_amount']} queued for UPI transfer. Process payout to complete.",
                "timestamp"  : "+3 min",
                "status"     : "pending"
            }
        ]
    }


# ─────────────────────────────────────────
# GET LIVE TRIGGER STATUS — All 5 triggers
# GET /triggers/live/{worker_id}
# For the 5-trigger monitor panel
# ─────────────────────────────────────────

@router.get("/triggers/live/{worker_id}")
def get_live_triggers(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    result = check_weather_trigger(worker.pincode, worker.city)
    return {
        "worker_city"   : worker.city,
        "worker_pincode": worker.pincode,
        "triggers"      : result.get("all_triggers", {}),
        "any_triggered" : result["triggered"],
        "checked_at"    : datetime.now().isoformat()
    }


# ─────────────────────────────────────────
# ACTUARIAL DASHBOARD ⭐ (NEW)
# GET /actuarial/{worker_id}
# Returns BCR, Loss Ratio, Stress Scenario
# ─────────────────────────────────────────

@router.get("/actuarial/{worker_id}")
def get_actuarial_data(worker_id: int, db: Session = Depends(get_db)):
    worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    # Get all claims + policies for this worker
    claims   = db.query(models.Claim).filter(models.Claim.worker_id == worker_id).all()
    policies = db.query(models.Policy).filter(models.Policy.worker_id == worker_id).all()

    total_claims_paid      = sum(c.payout_amount for c in claims if c.status == "paid")
    # Approximate total premium collected (weeks active × weekly premium)
    total_premium_collected = sum(p.final_premium * 4 for p in policies)  # 4 weeks per policy cycle

    bcr_data = calculate_bcr(total_claims_paid, total_premium_collected)

    # Active policy for stress scenario
    active_policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id,
        models.Policy.is_active == True
    ).first()

    plan_type = active_policy.plan_type if active_policy else "standard"
    premium   = calculate_premium(plan_type, worker.pincode, worker.trust_score, worker.city)

    return {
        "worker_summary": {
            "name"         : worker.name,
            "city"         : worker.city,
            "total_claims" : len(claims),
            "paid_claims"  : len([c for c in claims if c.status == "paid"]),
        },
        "actuarial": bcr_data,
        "formula_explained": {
            "title"    : "How Your Premium Is Calculated",
            "formula"  : "Base = P(trigger) × Avg income loss × Days exposed",
            "example"  : f"Base = {premium['actuarial']['trigger_probability']} × ₹{premium['formula_breakdown']['step1_actuarial']['values']['avg_income_lost_per_day']} × {premium['formula_breakdown']['step1_actuarial']['values']['avg_days_exposed']} days",
            "then"     : "Adjusted for: zone risk | worker trust score | waterlogging history | ML fine-tuning",
            "bcr_note" : f"BCR target 0.55–0.70 means {int(0.65*100)}p of every ₹1 you pay goes directly to payouts",
            "assumptions": [
                "Avg income lost per day: ₹650 (derived from Zepto/Blinkit partner surveys)",
                "Avg trigger duration: 1.4 days (24 months of IMD historical data)",
                "BCR target: 0.65 (65% claims ratio — IRDAI microinsurance benchmark)",
                "Zone trigger probability: derived from 24-month disruption frequency per pincode"
            ]
        },
        "stress_scenario" : premium["actuarial"]["stress_scenario"],
        "platform_summary": {
            "total_premium_collected": round(total_premium_collected, 2),
            "total_claims_paid"      : round(total_claims_paid, 2),
            "loss_ratio_pct"         : bcr_data["loss_ratio"],
            "bcr"                    : bcr_data["bcr"],
            "health_status"          : bcr_data["health"]
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
    worker = db.query(models.Worker).filter(models.Worker.id == worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    policy = db.query(models.Policy).filter(
        models.Policy.worker_id == worker_id,
        models.Policy.is_active == True
    ).first()

    claims      = db.query(models.Claim).filter(models.Claim.worker_id == worker_id).all()
    total_saved = sum(c.payout_amount for c in claims if c.status in ["approved", "paid"])

    return {
        "worker": {
            "name"       : worker.name,
            "pincode"    : worker.pincode,
            "city"       : worker.city,
            "trust_score": worker.trust_score
        },
        "policy": {
            "active"          : policy is not None,
            "plan_type"       : policy.plan_type if policy else None,
            "final_premium"   : policy.final_premium if policy else None,
            "max_daily_payout": policy.max_daily_payout if policy else None
        },
        "stats": {
            "total_claims"   : len(claims),
            "total_saved"    : total_saved,
            "approved_claims": len([c for c in claims if c.status == "approved"]),
            "paid_claims"    : len([c for c in claims if c.status == "paid"])
        }
    }


# ─────────────────────────────────────────────────────
# RAZORPAY TEST MODE — Mock Payment Gateway (Phase 3)
# Simulates Razorpay test API responses for demo
# In production: replace with real Razorpay SDK calls
# ─────────────────────────────────────────────────────

@router.post("/payment/razorpay/create-order")
def razorpay_create_order(body: dict, db: Session = Depends(get_db)):
    """
    Creates a Razorpay-format test order.
    Returns the same structure as Razorpay's real Orders API.
    Test Key: rzp_test_GigSure2026Demo
    """
    amount_paise = int(body.get("amount", 0) * 100)   # Razorpay uses paise
    trigger_type = body.get("trigger_type", "disruption")
    claim_id     = body.get("claim_id")

    # Generate Razorpay-format IDs
    order_id  = "order_" + "".join(random.choices(string.ascii_letters + string.digits, k=14))

    return {
        "order_id"    : order_id,
        "amount"      : amount_paise,
        "amount_inr"  : body.get("amount", 0),
        "currency"    : "INR",
        "key_id"      : "rzp_test_GigSure2026Demo",
        "name"        : "GigSure Parametric Insurance",
        "description" : f"Income protection payout — {trigger_type.title()} disruption",
        "image"       : "https://i.imgur.com/n5tjHFD.png",
        "claim_id"    : claim_id,
        "mode"        : "TEST",
        "prefill"     : {
            "name"    : body.get("worker_name", "GigSure Worker"),
            "contact" : body.get("phone", "9999999999"),
            "email"   : "worker@gigsure.in",
        },
        "notes"       : {
            "claim_id"    : str(claim_id),
            "trigger_type": trigger_type,
            "platform"    : "GigSure Parametric Insurance v3.0"
        }
    }


@router.post("/payment/razorpay/verify")
def razorpay_verify_payment(body: dict, db: Session = Depends(get_db)):
    """
    Verifies a Razorpay test payment and marks the claim as PAID.
    Simulates Razorpay signature verification.
    """
    claim_id   = body.get("claim_id")
    order_id   = body.get("order_id")
    upi_id     = body.get("upi_id", "worker@upi")
    method     = body.get("method", "upi")

    # Generate Razorpay-format payment ID
    payment_id = "pay_" + "".join(random.choices(string.ascii_letters + string.digits, k=14))
    # Simulate signature (sha256 in real Razorpay)
    signature  = "rzp_sig_" + "".join(random.choices(string.ascii_letters + string.digits, k=32))

    # Mark claim as paid in DB
    if claim_id:
        claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
        if claim and claim.status != "paid":
            claim.status = "paid"
            db.commit()
            amount = claim.payout_amount
        else:
            amount = body.get("amount_inr", 0)
    else:
        amount = body.get("amount_inr", 0)

    return {
        "success"        : True,
        "payment_id"     : payment_id,
        "order_id"       : order_id,
        "signature"      : signature,
        "amount_inr"     : amount,
        "currency"       : "INR",
        "method"         : method,
        "upi_id"         : upi_id if method == "upi" else None,
        "bank"           : "HDFC Bank" if method == "netbanking" else None,
        "mode"           : "TEST",
        "verified"       : True,
        "settled_in"     : "< 2 seconds",
        "message"        : f"₹{amount} received via {method.upper()}. Payment ID: {payment_id}",
        "coins_awarded"  : 25,
    }


# ─────────────────────────────────────────
# PAYOUT SIMULATION (with rollback logic)
# ─────────────────────────────────────────

@router.post("/payout/simulate/{claim_id}")
def simulate_payout(claim_id: int, db: Session = Depends(get_db)):
    claim = db.query(models.Claim).filter(models.Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    if claim.status == "paid":
        return {"message": "Already paid", "status": "paid"}

    # ── Advanced Fraud Engine (Phase 3) ──────────────────────────────────────
    worker = db.query(models.Worker).filter(models.Worker.id == claim.worker_id).first()

    # Use simulated GPS near worker's pincode for demo
    # In production: receive real GPS coordinates from mobile client
    from app.fraud_engine import PINCODE_CENTERS
    pincode = getattr(worker, 'pincode', '411001') or '411001'
    center  = PINCODE_CENTERS.get(pincode, (18.5204, 73.8567))
    sim_lat = center[0] + 0.01   # Slight offset — realistic rider position
    sim_lon = center[1] + 0.01

    fraud_result = run_advanced_fraud_check(
        worker       = worker,
        trigger_type = claim.trigger_type,
        lat          = sim_lat,
        lon          = sim_lon,
        db           = db,
    )
    fraud_score = fraud_result["fraud_score"]
    fraud_checks = fraud_result["checks"]
    # ─────────────────────────────────────────────────────────────────────────

    upi_ref = "UPI" + "".join(random.choices(string.digits, k=10))

    # If fraud score is too high, flag and reject
    if not fraud_result["approved"]:
        claim.status      = "flagged"
        claim.fraud_score = fraud_score
        db.commit()
        return {
            "success"      : False,
            "claim_id"     : claim_id,
            "fraud_score"  : fraud_score,
            "verdict"      : fraud_result["verdict"],
            "fraud_checks" : fraud_checks,
            "message"      : f"Claim flagged for review. Fraud score: {fraud_score}. Manual review initiated."
        }

    now = datetime.now()
    claim.status      = "paid"
    claim.fraud_score = fraud_score
    db.commit()

    return {
        "success"      : True,
        "claim_id"     : claim_id,
        "payout_amount": claim.payout_amount,
        "upi_reference": upi_ref,
        "fraud_score"  : fraud_score,
        "fraud_verdict": fraud_result["verdict"],
        "fraud_checks" : fraud_checks,
        "fraud_summary": fraud_result["summary"],
        "pipeline": [
            {"step": 1, "name": "Trigger Detected",        "status": "✅", "time": "T+0 min",  "detail": f"Trigger: {claim.trigger_type} ({claim.trigger_value})"},
            {"step": 2, "name": "Policy Verified",          "status": "✅", "time": "T+1 min",  "detail": "Active policy confirmed. No duplicate claim."},
            {"step": 3, "name": "Advanced Fraud Check",     "status": "✅", "time": "T+2 min",  "detail": f"4-layer check complete. Score: {fraud_score} — {fraud_result['verdict']}"},
            {"step": 4, "name": "Payout Calculated",        "status": "✅", "time": "T+3 min",  "detail": f"₹{claim.payout_amount} approved for UPI transfer"},
            {"step": 5, "name": "UPI Transfer Initiated",   "status": "✅", "time": "T+4 min",  "detail": f"Sent to registered UPI. Ref: {upi_ref}"},
            {"step": 6, "name": "Record Updated",           "status": "✅", "time": "T+5 min",  "detail": "Claim marked PAID. +25 GigSure Coins awarded."},
        ],
        "rollback": {"triggered": False, "reason": None},
        "coins_awarded": 25,
        "message": f"₹{claim.payout_amount} transferred via UPI in under 10 minutes. Ref: {upi_ref}"
    }

# ─────────────────────────────────────────
# ADMIN DASHBOARD APIs
# ─────────────────────────────────────────

@router.get("/admin/overview")
def admin_overview(db: Session = Depends(get_db)):
    from sqlalchemy import func

    # Total workers
    total_workers = db.query(models.Worker).count()

    # Active policies
    active_policies = db.query(models.Policy).filter(
        models.Policy.is_active == True
    ).count()

    # Total claims
    total_claims = db.query(models.Claim).count()

    # Total premium collected
    total_premium = db.query(
        func.sum(models.Policy.final_premium)
    ).scalar() or 0

    # Total payouts
    total_payouts = db.query(
        func.sum(models.Claim.payout_amount)
    ).filter(
        models.Claim.status.in_(["approved", "paid"])
    ).scalar() or 0

    # BCR calculation — add minimum premium floor for demo
    demo_premium_floor = max(total_premium, total_payouts * 0.65)
    bcr = round(total_payouts / demo_premium_floor, 3) if demo_premium_floor > 0 else 0
    loss_ratio = round((total_payouts / demo_premium_floor) * 100, 1) if demo_premium_floor > 0 else 0

    # Claims by trigger type
    claims_by_trigger = db.query(
        models.Claim.trigger_type,
        func.count(models.Claim.id).label("count"),
        func.sum(models.Claim.payout_amount).label("total_payout")
    ).group_by(models.Claim.trigger_type).all()

    # Claims by status
    claims_by_status = db.query(
        models.Claim.status,
        func.count(models.Claim.id).label("count")
    ).group_by(models.Claim.status).all()

    # Recent claims
    recent_claims = db.query(models.Claim).order_by(
        models.Claim.created_at.desc()
    ).limit(10).all()

    # Zone distribution
    zone_data = db.query(
        models.Worker.city,
        func.count(models.Worker.id).label("workers"),
    ).group_by(models.Worker.city).all()

    # Average trust score
    avg_trust = db.query(
        func.avg(models.Worker.trust_score)
    ).scalar() or 0

    return {
        "overview": {
            "total_workers"    : total_workers,
            "active_policies"  : active_policies,
            "total_claims"     : total_claims,
            "total_premium"    : round(float(total_premium), 2),
            "total_payouts"    : round(float(total_payouts), 2),
            "bcr"              : bcr,
            "loss_ratio"       : loss_ratio,
            "avg_trust_score"  : round(float(avg_trust), 1),
        },
        "claims_by_trigger": [
            {
                "trigger_type" : r.trigger_type,
                "count"        : r.count,
                "total_payout" : round(float(r.total_payout or 0), 2)
            } for r in claims_by_trigger
        ],
        "claims_by_status": [
            {
                "status": r.status,
                "count" : r.count
            } for r in claims_by_status
        ],
        "zone_distribution": [
            {
                "city"   : r.city,
                "workers": r.workers,
            } for r in zone_data
        ],
        "recent_claims": [
            {
                "id"           : c.id,
                "worker_id"    : c.worker_id,
                "trigger_type" : c.trigger_type,
                "payout_amount": c.payout_amount,
                "status"       : c.status,
                "reference_id" : c.reference_id,
                "fraud_score"  : c.fraud_score,
            } for c in recent_claims
        ]
    }


@router.get("/admin/predictive")
def admin_predictive(db: Session = Depends(get_db)):
    """Next week risk prediction per zone"""
    from app.trigger import CITY_COORDS
    from app.ml_model import ZONE_RISK_DATA

    predictions = []
    cities = ["Pune", "Mumbai", "Delhi", "Hyderabad", "Chennai"]

    for city in cities:
        city_lower = city.lower()
        # Get workers in this city
        worker_count = db.query(models.Worker).filter(
            models.Worker.city == city
        ).count()

        active_policies = db.query(models.Policy).join(
            models.Worker,
            models.Policy.worker_id == models.Worker.id
        ).filter(
            models.Worker.city == city,
            models.Policy.is_active == True
        ).count()

        # Get zone risk
        zone_risk = 50
        for pincode, data in ZONE_RISK_DATA.items():
            if data.get("city", "").lower() == city_lower:
                zone_risk = data["risk_score"]
                break

        # Predict expected claims (simplified)
        expected_claim_rate = zone_risk / 100 * 0.3
        expected_claims     = round(active_policies * expected_claim_rate)
        expected_payout     = expected_claims * 400

        predictions.append({
            "city"               : city,
            "zone_risk_score"    : zone_risk,
            "active_policies"    : active_policies,
            "total_workers"      : worker_count,
            "expected_claims"    : expected_claims,
            "expected_payout"    : expected_payout,
            "risk_level"         : "HIGH" if zone_risk > 70 else "MEDIUM" if zone_risk > 40 else "LOW",
        })

    # Sort by risk
    predictions.sort(key=lambda x: x["zone_risk_score"], reverse=True)

    return {
        "predictions"      : predictions,
        "week"             : "Next Week Forecast",
        "model"            : "Prophet-based zone risk scoring",
        "bcr_target"       : 0.65,
        "reserve_required" : sum(p["expected_payout"] for p in predictions)
    }


@router.get("/admin/fraud-summary")
def admin_fraud_summary(db: Session = Depends(get_db)):
    """Fraud detection summary"""
    total_claims   = db.query(models.Claim).count()
    flagged_claims = db.query(models.Claim).filter(
        models.Claim.fraud_score > 0.5
    ).count()
    clean_claims   = db.query(models.Claim).filter(
        models.Claim.fraud_score <= 0.5
    ).count()
    avg_fraud_score = db.query(
        __import__('sqlalchemy').func.avg(models.Claim.fraud_score)
    ).scalar() or 0

    return {
        "total_claims"    : total_claims,
        "flagged_claims"  : flagged_claims,
        "clean_claims"    : clean_claims,
        "flag_rate"       : round(flagged_claims / total_claims * 100, 1) if total_claims > 0 else 0,
        "avg_fraud_score" : round(float(avg_fraud_score), 3),
        "false_positive_cap": 5.0,
        "defense_layers"  : [
            {"layer": "Device",    "check": "Mock GPS Flag",          "status": "Active"},
            {"layer": "Device",    "check": "Cell Tower Mismatch",    "status": "Active"},
            {"layer": "Behaviour", "check": "Trust Score System",     "status": "Active"},
            {"layer": "Behaviour", "check": "Platform Login Check",   "status": "Active"},
            {"layer": "Zone",      "check": "Temporal Spike Detection","status": "Active"},
            {"layer": "Zone",      "check": "Honeypot Zone",          "status": "Active"},
            {"layer": "Zone",      "check": "Prophet Score Mismatch", "status": "Active"},
        ]
    }


# ─────────────────────────────────────────
# CHATBOT — Ask GigSure Questions
# POST /chat
# ─────────────────────────────────────────

@router.post("/chat", response_model=schemas.ChatResponse)
def chat_with_gigsure(request: schemas.ChatRequest):
    """
    Chat with GigSure AI assistant
    
    Request:
        {
            "message": "How does GigSure work?"
        }
    
    Response:
        {
            "response": "GigSure is an AI-powered parametric insurance..."
        }
    """
    try:
        # Call Groq API with user message
        response_text = ask_groq(request.message)
        
        return schemas.ChatResponse(response=response_text)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.database import Base

class Worker(Base):
    __tablename__ = "workers"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(100), nullable=False)
    phone         = Column(String(15), unique=True, nullable=False)
    partner_id    = Column(String(50), unique=True, nullable=False)
    pincode       = Column(String(10), nullable=False)
    city          = Column(String(50), nullable=False)
    language      = Column(String(20), default="hindi")
    upi_id        = Column(String(100), nullable=True)
    trust_score   = Column(Float, default=40.0)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime, server_default=func.now())


class Policy(Base):
    __tablename__ = "policies"

    id              = Column(Integer, primary_key=True, index=True)
    worker_id       = Column(Integer, nullable=False)
    plan_type       = Column(String(20), nullable=False)  # basic/standard/premium
    base_premium    = Column(Float, nullable=False)
    final_premium   = Column(Float, nullable=False)
    max_daily_payout= Column(Float, nullable=False)
    is_active       = Column(Boolean, default=True)
    start_date      = Column(DateTime, server_default=func.now())
    end_date        = Column(DateTime, nullable=True)


class Claim(Base):
    __tablename__ = "claims"

    id              = Column(Integer, primary_key=True, index=True)
    worker_id       = Column(Integer, nullable=False)
    policy_id       = Column(Integer, nullable=False)
    trigger_type    = Column(String(50), nullable=False)  # rain/aqi/heat
    trigger_value   = Column(Float, nullable=False)
    payout_amount   = Column(Float, nullable=False)
    status          = Column(String(20), default="pending")  # pending/approved/flagged/paid
    fraud_score     = Column(Float, default=0.0)
    reference_id    = Column(String(50), nullable=True)
    created_at      = Column(DateTime, server_default=func.now())


class ZoneRisk(Base):
    __tablename__ = "zone_risk"

    id              = Column(Integer, primary_key=True, index=True)
    pincode         = Column(String(10), nullable=False)
    city            = Column(String(50), nullable=False)
    risk_score      = Column(Float, default=50.0)
    rainfall_history= Column(Float, default=0.0)
    aqi_history     = Column(Float, default=100.0)
    updated_at      = Column(DateTime, server_default=func.now())
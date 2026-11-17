from datetime import datetime
from sqlalchemy import String , Integer , DateTime , func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from ..database import Base
from typing import Optional, List




 
class Findings(Base):
     __tablename__ = "findings_table"
     id:Mapped[int]=mapped_column(Integer, primary_key=True , index=True )
     title:Mapped[str] = mapped_column(String(120), nullable=False)
     description:Mapped[str] = mapped_column(String(500), nullable=True)
     severity:Mapped[str] = mapped_column(String(50), nullable=False, default="medium")
     status:Mapped[str] = mapped_column(String(50), nullable=False, default="open")
     review_status:Mapped[str] = mapped_column(String(50), nullable=False, default="review_pending") # review_pending, reviewed_fixed
     owner_id:Mapped[str] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
     
     owner = relationship("User", back_populates="findings")
     
     
     

class UserRoles(Base):
 __tablename__ ="user_roles"
 id:Mapped[int]= mapped_column(Integer, primary_key=True , index=True )
 role_title:Mapped[str] = mapped_column(String(200), unique=True , nullable=False, index=True)
 users:Mapped[list["User"]] = relationship(back_populates="role")

 

class User(Base):
 __tablename__ = "users"
 id: Mapped[int] = mapped_column(Integer, primary_key=True , index=True)
 full_name: Mapped[str] = mapped_column(String(200), nullable=False)
 user_name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
 email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False , index = True)
 password: Mapped[str] = mapped_column(
             String(255),
             nullable=False
 )
 created_at: Mapped[datetime] = mapped_column(
 DateTime(timezone=True),
 server_default=func.now(),
 nullable=False
 )
 
 role_id:Mapped[Optional[int]]= mapped_column(Integer,
     ForeignKey("user_roles.id", ondelete="SET NULL"),
nullable=True,
index=True)

 role: Mapped[Optional["UserRoles"]] = relationship(back_populates="users")
 findings: Mapped[List["Findings"]] = relationship(back_populates="owner")
 
 
 
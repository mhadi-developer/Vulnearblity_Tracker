from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, Annotated
from sqlalchemy import select 


from ..database import get_db
from ..models.user import User, Findings
from ..routers.auth import get_current_user
from ..schema.user import FindingResponse, FindingCreate



router = APIRouter(
    prefix="/finding", tags=["Findings Routes"]
)




@router.post('/add/new' , response_model=FindingResponse, status_code= status.HTTP_201_CREATED)
async def add_new_finding(finding_data:FindingCreate , current_user:Annotated[User, Depends(get_current_user)], db:Annotated[AsyncSession, Depends(get_db)]):
    role_name = str(current_user["role"]).lower()
    if role_name  not in ['admin', 'analyst']:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="you are not authorize to perform this task"
        )
        
    new_finding = Findings(
        title = finding_data.title,
        description= finding_data.description,
        severity=finding_data.severity,
        status="open",
        review_status="review_pending",
        owner_id=finding_data.owner_id,
        )
    db.add(new_finding)
    await db.commit()
    await db.refresh(new_finding)
    
    return new_finding
# -----------------------------------------------------------
@router.get('/get/all')
async def get_all_findings(current_user:Annotated[User, Depends(get_current_user)], db:Annotated[AsyncSession , Depends(get_db)]):
    role = str(current_user["role"]).lower()
    
    results = await db.execute(select(Findings))
    findings = results.scalars().all()
    
    return findings
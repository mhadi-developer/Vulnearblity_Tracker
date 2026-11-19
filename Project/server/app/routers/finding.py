from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, Annotated
from sqlalchemy import select 


from ..database import get_db
from ..models.user import User, Findings
from ..routers.auth import get_current_user
from ..schema.user import FindingResponse, FindingCreate, StatusUpdateSchema



router = APIRouter(
    prefix="/finding", tags=["Findings Routes"]
)



VALID_TRANSITIONS = {
    "open": ["in_progress", "closed"],
    "in_progress": ["resolved", "open"],
    "resolved": ["closed", "in_progress"],
    "closed": ["open"],
}




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




# --------------------------------------------------------------------------------------------------
@router.patch('/{finding_id}/status' , status_code=status.HTTP_201_CREATED)
async def update_finding_status(finding_id:int , payload:StatusUpdateSchema , current_user: Annotated[User, Depends(get_current_user)], db: Annotated[AsyncSession, Depends(get_db)] ):
    statment = await db.execute(select(Findings).where(Findings.id == finding_id))
    finding = statment.scalars().first()
    
    if not finding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Finding not found."
        )
    user_id = current_user["id"]
    user_role = current_user["role"].lower()
    
    

    
    if user_role == 'developer' and finding.owner_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developers can only update status of findings assigned to them."
        )
    current_status = finding.status
    target_status = payload.status
    
    
    if target_status not in VALID_TRANSITIONS.get(current_status, []):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid transition from {current_status} to {target_status}."
        )
    finding.status = target_status
    await db.commit()
    db.refresh(finding)

    return {
        "message": "Status updated successfully",
        "id": finding.id,
        "status": finding.status,
        "review_status": finding.review_status
    }
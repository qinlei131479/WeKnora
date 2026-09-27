"""用户凭据路由"""

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from server.utils.auth_middleware import get_required_user
from yuxi.storage.minio import upload_image_to_minio
from yuxi.storage.postgres.models_business import User

user_router = APIRouter(prefix="/user", tags=["user"])

MAX_USER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024



@user_router.post("/upload-image", response_model=dict)
async def upload_user_image(file: UploadFile = File(...), current_user: User = Depends(get_required_user)):
    try:
        image_url = await upload_image_to_minio(
            file,
            object_prefix=f"images/{current_user.uid}",
            max_size_bytes=MAX_USER_IMAGE_SIZE_BYTES,
            too_large_message="图片大小不能超过 5MB",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"success": True, "image_url": image_url, "url": image_url}

"""
MinIO 存储客户端
简化的 MinIO 对象存储操作
"""

import asyncio
import json
import mimetypes
import os
from datetime import timedelta
from io import BytesIO
from urllib.parse import quote, urlsplit

from urllib3 import BaseHTTPResponse
from yuxi.config.env import env_value, running_in_docker
from yuxi.utils import logger

from minio import Minio
from minio.error import S3Error


class StorageError(Exception):
    """存储相关异常基类"""

    pass


class StorageUploadError(StorageError):
    """存储相关异常基类"""


class UploadResult:
    """简化的上传结果"""

    def __init__(self, url: str, bucket_name: str, object_name: str):
        self.url = url
        self.bucket_name = bucket_name
        self.object_name = object_name


def normalize_public_minio_url(value: str | None) -> str | None:
    if not value or value.startswith("/minio/public/"):
        return value
    try:
        parsed = urlsplit(value)
        if parsed.port != 9000 or not parsed.path.startswith("/public/"):
            return value
    except ValueError:
        return value
    public_base_url = (os.getenv("MINIO_PUBLIC_URL") or "/minio").rstrip("/")
    normalized = f"{public_base_url}{parsed.path}"
    if parsed.query:
        normalized = f"{normalized}?{parsed.query}"
    if parsed.fragment:
        normalized = f"{normalized}#{parsed.fragment}"
    return normalized


def harness_minio_bucket() -> str:
    """Harness 业务桶，与 WeKnora 的 MINIO_BUCKET_NAME 分开。"""
    return env_value("HARNESS_MINIO_BUCKET_NAME", default="agent-harness")


class _HarnessKBBuckets:
    """KB_BUCKETS 按环境变量解析，避免和 WeKnora 共用 weknora 桶。"""

    _KEYS = ("documents", "parsed", "images")

    def _mapping(self) -> dict[str, str]:
        name = harness_minio_bucket()
        return {key: name for key in self._KEYS}

    def __getitem__(self, key: str) -> str:
        return self._mapping()[key]

    def values(self):
        return self._mapping().values()

    def items(self):
        return self._mapping().items()

    def __contains__(self, key: object) -> bool:
        return key in self._KEYS


class MinIOClient:
    """
    简化的 MinIO 客户端类
    """

    PUBLIC_READ_BUCKETS = {"public"}
    KB_BUCKETS = _HarnessKBBuckets()

    def __init__(self):
        """初始化 MinIO 客户端"""
        self.endpoint = env_value("MINIO_URI", default="http://minio:9000")
        self.access_key = env_value("MINIO_ACCESS_KEY", "MINIO_ACCESS_KEY_ID", default="minioadmin")
        self.secret_key = env_value("MINIO_SECRET_KEY", "MINIO_SECRET_ACCESS_KEY", default="minioadmin")
        self.public_base_url = (os.getenv("MINIO_PUBLIC_URL") or "/minio").rstrip("/")
        self._client = None

        # 设置公开访问端点
        if running_in_docker():
            host_ip = (os.getenv("HOST_IP") or "").strip()
            if not host_ip:
                host_ip = "localhost"
            if "://" in host_ip:
                host_ip = host_ip.split("://")[-1]
            host_ip = host_ip.rstrip("/")
            self.public_endpoint = f"{host_ip}:9000"
            logger.debug(f"Docker MinIOClient public_endpoint: {self.public_endpoint}")
        else:
            self.public_endpoint = "localhost:9000"
            logger.debug(f"Default_client: {self.public_endpoint}")

    @property
    def client(self) -> Minio:
        """获取 MinIO 客户端实例"""
        if self._client is None:
            endpoint = self.endpoint
            if "://" in endpoint:
                endpoint = endpoint.split("://")[-1]

            secure = self.endpoint.startswith("https://") or env_value("MINIO_USE_SSL").lower() in {
                "1",
                "true",
                "yes",
                "on",
            }
            self._client = Minio(
                endpoint=endpoint, access_key=self.access_key, secret_key=self.secret_key, secure=secure
            )
        return self._client

    def ensure_bucket_exists(self, bucket_name: str) -> bool:
        """确保存储桶存在"""
        try:
            created = False
            if not self.client.bucket_exists(bucket_name=bucket_name):
                self.client.make_bucket(bucket_name=bucket_name)
                created = True
                logger.info(f"存储桶 '{bucket_name}' 已创建")

            self._ensure_public_read_access(bucket_name)

            if created and bucket_name in self.PUBLIC_READ_BUCKETS:
                logger.info(f"存储桶 '{bucket_name}' 已配置为公开可读")

            return True
        except S3Error as e:
            logger.error(f"存储桶 '{bucket_name}' 错误: {e}")
            raise StorageError(f"Error with bucket '{bucket_name}': {e}")
        except StorageError:
            raise

    def upload_file(
        self, bucket_name: str, object_name: str, data: bytes, content_type: str | None = None
    ) -> UploadResult:
        """上传文件到 MinIO"""
        try:
            self.ensure_bucket_exists(bucket_name=bucket_name)

            resolved_content_type = content_type or self._guess_content_type(object_name)
            data_stream = BytesIO(data)
            result = self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=data_stream,
                length=len(data),
                content_type=resolved_content_type,
            )

            assert result is not None
            if bucket_name in self.PUBLIC_READ_BUCKETS:
                url = f"{self.public_base_url}/{bucket_name}/{quote(object_name, safe='/')}"
            else:
                url = f"http://{self.public_endpoint}/{bucket_name}/{object_name}"

            return UploadResult(url, bucket_name, object_name)

        except S3Error as e:
            error_msg = f"上传文件 '{object_name}' 失败: {e}"
            logger.error(error_msg)
            raise StorageError(error_msg)

    async def aupload_file(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str | None = None,
    ) -> UploadResult:
        result = await asyncio.to_thread(
            self.upload_file, bucket_name=bucket_name, object_name=object_name, data=data, content_type=content_type
        )
        return result

    def _guess_content_type(self, object_name: str) -> str:
        """根据文件名猜测 MIME 类型"""
        guessed_type, _ = mimetypes.guess_type(object_name)
        if guessed_type:
            return guessed_type

        ext = object_name.split(".")[-1].lower()
        content_types = {
            "md": "text/markdown",
            "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "xls": "application/vnd.ms-excel",
            "zip": "application/zip",
            "webp": "image/webp",
            "bmp": "image/bmp",
            "tif": "image/tiff",
            "tiff": "image/tiff",
        }
        return content_types.get(ext, "application/octet-stream")

    def download_file(self, bucket_name: str, object_name: str) -> bytes:
        """下载文件"""
        try:
            response = self.client.get_object(bucket_name=bucket_name, object_name=object_name)
            data = response.read()
            response.close()
            logger.info(f"成功下载 '{object_name}' 从存储桶 '{bucket_name}'")
            return data

        except S3Error as e:
            if e.code == "NoSuchKey":
                raise StorageError(f"对象 '{object_name}' 在存储桶 '{bucket_name}' 中不存在")
            raise StorageError(f"下载文件失败: {e}")

    async def adownload_response(self, bucket_name: str, object_name: str) -> BaseHTTPResponse:
        """异步下载文件"""
        try:
            response = await asyncio.to_thread(
                self.client.get_object,
                bucket_name=bucket_name,
                object_name=object_name,
            )
            return response

        except S3Error as e:
            if e.code == "NoSuchKey":
                raise StorageError(f"对象 '{object_name}' 在存储桶 '{bucket_name}' 中不存在")
            raise StorageError(f"下载文件失败: {e}")

    async def adownload_file(self, bucket_name: str, object_name: str) -> bytes:
        """异步下载文件"""
        try:
            response = await asyncio.to_thread(self.client.get_object, bucket_name=bucket_name, object_name=object_name)
            data = await asyncio.to_thread(response.read)
            response.close()
            logger.info(f"成功下载 '{object_name}' 从存储桶 '{bucket_name}'")
            return data

        except S3Error as e:
            if e.code == "NoSuchKey":
                raise StorageError(f"对象 '{object_name}' 在存储桶 '{bucket_name}' 中不存在")
            raise StorageError(f"下载文件失败: {e}")

    def get_presigned_url(self, bucket_name: str, object_name: str, days=7) -> str:
        """将minio放在内网访问，外部通过返回代理链接访问"""
        res_url = self.client.get_presigned_url(
            method="GET", bucket_name=bucket_name, object_name=object_name, expires=timedelta(days=days)
        )
        return res_url

    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """删除文件"""
        try:
            self.client.remove_object(bucket_name=bucket_name, object_name=object_name)
            logger.info(f"成功删除 '{object_name}' 从存储桶 '{bucket_name}'")
            return True

        except S3Error as e:
            if e.code == "NoSuchKey":
                logger.warning(f"要删除的对象 '{object_name}' 不存在")
                return False
            raise StorageError(f"删除文件失败: {e}")

    async def adelete_file(self, bucket_name: str, object_name: str) -> bool:
        """删除文件"""
        result = await asyncio.to_thread(
            self.delete_file,
            bucket_name=bucket_name,
            object_name=object_name,
        )
        return result

    async def adelete_objects_by_prefix(self, bucket_name: str, prefix: str) -> int:
        """
        按前缀删除对象

        Args:
            bucket_name: bucket 名称
            prefix: 对象前缀

        Returns:
            删除的对象数量
        """
        deleted_count = 0

        def _delete_objects():
            nonlocal deleted_count
            try:
                objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)
                for obj in objects:
                    try:
                        self.client.remove_object(bucket_name, obj.object_name)
                        deleted_count += 1
                    except S3Error as e:
                        logger.warning(f"Failed to delete {bucket_name}/{obj.object_name}: {e}")
            except S3Error as e:
                logger.warning(f"Failed to list objects in {bucket_name}/{prefix}: {e}")

        await asyncio.to_thread(_delete_objects)
        return deleted_count

    def stat_file(self, bucket_name: str, object_name: str) -> int | None:
        """获取文件大小（字节），文件不存在时返回 None"""
        try:
            stat = self.client.stat_object(bucket_name=bucket_name, object_name=object_name)
            return stat.size
        except S3Error as e:
            if e.code == "NoSuchKey":
                return None
            raise StorageError(f"获取文件信息失败: {e}")

    async def astat_file(self, bucket_name: str, object_name: str) -> int | None:
        """异步获取文件大小（字节），文件不存在时返回 None"""
        return await asyncio.to_thread(self.stat_file, bucket_name, object_name)

    def _ensure_public_read_access(self, bucket_name: str) -> None:
        """设置存储桶策略，允许公开读取对象"""
        if bucket_name not in self.PUBLIC_READ_BUCKETS:
            return

        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{bucket_name}/*"],
                },
            ],
        }

        try:
            self.client.set_bucket_policy(bucket_name=bucket_name, policy=json.dumps(policy))
        except S3Error as e:
            logger.warning(f"设置存储桶 '{bucket_name}' 公共读取策略失败: {e}")
            raise StorageError(f"无法设置存储桶公共访问策略: {e}")

# 全局客户端实例
_default_client = None


def get_minio_client() -> MinIOClient:
    """获取 MinIO 客户端实例"""
    global _default_client
    if _default_client is None:
        _default_client = MinIOClient()
    return _default_client


async def aupload_file_to_minio(bucket_name: str, file_name: str, data: bytes) -> str:
    """
    通过字节上传文件到 MinIO 的异步接口，并返回资源 URL。
    MIME 类型由 MinIO 客户端内部根据 object_name 自动推断。

    Args:
        bucket_name: bucket_name
        file_name : filename
        data: 文件字节流
    Returns:
        str: 文件访问 URL
    """
    client = get_minio_client()
    upload_result = await client.aupload_file(bucket_name, file_name, data)
    return upload_result.url

#!/bin/bash
# Pull a Docker image via DaoCloud mirror, then retag to the original name.
# Usage: scripts/pull_image.sh <image:tag>

if [ $# -ne 1 ]; then
    echo "Usage: $0 <image:tag>"
    exit 1
fi

set -e

IMAGE_TAG="$1"
SLASH_COUNT=$(echo "$IMAGE_TAG" | tr -cd '/' | wc -c | tr -d ' ')

if [ "$SLASH_COUNT" -eq 0 ]; then
    MIRROR_URL="m.daocloud.io/docker.io/library"
elif [ "$SLASH_COUNT" -eq 1 ]; then
    MIRROR_URL="m.daocloud.io/docker.io"
else
    MIRROR_URL="m.daocloud.io"
fi

echo "Pulling image from mirror: $MIRROR_URL/$IMAGE_TAG"
docker pull "$MIRROR_URL/$IMAGE_TAG"
docker tag "$MIRROR_URL/$IMAGE_TAG" "$IMAGE_TAG"
docker rmi "$MIRROR_URL/$IMAGE_TAG"

echo "Process completed successfully!"

#!/bin/bash

# Docker 镜像构建和发布脚本
# 用法: ./build-docker.sh [版本号]
# 示例: ./build-docker.sh v1.0.0

set -e

# Docker Hub 用户名
DOCKER_USERNAME="liangdiandian"
IMAGE_NAME="ech0"

# 获取版本号
VERSION=${1:-"latest"}

echo "🚀 开始构建 Docker 镜像..."
echo "📦 镜像: ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

# 构建镜像（支持 amd64 和 arm64）
echo "🔨 构建多架构镜像..."
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -f Dockerfile.local \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION} \
  -t ${DOCKER_USERNAME}/${IMAGE_NAME}:latest \
  --push \
  .

echo "✅ 构建完成！"
echo ""
echo "📥 拉取镜像:"
echo "   docker pull ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo ""
echo "🏃 运行容器:"
echo "   docker run -d --name ech0 -p 6277:6277 -v ./data:/app/data ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"

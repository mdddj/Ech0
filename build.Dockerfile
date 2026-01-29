# =================== 前端构建阶段 ===================
FROM node:22-alpine AS frontend-builder

WORKDIR /web

COPY web/package.json web/pnpm-lock.yaml ./

# 启用 corepack 并使用项目声明的 pnpm 版本
RUN corepack enable

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制前端源代码
COPY web/ .

# 构建前端（跳过类型检查）
RUN pnpm run build-only --mode production

# =================== 后端构建阶段 ===================
FROM golang:1.25.1-alpine AS backend-builder

# 安装必要的工具
RUN apk add --no-cache git ca-certificates tzdata gcc musl-dev

WORKDIR /app

# 复制go mod文件
COPY go.mod go.sum ./

# 下载依赖
RUN go mod download

# 复制源代码
COPY . .
COPY --from=frontend-builder /template/dist /app/template/dist

ARG TARGETOS
ARG TARGETARCH

# 构建后端二进制文件
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
    -ldflags="-w -s" \
    -o ech0 ./main.go

# =================== 最终镜像 ===================
FROM alpine:latest

ENV TZ=Asia/Shanghai

# 从后端构建阶段复制二进制文件到临时位置
COPY --from=backend-builder /app/ech0 /tmp/ech0

# 创建必要的目录
RUN mkdir -p /app/data /app/backup /app/template

# 移动二进制文件到 /app
RUN mv /tmp/ech0 /app/ech0 && chmod +x /app/ech0

# 设置工作目录
WORKDIR /app

# 暴露端口
EXPOSE 6277
EXPOSE 6278

# 启动命令
ENTRYPOINT ["/app/ech0"]
CMD ["serve"]
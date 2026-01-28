# Docker CI/CD 配置指南

## 功能说明

当你推送一个 tag（例如 `v3.1.2`）到 GitHub 时，GitHub Actions 会自动：

1. 构建 Docker 镜像（支持 linux/amd64 和 linux/arm64）
2. 推送到 Docker Hub：
   - `liangdiandian/ech0:3.1.2`（版本号标签）
   - `liangdiandian/ech0:latest`（最新标签）

## 配置步骤

### 1. 获取 Docker Hub Access Token

1. 登录 [Docker Hub](https://hub.docker.com/)
2. 点击右上角头像 → **Account Settings**
3. 选择 **Security** → **New Access Token**
4. 输入 Token 名称（例如：`github-actions`）
5. 选择权限：**Read, Write, Delete**
6. 点击 **Generate**
7. **复制生成的 Token**（只显示一次，请妥善保存）

### 2. 配置 GitHub Secrets

1. 打开你的 GitHub 仓库
2. 进入 **Settings** → **Secrets and variables** → **Actions**
3. 点击 **New repository secret**
4. 添加以下两个 secrets：

#### Secret 1: DOCKERHUB_USERNAME
- **Name**: `DOCKERHUB_USERNAME`
- **Value**: `liangdiandian`

#### Secret 2: DOCKERHUB_TOKEN
- **Name**: `DOCKERHUB_TOKEN`
- **Value**: 粘贴你在步骤 1 中复制的 Access Token

### 3. 使用方法

#### 方式一：通过 Git 命令打 tag

```bash
# 1. 确保代码已提交
git add .
git commit -m "feat: 新功能描述"

# 2. 创建并推送 tag
git tag v3.1.2
git push origin v3.1.2

# 或者一次性推送代码和 tag
git push origin main --tags
```

#### 方式二：通过 GitHub 网页创建 Release

1. 进入仓库的 **Releases** 页面
2. 点击 **Draft a new release**
3. 点击 **Choose a tag** → 输入新版本号（例如 `v3.1.2`）
4. 填写 Release 标题和描述
5. 点击 **Publish release**

### 4. 查看构建进度

1. 进入仓库的 **Actions** 标签页
2. 找到 **Build and Push Docker Image** 工作流
3. 点击查看构建日志

### 5. 验证镜像

构建完成后，可以拉取镜像验证：

```bash
# 拉取指定版本
docker pull liangdiandian/ech0:3.1.2

# 拉取最新版本
docker pull liangdiandian/ech0:latest

# 查看镜像信息
docker images | grep liangdiandian/ech0
```

## 工作流文件说明

工作流文件位于：`.github/workflows/docker-publish.yml`

### 主要特性

- ✅ 自动触发：推送 `v*` 格式的 tag 时自动运行
- ✅ 多架构支持：同时构建 linux/amd64 和 linux/arm64
- ✅ 缓存优化：使用 GitHub Actions 缓存加速构建
- ✅ 双标签：同时推送版本号标签和 latest 标签
- ✅ 版本提取：自动从 tag 中提取版本号（v3.1.2 → 3.1.2）

### 构建时间

- 首次构建：约 3-5 分钟
- 后续构建（有缓存）：约 2-3 分钟

## 常见问题

### Q1: 构建失败，提示 "denied: requested access to the resource is denied"

**原因**：Docker Hub 认证失败

**解决方法**：
1. 检查 `DOCKERHUB_USERNAME` 是否正确
2. 检查 `DOCKERHUB_TOKEN` 是否有效
3. 重新生成 Access Token 并更新 Secret

### Q2: 如何删除已推送的 tag？

```bash
# 删除本地 tag
git tag -d v3.1.2

# 删除远程 tag
git push origin :refs/tags/v3.1.2
```

### Q3: 如何修改 Docker 镜像名称？

编辑 `.github/workflows/docker-publish.yml` 文件，修改 `tags` 部分：

```yaml
tags: |
  你的用户名/你的镜像名:${{ steps.meta.outputs.version }}
  你的用户名/你的镜像名:latest
```

### Q4: 如何只构建单一架构？

修改 `platforms` 参数：

```yaml
# 只构建 amd64
platforms: linux/amd64

# 只构建 arm64
platforms: linux/arm64
```

## 版本号规范

建议使用语义化版本号（Semantic Versioning）：

- **主版本号**：不兼容的 API 修改（例如：v1.0.0 → v2.0.0）
- **次版本号**：向下兼容的功能性新增（例如：v3.1.0 → v3.2.0）
- **修订号**：向下兼容的问题修正（例如：v3.1.1 → v3.1.2）

示例：
- `v3.1.2` - 修复 bug
- `v3.2.0` - 新增功能
- `v4.0.0` - 重大更新

## 下一步

配置完成后，你可以：

1. 推送一个测试 tag 验证工作流：
   ```bash
   git tag v3.1.2-test
   git push origin v3.1.2-test
   ```

2. 在 GitHub Actions 中查看构建进度

3. 验证镜像是否成功推送到 Docker Hub

4. 如果测试成功，删除测试 tag：
   ```bash
   git tag -d v3.1.2-test
   git push origin :refs/tags/v3.1.2-test
   ```

## 相关链接

- [Docker Hub](https://hub.docker.com/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Docker Buildx 文档](https://docs.docker.com/buildx/working-with-buildx/)
- [语义化版本规范](https://semver.org/lang/zh-CN/)

# 快速开始：使用 GitHub Actions 自动发布 Docker 镜像

## 🚀 一分钟配置

### 1️⃣ 配置 Docker Hub Secrets

在 GitHub 仓库中添加两个 Secrets：

1. 进入：**Settings** → **Secrets and variables** → **Actions**
2. 添加 Secret：
   - **Name**: `DOCKERHUB_USERNAME`，**Value**: `liangdiandian`
   - **Name**: `DOCKERHUB_TOKEN`，**Value**: 你的 Docker Hub Access Token

> 💡 如何获取 Access Token？
> 1. 登录 [Docker Hub](https://hub.docker.com/)
> 2. **Account Settings** → **Security** → **New Access Token**
> 3. 权限选择：**Read, Write, Delete**
> 4. 复制生成的 Token

### 2️⃣ 发布新版本

```bash
# 方式一：命令行发布
git tag v3.1.2
git push origin v3.1.2

# 方式二：GitHub 网页发布
# 进入 Releases → Draft a new release → 输入 tag → Publish
```

### 3️⃣ 等待构建完成

- 进入 **Actions** 标签页查看构建进度
- 构建时间：约 3-5 分钟
- 构建完成后自动推送到：
  - `liangdiandian/ech0:3.1.2`
  - `liangdiandian/ech0:latest`

## ✅ 完成！

现在每次打 tag 都会自动构建并推送 Docker 镜像，不需要在本地慢慢上传了！

---

📖 详细文档请查看：[DOCKER_CI_SETUP.md](./DOCKER_CI_SETUP.md)

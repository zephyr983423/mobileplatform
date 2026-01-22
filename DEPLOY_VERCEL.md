# 部署到 Vercel 平台教程

本教程将指导你如何将手机售后服务管理系统部署到 Vercel 平台。

## 目录

1. [前置准备](#前置准备)
2. [准备数据库](#准备数据库)
3. [推送代码到 GitHub](#推送代码到-github)
4. [部署到 Vercel](#部署到-vercel)
5. [配置环境变量](#配置环境变量)
6. [初始化数据库](#初始化数据库)
7. [验证部署](#验证部署)
8. [常见问题](#常见问题)

---

## 前置准备

在开始之前，请确保你已经准备好以下内容：

- [ ] GitHub 账号
- [ ] Vercel 账号（可使用 GitHub 登录）
- [ ] PostgreSQL 数据库（推荐使用 Vercel Postgres、Supabase 或 Neon）

---

## 准备数据库

由于本项目使用 PostgreSQL + Prisma，你需要一个云端 PostgreSQL 数据库。

### 方案一：使用 Vercel Postgres（推荐）

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目（或先创建项目）
3. 点击 **Storage** 标签
4. 选择 **Create Database** → **Postgres**
5. 按提示完成创建，Vercel 会自动配置环境变量

### 方案二：使用 Supabase（免费额度更大）

1. 访问 [Supabase](https://supabase.com/) 并注册账号
2. 创建新项目，设置数据库密码
3. 进入 **Settings** → **Database**
4. 复制 **Connection string (URI)**，格式如下：
   ```
   postgresql://postgres:[密码]@db.[项目ID].supabase.co:5432/postgres
   ```

### 方案三：使用 Neon（冷启动快）

1. 访问 [Neon](https://neon.tech/) 并注册账号
2. 创建新项目
3. 复制数据库连接字符串

---

## 推送代码到 GitHub

### 步骤 1：创建 GitHub 仓库

1. 登录 [GitHub](https://github.com/)
2. 点击右上角 **+** → **New repository**
3. 填写仓库名称，例如 `mobile-aftersales`
4. 选择 **Private**（推荐）或 **Public**
5. 点击 **Create repository**

### 步骤 2：推送本地代码

在项目根目录执行以下命令：

```bash
# 如果还没有初始化 git
git init

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/你的用户名/mobile-aftersales.git
https://github.com/zephyr983423/mobileplatform.git

# 确保 .gitignore 包含敏感文件
# 检查是否已忽略 .env 文件
cat .gitignore | grep .env

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Mobile after-sales service system"

# 推送到 GitHub
git push -u origin master
```

### 步骤 3：确认敏感信息未上传

确保以下文件**不会**被推送到 GitHub：

- `.env`
- `.env.local`
- `node_modules/`
- `.next/`

---

## 部署到 Vercel

### 步骤 1：导入项目

1. 访问 [Vercel](https://vercel.com/) 并登录
2. 点击 **Add New...** → **Project**
3. 在 **Import Git Repository** 中找到你的仓库
4. 点击 **Import**

### 步骤 2：配置项目设置

在配置页面：

| 设置项 | 值 |
|-------|-----|
| Framework Preset | Next.js |
| Root Directory | `./` (默认) |
| Build Command | `prisma generate && next build` |
| Output Directory | `.next` (默认) |
| Install Command | `npm install` (默认) |

### 步骤 3：配置环境变量

在 **Environment Variables** 部分添加以下变量：

```env
# 数据库连接（必填）
DATABASE_URL=postgresql://用户名:密码@主机:5432/数据库名

# NextAuth 配置（必填）
NEXTAUTH_SECRET=你的随机密钥（至少32位）
NEXTAUTH_URL=https://你的项目名.vercel.app

# 可选：如果使用 Prisma 加速
# DIRECT_URL=postgresql://...
```

**生成 NEXTAUTH_SECRET 的方法：**

```bash
# macOS / Linux
openssl rand -base64 32

# 或使用 Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 步骤 4：部署

1. 确认所有环境变量已填写
2. 点击 **Deploy**
3. 等待构建完成（通常需要 2-5 分钟）

---

## 初始化数据库

部署完成后，需要初始化数据库结构和种子数据。

### 方法一：使用 Vercel CLI（推荐）

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 链接项目
vercel link

# 拉取环境变量到本地
vercel env pull .env.local

# 执行数据库迁移
npx prisma db push

# 运行种子数据（可选，添加测试数据）
npx prisma db seed
```

### 方法二：直接在本地执行

1. 创建 `.env.local` 文件，填入生产环境的 `DATABASE_URL`
2. 执行迁移：

```bash
# 同步数据库结构
npx prisma db push

# 生成 Prisma Client
npx prisma generate

# 填充测试数据（可选）
npx prisma db seed
```

### 方法三：使用 Vercel 函数触发

你也可以创建一个 API 路由来执行迁移（仅建议首次使用）。

---

## 验证部署

### 步骤 1：访问网站

部署成功后，Vercel 会提供一个 URL，格式如：
```
https://你的项目名.vercel.app
```

### 步骤 2：测试登录

如果你运行了种子数据，可以使用以下测试账号：

| 角色 | 用户名 | 密码 |
|-----|--------|------|
| 管理员 | boss | password123 |
| 员工 | staff1 | password123 |
| 客户 | customer1 | password123 |

### 步骤 3：检查功能

- [ ] 登录页面正常显示
- [ ] 登录功能正常
- [ ] 根据角色正确跳转到对应页面
- [ ] API 接口正常响应

---

## 配置自定义域名（可选）

1. 在 Vercel 项目设置中，进入 **Domains**
2. 添加你的域名，例如 `aftersales.yourdomain.com`
3. 按照提示配置 DNS 记录：
   - **A 记录**: `76.76.19.19`
   - **CNAME 记录**: `cname.vercel-dns.com`
4. 等待 DNS 生效（通常几分钟到 48 小时）
5. **重要**：更新环境变量中的 `NEXTAUTH_URL` 为新域名

---

## 常见问题

### Q1: 构建失败，提示 Prisma 相关错误

**解决方案**：确保 Build Command 为：
```
prisma generate && next build
```

### Q2: 登录后跳转到错误页面

**解决方案**：
1. 检查 `NEXTAUTH_URL` 是否正确设置
2. 确保 URL 包含 `https://` 前缀
3. 不要在 URL 末尾加 `/`

### Q3: 数据库连接失败

**解决方案**：
1. 确认 `DATABASE_URL` 格式正确
2. 检查数据库是否允许外部连接
3. 如果使用 Supabase，确保使用 **Connection pooling** 地址

### Q4: 部署成功但页面空白

**解决方案**：
1. 检查浏览器控制台错误
2. 查看 Vercel 的 **Functions** 日志
3. 确保所有环境变量都已设置

### Q5: 如何更新部署？

只需推送代码到 GitHub，Vercel 会自动重新部署：
```bash
git add .
git commit -m "Update: 你的更新说明"
git push
```

---

## 环境变量完整列表

| 变量名 | 必填 | 说明 |
|-------|-----|------|
| `DATABASE_URL` | 是 | PostgreSQL 连接字符串 |
| `NEXTAUTH_SECRET` | 是 | NextAuth 加密密钥 |
| `NEXTAUTH_URL` | 是 | 网站完整 URL |

---

## 部署架构图

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   GitHub Repo   │────▶│     Vercel      │────▶│   PostgreSQL    │
│                 │     │   (Next.js)     │     │   (Database)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │ Push                  │ Auto Deploy
        ▼                       ▼
   代码更新后              自动构建并部署
   自动触发部署            新版本上线
```

---

## 下一步

部署完成后，你可以：

1. **配置自定义域名** - 使用自己的域名
2. **设置监控告警** - 在 Vercel 中配置
3. **优化性能** - 启用 Vercel Analytics
4. **配置 CI/CD** - 添加自动化测试

---

如有问题，请查阅：
- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [Prisma 部署指南](https://www.prisma.io/docs/guides/deployment)

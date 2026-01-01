#!/bin/bash

# 确保在 git 仓库根目录执行
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# 检查是否在 git 仓库中
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "错误: 当前目录不是 git 仓库"
    exit 1
fi

# 检查是否有未提交的更改
if ! git diff-index --quiet HEAD --; then
    echo "错误: 仓库存在未提交的更改，请先提交或暂存更改"
    git status
    exit 1
fi

# 保存当前分支名称
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支: $CURRENT_BRANCH"

# 执行 Python 脚本更新页面
echo "正在构建文档..."
python3 ./website/scripts/build_docs.py ./website/docs ./website/html/docs

if [ $? -ne 0 ]; then
    echo "错误: 文档构建失败"
    exit 1
fi

echo "文档构建成功"

# 创建临时目录用于存储 html 内容
TMP_DIR=$(mktemp -d)
echo "临时目录: $TMP_DIR"

# 复制 html 内容到临时目录
cp -r ./website/html/* "$TMP_DIR/"

# 切换到 gh-pages 分支
echo "正在切换到 gh-pages 分支..."
if git show-ref --verify --quiet refs/heads/gh-pages; then
    # gh-pages 分支存在，直接切换
    git checkout gh-pages
else
    # gh-pages 分支不存在，创建并切换
    if git show-ref --verify --quiet refs/remotes/origin/gh-pages; then
        git checkout -b gh-pages origin/gh-pages
    else
        git checkout --orphan gh-pages
        git rm -rf .
    fi
fi

# 清空当前目录内容（保留 .git）
echo "正在清空 gh-pages 分支内容..."
find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} +

# 复制新的 html 内容
echo "正在复制新的内容..."
cp -r "$TMP_DIR"/* ./

# 添加所有更改并提交
echo "正在提交更改..."
git add -A

if git diff --staged --quiet; then
    echo "没有需要提交的更改"
else
    git commit -m "更新文档 $(date +'%Y-%m-%d %H:%M:%S')"
    
    # 推送到远程
    echo "正在推送到远程仓库..."
    git push origin gh-pages
    
    if [ $? -eq 0 ]; then
        echo "推送成功"
    else
        echo "警告: 推送失败，请手动推送"
    fi
fi

# 切换回原来的分支
echo "正在切换回 $CURRENT_BRANCH 分支..."
git checkout "$CURRENT_BRANCH"

# 清理临时目录
rm -rf "$TMP_DIR"

echo "完成！"
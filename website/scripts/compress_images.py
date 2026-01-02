#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
递归压缩 website/docs 及其所有子目录下的图片，尽量保证清晰度。
支持 jpg/jpeg/png 格式。
依赖：pip install pillow
"""
import os
from PIL import Image

IMG_EXTS = {'.jpg', '.jpeg', '.png'}
DOCS_DIR = os.path.join(os.path.dirname(__file__), '../docs')

# 压缩参数
JPEG_QUALITY = 85  # 85%质量，兼顾清晰度和体积
PNG_OPTIMIZE = True


def compress_image(img_path):
    ext = os.path.splitext(img_path)[1].lower()
    try:
        img = Image.open(img_path)
        if ext in ['.jpg', '.jpeg']:
            img.save(img_path, 'JPEG', quality=JPEG_QUALITY, optimize=True)
        elif ext == '.png':
            img.save(img_path, 'PNG', optimize=PNG_OPTIMIZE)
        print(f"压缩完成: {img_path}")
    except Exception as e:
        print(f"跳过 {img_path}: {e}")


def compress_images_in_dir(root_dir):
    for dirpath, _, filenames in os.walk(root_dir):
        for fname in filenames:
            ext = os.path.splitext(fname)[1].lower()
            if ext in IMG_EXTS:
                img_path = os.path.join(dirpath, fname)
                compress_image(img_path)


def main():
    abs_docs_dir = os.path.abspath(DOCS_DIR)
    print(f"开始压缩 {abs_docs_dir} 下的图片...")
    compress_images_in_dir(abs_docs_dir)
    print("全部图片压缩完成！")

if __name__ == '__main__':
    main()

import os
import re
import json
import sys
import subprocess
import shutil

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(BASE_DIR, os.pardir))
DOCS_DIR = None
OUT_DIR = None

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path, exist_ok=True)

def md_to_html_pandoc(src_path):
    try:
        cmd = ["pandoc", "-f", "gfm", "-t", "html", src_path]
        res = subprocess.run(cmd, check=True, capture_output=True, text=True)
        return res.stdout
    except Exception:
        return None

def ensure_pandoc():
    if shutil.which("pandoc") is not None:
        return True
    brew = shutil.which("brew")
    if brew is not None:
        try:
            subprocess.run([brew, "install", "pandoc"], check=True)
            return shutil.which("pandoc") is not None
        except Exception:
            return False
    return False

def extract_title(md_text, fallback):
    """提取markdown文件中的第一个一级标题"""
    for l in md_text.splitlines():
        # 使用正则 ^#\s+(.+?)$ 匹配行首的一级标题
        m = re.match(r"^#\s+(.+?)$", l.rstrip())
        if m:
            return m.group(1).strip()
    return fallback

def extract_number(filename):
    # 匹配开头的数字编号如 00, 01, 03 等
    m = re.match(r'^(\d+)', filename)
    if m:
        return m.group(1)
    return None

def clean_display_name(name):
    """去掉文件名前面的编号_前缀和后面的.html扩展名"""
    # 去掉 .html 后缀
    if name.endswith('.html'):
        name = name[:-5]
    # 去掉前面的编号_格式，如 "00_", "01_", "03_" 等
    name = re.sub(r'^\d+_', '', name)
    # 将下划线替换为空格以提高可读性
    name = name.replace('_', ' ')
    return name.strip()

def sort_key(filename):
    """提取文件名中的编号用于排序"""
    # 匹配开头的数字编号如 00, 01, 03 等
    m = re.match(r'^(\d+)', filename)
    if m:
        return (0, int(m.group(1)), filename)
    # 没有编号的文件放在最后
    return (1, 0, filename)

def build_manifest(entries):
    """构建manifest树形结构，支持多层嵌套"""
    # 按目录层级组织所有条目
    entries_by_dir = {}  # {dir_path: [entries]}
    
    for e in entries:
        dir_path = e['rel_dir'] if e['rel_dir'] else ''
        if dir_path not in entries_by_dir:
            entries_by_dir[dir_path] = []
        entries_by_dir[dir_path].append(e)
    
    def build_tree_for_dir(dir_path):
        """递归构建指定目录下的树结构"""
        if dir_path not in entries_by_dir:
            return []
        
        files = entries_by_dir[dir_path]
        # 按编号排序
        files.sort(key=lambda x: sort_key(x['original_name']))
        
        tree = []
        for e in files:
            original_name = e['original_name']
            number = extract_number(original_name)
            
            # 创建节点
            node = {
                "path": e["rel_path_html"],
                "title": e["title"],
                "type": "file"
            }
            
            # 检查是否有同编号的子目录
            if number:
                # 构建可能的子目录路径
                # 例如：当前文件是 "03_main.md"，编号是 "03"，查找子目录 "03_main" 或 "03_xxx"
                if dir_path:
                    # 在子目录中查找，路径格式如 "03_main/03_content"
                    potential_prefix = dir_path + '/' + number + '_'
                else:
                    # 在根目录中查找，路径格式如 "03_main"
                    potential_prefix = number + '_'
                
                # 查找所有以 potential_prefix 开头的目录
                child_dirs = []
                for d in entries_by_dir.keys():
                    if not d:
                        continue
                    
                    if dir_path:
                        # 当前在子目录中，找下一级
                        if d.startswith(potential_prefix):
                            # 确保是直接子目录（没有更多的/）
                            relative = d[len(dir_path)+1:]  # 去掉父目录路径
                            if '/' not in relative:
                                child_dirs.append(d)
                    else:
                        # 在根目录，找第一级子目录
                        if d.startswith(potential_prefix) and '/' not in d:
                            child_dirs.append(d)
                
                # 递归构建子节点
                children = []
                for child_dir in child_dirs:
                    children.extend(build_tree_for_dir(child_dir))
                
                if children:
                    node["children"] = children
            
            tree.append(node)
        
        return tree
    
    # 从根目录开始构建
    return build_tree_for_dir('')

def main():
    args = sys.argv[1:]
    if len(args) >= 2:
        input_dir = args[0]
        output_dir = args[1]
    else:
        exit("用法: python build_docs.py <输入目录> <输出目录>")
    global DOCS_DIR, OUT_DIR
    DOCS_DIR = os.path.abspath(input_dir)
    OUT_DIR = os.path.abspath(output_dir)
    ensure_dir(OUT_DIR)
    out_entries = []
    for root, dirs, files in os.walk(DOCS_DIR):
        rel_dir = os.path.relpath(root, DOCS_DIR)
        if rel_dir == ".":
            rel_dir = ""
        out_dir = os.path.join(OUT_DIR, rel_dir)
        ensure_dir(out_dir)
        
        # 按照编号排序目录和文件
        dirs[:] = sorted(dirs, key=sort_key)
        files = sorted(files, key=sort_key)
        
        for f in files:
            src_path = os.path.join(root, f)
            if f.lower().endswith(".md"):
                with open(src_path, "r", encoding="utf-8") as rf:
                    md_text = rf.read()
                
                # 确保 pandoc 可用
                if not ensure_pandoc():
                    print(f"错误: 无法找到或安装 pandoc，跳过 {f}")
                    continue
                
                # 使用 pandoc 转换
                html_body = md_to_html_pandoc(src_path)
                if html_body is None:
                    print(f"错误: 转换 {f} 失败")
                    continue
                
                title = extract_title(md_text, os.path.splitext(f)[0])
                name_html = os.path.splitext(f)[0] + ".html"
                out_path = os.path.join(out_dir, name_html)
                doc_html = (
                    "<article class=\"doc-article\">\n" +
                    html_body +
                    "\n</article>\n"
                )
                with open(out_path, "w", encoding="utf-8") as wf:
                    wf.write(doc_html)
                rel_path_html = os.path.join(rel_dir, name_html) if rel_dir else name_html
                out_entries.append({
                    "title": title,
                    "rel_path_html": rel_path_html.replace("\\", "/"),
                    "rel_dir": rel_dir.replace("\\", "/"),
                    "name_html": name_html,
                    "original_name": os.path.splitext(f)[0]  # 保存原始文件名（不含扩展名）
                })
            else:
                dst_path = os.path.join(out_dir, f)
                with open(src_path, "rb") as rf, open(dst_path, "wb") as wf:
                    wf.write(rf.read())
    manifest = build_manifest(out_entries)
    manifest_path = os.path.join(OUT_DIR, "manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as mf:
        json.dump({"files": manifest}, mf, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()

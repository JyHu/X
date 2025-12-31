/**
 * 文档系统主脚本
 * 负责文档树的渲染和文档内容的加载
 */

// 全局变量：扁平化的文档列表
var flatDocList = [];

/**
 * 获取基础路径前缀
 * 判断当前页面是否在 /pages/ 目录下，返回相应的相对路径前缀
 * @returns {string} 返回 '../' 或 ''
 */
function basePrefix() { 
    var p = location.pathname; 
    return p.indexOf('/pages/') !== -1 ? '../' : '' 
}

/**
 * 获取文档清单（manifest）
 * 通过 fetch 加载 JSON 文件，添加时间戳参数避免浏览器缓存
 * @returns {Promise} 返回包含树形结构的 Promise
 */
function fetchManifest() { 
    var url = basePrefix() + 'docs/manifest.json?t=' + Date.now(); 
    return fetch(url).then(function (r) { 
        if (!r.ok) throw new Error('manifest'); 
        return r.json() 
    }) 
}

/**
 * 将树形结构扁平化为文档列表
 * @param {Array} nodes - 树节点数组
 * @returns {Array} 扁平化的文档列表
 */
function flattenTree(nodes) {
    var result = [];
    
    function traverse(nodeList) {
        nodeList.forEach(function(node) {
            // 添加当前节点
            result.push({
                path: node.path,
                title: node.title
            });
            // 递归处理子节点
            if (node.children && node.children.length > 0) {
                traverse(node.children);
            }
        });
    }
    
    traverse(nodes);
    return result;
}

/**
 * 渲染文档树到 DOM
 * 将树结构转换为可交互的 HTML 元素
 * @param {Array} nodes - 树节点数组
 * @param {HTMLElement} container - 容器 DOM 元素
 * @param {Function} onSelect - 选中文档时的回调函数
 */
function renderTree(nodes, container, onSelect) {
    /**
     * 创建文件节点（可能带子节点）
     * @param {Object} node - 节点对象，包含 name, path, children 等属性
     * @returns {HTMLElement} 返回节点 DOM 元素
     */
    function createNode(node) {
        var hasChildren = node.children && node.children.length > 0;
        
        if (hasChildren) {
            // 带子节点的文件：需要分离箭头和名称的点击行为
            var wrap = document.createElement('div'); 
            wrap.className = 'tree-folder'; 
            
            var header = document.createElement('div'); 
            header.className = 'tree-toggle'; 
            
            // 创建箭头区域（用于展开/收起）
            var arrow = document.createElement('span');
            arrow.className = 'tree-arrow';
            arrow.textContent = '▸';
            arrow.addEventListener('click', function(e) {
                e.stopPropagation();  // 阻止事件冒泡到父节点
                wrap.classList.toggle('open');
            });
            
            // 创建可点击的名称区域
            var nameSpan = document.createElement('span');
            nameSpan.textContent = node.title;
            nameSpan.dataset.path = node.path;
            nameSpan.className = 'tree-name';
            
            // 点击名称加载文档
            nameSpan.addEventListener('click', function(e) {
                e.stopPropagation();
                setActiveDocLink(node.path);
                onSelect(node.path);
            });
            
            header.appendChild(arrow);
            header.appendChild(nameSpan);
            
            // 创建子节点容器
            var list = document.createElement('div'); 
            list.className = 'tree-children'; 
            wrap.appendChild(header); 
            wrap.appendChild(list); 
            
            // 递归渲染子节点
            node.children.forEach(function(child) {
                list.appendChild(createNode(child));
            });
            
            return wrap;
        } else {
            // 普通文件节点
            var a = document.createElement('a'); 
            a.className = 'tree-file'; 
            a.href = '#'; 
            a.textContent = node.title; 
            a.dataset.path = node.path; 
            a.addEventListener('click', function (e) { 
                e.preventDefault();
                setActiveDocLink(node.path);
                onSelect(node.path);
            }); 
            return a;
        }
    }
    
    // 渲染所有顶层节点
    nodes.forEach(function(node) {
        container.appendChild(createNode(node));
    });
}

/**
 * 规范化路径
 * 处理路径中的 . 和 .. 符号，返回规范化的路径
 * @param {string} p - 原始路径
 * @returns {string} 规范化后的路径
 */
function normalizePath(p){
    var parts=p.split('/');
    var stack=[];
    for(var i=0;i<parts.length;i++){
        var s=parts[i];
        if(!s||s==='.')continue;  // 跳过空字符串和当前目录
        if(s==='..'){
            if(stack.length)stack.pop()  // 返回上级目录
        }else stack.push(s)
    }
    return stack.join('/')
}

/**
 * 重写文档中的资源路径
 * 将文档中的相对路径转换为正确的绝对路径
 * @param {string} dir - 当前文档所在的目录
 */
function rewriteAssets(dir){
    var prefix=basePrefix()+'docs/';
    var container=document.getElementById('doc-content');
    
    // 处理图片的 src 属性
    Array.from(container.querySelectorAll('img')).forEach(function(img){
        var s=img.getAttribute('src');
        if(!s)return;
        // 跳过绝对路径和 data URL
        if(/^(https?:|data:|\/)/.test(s))return;
        // 跳过已经包含 docs/ 的路径
        if(s.indexOf('docs/')!==-1)return;
        var target=normalizePath((dir?dir+'/':'')+s);
        img.setAttribute('src',prefix+target)
    });
    
    // 处理链接的 href 属性
    Array.from(container.querySelectorAll('a')).forEach(function(a){
        var href=a.getAttribute('href');
        if(!href)return;
        // 跳过外部链接和锚点链接
        if(/^(https?:|mailto:|tel:)/.test(href))return;
        if(href.startsWith('#'))return;
        // 将 .md 链接转换为 .html
        var t=href.replace(/\.md(\#.*)?$/,'.html$1');
        var target=normalizePath((dir?dir+'/':'')+t);
        a.setAttribute('data-doc',target);
        a.setAttribute('href','#');
        // 点击内部链接时加载对应文档
        a.addEventListener('click',function(e){
            e.preventDefault();
            setActiveDocLink(target);
            loadDoc(target)
        })
    })
}

/**
 * 展开指定路径所在的所有父节点
 * 确保目标节点在树中可见
 * @param {string} path - 文档路径
 */
function expandParentNodes(path){
    // 查找包含该路径的所有节点（包括普通文件和带子节点的文件）
    var allLinks = document.querySelectorAll('.tree-file[data-path]');
    var allNames = document.querySelectorAll('.tree-name[data-path]');
    
    var targetElement = null;
    
    // 在普通文件中查找
    allLinks.forEach(function(l){
        if(l.dataset.path === path){
            targetElement = l;
        }
    });
    
    // 在带子节点的文件中查找
    if(!targetElement){
        allNames.forEach(function(s){
            if(s.dataset.path === path){
                targetElement = s;
            }
        });
    }
    
    // 如果找到目标元素，展开其所有父节点
    if(targetElement){
        var current = targetElement.parentElement;
        while(current){
            // 如果是折叠的文件夹节点，展开它
            if(current.classList && current.classList.contains('tree-folder')){
                current.classList.add('open');
            }
            current = current.parentElement;
        }
    }
}

/**
 * 设置文档树中的激活状态
 * 高亮显示当前选中的文档
 * @param {string} path - 文档路径
 */
function setActiveDocLink(path){
    // 先展开父节点
    expandParentNodes(path);
    
    var allLinks = document.querySelectorAll('.tree-file');
    var allNames = document.querySelectorAll('.tree-name[data-path]');
    
    // 更新普通文件链接的激活状态
    allLinks.forEach(function(l){
        if(l.dataset.path === path){
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
    
    // 更新带子节点的文件节点的激活状态
    allNames.forEach(function(s){
        if(s.dataset.path === path){
            s.classList.add('active');
        } else {
            s.classList.remove('active');
        }
    });
}

/**
 * 显示空状态页面
 * 当没有选中任何文档时显示欢迎信息
 */
function showEmptyState(){
    var c=document.getElementById('doc-content');
    c.innerHTML='<div class="doc-empty-state"><div class="doc-empty-state-icon">📚</div><h3>欢迎使用 TransX 文档</h3><p>请从左侧文档列表中选择一个条目开始阅读。您可以浏览完整的使用指南，了解 TransX 的各项功能。</p></div>'
}

/**
 * 添加页面导航按钮（上一页/下一页）
 * @param {string} currentPath - 当前文档路径
 */
function addPageNavigation(currentPath) {
    // 查找当前文档在列表中的索引
    var currentIndex = -1;
    for (var i = 0; i < flatDocList.length; i++) {
        if (flatDocList[i].path === currentPath) {
            currentIndex = i;
            break;
        }
    }
    
    if (currentIndex === -1) return;
    
    var prevDoc = currentIndex > 0 ? flatDocList[currentIndex - 1] : null;
    var nextDoc = currentIndex < flatDocList.length - 1 ? flatDocList[currentIndex + 1] : null;
    
    // 创建导航容器
    var nav = document.createElement('div');
    nav.className = 'doc-navigation';
    nav.innerHTML = `
        <div class="doc-nav-buttons">
            <button class="doc-nav-btn doc-nav-prev ${!prevDoc ? 'disabled' : ''}" ${!prevDoc ? 'disabled' : ''}>
                <span class="doc-nav-arrow">←</span>
                <div class="doc-nav-text">
                    <div class="doc-nav-label">上一页</div>
                    ${prevDoc ? '<div class="doc-nav-title">' + prevDoc.title + '</div>' : ''}
                </div>
            </button>
            <button class="doc-nav-btn doc-nav-next ${!nextDoc ? 'disabled' : ''}" ${!nextDoc ? 'disabled' : ''}>
                <div class="doc-nav-text">
                    <div class="doc-nav-label">下一页</div>
                    ${nextDoc ? '<div class="doc-nav-title">' + nextDoc.title + '</div>' : ''}
                </div>
                <span class="doc-nav-arrow">→</span>
            </button>
        </div>
    `;
    
    // 添加点击事件
    var prevBtn = nav.querySelector('.doc-nav-prev');
    var nextBtn = nav.querySelector('.doc-nav-next');
    
    if (prevDoc && prevBtn) {
        prevBtn.addEventListener('click', function() {
            setActiveDocLink(prevDoc.path);
            loadDoc(prevDoc.path);
        });
    }
    
    if (nextDoc && nextBtn) {
        nextBtn.addEventListener('click', function() {
            setActiveDocLink(nextDoc.path);
            loadDoc(nextDoc.path);
        });
    }
    
    // 将导航添加到文档内容区域
    var container = document.getElementById('doc-content');
    var article = container.querySelector('.doc-article');
    if (article) {
        article.appendChild(nav);
    } else {
        container.appendChild(nav);
    }
}

/**
 * 加载并显示文档内容
 * 通过 fetch 从服务器获取 HTML 文档并渲染到页面
 * @param {string} path - 文档路径
 */
function loadDoc(path) { 
    var c = document.getElementById('doc-content'); 
    // 提取文档所在的目录路径
    var dir = path.lastIndexOf('/') !== -1 ? path.slice(0, path.lastIndexOf('/')) : ''; 
    
    // 通过 fetch 加载文档
    var url = basePrefix() + 'docs/' + path; 
    fetch(encodeURI(url))
        .then(function (r) { 
            if (!r.ok) throw new Error('doc'); 
            return r.text() 
        })
        .then(function (html) { 
            c.innerHTML = html; 
            rewriteAssets(dir);  // 修正资源路径
            setActiveDocLink(path);  // 更新 doc-tree 选中状态
            addPageNavigation(path);  // 添加页面导航
            window.scrollTo({ top: 0, behavior: 'smooth' })  // 滚动到顶部
        })
        .catch(function () { 
            c.innerHTML = '<div style="color:#ef4444">文档加载失败</div>' 
        }) 
}

/**
 * 页面加载完成后初始化文档系统
 */
document.addEventListener('DOMContentLoaded', function () { 
    var c = document.getElementById('doc-content'); 
    showEmptyState();  // 显示空状态
    
    // 加载文档清单并渲染文档树
    fetchManifest()
        .then(function (man) { 
            var tree = (man && man.files || []);  // 直接使用树形结构
            // 扁平化文档列表
            flatDocList = flattenTree(tree);
            var container = document.getElementById('doc-tree'); 
            // 渲染文档树，并设置选中回调
            renderTree(tree, container, function(p){
                setActiveDocLink(p);  // 设置高亮
                loadDoc(p);  // 加载文档
            }); 
        })
        .catch(function () { 
            c.innerHTML = '<div style="color:#ef4444">文档清单加载失败</div>' 
        }) 
});
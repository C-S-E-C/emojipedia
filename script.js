// 表情库索引URL
const emojibank = "https://raw.githubusercontent.com/C-S-E-C/emojipedia/refs/heads/main/emojibank.json"; // 替换为您的索引JSON地址

// 本地缓存：索引缓存和表情集缓存
const emojiIndexCache = {}; // 存储从emojibank加载的索引 {id: url}
const emojiSetCache = {};   // 存储加载的表情集 {setId: {a: data, b: data}}

// 配置选项
const config = {
    // 要扫描的标签，null表示扫描所有元素
    scanTags: null,
    // 是否忽略某些元素
    ignoreClass: 'no-emoji',
    // 图片样式
    imgStyle: {
        width: '20px',
        height: '20px',
        verticalAlign: 'middle',
        margin: '0 3px'
    }
};

/**
 * 加载表情索引
 */
async function loadEmojiIndex() {
    try {
        console.log('正在加载表情索引...');
        
        if (!emojibank) {
            console.warn('未配置表情索引地址');
            return false;
        }
        
        const response = await fetch(emojibank);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const indexData = await response.json();
        
        // 清空缓存
        Object.keys(emojiIndexCache).forEach(key => delete emojiIndexCache[key]);
        
        // 解析索引数据
        if (Array.isArray(indexData)) {
            // 格式: [{id: "set1", url: "url1"}, {id: "set2", url: "url2"}, ...]
            indexData.forEach(item => {
                if (item.id && item.url) {
                    emojiIndexCache[item.id] = item.url;
                }
            });
        } else if (typeof indexData === 'object') {
            // 格式: {"set1": "url1", "set2": "url2", ...}
            Object.assign(emojiIndexCache, indexData);
        }
        
        console.log(`表情索引加载完成，共 ${Object.keys(emojiIndexCache).length} 个表情集`);
        return true;
        
    } catch (error) {
        console.error('加载表情索引失败:', error);
        return false;
    }
}

/**
 * 加载指定的表情集
 * @param {string} setId - 表情集ID
 */
async function loadEmojiSet(setId) {
    try {
        // 检查是否已缓存
        if (emojiSetCache[setId]) {
            return emojiSetCache[setId];
        }
        
        // 从索引获取URL
        const setUrl = emojiIndexCache[setId];
        if (!setUrl) {
            console.error(`未找到表情集 ${setId} 的URL`);
            return null;
        }
        
        console.log(`正在加载表情集: ${setId}`);
        const response = await fetch(setUrl);
        if (!response.ok) {
            throw new Error(`加载表情集失败: ${response.status}`);
        }
        
        const setData = await response.json();
        emojiSetCache[setId] = setData;
        
        console.log(`表情集 ${setId} 加载完成`);
        return setData;
        
    } catch (error) {
        console.error(`加载表情集 ${setId} 失败:`, error);
        return null;
    }
}

/**
 * 查找表情
 * @param {string} object - 表情ID
 * @param {string} resp - 表情集ID
 * @returns {Promise<string>} 表情HTML或原始文本
 */
async function convertEmoji(object, resp) {
    try {
        // 1. 加载表情索引（如果未加载）
        if (Object.keys(emojiIndexCache).length === 0) {
            await loadEmojiIndex();
        }
        
        // 2. 加载指定的表情集
        const emojiSet = await loadEmojiSet(resp);
        if (!emojiSet) {
            return `[${object}@${resp}]`; // 加载失败，返回原始文本
        }
        
        // 3. 在表情集中查找指定的表情
        let emojiData = null;
        
        if (Array.isArray(emojiSet)) {
            // 格式: [{id: "smile", url: "url"}, {id: "cry", html: "<img>"}, ...]
            emojiData = emojiSet.find(item => item.id === object);
        } else if (typeof emojiSet === 'object') {
            // 格式: {"smile": {url: "..."}, "cry": {html: "..."}} 或 {"smile": "url", "cry": "<img>"}
            emojiData = emojiSet[object];
            
            // 如果值是字符串，可能是URL或HTML
            if (typeof emojiData === 'string') {
                emojiData = { url: emojiData };
            }
        }
        
        // 4. 返回表情HTML
        if (emojiData) {
            if (emojiData.html) {
                // 直接使用提供的HTML
                return emojiData.html;
            } else if (emojiData.url) {
                // 构建图片HTML
                const img = document.createElement('img');
                img.src = emojiData.url;
                img.alt = object;
                img.className = 'emoji-image';
                Object.assign(img.style, config.imgStyle);
                
                return img.outerHTML;
            }
        }
        
        // 未找到表情
        return `[${object}@${resp}]`;
        
    } catch (error) {
        console.error(`转换表情失败 [${object}@${resp}]:`, error);
        return `[${object}@${resp}]`;
    }
}

/**
 * 主函数：扫描并替换所有文本元素中的表情标记
 */
async function replaceEmojiMarkers() {
    console.log('开始扫描文本元素中的表情标记...');
    
    // 获取要扫描的元素
    let elementsToScan;
    if (config.scanTags) {
        // 扫描指定标签
        elementsToScan = document.querySelectorAll(config.scanTags.join(','));
    } else {
        // 扫描所有元素，但排除body和html
        elementsToScan = document.querySelectorAll('body *:not(html):not(body):not(script):not(style)');
    }
    
    // 遍历所有元素
    for (const element of elementsToScan) {
        // 跳过忽略的元素
        if (config.ignoreClass && element.classList.contains(config.ignoreClass)) {
            continue;
        }
        
        // 处理元素
        await processElement(element);
    }
    
    console.log('表情标记替换完成！');
}

/**
 * 处理单个元素，查找并替换表情标记
 * @param {HTMLElement} element - 要处理的DOM元素
 */
async function processElement(element) {
    // 保存原始HTML以进行对比
    const originalHTML = element.innerHTML;
    
    // 检查是否包含[...@...]格式的标记
    const regex = /\[([^@\]]+)@([^\]]+)\]/g;
    const matches = [...originalHTML.matchAll(regex)];
    
    if (matches.length === 0) {
        return; // 没有匹配项
    }
    
    // 用于存储替换结果的Map
    const replacements = new Map();
    
    // 并行处理所有匹配项
    await Promise.all(
        matches.map(async (match) => {
            const fullMatch = match[0]; // 完整匹配，如[smile@set1]
            const object = match[1];    // 表情ID，如smile
            const resp = match[2];      // 表情集ID，如set1
            
            // 转换表情
            const replacement = await convertEmoji(object, resp);
            replacements.set(fullMatch, replacement);
        })
    );
    
    // 执行替换
    let newHTML = originalHTML;
    replacements.forEach((replacement, original) => {
        newHTML = newHTML.split(original).join(replacement);
    });
    
    // 更新元素内容（如果有变化）
    if (newHTML !== originalHTML) {
        element.innerHTML = newHTML;
    }
}

/**
 * 重新扫描并替换（在动态内容添加后使用）
 */
async function refreshEmojis() {
    await replaceEmojiMarkers();
}

/**
 * 清除表情缓存
 * @param {string} setId - 可选，清除指定表情集缓存
 */
function clearEmojiCache(setId = null) {
    if (setId) {
        delete emojiSetCache[setId];
        console.log(`已清除表情集 ${setId} 的缓存`);
    } else {
        Object.keys(emojiIndexCache).forEach(key => delete emojiIndexCache[key]);
        Object.keys(emojiSetCache).forEach(key => delete emojiSetCache[key]);
        console.log('已清除所有表情缓存');
    }
}

/**
 * 预加载表情集
 * @param {string|string[]} setIds - 表情集ID或ID数组
 */
async function preloadEmojiSets(setIds) {
    if (!Array.isArray(setIds)) {
        setIds = [setIds];
    }
    
    // 先确保索引已加载
    if (Object.keys(emojiIndexCache).length === 0) {
        await loadEmojiIndex();
    }
    
    // 并行加载所有指定的表情集
    await Promise.all(
        setIds.map(setId => loadEmojiSet(setId))
    );
    
    console.log(`预加载完成: ${setIds.join(', ')}`);
}

/**
 * 手动添加表情到缓存
 * @param {string} setId - 表情集ID
 * @param {string} objectId - 表情ID
 * @param {string|object} data - 表情数据（URL字符串或对象）
 */
function addEmojiToCache(setId, objectId, data) {
    if (!emojiSetCache[setId]) {
        emojiSetCache[setId] = {};
    }
    
    emojiSetCache[setId][objectId] = data;
    console.log(`已添加表情: [${objectId}@${setId}]`);
}

/**
 * 初始化函数
 */
async function initEmojiReplacer() {
    // 预加载表情索引
    await loadEmojiIndex();
    
    // 监听DOM变化以处理动态添加的内容
    const observer = new MutationObserver((mutations) => {
        let shouldRefresh = false;
        
        mutations.forEach((mutation) => {
            // 检查是否有新节点添加
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                shouldRefresh = true;
            }
        });
        
        if (shouldRefresh) {
            // 使用防抖避免频繁刷新
            clearTimeout(window.emojiRefreshTimeout);
            window.emojiRefreshTimeout = setTimeout(() => {
                refreshEmojis();
            }, 300);
        }
    });
    
    // 开始观察body及其子节点的变化
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // 初始替换
    await replaceEmojiMarkers();
    
    console.log('表情替换器初始化完成！');
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initEmojiReplacer);
} else {
    initEmojiReplacer();
}

// 导出API到全局对象
window.EmojiReplacer = {
    replace: replaceEmojiMarkers,
    refresh: refreshEmojis,
    convert: convertEmoji,
    loadIndex: loadEmojiIndex,
    loadSet: loadEmojiSet,
    preload: preloadEmojiSets,
    clearCache: clearEmojiCache,
    addToCache: addEmojiToCache,
    caches: {
        index: emojiIndexCache,
        sets: emojiSetCache
    },
    config: config
};

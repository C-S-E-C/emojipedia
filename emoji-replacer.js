/**
 * EmojiReplacer - Replaces emoji markers with actual emoji images
 * Scans text content and replaces patterns like :emoji_name: with images
 */
class EmojiReplacer {
  constructor(config = {}) {
    this.config = {
      emojiIndexUrl: config.emojiIndexUrl || "https://emoji-api.example.com/index.json",
      imageBaseUrl: config.imageBaseUrl || "https://cdn.example.com/emoji/",
      imageFormat: config.imageFormat || "png",
      className: config.className || "emoji-img",
      size: config.size || 20,
      lazyLoad: config.lazyLoad !== false,
      observeChanges: config.observeChanges !== false,
      ...config,
    }

    this.emojiMap = new Map()
    this.processedNodes = new WeakSet()
    this.observer = null
    this.isLoaded = false
    this.loadPromise = null
  }

  /**
   * Initialize the emoji replacer
   * Loads emoji index and starts observing DOM changes
   */
  async init() {
    if (this.loadPromise) {
      return this.loadPromise
    }

    this.loadPromise = this._loadEmojiIndex()
    await this.loadPromise

    if (this.config.observeChanges) {
      this._startObserver()
    }

    return this
  }

  /**
   * Load emoji index from remote URL
   */
  async _loadEmojiIndex() {
    try {
      const response = await fetch(this.config.emojiIndexUrl)

      if (!response.ok) {
        throw new Error(`Failed to load emoji index: ${response.status}`)
      }

      const data = await response.json()

      if (!data || typeof data !== "object") {
        throw new Error("Invalid emoji index format")
      }

      // Populate emoji map
      Object.entries(data).forEach(([name, info]) => {
        if (name && info && typeof info === "object") {
          this.emojiMap.set(name, {
            name: this._sanitize(name),
            alt: this._sanitize(info.alt || name),
            keywords: Array.isArray(info.keywords) ? info.keywords.map((k) => this._sanitize(k)) : [],
          })
        }
      })

      this.isLoaded = true
      console.log(`[EmojiReplacer] Loaded ${this.emojiMap.size} emojis`)
    } catch (error) {
      console.error("[EmojiReplacer] Failed to load emoji index:", error)
      throw error
    }
  }

  /**
   * Sanitize text to prevent XSS
   */
  _sanitize(text) {
    if (typeof text !== "string") return ""
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  /**
   * Start observing DOM changes
   */
  _startObserver() {
    if (this.observer) return

    this.observer = new MutationObserver(
      this._debounce((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.replaceInElement(node)
            }
          })
        })
      }, 100),
    )

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  }

  /**
   * Debounce function to limit execution rate
   */
  _debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }

  /**
   * Replace emoji markers in an element
   */
  replaceInElement(element) {
    if (!this.isLoaded || !element || this.processedNodes.has(element)) {
      return
    }

    this.processedNodes.add(element)

    // Skip script, style, and already processed elements
    const skipTags = ["SCRIPT", "STYLE", "IFRAME", "NOSCRIPT"]
    if (skipTags.includes(element.tagName)) {
      return
    }

    // Process all text nodes
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = node.parentElement
        return parent && !skipTags.includes(parent.tagName) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
      },
    })

    const nodesToProcess = []
    let currentNode
    while ((currentNode = walker.nextNode())) {
      nodesToProcess.push(currentNode)
    }

    nodesToProcess.forEach((node) => this._replaceInTextNode(node))
  }

  /**
   * Replace emoji markers in a text node
   */
  _replaceInTextNode(textNode) {
    if (!textNode || !textNode.textContent) return

    const text = textNode.textContent
    const regex = /:([a-zA-Z0-9_+-]+):/g
    const matches = [...text.matchAll(regex)]

    if (matches.length === 0) return

    const fragment = document.createDocumentFragment()
    let lastIndex = 0

    matches.forEach((match) => {
      const [fullMatch, emojiName] = match
      const matchIndex = match.index

      // Add text before the match
      if (matchIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, matchIndex)))
      }

      // Check if emoji exists
      if (this.emojiMap.has(emojiName)) {
        const emojiInfo = this.emojiMap.get(emojiName)
        const img = this._createEmojiImage(emojiInfo)
        fragment.appendChild(img)
      } else {
        // Keep original text if emoji not found
        fragment.appendChild(document.createTextNode(fullMatch))
      }

      lastIndex = matchIndex + fullMatch.length
    })

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)))
    }

    // Replace the text node with the fragment
    textNode.parentNode?.replaceChild(fragment, textNode)
  }

  /**
   * Create an emoji image element
   */
  _createEmojiImage(emojiInfo) {
    const img = document.createElement("img")
    const src = `${this.config.imageBaseUrl}${emojiInfo.name}.${this.config.imageFormat}`

    img.className = this.config.className
    img.alt = emojiInfo.alt
    img.title = emojiInfo.alt
    img.width = this.config.size
    img.height = this.config.size
    img.style.cssText = `
      display: inline-block;
      vertical-align: middle;
      margin: 0 2px;
    `

    // Lazy loading
    if (this.config.lazyLoad && "loading" in HTMLImageElement.prototype) {
      img.loading = "lazy"
      img.src = src
    } else {
      img.src = src
    }

    // Error handling
    img.onerror = () => {
      console.warn(`[EmojiReplacer] Failed to load emoji: ${emojiInfo.name}`)
      img.alt = `:${emojiInfo.name}:`
    }

    return img
  }

  /**
   * Replace emojis in the entire document
   */
  replaceAll() {
    if (!this.isLoaded) {
      console.warn("[EmojiReplacer] Emoji index not loaded yet")
      return
    }

    this.replaceInElement(document.body)
  }

  /**
   * Get configuration
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * Check if emoji exists
   */
  hasEmoji(name) {
    return this.emojiMap.has(name)
  }

  /**
   * Get emoji info
   */
  getEmoji(name) {
    return this.emojiMap.get(name)
  }

  /**
   * Get all emoji names
   */
  getAllEmojiNames() {
    return Array.from(this.emojiMap.keys())
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this.processedNodes = new WeakSet()
  }
}

// Export for use in modules or browser
if (typeof module !== "undefined" && module.exports) {
  module.exports = EmojiReplacer
}
if (typeof window !== "undefined") {
  window.EmojiReplacer = EmojiReplacer
}

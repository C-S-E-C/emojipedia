/**
 * Auto-initialize EmojiReplacer with default configuration
 * Include this file to automatically replace emojis on page load
 */

;(async () => {
  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initEmojiReplacer)
  } else {
    await initEmojiReplacer()
  }

  async function initEmojiReplacer() {
    try {
      // Check if EmojiReplacer is available
      const EmojiReplacer = window.EmojiReplacer // Declare the variable before using it
      if (typeof EmojiReplacer === "undefined") {
        console.error("[EmojiReplacer] EmojiReplacer class not found. Make sure to include emoji-replacer.js first.")
        return
      }

      // Create instance with default config
      const replacer = new EmojiReplacer({
        emojiIndexUrl: "https://emoji-api.example.com/index.json",
        imageBaseUrl: "https://cdn.example.com/emoji/",
        imageFormat: "png",
        className: "emoji-img",
        size: 20,
        lazyLoad: true,
        observeChanges: true,
      })

      // Initialize and replace emojis
      await replacer.init()
      replacer.replaceAll()

      // Make available globally for debugging
      window.emojiReplacer = replacer

      console.log("[EmojiReplacer] Initialized successfully")
    } catch (error) {
      console.error("[EmojiReplacer] Initialization failed:", error)
    }
  }
})()

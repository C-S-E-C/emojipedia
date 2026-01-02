# Emoji Replacer - Plain JavaScript

A robust emoji replacement system that converts `[emojiId@setId]` markers into actual emoji images with caching and dynamic content support.

## Key Improvements

### Architecture
- Map for better cache performance vs plain objects
- WeakSet for tracking processed elements (prevents reprocessing)
- Clean modular functions with clear responsibilities

### Security
- HTML sanitization to prevent XSS attacks
- Validates emoji data before rendering
- Safe DOM manipulation using text nodes

### Performance
- Lazy loading for images (`loading="lazy"`)
- Debounced mutation observer (300ms)
- Parallel emoji loading with Promise.all
- WeakSet prevents duplicate processing
- Efficient text node walking instead of innerHTML manipulation

### Code Quality
- English comments for international collaboration
- Proper error handling with try/catch
- Clean async/await patterns
- Comprehensive API

## Usage

```javascript
// Auto-initialized on page load, or manually:
window.EmojiReplacer.replace(); // Scan and replace all emojis

// Preload emoji sets
await window.EmojiReplacer.preload(['set1', 'set2']);

// Convert single emoji
const html = await window.EmojiReplacer.convert('smile', 'set1');

// Refresh after adding dynamic content
await window.EmojiReplacer.refresh();

// Clear cache
window.EmojiReplacer.clearCache('set1'); // Specific set
window.EmojiReplacer.clearCache(); // All cache

// Add custom emoji to cache
window.EmojiReplacer.addToCache('mySet', 'myEmoji', {
  url: 'https://example.com/emoji.png'
});
```

## Configuration

Edit the `config` object in `emoji-replacer.js`:

```javascript
const config = {
  emojibank: "https://your-emoji-index.json", // Index URL
  scanTags: null, // null = all elements, or ['p', 'div', 'span']
  ignoreClass: "no-emoji", // Skip elements with this class
  imgStyle: { // Image styling
    width: "20px",
    height: "20px",
    verticalAlign: "middle",
    margin: "0 3px",
  },
}
```

## Emoji Format

### Index JSON Format
```json
{
  "set1": "https://example.com/set1.json",
  "set2": "https://example.com/set2.json"
}
```

### Emoji Set JSON Format
```json
{
  "smile": { "url": "https://example.com/smile.png" },
  "cry": { "url": "https://example.com/cry.png" },
  "custom": { "html": "<span class='emoji'>😊</span>" }
}
```

## API Reference

- `replace()` - Scan and replace all emoji markers
- `refresh()` - Refresh all emojis (clears processed cache)
- `convert(emojiId, setId)` - Convert single emoji to HTML
- `loadIndex()` - Manually reload emoji index
- `loadSet(setId)` - Load a specific emoji set
- `preload(setIds)` - Preload emoji sets (string or array)
- `clearCache(setId?)` - Clear cache (all or specific set)
- `addToCache(setId, emojiId, data)` - Add custom emoji to cache

import hljs from 'highlight.js/lib/core';
import php from 'highlight.js/lib/languages/php';
import json from 'highlight.js/lib/languages/json';
import js from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('php', php)
hljs.registerLanguage('json', json)
hljs.registerLanguage('javascript', js)

const highlightCode = function (str, lang) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return '<pre class="hljs"><code>' +
        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
        '</code></pre>';
    } catch (__) { }
  }
  // else unknown lamguage or unspecified language type
  return '<pre class="hljs"><code>' + str + '</code></pre>';
}

const formatDate = (dateString) => {
  const options = { year: "numeric", month: "long", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

const slugify = (text) => text.replace(/\s/gi, "-").toLowerCase();

// Format codeblocks to use highlight JS and show proper UL icons
const customTextComponents = {
  block: {
    h1: ({ children }) => `<h1 id="${slugify(children)}">${children}</h1>`,
    h2: ({ children }) => `<h2 id="${slugify(children)}">${children}</h2>`,
    h3: ({ children }) => `<h3 id="${slugify(children)}">${children}</h3>`,
    h4: ({ children }) => `<h4 id="${slugify(children)}">${children}</h4>`,
    h5: ({ children }) => `<h5 id="${slugify(children)}">${children}</h5>`,
    h6: ({ children }) => `<h6 id="${slugify(children)}">${children}</h6>`,
  },
  types: {
    code: ({ value }) => highlightCode(value.code, value.language),
    html: ({ value }) => value.html
  },
  listItem: ({ children }) => {
    let regEx = /(\[icon)|(\])/gi;
    let replacements = { '[icon': '<i class="uil', ']': '"></i>' }
    return `<li>${children.replace(regEx, m => replacements[m])}</li>`
  }
};

const checkPageTheme = (req) => req.cookies.theme === 'dark' ? 'dark' : false;

function getEstimatedReadingTime(blocks = []) {
  let wordsArray = blocks.map(block => {
      if (block._type !== 'block' || !block.children) {return []}
      return block.children.map(child => child.text).join('')
    }).join('').split(' ')

    let wordCount = wordsArray.length;
    let readingLength = Math.ceil(wordCount/200)
    return `${readingLength} min read`;
}

export { highlightCode, formatDate, slugify, customTextComponents, checkPageTheme, getEstimatedReadingTime }
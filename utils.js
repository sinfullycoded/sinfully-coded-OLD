import hljs from 'highlight.js/lib/core';
import php from 'highlight.js/lib/languages/php';
import json from 'highlight.js/lib/languages/json';
import js from 'highlight.js/lib/languages/javascript';
hljs.registerLanguage('php', php)
hljs.registerLanguage('json', json)
hljs.registerLanguage('javascript', js)
import pkg from 'canvas';
const { registerFont, createCanvas, loadImage } = pkg;
import { fs, __dirname } from './server.js';

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
    let regEx = /(\[icon )|(\])/gi;
    let replacements = { '[icon ': '<i class="icon-', ']': '"></i>' }
    return `<li>${children.replace(regEx, m => replacements[m])}</li>`
  }
};

const checkPageTheme = (req) => req.cookies.theme === 'dark' ? 'dark' : false;

function getEstimatedReadingTime(blocks = []) {
  let wordsArray = blocks.map(block => {
    if (block._type !== 'block' || !block.children) { return [] }
    return block.children.map(child => child.text).join('')
  }).join('').split(' ')

  let wordCount = wordsArray.length;
  let readingLength = Math.ceil(wordCount / 200)
  return `${readingLength} min read`;
}

function generateOgImage(ogImgOpts) {
  registerFont('./src/fonts/Neuton/Neuton-Regular.ttf', { family: 'Neuton' })
  registerFont('./src/fonts/Noto_Sans/NotoSans-Regular.ttf', { family: 'Noto Sans' })

  // Set up canvas
  const canvas = createCanvas(600, 315);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add 1px border around canvas
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#d3d3d3';
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  // Add logo image
  loadImage(__dirname + '/public/assets/images/logo-main.png').then((logo) => {
    ctx.drawImage(logo, 30, 25, 120, 28.8)
  }).catch(err => console.log(err))

  // Add post category
  const category = ogImgOpts.category.toUpperCase();
  ctx.fillStyle = '#c415bc';
  ctx.font = "bold 15px 'Noto Sans', sans-serif";
  ctx.fillText(category, 30, 105);

  // Add post title
  ctx.font = "35px Neuton";
  ctx.fillStyle = '#000';
  let text = ogImgOpts.title;
  wrapText(ctx, text, 30, 200, 500, 35)

  // Add post tags
  const tags = ogImgOpts.tags.join(" ").trim();
  ctx.font = "15px 'Noto Sans', sans-serif";
  ctx.fillStyle = '#555';
  ctx.fillText(tags, 30, 215);

  // Add my avatar image
  ctx.save()
  loadImage(__dirname + '/public/assets/images/me_small.png').then((avatar) => {
    	ctx.beginPath();
		  ctx.arc(50, 265, 20, 0, Math.PI*2);
		  ctx.closePath();
		  ctx.clip();
      ctx.drawImage(avatar, 30, 245, 40, 40)
      ctx.restore();
  }).catch(err => console.log(err))

  // Add author
  ctx.font = "15px 'Noto Sans', sans-serif";
  ctx.fillStyle = '#000';
  ctx.fillText("Shakima F.", 85, 270);

  // Add decorative gradient border to bottom of canvas
  let gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, "#721932");
  gradient.addColorStop(0.3, "#c415bc");
  gradient.addColorStop(0.6, "#ff9449");
  gradient.addColorStop(0.8, "#cb440f");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, canvas.height - 6, canvas.width, canvas.width);

  // write the canvas file to public folder as a png to be used as OG image for post
  setTimeout(() => {
    const out = fs.createWriteStream(__dirname + `/public/assets/images/blog/${ogImgOpts.post_id}.png`)
    const stream = canvas.createPNGStream()
    stream.pipe(out)
  }, 1000)
}

// Helper function from: https://rodrigopassos.com/posts/create-social-media-image-programatically--part-2/
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  const lines = []
  let line = ''
  for (let i = 0; i < words.length; i++) {
    let test = words[i]
    let metrics = context.measureText(test);
    while (metrics.width > maxWidth) {
      // Determine how much of the word will fit
      test = test.substring(0, test.length - 1);
      metrics = context.measureText(test);
    }
    if (words[i] != test) {
      words.splice(i + 1, 0, words[i].substr(test.length))
      words[i] = test;
    }
    test = line + words[i] + ' ';
    metrics = context.measureText(test);
    if (metrics.width > maxWidth && i > 0) {
      lines.push({ line, x, y })
      line = words[i] + ' '
      y += lineHeight
    } else {
      line = test;
    }
  }
  lines.push({ line, x, y })
  let negativeTop = 0
  if (lines.length > 1) {
    negativeTop = lines.length * 25
  }
  lines.forEach(ln => {
    context.fillText(ln.line, ln.x, ln.y - negativeTop)
  });
}

export { highlightCode, formatDate, slugify, customTextComponents, checkPageTheme, getEstimatedReadingTime, generateOgImage, wrapText }


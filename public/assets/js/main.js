function themeManager() {
    document.getElementById('theme-switcher').addEventListener('input', ({ target }) => {
        document.body.style.transition = 'background-color 400ms ease-in-out';
        if (target.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark')
            document.cookie = 'theme=dark; path=/';
            document.getElementById('theme-switcher').setAttribute('title', 'Switch to light theme')
        } else {
            document.body.removeAttribute('data-theme');
            document.cookie = 'theme=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
            localStorage.removeItem('theme')
            document.getElementById('theme-switcher').setAttribute('title', 'Switch to dark theme')
        }
    })
    document.addEventListener("DOMContentLoaded", () => {
        if (localStorage.getItem('theme') === 'dark') {
            document.cookie = 'theme=dark; path=/';
            document.getElementById('theme-switcher').setAttribute('checked', 'checked')
            document.getElementById('theme-switcher').setAttribute('title', 'Switch to light theme')
        }
    })
}

function adjustImgSizeOnMobile() {
    if (document.documentElement.clientWidth > 600) {
        document.querySelectorAll('img').forEach(img => {
            img.setAttribute('width', img.getAttribute('dwidth'));
            img.setAttribute('height', img.getAttribute('dheight'));
        })
    }
}

function tableOfContentsObserver() {
    if (document.documentElement.clientWidth > 1220) {
        let bottomOffset = (window.innerHeight - 30) * -1;
        const ops = { rootMargin: `0px 0px ${bottomOffset}px 0px` };

        // Retrieve all blog post headings with ids (h3 in my case)
        const headings = Array.from(document.querySelectorAll("h3[id]"));
        const allHeadingLinks = Array.from(document.querySelectorAll(".toc > ul > li > a"));

        // Once a scrolling event is detected, iterate all elements whose visibility changed and highlight their corresponding navigation link
        const scrollHandler = (entries) => {
            entries.forEach((entry) => {
                const heading = entry.target;
                const headingId = heading.id;
                const headingLink = document.querySelector(`.toc > ul > li > a[href="#${headingId}"]`);
                if (entry.isIntersecting) {
                    allHeadingLinks.forEach((headLink) => {
                        if (headLink !== headingLink) {
                            headLink.classList.remove("visible");
                        }
                    })
                    headingLink.classList.add("visible");
                }
            })
        }

        // Creates a new scroll observer
        const observer = new IntersectionObserver(scrollHandler, ops);

        //adds observer to all heading elements
        headings.forEach((heading) => observer.observe(heading));
    }
}

function addListenersOnCommentForm() {

    function addComment(e) {
        e.preventDefault()
        document.querySelector("#comment-form button").setAttribute("disabled", "disabled");
        let formData = new FormData(e.target)
        formData.append('post_id', e.target.getAttribute("data-post-id"))
        let data = {};
        for (const [key, value] of formData) {
            data[key] = value;
        }

        const response = async () => await fetch('/api/add-comment', { body: JSON.stringify(data), method: 'POST', headers: { 'Content-Type': 'application/json' } })

        response()
        .then(result => result.json())
        .then(data => {
            if(data.status === 'success') {
                document.getElementById("add-comment").setAttribute("disabled", "disabled");
                const commentFormMessageEl = document.getElementById("comment-msg");
                const commentForm = document.getElementById("comment-form");
                commentFormMessageEl.classList.add("success");
                commentForm.style.display = 'none';
                commentFormMessageEl.innerHTML = '<p>Your comment was successfully submitted. If all looks good, it\'ll be published within 24 hrs.</p>';
            }
        })
        .catch(() => {
            const commentFormMessageEl = document.getElementById("comment-msg");
                const commentForm = document.getElementById("comment-form");
                commentFormMessageEl.classList.add("error");
                commentFormMessageEl.innerHTML = '<p>Something went wrong. Maybe try again?</p>';
                document.querySelector("#comment-form button").removeAttribute("disabled");
        })
    }

    function toggleCommentForm() {
        if (!document.querySelector('.comment-form-holder').classList.toString().includes("show")) {
            document.querySelector('.comment-form-holder').classList.add('show')
            document.querySelector('textarea[name="comment"]').focus();
        } else {
            document.querySelector('.comment-form-holder').classList.remove('show')
        }
    }

    document.getElementById("comment-form").addEventListener("submit", addComment)
    document.getElementById("add-comment").addEventListener("click", toggleCommentForm)
}

export { themeManager, tableOfContentsObserver, addListenersOnCommentForm, adjustImgSizeOnMobile }
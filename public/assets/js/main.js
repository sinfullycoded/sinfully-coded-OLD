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

        // Retrieve all blog post headings with ids (h2 in my case)
        const headings = Array.from(document.querySelectorAll("h2[id]"));
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
        formData.append('post_title', e.target.getAttribute("data-post-title"))
        let data = {};
        for (const [key, value] of formData) {
            data[key] = value;
        }

        const response = async () => await fetch('/api/add-comment', { body: JSON.stringify(data), method: 'POST', headers: { 'Content-Type': 'application/json' } })

        response()
            .then(result => result.json())
            .then(data => {
                console.log(data)
                if (data.status === 'success') {
                    console.log(data.status)
                    const commentFormMessageEl = document.getElementById("comment-msg");
                    const commentForm = document.getElementById("comment-form");
                    commentFormMessageEl.classList.add("success");
                    commentForm.style.display = 'none';
                    commentFormMessageEl.innerHTML = '<p>Your comment was successfully submitted. If all looks good, it\'ll be published within 24 hrs.</p>';
                } else {
                    console.log(data.status)
                    const commentFormMessageEl = document.getElementById("comment-msg");
                    const commentForm = document.getElementById("comment-form");
                    commentFormMessageEl.classList.add("error");
                    commentFormMessageEl.innerHTML = '<p>Something went wrong. Maybe try again?</p>';
                }
            })
            .catch((err) => {
                if (err) {
                    console.error(err)
                    const commentFormMessageEl = document.getElementById("comment-msg");
                    const commentForm = document.getElementById("comment-form");
                    commentFormMessageEl.classList.add("error");
                    commentFormMessageEl.innerHTML = '<p>Something went wrong. Maybe try again?</p>';
                }
            })
    }

    document.getElementById("comment-form").addEventListener("submit", addComment)
}

function changeTabs(e) {
    e.preventDefault()
    document.querySelectorAll('.tabbed > ul > li a').forEach(a => {
        a.classList.remove("active")
    })

    e.currentTarget.classList.add("active");

    document.querySelectorAll('.tabbed > div[class^="tab"]').forEach(div => {
        div.style.display = "none";
        let targetDiv = e.currentTarget.href.split('#').pop();
        document.getElementsByClassName(targetDiv)[0].style.display = "block";
    })
}

export { themeManager, tableOfContentsObserver, addListenersOnCommentForm, adjustImgSizeOnMobile, changeTabs }
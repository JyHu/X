function updateActiveNav() {
    var t = window.location.pathname,
    n = document.querySelectorAll(".nav-link");
    n.forEach(function(n) {
        var e = n.getAttribute("href");
        e && (t.endsWith(e) || "/index.html" === e && t.endsWith("/")) ? n.classList.add("active") : n.classList.remove("active")
    })
}
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function(t) {
        t.addEventListener("click",
        function(t) {
            var n = this.getAttribute("href");
            if ("#" !== n) {
                t.preventDefault();
                var e = document.querySelector(n);
                e && e.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                })
            }
        })
    })
}
function initSidebarHighlight() {
    var t = document.querySelectorAll(".sidebar-nav a");
    if (0 !== t.length) {
        var n = Array.from(t).map(function(t) {
            var n = t.getAttribute("href");
            return n && n.startsWith("#") ? document.querySelector(n) : null
        }).filter(function(t) {
            return null !== t
        });
        if (0 !== n.length) {
            var e = new IntersectionObserver(function(n) {
                n.forEach(function(n) {
                    if (n.isIntersecting) {
                        var e = n.target.id;
                        t.forEach(function(t) {
                            t.getAttribute("href") === "#" + e ? t.classList.add("active") : t.classList.remove("active")
                        })
                    }
                })
            },
            {
                rootMargin: "-20% 0px -70% 0px",
                threshold: 0
            });
            n.forEach(function(t) {
                return e.observe(t)
            })
        }
    }
}
function initLazyLoad() {
    var t = document.querySelectorAll("img[data-src]"),
    n = new IntersectionObserver(function(t, e) {
        t.forEach(function(t) {
            if (t.isIntersecting) {
                var n = t.target;
                n.src = n.dataset.src,
                n.removeAttribute("data-src"),
                e.unobserve(n)
            }
        })
    });
    t.forEach(function(t) {
        return n.observe(t)
    })
}
function initMobileMenu() {
    var t = document.querySelector(".mobile-menu-btn"),
    n = document.querySelector(".nav");
    t && n && t.addEventListener("click",
    function() {
        n.classList.toggle("active"),
        t.classList.toggle("active")
    })
}
document.addEventListener("DOMContentLoaded",
function() {
    updateActiveNav(),
    initSmoothScroll(),
    initSidebarHighlight(),
    initLazyLoad(),
    initMobileMenu()
});
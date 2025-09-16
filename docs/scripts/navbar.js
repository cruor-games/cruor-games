/*v1.79 2025-08-28T08:39:42.841Z*/
import { auth } from "/scripts/config.js";

fetch("/navbar.html")
  .then((res) => res.text())
  .then((html) => {
    // Inietta l'HTML della navbar nel DOM
    document.getElementById("navbar-top").innerHTML = html;

    // Esegui la logica della navbar DOPO che l'HTML è stato caricato

    // 1. Gestione del menu utente
    const userIcon = document.getElementById("user-icon");
    const userDropdownMenu = document.getElementById("user-dropdown-menu");
    const dropdownAuthLink = document.getElementById("dropdown-auth-link");
    const userMenuContainer = document.querySelector(".user-menu-container");

    // Assicurati che gli elementi del menu utente esistano prima di gestirli
    if (userIcon && userDropdownMenu && dropdownAuthLink) {
      // Gestisci la visualizzazione del menu a tendina
      userIcon.addEventListener("click", (e) => {
        e.preventDefault();
        userDropdownMenu.classList.toggle("show");
      });

      // Nascondi il menu se l'utente clicca fuori
      document.addEventListener("click", (e) => {
        if (userMenuContainer && !userMenuContainer.contains(e.target)) {
          userDropdownMenu.classList.remove("show");
        }
      });

      // Aggiungi il listener per lo stato di autenticazione di Firebase
      // Nota: 'auth' deve essere definito in config.js e caricato prima di questo script
      auth.onAuthStateChanged((user) => {
        if (user) {
          // L'utente è loggato: mostra il link per il logout e il profilo
          dropdownAuthLink.textContent = "Logout";
          dropdownAuthLink.href = "#";

          // Clona e sostituisci per evitare listener multipli
          const oldLink = dropdownAuthLink;
          const newLink = oldLink.cloneNode(true);
          oldLink.parentNode.replaceChild(newLink, oldLink);

          newLink.addEventListener("click", async (e) => {
            e.preventDefault();
            await auth.signOut();
            window.location.href = "/auth.html";
          });
        } else {
          // L'utente non è loggato: mostra il link per il login
          dropdownAuthLink.textContent = "Login";
          dropdownAuthLink.href = "/auth.html";
        }
      });
    }

    // 2. Logica di evidenziazione della pagina corrente
    const path = window.location.pathname;
    const currentPage =
      path === "/" || path === "/seeker-ttrpg/"
        ? "index.html"
        : path.split("/").pop();

    document.querySelectorAll(".nav-link").forEach((link) => {
      const href = link.getAttribute("href");
      if (
        href.includes(currentPage) ||
        (currentPage === "index.html" &&
          (href === "index.html" || href === "./" || href === "/"))
      ) {
        link.classList.add("active");
      }
    });

    // 3. Logica per il menu mobile
    const toggleBtn = document.getElementById("navbar-toggle");
    const mobileMenu = document.getElementById("navbar-links-mobile");
    const closeBtn = document.getElementById("navbar-close");

    function openMenu() {
      mobileMenu.classList.add("show");
      mobileMenu.classList.remove("fade-out");
      closeBtn?.classList.add("rotated");

      const links = mobileMenu.querySelectorAll("li");
      links.forEach((li, i) => {
        li.style.animation = `slideIn 0.8s forwards`;
        li.style.animationDelay = `${0.1 * i}s`;
      });

      mobileMenu.style.animation = `fadeInBackground 0.4s forwards`;
    }

    function closeMenu() {
      closeBtn?.classList.remove("rotated");

      const links = mobileMenu.querySelectorAll("li");
      links.forEach((li, i) => {
        li.style.animation = `slideOut 0.3s forwards`;
        li.style.animationDelay = `${0.05 * i}s`;
      });

      mobileMenu.classList.add("fade-out");
      mobileMenu.style.animation = `fadeOutBackground 0.8s forwards`;

      setTimeout(() => {
        mobileMenu.classList.remove("show", "fade-out");
        links.forEach((li) => {
          li.style.opacity = "";
          li.style.transform = "";
          li.style.animation = "";
          li.style.animationDelay = "";
        });
        mobileMenu.style.removeProperty("animation");
      }, 50);
    }

    toggleBtn?.addEventListener("click", openMenu);
    closeBtn?.addEventListener("click", closeMenu);

    mobileMenu?.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    // 4. Inserisci il <title> della pagina nella navbar (senza "Seeker TTRPG")
    let pageTitle = document.title;

    // Rimuovi "Seeker TTRPG" e spazi/puntini vari
    pageTitle = pageTitle.replace("Seeker TTRPG", "").trim();

    // Se rimane un separatore "•" all'inizio o alla fine, toglilo
    pageTitle = pageTitle.replace(/^•\s*/, "").replace(/\s*•$/, "").trim();

    const pageNameSpan = document.querySelector(".page-name");
    if (pageNameSpan) {
      pageNameSpan.textContent = pageTitle;
    }
  });

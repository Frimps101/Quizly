// Mobile nav toggle
const toggle = document.getElementById("navToggle");
const links = document.getElementById("navLinks");

toggle.addEventListener("click", () => {
  links.classList.toggle("open");
});

// Close the mobile menu after tapping a link
links.querySelectorAll("a").forEach((a) => {
  a.addEventListener("click", () => links.classList.remove("open"));
});

// Subtle shadow on the nav once the user scrolls
const nav = document.getElementById("nav");
const onScroll = () => {
  nav.style.boxShadow = window.scrollY > 8 ? "0 6px 18px rgba(15,10,30,0.06)" : "none";
};
window.addEventListener("scroll", onScroll);
onScroll();

// Current year in the footer
document.getElementById("year").textContent = new Date().getFullYear();

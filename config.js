// Central Configuration for Moore County Junk Removal
// Easily swap these settings to update the entire site for your renter!

const SITE_CONFIG = {
    businessName: "Moore County Junk Removal",
    phoneDisplay: "(910) 420-8159",
    phoneLink: "tel:+19104208159",
    email: "info@moorecountyjunkremoval.com",
    formAction: "https://formspree.io/f/xknadjyb", // Replace with renter's Formspree/Formspark ID
    bookingUrl: "#contact"
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Update all dynamic phone link hrefs (e.g. href="tel:...")
    document.querySelectorAll(".dynamic-phone-link").forEach(el => {
        el.href = SITE_CONFIG.phoneLink;
    });

    // 2. Update all dynamic phone display texts
    document.querySelectorAll(".dynamic-phone-text").forEach(el => {
        // If it's a link, we don't want to overwrite the icon if there is one, but we check if it is just a tel link
        if (el.tagName === 'A' && el.childNodes.length > 1) {
            // Keep the icon if it has one (like 📞 Call Now)
            const iconNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE && node.textContent.includes('📞'));
            if (iconNode) {
                iconNode.textContent = `📞 ${SITE_CONFIG.phoneDisplay}`;
                return;
            }
        }
        el.textContent = SITE_CONFIG.phoneDisplay;
    });

    // 3. Update all dynamic business name references
    document.querySelectorAll(".dynamic-business-name").forEach(el => {
        el.textContent = SITE_CONFIG.businessName;
    });

    // 4. Update all dynamic email links
    document.querySelectorAll(".dynamic-email-link").forEach(el => {
        el.href = `mailto:${SITE_CONFIG.email}`;
        el.textContent = SITE_CONFIG.email;
    });

    // 5. Update dynamic form action targets
    document.querySelectorAll(".dynamic-lead-form").forEach(el => {
        el.action = SITE_CONFIG.formAction;
    });

    // 6. Setup FAQ Accordion Toggles
    document.querySelectorAll(".faq-question").forEach(questionEl => {
        questionEl.addEventListener("click", () => {
            const item = questionEl.parentElement;
            const isActive = item.classList.contains("active");
            
            // Close all items
            document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("active"));
            
            // Toggle clicked item
            if (!isActive) {
                item.classList.add("active");
            }
        });
    });
});

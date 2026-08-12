export default function Footer() {
  return (
      
      <footer className="hm-footer">
        <div className="hm-footer-inner">
          {/* Brand */}
          <div className="hm-foot-brand">
            <div className="hm-foot-logo">
              <span className="hm-foot-mark"><img src="/images//web-logo.avif"></img></span>
              <span className="hm-foot-name">
                Pizzeria <span>Con Amore</span>.
              </span>
            </div>
            <p className="hm-foot-tag">
              Fresh, local, fast. Stone-baked pizza and kitchen favourites delivered across our
              service areas.
            </p>
            <div className="hm-foot-social">
              <a href="#" aria-label="Facebook" className="hm-soc">f</a>
              <a href="#" aria-label="Instagram" className="hm-soc">in</a>
              <a href="#" aria-label="X" className="hm-soc">✕</a>
            </div>
          </div>

          {/* Contact */}
          <div className="hm-foot-col">
            <h4>Get in touch</h4>
            <ul className="hm-foot-contact">
              <li>
                <span className="hm-foot-ic">📍</span>
                <span>
                  Musterstraße 12
                  <br />
                  10115 Berlin, Germany
                </span>
              </li>
              <li>
                <span className="hm-foot-ic">✉️</span>
                <a href="mailto:hello@pizzeriaConAmore.com">hello@pizzeriaConAmore.com</a>
              </li>
              <li>
                <span className="hm-foot-ic">📞</span>
                <a href="tel:+493012345678">+49 30 1234 5678</a>
              </li>
            </ul>
          </div>

          {/* Links */}
          <div className="hm-foot-col">
            <h4>Explore</h4>
            <ul className="hm-foot-links">
              <li><a href="/">Home</a></li>
              <li><a href="/products">Menu</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>

          {/* Hours */}
          <div className="hm-foot-col">
            <h4>Opening hours</h4>
            <ul className="hm-foot-hours">
              <li>
                <span>Mon – Thu</span>
                <span>11:00 – 22:00</span>
              </li>
              <li>
                <span>Fri – Sat</span>
                <span>11:00 – 23:30</span>
              </li>
              <li>
                <span>Sunday</span>
                <span>12:00 – 22:00</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="hm-foot-bottom">
          <span>© {new Date().getFullYear()} Pizzeria Con Amore. All rights reserved.</span>
          <div className="hm-foot-legal">
            <a href="/imprint">Imprint</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
        </div>
      </footer>
  );
}
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("Footer");

  return (
    <footer className="hm-footer">
      <div className="hm-footer-inner">

        {/* Brand */}
        <div className="hm-foot-brand">
          <div className="hm-foot-logo">
            <span className="hm-foot-mark">
              <img src="/images/web-logo.avif" alt="Pizzeria Con Amore" />
            </span>

            <span className="hm-foot-name">
              Pizzeria <span>Con Amore</span>.
            </span>
          </div>

          <p className="hm-foot-tag">
            {t("tagline")}
          </p>

          <div className="hm-foot-social">
            <a href="#" aria-label={t("social.facebook")} className="hm-soc">
              f
            </a>
            <a href="#" aria-label={t("social.instagram")} className="hm-soc">
              in
            </a>
            <a href="#" aria-label={t("social.x")} className="hm-soc">
              ✕
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="hm-foot-col">
          <h4>{t("contact.title")}</h4>

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
              <a href="mailto:hello@pizzeriaConAmore.com">
                hello@pizzeriaConAmore.com
              </a>
            </li>

            <li>
              <span className="hm-foot-ic">📞</span>
              <a href="tel:+493012345678">
                +49 30 1234 5678
              </a>
            </li>
          </ul>
        </div>

        {/* Links */}
        <div className="hm-foot-col">
          <h4>{t("explore.title")}</h4>

          <ul className="hm-foot-links">
            <li>
              <a href="/">{t("explore.home")}</a>
            </li>
            <li>
              <a href="/products">{t("explore.menu")}</a>
            </li>
            <li>
              <a href="/contact">{t("explore.contact")}</a>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div className="hm-foot-col">
          <h4>{t("hours.title")}</h4>

          <ul className="hm-foot-hours">
            <li>
              <span>{t("hours.mondayThursday")}</span>
              <span>11:00 – 22:00</span>
            </li>

            <li>
              <span>{t("hours.fridaySaturday")}</span>
              <span>11:00 – 23:30</span>
            </li>

            <li>
              <span>{t("hours.sunday")}</span>
              <span>12:00 – 22:00</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="hm-foot-bottom">
        <span>
          {t("bottom.copyright", {
            year: new Date().getFullYear()
          })}
        </span>

        <div className="hm-foot-legal">
          <a href="/imprint">{t("bottom.imprint")}</a>
          <a href="/privacy">{t("bottom.privacy")}</a>
          <a href="/terms">{t("bottom.terms")}</a>
        </div>
      </div>
    </footer>
  );
}
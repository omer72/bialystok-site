import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../hooks/useLanguage';
import { usePages, PageDef } from '../hooks/usePages';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  const { getLocalizedText } = useLanguage();
  const { navPages, getChildren } = usePages();

  const MAX_NAV_ITEMS = 7;
  const visiblePages = navPages.slice(0, MAX_NAV_ITEMS);
  const morePages = navPages.slice(MAX_NAV_ITEMS);

  const isActive = (slug: string) => location.pathname === slug;

  const renderNavItem = (page: PageDef) => {
    const children = page.children ? getChildren(page.id) : [];
    const hasDropdown = children.length > 0;

    if (hasDropdown) {
      return (
        <li
          key={page.id}
          className="nav-item has-dropdown"
          onMouseEnter={() => setOpenDropdown(page.id)}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <Link
            to={page.slug}
            className={`nav-link ${isActive(page.slug) ? 'active' : ''}`}
            onClick={() => setMenuOpen(false)}
          >
            {getLocalizedText(page.title)}
          </Link>
          {openDropdown === page.id && (
            <ul className="dropdown-menu">
              {children.map((child) => (
                <li key={child.id}>
                  <Link
                    to={child.slug}
                    className="dropdown-link"
                    onClick={() => {
                      setMenuOpen(false);
                      setOpenDropdown(null);
                    }}
                  >
                    {getLocalizedText(child.title)}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }

    return (
      <li key={page.id} className="nav-item">
        <Link
          to={page.slug}
          className={`nav-link ${isActive(page.slug) ? 'active' : ''}`}
          onClick={() => setMenuOpen(false)}
        >
          {getLocalizedText(page.title)}
        </Link>
      </li>
    );
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="logo-text">{getLocalizedText({ he: 'ביאליסטוק', en: 'Bialystok' })}</span>
        </Link>

        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul className={`nav-list ${menuOpen ? 'open' : ''}`}>
          {visiblePages.map(renderNavItem)}

          {morePages.length > 0 && (
            <li
              className="nav-item has-dropdown"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button className="nav-link more-btn">
                {getLocalizedText({ he: 'עוד', en: 'More' })} ▾
              </button>
              {moreOpen && (
                <ul className="dropdown-menu">
                  {morePages.map((page) => (
                    <li key={page.id}>
                      <Link
                        to={page.slug}
                        className="dropdown-link"
                        onClick={() => {
                          setMenuOpen(false);
                          setMoreOpen(false);
                        }}
                      >
                        {getLocalizedText(page.title)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )}

          <li className="nav-item nav-lang">
            <LanguageSwitcher />
          </li>
        </ul>

        <div className="navbar-social">
          <a href="https://www.instagram.com/bialystok_israel/" target="_blank" rel="noopener" aria-label="Instagram">📷</a>
          <a href="https://www.facebook.com/profile.php?id=100064773498498" target="_blank" rel="noopener" aria-label="Facebook">📘</a>
          <a href="https://www.youtube.com/@user-fk9ue3ds7g" target="_blank" rel="noopener" aria-label="YouTube">🎬</a>
        </div>
      </div>
    </nav>
  );
}

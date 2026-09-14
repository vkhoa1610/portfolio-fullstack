import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

/**
 * Root of the site — redirects to /home in the *current* locale.
 * useBaseUrl only prepends baseUrl (`/portfolio-fullstack/`), not the locale
 * segment; so at /de/ we must prepend `/de` ourselves, otherwise the browser
 * ends up at `/portfolio-fullstack/vi/de/home` (locale switcher stacks).
 */
export default function Home(): JSX.Element {
  const {i18n} = useDocusaurusContext();
  const localePrefix =
    i18n.currentLocale === i18n.defaultLocale ? '' : `/${i18n.currentLocale}`;
  return <Redirect to={useBaseUrl(`${localePrefix}/home`)} />;
}

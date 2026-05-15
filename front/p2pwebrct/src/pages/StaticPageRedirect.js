import { useEffect } from 'react';

/** Полная перезагрузка на статический .html (обход React Router). */
export default function StaticPageRedirect({ to }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return null;
}

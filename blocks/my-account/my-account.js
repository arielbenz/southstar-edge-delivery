/**
 * my-account.js — EDS entry point
 * Requires authentication to render.
 */
import { isAuthenticated, getUserId } from '../../scripts/utils/auth.js';
import { loadReact } from '../../scripts/utils/react-loader.js';

export default async function decorate(block) {
  block.innerHTML = '';

  if (!isAuthenticated()) {
    window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  const userId = getUserId();
  const mountPoint = document.createElement('div');
  mountPoint.classList.add('my-account-mount');
  block.append(mountPoint);

  const [{ React, ReactDOM }, { default: MyAccount }] = await Promise.all([
    loadReact(),
    import('./components/MyAccount.bundle.js'),
  ]);

  const root = ReactDOM.createRoot(mountPoint);
  root.render(React.createElement(MyAccount, { userId }));
}

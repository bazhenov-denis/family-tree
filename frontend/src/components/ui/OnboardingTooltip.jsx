import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'ft_onboarding_dismissed';

function getDismissed() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
}

function dismiss(id) {
  const dismissed = getDismissed();
  if (!dismissed.includes(id)) {
    dismissed.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissed));
  }
}

export function useOnboarding() {
  const [dismissed, setDismissed] = useState(getDismissed());

  function handleDismiss(id) {
    dismiss(id);
    setDismissed(getDismissed());
  }

  function isDismissed(id) {
    return dismissed.includes(id);
  }

  return { isDismissed, dismiss: handleDismiss };
}

/**
 * OnboardingTooltip — shows a tooltip near a target element until dismissed.
 * Usage:
 *   <OnboardingTooltip id="graph-add-first" content="Нажмите чтобы добавить первого человека">
 *     <button>Добавить</button>
 *   </OnboardingTooltip>
 */
export default function OnboardingTooltip({ id, content, children }) {
  const [dismissed, setDismissed] = useState(() => getDismissed().includes(id));

  if (dismissed) return children;

  function handleClose() {
    dismiss(id);
    setDismissed(true);
  }

  return (
    <div className="onboarding-wrapper">
      {children}
      <div className="onboarding-tooltip">
        <button className="onboarding-close" onClick={handleClose} aria-label="Закрыть подсказку">
          <X size={12} />
        </button>
        <p className="onboarding-text">{content}</p>
      </div>
    </div>
  );
}

import { t } from 'i18next';

import { flagsHooks } from '@/hooks/flags-hooks';

const FullLogo = () => {
  const branding = flagsHooks.useWebsiteBranding();

  return (
    <div className="h-[100px] mt-4 mb-4 flex items-center justify-center">
      <img
        className="max-h-[300px] max-w-[300px] mb-4 object-contain"
        src={branding.logos.fullLogoUrl}
        alt={t('logo')}
      />
    </div>
  );
};
FullLogo.displayName = 'FullLogo';
export { FullLogo };

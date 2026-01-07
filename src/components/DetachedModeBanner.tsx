import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { WarningBanner, BannerLink } from "./shared/WarningBanner";

interface DetachedModeBannerProps {
  isActive: boolean;
  onLearnMore: () => void;
}

/**
 * Detached Mode Banner - displays a warning banner at the top of the app
 * when Canon Guard is operating in detached mode (not attached to the Safe).
 * This warns users that their Safe is not protected by Canon Guard.
 */
export const DetachedModeBanner = ({ isActive, onLearnMore }: DetachedModeBannerProps) => {
  if (!isActive) return null;

  return (
    <WarningBanner backgroundColor={canonHeaderTokens.status.amber}>
      Canon Guard is detached and not securing this Safe. <BannerLink onClick={onLearnMore}>Learn more</BannerLink>
    </WarningBanner>
  );
};

import { canonHeaderTokens } from "~/config/themes/safeTheme";
import { WarningBanner } from "./shared/WarningBanner";

interface EmergencyModeBannerProps {
  isActive: boolean;
}

/**
 * Emergency Mode Banner - displays a red banner at the top of the app
 * when emergency mode is active. Should be rendered above the Header
 * in all screens.
 */
export const EmergencyModeBanner = ({ isActive }: EmergencyModeBannerProps) => {
  if (!isActive) return null;

  return <WarningBanner backgroundColor={canonHeaderTokens.status.red}>Emergency Mode Activated</WarningBanner>;
};

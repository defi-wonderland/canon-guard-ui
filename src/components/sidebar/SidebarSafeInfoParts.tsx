import React from "react";
import { Language, MoreVert } from "@mui/icons-material";
import { Box, Typography, IconButton, Chip, Tooltip, useTheme, styled } from "@mui/material";
import { VaultInfo } from "~/types/canon-guard";
import { truncateAddress } from "~/utils";
import safeLogoBlack from "~/assets/safe-logo-black.png";
import safeLogoWhite from "~/assets/safe-logo-white.png";

interface SidebarSafeInfoPartProps {
  safeInfo: VaultInfo;
  onMenuClick: (event: React.MouseEvent<HTMLElement>) => void;
}

// Collapsed state component
export const SidebarSafeInfoCollapsed = ({ safeInfo, onMenuClick }: SidebarSafeInfoPartProps) => {
  const theme = useTheme();

  return (
    <>
      <Tooltip title={`Safe: ${safeInfo.address}`} placement='right'>
        <SafeLogoWrapper>
          <SafeLogo src={theme.palette.mode === "dark" ? safeLogoWhite : safeLogoBlack} alt='Safe Logo' />
        </SafeLogoWrapper>
      </Tooltip>
      <Tooltip title='More options' placement='right'>
        <IconButton onClick={onMenuClick} size='small' sx={{ color: "text.secondary" }}>
          <MoreVert fontSize='small' />
        </IconButton>
      </Tooltip>
    </>
  );
};

// Expanded state component
export const SidebarSafeInfoExpanded = ({ safeInfo, onMenuClick }: SidebarSafeInfoPartProps) => {
  const theme = useTheme();

  const formatAddress = (address: string) => truncateAddress(address);

  return (
    <>
      <SafeHeader>
        <SafeLogoWrapper>
          <SafeLogo src={theme.palette.mode === "dark" ? safeLogoWhite : safeLogoBlack} alt='Safe Logo' />
        </SafeLogoWrapper>
        <SafeDetails>
          <SafeTitle variant='subtitle2'>Canon Vault</SafeTitle>
          <SafeAddress variant='caption' onClick={() => navigator.clipboard.writeText(safeInfo.address)}>
            {formatAddress(safeInfo.address)}
          </SafeAddress>
        </SafeDetails>
        <IconButton onClick={onMenuClick} size='small' sx={{ color: "text.secondary" }}>
          <MoreVert fontSize='small' />
        </IconButton>
      </SafeHeader>

      <SafeMetrics>
        <MetricItem>
          <MetricLabel variant='caption'>Network</MetricLabel>
          <NetworkChip label={<Language fontSize='small' />} size='small' />
        </MetricItem>
        <MetricItem>
          <MetricLabel variant='caption'>Threshold</MetricLabel>
          <MetricValue variant='body2'>
            {safeInfo.threshold}/{safeInfo.totalOwners}
          </MetricValue>
        </MetricItem>
      </SafeMetrics>
    </>
  );
};

// Shared styled components
const SafeLogoWrapper = styled(Box)(() => ({
  width: 32,
  height: 32,
  borderRadius: "50%",
  overflow: "hidden",
  flexShrink: 0,
}));

const SafeLogo = styled("img")(() => ({
  width: "100%",
  height: "100%",
  objectFit: "cover",
}));

const SafeHeader = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  gap: 12,
}));

const SafeDetails = styled(Box)(() => ({
  flex: 1,
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
}));

const SafeTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  lineHeight: 1.2,
}));

const SafeAddress = styled(Typography)(({ theme }) => ({
  fontFamily: "monospace",
  color: theme.palette.text.secondary,
  cursor: "pointer",
  "&:hover": {
    color: theme.palette.primary.main,
  },
}));

const SafeMetrics = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginTop: theme.spacing(1),
}));

const MetricItem = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  flex: 1,
}));

const MetricLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginBottom: 4,
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

const NetworkChip = styled(Chip)(({ theme }) => ({
  height: 20,
  fontSize: "0.75rem",
  color: theme.palette.primary.main,
  backgroundColor: theme.palette.primary.main + "20",
  "& .MuiChip-label": {
    padding: "0 6px",
  },
}));

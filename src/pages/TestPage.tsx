/**
 * Test Page for Component Development
 *
 * This page shows various components in isolation for easy testing and iteration.
 * Access at: /test
 */

import { useState } from "react";
import { Box, Typography, styled, Divider, Button } from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NonceSelector } from "~/components/NonceSelector";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import type { QueueItem } from "~/services/queueService";

// Mock queue items for testing
const mockQueueItems: QueueItem[] = [
  {
    actionBuilderAddress: "0x1111111111111111111111111111111111111111",
    label: "Empty USDC Transfer",
    factoryLabel: "Transfer",
    nonce: 2,
    approversCount: 2,
    threshold: 3,
    executableAt: new Date(Date.now() + 3600000), // 1 hour from now
    expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
  },
  {
    actionBuilderAddress: "0x2222222222222222222222222222222222222222",
    label: "Deposit to Vault",
    factoryLabel: "Arbitrary Action",
    nonce: 2, // Same nonce - will show the one with more sigs
    approversCount: 1,
    threshold: 3,
    executableAt: new Date(Date.now() + 7200000),
    expiresAt: new Date(Date.now() + 86400000),
  },
  {
    actionBuilderAddress: "0x3333333333333333333333333333333333333333",
    label: "Claim Rewards",
    factoryLabel: "Claim Allowance",
    nonce: 3,
    approversCount: 1,
    threshold: 3,
    executableAt: new Date(Date.now() + 1800000),
    expiresAt: new Date(Date.now() + 86400000),
  },
];

export const TestPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // State for interactive nonce selectors
  const [selectedNonce1, setSelectedNonce1] = useState(4);
  const [selectedNonce2, setSelectedNonce2] = useState(0);
  const [selectedNonce3, setSelectedNonce3] = useState(2);

  // Get safeAddress and chainId from URL params (to preserve in navigation)
  const safeAddress = searchParams.get("safeAddress") || "0x9c798F32A328292b296d9B4AD4aEbC69ed012554";
  const chainId = searchParams.get("chainId") || "10";

  // Test navigation to sign flow
  const handleTestSignFlow = (hasExistingSignatures: boolean) => {
    const state = {
      actionBuilderAddress: "0x1111111111111111111111111111111111111111",
      label: hasExistingSignatures ? "Existing Signed Transfer" : "New Unsigned Transfer",
      factoryLabel: "Transfer",
      nonce: hasExistingSignatures ? 2 : 5,
      approversCount: hasExistingSignatures ? 2 : 0,
      threshold: 3,
    };
    navigate(`/queue/sign?safeAddress=${safeAddress}&chainId=${chainId}`, { state });
  };

  return (
    <Container>
      <Title>Component Test Page</Title>
      <Subtitle>Use this page to test and iterate on components in isolation</Subtitle>

      <Section>
        <SectionTitle>Queue Sign Flow Test</SectionTitle>
        <TestCase>
          <TestLabel>Navigate to Sign Flow</TestLabel>
          <TestDescription>
            Test the signing flow from queue items. The first button simulates a new unsigned item (editable nonce), the
            second simulates an item with existing signatures (locked nonce).
          </TestDescription>
          <ButtonRow>
            <TestButton onClick={() => handleTestSignFlow(false)}>Sign New Item (editable nonce)</TestButton>
            <TestButton onClick={() => handleTestSignFlow(true)}>Sign Existing Item (locked nonce)</TestButton>
          </ButtonRow>
        </TestCase>
      </Section>

      <Divider sx={{ my: 4, borderColor: canonHeaderTokens.foreground.accent40 }} />

      <Section>
        <SectionTitle>NonceSelector Component</SectionTitle>

        {/* Scenario 1: With queue items */}
        <TestCase>
          <TestLabel>With Queue Items (recommended = 4)</TestLabel>
          <TestDescription>
            Shows nonces with existing queue items. #2 has "Empty USDC Transfer" (picked over "Deposit to Vault" because
            it has more signatures). #3 has "Claim Rewards".
          </TestDescription>
          <NonceSelector
            currentNonce={0}
            recommendedNonce={4}
            selectedNonce={selectedNonce1}
            onNonceChange={setSelectedNonce1}
            queueItems={mockQueueItems}
          />
          <SelectedValue>Selected: #{selectedNonce1}</SelectedValue>
        </TestCase>

        <Divider sx={{ my: 3, borderColor: canonHeaderTokens.foreground.accent40 }} />

        {/* Scenario 2: Empty queue */}
        <TestCase>
          <TestLabel>Empty Queue (recommended = current = 0)</TestLabel>
          <TestDescription>
            When there are no items in the queue, the recommended nonce equals the current Safe nonce.
          </TestDescription>
          <NonceSelector
            currentNonce={0}
            recommendedNonce={0}
            selectedNonce={selectedNonce2}
            onNonceChange={setSelectedNonce2}
            queueItems={[]}
          />
          <SelectedValue>Selected: #{selectedNonce2}</SelectedValue>
        </TestCase>

        <Divider sx={{ my: 3, borderColor: canonHeaderTokens.foreground.accent40 }} />

        {/* Scenario 3: Read-only mode */}
        <TestCase>
          <TestLabel>Read-Only Mode (for signing existing queue items)</TestLabel>
          <TestDescription>
            When a user clicks "Sign" on an existing queue item, the nonce is locked and shown as read-only text.
          </TestDescription>
          <NonceSelector
            currentNonce={0}
            recommendedNonce={4}
            selectedNonce={selectedNonce3}
            onNonceChange={setSelectedNonce3}
            queueItems={mockQueueItems}
            isReadOnly={true}
          />
        </TestCase>

        <Divider sx={{ my: 3, borderColor: canonHeaderTokens.foreground.accent40 }} />

        {/* Scenario 4: High nonce range */}
        <TestCase>
          <TestLabel>High Nonce Values</TestLabel>
          <TestDescription>Testing with higher nonce values to ensure proper display.</TestDescription>
          <NonceSelector
            currentNonce={150}
            recommendedNonce={155}
            selectedNonce={155}
            onNonceChange={() => {}}
            queueItems={[
              {
                actionBuilderAddress: "0x4444444444444444444444444444444444444444",
                label: "Large Transfer #152",
                factoryLabel: "Transfer",
                nonce: 152,
                approversCount: 3,
                threshold: 3,
                executableAt: new Date(),
                expiresAt: new Date(Date.now() + 86400000),
              },
            ]}
          />
        </TestCase>
      </Section>
    </Container>
  );
};

// Styled Components
const Container = styled(Box)({
  display: "flex",
  flexDirection: "column",
  padding: "40px 60px",
  minHeight: "100vh",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const Title = styled(Typography)({
  fontSize: "32px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent0,
  marginBottom: "8px",
});

const Subtitle = styled(Typography)({
  fontSize: "16px",
  color: canonHeaderTokens.foreground.accent10,
  marginBottom: "40px",
});

const Section = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "24px",
});

const SectionTitle = styled(Typography)({
  fontSize: "24px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent0,
  marginBottom: "16px",
});

const TestCase = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  padding: "24px",
  backgroundColor: canonHeaderTokens.background.layer1,
  borderRadius: "12px",
});

const TestLabel = styled(Typography)({
  fontSize: "16px",
  fontWeight: 600,
  color: canonHeaderTokens.foreground.accent0,
});

const TestDescription = styled(Typography)({
  fontSize: "14px",
  color: canonHeaderTokens.foreground.accent10,
  marginBottom: "8px",
});

const SelectedValue = styled(Typography)({
  fontSize: "13px",
  fontFamily: "monospace",
  color: canonHeaderTokens.brand.green,
  marginTop: "8px",
});

const ButtonRow = styled(Box)({
  display: "flex",
  gap: "16px",
  marginTop: "8px",
});

const TestButton = styled(Button)({
  backgroundColor: canonHeaderTokens.brand.green,
  color: "#000",
  padding: "12px 24px",
  borderRadius: "8px",
  fontWeight: 600,
  fontSize: "14px",
  textTransform: "none",
  "&:hover": {
    backgroundColor: "#8ae58a",
  },
});

export default TestPage;

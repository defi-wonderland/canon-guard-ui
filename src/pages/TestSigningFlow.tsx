import { useState, useEffect } from "react";
import { Box, styled } from "@mui/material";
import { useSearchParams } from "react-router-dom";
import { optimism } from "viem/chains";
import { Header } from "~/components/Header";
import { SigningFlowStep } from "~/components/NewAction/steps";
import type { TransferFormData } from "~/components/NewAction/steps";
import { canonHeaderTokens } from "~/config/themes/safeTheme";
import type { TransactionStep } from "~/services/transactionBuilderService";

// Mock Safe address for testing
const MOCK_SAFE_ADDRESS = "0x9c798F32A328292b296d9B4AD4aEbC69ed012554";

// Mock form data for testing
const MOCK_FORM_DATA: TransferFormData = {
  title: "Bankless Transfer 2025-2026",
  tokenAddress: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  recipientAddress: "0x4a9dE4AeA32B0B3e2711b8EEB85B5E209cB65EB5",
  amount: "1000000",
};

// Mock transaction steps for testing (7 steps to match Figma)
const createMockSteps = (): TransactionStep[] => [
  {
    id: "deploy-action",
    title: "Deploy Contract",
    description: "Deploy the transfer action builder contract",
    status: "pending",
    to: "0x55402f682b3FbD58eaE1d6E990FF8D086B2F9F61",
    data: "0x096b81919b8fad769c5f9afa23efbbc5699812e21d94dc5fed8db69de67d1b6f",
  },
  {
    id: "save-canon-list",
    title: "Save to Canon List",
    description: "Save the action builder to Canon Guard Registry",
    status: "pending",
    to: "0x1d6f006964fBDf260B06cA38283Ec952B51f4f84",
    data: "0xa1b2c3d4e5f6789012345678901234567890abcdef",
  },
  {
    id: "add-to-queue",
    title: "Add to Queue",
    description: "Add transaction to Canon Guard queue",
    status: "pending",
    to: "0x4E4536447B3f4adf2B62a1212f27Bd1B077b135D",
    data: "0x1234567890abcdef1234567890abcdef1234567890abcdef",
  },
  {
    id: "sign-transaction",
    title: "Sign",
    description: "Sign the transaction in Safe",
    status: "pending",
    to: "0x9c798F32A328292b296d9B4AD4aEbC69ed012554",
    data: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
  },
  {
    id: "pre-approval-deploy",
    title: "Pre-Approval: Deploy Contract",
    description: "Deploy the pre-approval action",
    status: "pending",
    to: "0x55402f682b3FbD58eaE1d6E990FF8D086B2F9F61",
    data: "0x5566778899aabbccddeeff00112233445566778899aabbcc",
  },
  {
    id: "pre-approval-queue",
    title: "Pre-Approval: Add to Queue",
    description: "Add pre-approval to Canon Guard queue",
    status: "pending",
    to: "0x4E4536447B3f4adf2B62a1212f27Bd1B077b135D",
    data: "0xaabbccddeeff00112233445566778899aabbccddeeff0011",
  },
  {
    id: "pre-approval-sign",
    title: "Pre-Approval: Sign",
    description: "Sign the pre-approval in Safe",
    status: "pending",
    to: "0x9c798F32A328292b296d9B4AD4aEbC69ed012554",
    data: "0x00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
  },
];

export const TestSigningFlow = () => {
  const [searchParams] = useSearchParams();
  const showComplete = searchParams.get("complete") === "true";

  // Create steps with all signed if showing complete state
  const createInitialSteps = () => {
    const mockSteps = createMockSteps();
    if (showComplete) {
      return mockSteps.map((step) => ({ ...step, status: "signed" as const }));
    }
    return mockSteps;
  };

  const [steps, setSteps] = useState<TransactionStep[]>(createInitialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(showComplete ? 7 : 0);

  // Update when URL changes
  useEffect(() => {
    if (showComplete) {
      setSteps(createMockSteps().map((step) => ({ ...step, status: "signed" as const })));
      setCurrentStepIndex(7);
    } else {
      setSteps(createMockSteps());
      setCurrentStepIndex(0);
    }
  }, [showComplete]);

  const isComplete = steps.every((s) => s.status === "signed");

  const handleSimulateSign = () => {
    if (currentStepIndex >= steps.length) return;

    // Step 1: Set current step to "waiting"
    const waitingSteps = [...steps];
    waitingSteps[currentStepIndex] = {
      ...waitingSteps[currentStepIndex],
      status: "waiting",
    };
    setSteps(waitingSteps);

    // Step 2: After 3 seconds, mark as signed and advance
    setTimeout(() => {
      setSteps((prev) => {
        const updatedSteps = [...prev];
        updatedSteps[currentStepIndex] = {
          ...updatedSteps[currentStepIndex],
          status: "signed",
        };
        // Set next step to pending (ready to sign)
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < updatedSteps.length) {
          updatedSteps[nextIndex] = {
            ...updatedSteps[nextIndex],
            status: "pending",
          };
        }
        return updatedSteps;
      });
      setCurrentStepIndex((prev) => prev + 1);
    }, 3000);
  };

  const handleBack = () => {
    // Reset for testing
    setSteps(createMockSteps());
    setCurrentStepIndex(0);
  };

  const handleNavigateToCreate = () => {
    // Reset for testing
    setSteps(createMockSteps());
    setCurrentStepIndex(0);
  };

  const handleClearConfig = () => {
    // For test route, just reset the flow
    setSteps(createMockSteps());
    setCurrentStepIndex(0);
  };

  return (
    <PageContainer>
      <Header safeAddress={MOCK_SAFE_ADDRESS} chain={optimism} queueCount={10} onClearConfig={handleClearConfig} />
      <MainContent>
        <SigningFlowStep
          steps={steps}
          currentStepIndex={currentStepIndex}
          formData={MOCK_FORM_DATA}
          onBack={handleBack}
          onNavigateToCreate={handleNavigateToCreate}
          onSimulateSign={handleSimulateSign}
          isComplete={isComplete}
        />
      </MainContent>
    </PageContainer>
  );
};

const PageContainer = styled(Box)({
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  width: "100%",
  backgroundColor: canonHeaderTokens.background.layer0,
});

const MainContent = styled(Box)({
  flex: 1,
  overflow: "auto",
  backgroundColor: canonHeaderTokens.background.layer0,
});

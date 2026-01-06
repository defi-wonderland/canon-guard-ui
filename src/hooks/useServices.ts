import { useStateContext } from "./useStateContext";

export const useSafeService = () => {
  const { services } = useStateContext();
  return services.safeService;
};

export const useCanonGuardService = () => {
  const { services } = useStateContext();
  return services.canonGuardService;
};

export const useClientService = () => {
  const { services } = useStateContext();
  return services.clientService;
};

export const useQueueService = () => {
  const { services } = useStateContext();
  return services.queueService;
};

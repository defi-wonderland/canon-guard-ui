import { useStateContext } from "./useStateContext";

export const useSafeService = () => {
  const { services } = useStateContext();
  return services.safeService;
};

export const useCanonGuardService = () => {
  const { services } = useStateContext();
  return services.canonGuardService;
};

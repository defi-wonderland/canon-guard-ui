import { useCallback } from "react";
import { useNavigate, useSearchParams, NavigateOptions } from "react-router-dom";

interface NavigateWithParamsOptions extends NavigateOptions {
  /** Additional search params to add to the URL */
  additionalParams?: Record<string, string>;
}

/**
 * Hook that provides navigation while preserving safeAddress, chainId, and guardAddress query params.
 * This allows users to share URLs that include the Safe context (including detached mode).
 */
export const useNavigateWithParams = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const navigateWithParams = useCallback(
    (to: string, options?: NavigateWithParamsOptions) => {
      const safeAddress = searchParams.get("safeAddress");
      const chainId = searchParams.get("chainId");
      const guardAddress = searchParams.get("guardAddress");

      // Build the search params string
      const params = new URLSearchParams();
      if (safeAddress) params.set("safeAddress", safeAddress);
      if (chainId) params.set("chainId", chainId);
      if (guardAddress) params.set("guardAddress", guardAddress);

      // Add any additional params
      if (options?.additionalParams) {
        for (const [key, value] of Object.entries(options.additionalParams)) {
          params.set(key, value);
        }
      }

      const search = params.toString();
      const fullPath = search ? `${to}?${search}` : to;

      // Extract navigateOptions without additionalParams (which is only used for URL building)
      const navigateOptions = options ? { state: options.state, replace: options.replace } : undefined;
      navigate(fullPath, navigateOptions);
    },
    [navigate, searchParams],
  );

  return navigateWithParams;
};

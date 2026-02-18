/**
 * Icon exports from Lucide React
 *
 * These icons match the Figma design system (node 119:823).
 * All icons are from the Lucide icon library: https://lucide.dev/icons
 *
 * Usage:
 *   import { BoxIcon, StarIcon } from "~/components/icons";
 *   <BoxIcon size={24} color="#858589" />
 */

export {
  // Navigation & UI
  ChevronDown as ChevronDownIcon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronUp as ChevronUpIcon,

  // Actions
  Plus as PlusIcon,
  Minus as MinusIcon,
  X as XIcon,
  Check as CheckIcon,
  CheckCheck as CheckCheckIcon,
  Search as SearchIcon,
  Copy as CopyIcon,
  Trash2 as TrashIcon,
  SquarePen as SquarePenIcon,
  LogOut as LogOutIcon,
  CircleFadingPlus as CircleFadingPlusIcon,

  // Files & Data
  FileJson2 as FileJsonIcon,
  Box as BoxIcon,
  Layers2 as Layers2Icon,
  List as ListIcon,

  // Status & Indicators
  CircleDashed as CircleDashedIcon,
  CircleHelp as HelpCircleIcon,
  Info as InfoIcon,

  // Security & Protection
  ShieldCheck as ShieldCheckIcon,
  ShieldAlert as ShieldAlertIcon,
  Lock as LockIcon,

  // User

  // Wallet & Finance
  Wallet as WalletIcon,

  // Time & History

  // Connectivity
  Link2 as Link2Icon,

  // Settings
  Ellipsis as EllipsisIcon,
  GripVertical as GripIcon,

  // Theme

  // Special
  Star as StarIcon,
  Asterisk as AsteriskIcon,
  Zap as ZapIcon,
  ZapOff as ZapOffIcon,
  Loader2 as Loader2Icon,

  // Shapes & Layout
  Waypoints as VectorSquareIcon, // matches vector-square concept (nodes connected)
} from "lucide-react";

// Chain icons
export { EthereumIcon, OptimismIcon, InkIcon, ChainIcon, ChainBadge } from "./ChainIcons";

// Token icons
export { TokenIcon } from "./TokenIcon";

// Re-export the type for convenience

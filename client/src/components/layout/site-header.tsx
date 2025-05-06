/**
 * @deprecated This component has been replaced by MainHeader.tsx.
 * Please use MainHeader from the layout folder instead.
 * This file is now just a proxy that imports and exports MainHeader to avoid breaking existing code.
 */

import { MainHeader } from './MainHeader';

// Re-export MainHeader as SiteHeader for backward compatibility
export { MainHeader as SiteHeader };
export default MainHeader;

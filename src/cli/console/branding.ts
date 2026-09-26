// src/cli/console/branding.ts
import { theme } from "../../terminal/theme.js";

export const GLOBAL_FOOTER = `   ────────────────────────────────────────────
${theme.heading("                                            NEER — Cognitive Infrastructure")}
                                      © 2026 Khalil Benhaya. All rights reserved.

                        For business inquiries, technical support, or vulnerability disclosures:
                                          Email     : khalilbenhay07@gmail.com
   ────────────────────────────────────────────`;

export function printGlobalFooter() {
    console.log(`\n${GLOBAL_FOOTER}\n`);
}

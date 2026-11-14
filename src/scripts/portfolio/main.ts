// Explicit browser orchestration: mounts must exist before interactions read them.
import { initializeDiagrams } from "./diagrams";
import { initializeScenarios } from "./scenario";
import { initializePanels } from "./panels";
import { initializeInteractions } from "./interactions";
import { initializeMotion } from "./motion";

initializeDiagrams();
initializeScenarios();
initializePanels();
initializeInteractions();
initializeMotion();

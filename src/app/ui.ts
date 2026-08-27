import type { HelpContent, Selectors } from "@/types/app";
import { fireworksAppConfig } from "@/config/appConfig";

/* ------------------------------------------------------------------ */
/*  Local types                                                        */
/* ------------------------------------------------------------------ */

/** Option for a <select> dropdown */
type SelectOption = { value: string; label: string };

/** Options passed to populateControls */
type PopulateControlsOptions = {
  shellSizeOptions: SelectOption[];
  qualityOptions: SelectOption[];
  skyLightingOptions: SelectOption[];
  scaleFactorOptions: SelectOption[];
};

/** Config read from DOM form elements */
export type DomConfig = {
  quality: string;
  shell: string;
  size: string;
  wordShell: boolean;
  autoLaunch: boolean;
  finale: boolean;
  skyLighting: string;
  hideControls: boolean;
  longExposure: boolean;
  scaleFactor: number;
};

/** Application render state */
export type AppState = {
  paused: boolean;
  soundEnabled: boolean;
  menuOpen: boolean;
  config: DomConfig;
  fullscreen: boolean;
  background: {
    configured: boolean;
    value: string;
  };
  openHelpTopic: keyof HelpContent | null;
};

/** Typed map of all DOM nodes queried from selectors */
export type AppNodes = {
  stageContainer: HTMLElement;
  canvasContainer: HTMLElement;
  controls: HTMLElement;
  menu: HTMLElement;
  menuInnerWrap: HTMLElement;
  pauseBtn: HTMLElement;
  pauseBtnSVG: SVGElement;
  soundBtn: HTMLElement;
  soundBtnSVG: SVGElement;
  shellType: HTMLSelectElement;
  shellTypeLabel: HTMLElement;
  shellSize: HTMLSelectElement;
  shellSizeLabel: HTMLElement;
  quality: HTMLSelectElement;
  qualityLabel: HTMLElement;
  skyLighting: HTMLSelectElement;
  skyLightingLabel: HTMLElement;
  scaleFactor: HTMLSelectElement;
  scaleFactorLabel: HTMLElement;
  wordShell: HTMLInputElement;
  wordShellLabel: HTMLElement;
  autoLaunch: HTMLInputElement;
  autoLaunchLabel: HTMLElement;
  finaleModeFormOption: HTMLElement;
  finaleMode: HTMLInputElement;
  finaleModeLabel: HTMLElement;
  hideControls: HTMLInputElement;
  hideControlsLabel: HTMLElement;
  fullscreenFormOption: HTMLElement;
  fullscreen: HTMLInputElement;
  fullscreenLabel: HTMLElement;
  longExposure: HTMLInputElement;
  longExposureLabel: HTMLElement;
  backgroundInput: HTMLInputElement;
  backgroundLabel: HTMLElement;
  backgroundApplyBtn: HTMLElement;
  backgroundClearBtn: HTMLElement;
  backgroundStatus: HTMLElement;
  copyrightYear: HTMLElement;
  helpModal: HTMLElement;
  helpModalOverlay: HTMLElement;
  helpModalHeader: HTMLElement;
  helpModalBody: HTMLElement;
  helpModalCloseBtn: HTMLElement;
};

/** Options for bindAppControls */
export type BindControlsOptions = {
  nodes: AppNodes;
  onConfigChange: (config: DomConfig) => void;
  onScaleFactorChange: () => void;
  onToggleFullscreen: () => void;
  onBackgroundApply: (value: string) => void;
  onBackgroundClear: () => void;
  onHelpOpen: (topic: keyof HelpContent) => void;
  onHelpClose: () => void;
};

/* ------------------------------------------------------------------ */
/*  Private helpers                                                     */
/* ------------------------------------------------------------------ */

function createOptionMarkup(options: SelectOption[]): string {
  return options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");
}

/* ------------------------------------------------------------------ */
/*  Public API                                                          */
/* ------------------------------------------------------------------ */

/**
 * Query all DOM nodes defined in appConfig.selectors.
 * Throws if any node is missing from the document.
 */
export function queryNodes(): AppNodes {
  const selectors = fireworksAppConfig.selectors;
  const keys = Object.keys(selectors) as Array<keyof Selectors>;

  return keys.reduce<AppNodes>(
    (nodes, key) => {
      const selector = selectors[key];
      const node = document.querySelector(selector);
      if (!node) {
        throw new Error(`未找到界面节点: ${selector}`);
      }
      (nodes as Record<string, Element>)[key] = node;
      return nodes;
    },
    {} as AppNodes,
  );
}

/**
 * Populate <select> controls with option markup.
 */
export function populateControls(
  nodes: AppNodes,
  shellNames: string[],
  options: PopulateControlsOptions,
): void {
  nodes.shellType.innerHTML = createOptionMarkup(
    shellNames.map((name) => ({ value: name, label: name })),
  );
  nodes.shellSize.innerHTML = createOptionMarkup(options.shellSizeOptions);
  nodes.quality.innerHTML = createOptionMarkup(options.qualityOptions);
  nodes.skyLighting.innerHTML = createOptionMarkup(options.skyLightingOptions);
  nodes.scaleFactor.innerHTML = createOptionMarkup(options.scaleFactorOptions);
}

/**
 * Read current form state from DOM nodes.
 */
export function readConfigFromDom(nodes: AppNodes): DomConfig {
  return {
    quality: nodes.quality.value,
    shell: nodes.shellType.value,
    size: nodes.shellSize.value,
    wordShell: nodes.wordShell.checked,
    autoLaunch: nodes.autoLaunch.checked,
    finale: nodes.finaleMode.checked,
    skyLighting: nodes.skyLighting.value,
    hideControls: nodes.hideControls.checked,
    longExposure: nodes.longExposure.checked,
    scaleFactor: Number.parseFloat(nodes.scaleFactor.value),
  };
}

/**
 * Sync the full UI to the given application state.
 */
export function renderApp(state: AppState, nodes: AppNodes): void {
  const pauseBtnIcon = `#icon-${state.paused ? "play" : "pause"}`;
  const soundBtnIcon = `#icon-sound-${state.soundEnabled ? "on" : "off"}`;

  nodes.pauseBtnSVG.setAttribute("href", pauseBtnIcon);
  nodes.pauseBtnSVG.setAttribute("xlink:href", pauseBtnIcon);
  nodes.soundBtnSVG.setAttribute("href", soundBtnIcon);
  nodes.soundBtnSVG.setAttribute("xlink:href", soundBtnIcon);

  nodes.controls.classList.toggle(
    "hide",
    state.menuOpen || state.config.hideControls,
  );
  nodes.canvasContainer.classList.toggle("blur", state.menuOpen);
  nodes.menu.classList.toggle("hide", !state.menuOpen);
  nodes.finaleModeFormOption.style.opacity = state.config.autoLaunch
    ? "1"
    : "0.32";

  nodes.quality.value = state.config.quality;
  nodes.shellType.value = state.config.shell;
  nodes.shellSize.value = state.config.size;
  nodes.wordShell.checked = state.config.wordShell;
  nodes.autoLaunch.checked = state.config.autoLaunch;
  nodes.finaleMode.checked = state.config.finale;
  nodes.skyLighting.value = state.config.skyLighting;
  nodes.hideControls.checked = state.config.hideControls;
  nodes.fullscreen.checked = state.fullscreen;
  nodes.longExposure.checked = state.config.longExposure;
  nodes.scaleFactor.value = state.config.scaleFactor.toFixed(2);
  nodes.backgroundInput.value = state.background.configured
    ? state.background.value
    : "";

  nodes.menuInnerWrap.style.opacity = state.openHelpTopic ? "0.12" : "1";
  nodes.helpModal.classList.toggle("active", Boolean(state.openHelpTopic));
  if (state.openHelpTopic) {
    const helpContent = fireworksAppConfig.helpContent[state.openHelpTopic];
    if (!helpContent) {
      throw new Error(`未知帮助主题: ${state.openHelpTopic}`);
    }
    nodes.helpModalHeader.textContent = helpContent.header;
    nodes.helpModalBody.textContent = helpContent.body;
  }
}

/**
 * Set background status text and data-state attribute.
 */
export function setBackgroundStatus(
  nodes: AppNodes,
  text: string,
  state: string,
): void {
  nodes.backgroundStatus.textContent = text;
  nodes.backgroundStatus.dataset.state = state;
}

/**
 * Bind event listeners to all app controls.
 */
export function bindAppControls(options: BindControlsOptions): void {
  const nodes = options.nodes;

  const syncConfig = (): void =>
    options.onConfigChange(readConfigFromDom(nodes));

  (
    ["quality", "shellType", "shellSize", "skyLighting"] as const
  ).forEach((key) => {
    nodes[key].addEventListener("change", syncConfig);
  });

  (
    ["wordShell", "autoLaunch", "finaleMode", "hideControls", "longExposure"] as const
  ).forEach((key) => {
    nodes[key].addEventListener("change", syncConfig);
  });

  nodes.scaleFactor.addEventListener("change", () => {
    syncConfig();
    options.onScaleFactorChange();
  });

  nodes.fullscreen.addEventListener("change", options.onToggleFullscreen);

  nodes.backgroundApplyBtn.addEventListener("click", () => {
    options.onBackgroundApply(nodes.backgroundInput.value);
  });

  nodes.backgroundClearBtn.addEventListener("click", options.onBackgroundClear);

  nodes.backgroundInput.addEventListener("keydown", (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      options.onBackgroundApply(nodes.backgroundInput.value);
    }
  });

  Object.keys(fireworksAppConfig.helpNodeMap).forEach((nodeKey) => {
    const helpTopic =
      fireworksAppConfig.helpNodeMap[
        nodeKey as keyof typeof fireworksAppConfig.helpNodeMap
      ];
    (nodes as unknown as Record<string, HTMLElement>)[nodeKey].addEventListener(
      "click",
      () => {
        options.onHelpOpen(helpTopic);
      },
    );
  });

  nodes.helpModalCloseBtn.addEventListener("click", options.onHelpClose);
  nodes.helpModalOverlay.addEventListener("click", options.onHelpClose);
}

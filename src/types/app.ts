/** Quality level: 1=low, 2=normal, 3=high */
export type QualityLevel = 1 | 2 | 3;

/** Sky lighting mode: 0=none, 1=dim, 2=normal */
export type SkyLightingMode = 0 | 1 | 2;

/** Background mode for default background */
export type BackgroundMode = "none" | "image" | "style";

/** Scale factor option values */
export type ScaleFactor = 0.5 | 0.62 | 0.75 | 0.9 | 1.0 | 1.5 | 2.0;

/** CSS selector map for all UI elements */
export type Selectors = {
  readonly stageContainer: string;
  readonly canvasContainer: string;
  readonly controls: string;
  readonly menu: string;
  readonly menuInnerWrap: string;
  readonly pauseBtn: string;
  readonly pauseBtnSVG: string;
  readonly soundBtn: string;
  readonly soundBtnSVG: string;
  readonly shellType: string;
  readonly shellTypeLabel: string;
  readonly shellSize: string;
  readonly shellSizeLabel: string;
  readonly quality: string;
  readonly qualityLabel: string;
  readonly skyLighting: string;
  readonly skyLightingLabel: string;
  readonly scaleFactor: string;
  readonly scaleFactorLabel: string;
  readonly wordShell: string;
  readonly wordShellLabel: string;
  readonly autoLaunch: string;
  readonly autoLaunchLabel: string;
  readonly finaleModeFormOption: string;
  readonly finaleMode: string;
  readonly finaleModeLabel: string;
  readonly hideControls: string;
  readonly hideControlsLabel: string;
  readonly fullscreenFormOption: string;
  readonly fullscreen: string;
  readonly fullscreenLabel: string;
  readonly longExposure: string;
  readonly longExposureLabel: string;
  readonly backgroundInput: string;
  readonly backgroundLabel: string;
  readonly backgroundApplyBtn: string;
  readonly backgroundClearBtn: string;
  readonly backgroundStatus: string;
  readonly copyrightYear: string;
  readonly helpModal: string;
  readonly helpModalOverlay: string;
  readonly helpModalHeader: string;
  readonly helpModalBody: string;
  readonly helpModalCloseBtn: string;
};

/** Help content entry with Chinese header and body text */
export type HelpContentEntry = {
  readonly header: string;
  readonly body: string;
};

/** Help content map keyed by feature name */
export type HelpContent = {
  readonly shellType: HelpContentEntry;
  readonly shellSize: HelpContentEntry;
  readonly quality: HelpContentEntry;
  readonly skyLighting: HelpContentEntry;
  readonly scaleFactor: HelpContentEntry;
  readonly wordShell: HelpContentEntry;
  readonly autoLaunch: HelpContentEntry;
  readonly finaleMode: HelpContentEntry;
  readonly hideControls: HelpContentEntry;
  readonly fullscreen: HelpContentEntry;
  readonly longExposure: HelpContentEntry;
  readonly background: HelpContentEntry;
};

/** Maps selector label keys to help content keys */
export type HelpNodeMap = {
  readonly shellTypeLabel: keyof HelpContent;
  readonly shellSizeLabel: keyof HelpContent;
  readonly qualityLabel: keyof HelpContent;
  readonly skyLightingLabel: keyof HelpContent;
  readonly scaleFactorLabel: keyof HelpContent;
  readonly wordShellLabel: keyof HelpContent;
  readonly autoLaunchLabel: keyof HelpContent;
  readonly finaleModeLabel: keyof HelpContent;
  readonly hideControlsLabel: keyof HelpContent;
  readonly fullscreenLabel: keyof HelpContent;
  readonly longExposureLabel: keyof HelpContent;
  readonly backgroundLabel: keyof HelpContent;
};

export type AppConfig = {
  readonly storageKey: string;
  readonly storageVersion: string;
  readonly defaultWords: readonly ["新年快乐", "平安喜乐", "万事顺意"];
  readonly defaultBackground: {
    readonly mode: BackgroundMode;
    readonly value: string;
  };
  readonly wordFontFamily: string;
  readonly wordPointDensity: number;
  readonly wordFontSizeMin: number;
  readonly wordFontSizeMax: number;
  readonly wordBurstInterval: number;
  readonly qualityLevels: {
    readonly low: QualityLevel;
    readonly normal: QualityLevel;
    readonly high: QualityLevel;
  };
  readonly skyLightingModes: {
    readonly none: SkyLightingMode;
    readonly dim: SkyLightingMode;
    readonly normal: SkyLightingMode;
  };
  readonly scaleFactorOptions: readonly ScaleFactor[];
  readonly selectors: Selectors;
  readonly helpContent: HelpContent;
  readonly helpNodeMap: HelpNodeMap;
};

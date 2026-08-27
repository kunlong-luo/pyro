"use client";

/**
 * Settings menu — 100% pixel-perfect port of
 * legacy.index.html lines 71-143 + CSS lines 141-316.
 *
 * Form with 5 selects, background input + apply/clear,
 * 6 checkboxes, close button, credits footer.
 *
 * Reads via Zustand selectors, writes via store.setState,
 * fires onConfigChange callback for side effects.
 */

import { useCallback } from "react";
import { useStore } from "zustand";
import { useFireworksStore } from "@/stores/storeContext";
import { fireworksAppConfig } from "@/config/appConfig";
import { shellNames } from "@/fireworks/shells";
import type { FireworksConfig } from "@/stores/fireworksStore";
import type { HelpContent } from "@/types/app";

// ---------------------------------------------------------------------------
// Option data (mirrors populateAppControls in engine.js)
// ---------------------------------------------------------------------------

const SHELL_SIZE_OPTIONS = ['3"', '4"', '6"', '8"', '12"', '16"'].map(
  (label, index) => ({ value: String(index), label }),
);

const QUALITY_OPTIONS = [
  { label: "低", value: String(fireworksAppConfig.qualityLevels.low) },
  { label: "正常", value: String(fireworksAppConfig.qualityLevels.normal) },
  { label: "高", value: String(fireworksAppConfig.qualityLevels.high) },
];

const SKY_LIGHTING_OPTIONS = [
  { label: "不", value: String(fireworksAppConfig.skyLightingModes.none) },
  { label: "暗", value: String(fireworksAppConfig.skyLightingModes.dim) },
  {
    label: "正常",
    value: String(fireworksAppConfig.skyLightingModes.normal),
  },
];

const SCALE_FACTOR_OPTIONS = fireworksAppConfig.scaleFactorOptions.map(
  (value) => ({
    value: value.toFixed(2),
    label: `${value * 100}%`,
  }),
);

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MenuProps {
  onConfigChange: (config: FireworksConfig) => void;
  onBackgroundApply: (value: string) => void;
  onBackgroundClear: () => void;
  onToggleFullscreen: () => void;
  onHelpOpen: (topic: keyof HelpContent) => void;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Menu({
  onConfigChange,
  onBackgroundApply,
  onBackgroundClear,
  onToggleFullscreen,
  onHelpOpen,
  onClose,
}: MenuProps) {
  const store = useFireworksStore();
  const menuOpen = useStore(store, (s) => s.menuOpen);
  const config = useStore(store, (s) => s.config);
  const fullscreen = useStore(store, (s) => s.fullscreen);
  const background = useStore(store, (s) => s.background);

  // Local state for background input value
  const backgroundValue = background.configured ? background.value : "";

  // ---- helpers ----

  const updateConfig = useCallback(
    (patch: Partial<FireworksConfig>) => {
      store.setState((state) => ({
        config: { ...state.config, ...patch },
      }));
      onConfigChange(store.getState().config);
    },
    [store, onConfigChange],
  );

  // ---- event handlers ----

  const handleSelectChange = useCallback(
    (field: keyof FireworksConfig, value: string) => {
      if (field === "scaleFactor") {
        updateConfig({ scaleFactor: Number.parseFloat(value) });
      } else {
        updateConfig({ [field]: value } as Partial<FireworksConfig>);
      }
    },
    [updateConfig],
  );

  const handleCheckboxChange = useCallback(
    (field: keyof FireworksConfig, checked: boolean) => {
      updateConfig({ [field]: checked } as Partial<FireworksConfig>);
    },
    [updateConfig],
  );

  const handleBackgroundApply = useCallback(
    (value: string) => {
      onBackgroundApply(value);
    },
    [onBackgroundApply],
  );

  const handleBackgroundClear = useCallback(() => {
    onBackgroundClear();
  }, [onBackgroundClear]);

  const handleBackgroundKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const target = e.currentTarget;
        handleBackgroundApply(target.value);
      }
    },
    [handleBackgroundApply],
  );

  const handleHelpClick = useCallback(
    (topic: keyof HelpContent) => {
      onHelpOpen(topic);
    },
    [onHelpOpen],
  );

  const isHidden = !menuOpen;

  return (
    <div className={`menu${isHidden ? " hide" : ""}`}>
      <div className="menu__inner-wrap">
        <button
          className="btn btn--bright close-menu-btn"
          type="button"
          aria-label="关闭设置"
          onClick={onClose}
        >
          <svg fill="white" width="24" height="24" aria-hidden="true">
            <use href="#icon-close" xlinkHref="#icon-close" />
          </svg>
        </button>
        <div className="menu__header">设置</div>
        <div className="menu__subheader">若想了解更多信息 请点击任意标签</div>

        <form>
          {/* ---- 烟花类型 ---- */}
          <div className="form-option form-option--select">
            <label
              className="shell-type-label"
              onClick={() => handleHelpClick("shellType")}
            >
              烟花类型
            </label>
            <select
              className="shell-type"
              value={config.shell}
              onChange={(e) => handleSelectChange("shell", e.target.value)}
            >
              {shellNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* ---- 烟花大小 ---- */}
          <div className="form-option form-option--select">
            <label
              className="shell-size-label"
              onClick={() => handleHelpClick("shellSize")}
            >
              烟花大小
            </label>
            <select
              className="shell-size"
              value={config.size}
              onChange={(e) => handleSelectChange("size", e.target.value)}
            >
              {SHELL_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ---- 画质 ---- */}
          <div className="form-option form-option--select">
            <label
              className="quality-ui-label"
              onClick={() => handleHelpClick("quality")}
            >
              画质
            </label>
            <select
              className="quality-ui"
              value={config.quality}
              onChange={(e) => handleSelectChange("quality", e.target.value)}
            >
              {QUALITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ---- 照亮天空 ---- */}
          <div className="form-option form-option--select">
            <label
              className="sky-lighting-label"
              onClick={() => handleHelpClick("skyLighting")}
            >
              照亮天空
            </label>
            <select
              className="sky-lighting"
              value={config.skyLighting}
              onChange={(e) =>
                handleSelectChange("skyLighting", e.target.value)
              }
            >
              {SKY_LIGHTING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ---- 缩放 ---- */}
          <div className="form-option form-option--select">
            <label
              className="scaleFactor-label"
              onClick={() => handleHelpClick("scaleFactor")}
            >
              缩放
            </label>
            <select
              className="scaleFactor"
              value={config.scaleFactor.toFixed(2)}
              onChange={(e) =>
                handleSelectChange("scaleFactor", e.target.value)
              }
            >
              {SCALE_FACTOR_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* ---- 自定义背景 ---- */}
          <div className="form-option form-option--stacked">
            <label
              className="background-label"
              onClick={() => handleHelpClick("background")}
            >
              自定义背景
            </label>
            <div className="form-option__content">
              <input
                className="background-input"
                type="text"
                placeholder="图片地址，或 linear-gradient(...)"
                autoComplete="off"
                spellCheck={false}
                defaultValue={backgroundValue}
                onKeyDown={handleBackgroundKeyDown}
              />
              <div className="form-option__actions">
                <button
                  className="background-apply-btn"
                  type="button"
                  onClick={() => {
                    const input = document.querySelector<HTMLInputElement>(
                      ".background-input",
                    );
                    if (input) handleBackgroundApply(input.value);
                  }}
                >
                  应用
                </button>
                <button
                  className="background-clear-btn"
                  type="button"
                  onClick={handleBackgroundClear}
                >
                  清除
                </button>
              </div>
              <div className="background-status" aria-live="polite" />
            </div>
          </div>

          {/* ---- 文字烟花 ---- */}
          <div className="form-option form-option--checkbox">
            <label
              className="word-shell-label"
              onClick={() => handleHelpClick("wordShell")}
            >
              文字烟花
            </label>
            <input
              className="word-shell"
              type="checkbox"
              checked={config.wordShell}
              onChange={(e) =>
                handleCheckboxChange("wordShell", e.target.checked)
              }
            />
          </div>

          {/* ---- 自动放烟花 ---- */}
          <div className="form-option form-option--checkbox">
            <label
              className="auto-launch-label"
              onClick={() => handleHelpClick("autoLaunch")}
            >
              自动放烟花
            </label>
            <input
              className="auto-launch"
              type="checkbox"
              checked={config.autoLaunch}
              onChange={(e) =>
                handleCheckboxChange("autoLaunch", e.target.checked)
              }
            />
          </div>

          {/* ---- 同时放更多的烟花 ---- */}
          <div
            className="form-option form-option--checkbox form-option--finale-mode"
            style={{ opacity: config.autoLaunch ? 1 : 0.32 }}
          >
            <label
              className="finale-mode-label"
              onClick={() => handleHelpClick("finaleMode")}
            >
              同时放更多的烟花
            </label>
            <input
              className="finale-mode"
              type="checkbox"
              checked={config.finale}
              onChange={(e) =>
                handleCheckboxChange("finale", e.target.checked)
              }
            />
          </div>

          {/* ---- 隐藏控制按钮 ---- */}
          <div className="form-option form-option--checkbox">
            <label
              className="hide-controls-label"
              onClick={() => handleHelpClick("hideControls")}
            >
              隐藏控制按钮
            </label>
            <input
              className="hide-controls"
              type="checkbox"
              checked={config.hideControls}
              onChange={(e) =>
                handleCheckboxChange("hideControls", e.target.checked)
              }
            />
          </div>

          {/* ---- 全屏 ---- */}
          <div className="form-option form-option--checkbox form-option--fullscreen">
            <label
              className="fullscreen-label"
              onClick={() => handleHelpClick("fullscreen")}
            >
              全屏
            </label>
            <input
              className="fullscreen"
              type="checkbox"
              checked={fullscreen}
              onChange={onToggleFullscreen}
            />
          </div>

          {/* ---- 保留烟花的火花 ---- */}
          <div className="form-option form-option--checkbox">
            <label
              className="long-exposure-label"
              onClick={() => handleHelpClick("longExposure")}
            >
              保留烟花的火花
            </label>
            <input
              className="long-exposure"
              type="checkbox"
              checked={config.longExposure}
              onChange={(e) =>
                handleCheckboxChange("longExposure", e.target.checked)
              }
            />
          </div>
        </form>

        {/* ---- Credits ---- */}
        <div className="credits">
          <p className="copyright">
            Copyright&nbsp;&copy;&nbsp;2021 -{" "}
            <span className="copyright-year">
              {new Date().getFullYear()}
            </span>
            &nbsp;
            <a target="_blank" href="https://www.nianbroken.top/" rel="noreferrer">
              碎念_Nian
            </a>
            <br />
            All&nbsp;Rights&nbsp;Reserved
          </p>
        </div>
      </div>
    </div>
  );
}

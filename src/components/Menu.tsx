"use client";

/**
 * Settings menu — Modernized with shadcn/ui components
 *
 * Form with 5 selects, background input + apply/clear,
 * 6 toggles, close button, credits footer.
 *
 * Reads via Zustand selectors, writes via store.setState,
 * fires onConfigChange callback for side effects.
 */

import { useCallback } from "react";
import { useStore } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { useFireworksStore } from "@/stores/storeContext";
import { fireworksAppConfig } from "@/config/appConfig";
import { shellNames } from "@/fireworks/shells";
import type { FireworksConfig } from "@/stores/fireworksStore";
import type { HelpContent } from "@/types/app";
import { Icon } from "./Icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// ---------------------------------------------------------------------------
// Option data (mirrors populateAppControls in engine.js)
// ---------------------------------------------------------------------------

const SHELL_SIZE_OPTIONS = ['3"', '4"', '6"', '8"', '12"', '16"'].map((label, index) => ({
  value: String(index),
  label,
}));

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

const SCALE_FACTOR_OPTIONS = fireworksAppConfig.scaleFactorOptions.map((value) => ({
  value: value.toFixed(2),
  label: `${value * 100}%`,
}));

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
    <AnimatePresence>
      {!isHidden && (
        <motion.div
          className="menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="menu__inner-wrap"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <button
              className="btn btn--bright close-menu-btn"
              type="button"
              aria-label="关闭设置"
              onClick={onClose}
            >
              <Icon name="icon-close" size={24} className="text-white" />
            </button>
            <div className="menu__header">设置</div>
            <div className="menu__subheader">若想了解更多信息 请点击任意标签</div>

            <form>
          {/* ---- 烟花类型 ---- */}
          <div className="form-option form-option--select">
            <Label
              className="shell-type-label cursor-pointer"
              htmlFor="shell-type"
              onClick={() => handleHelpClick("shellType")}
            >
              烟花类型
            </Label>
            <Select value={config.shell} onValueChange={(v) => handleSelectChange("shell", v)}>
              <SelectTrigger id="shell-type" className="w-[180px] bg-black/50 border-white/20 text-white/70">
                <SelectValue placeholder="选择烟花类型" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {shellNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-white/70 focus:text-white focus:bg-white/10">
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ---- 烟花大小 ---- */}
          <div className="form-option form-option--select">
            <Label
              className="shell-size-label cursor-pointer"
              htmlFor="shell-size"
              onClick={() => handleHelpClick("shellSize")}
            >
              烟花大小
            </Label>
            <Select value={config.size} onValueChange={(v) => handleSelectChange("size", v)}>
              <SelectTrigger id="shell-size" className="w-[180px] bg-black/50 border-white/20 text-white/70">
                <SelectValue placeholder="选择大小" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {SHELL_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ---- 画质 ---- */}
          <div className="form-option form-option--select">
            <Label
              className="quality-ui-label cursor-pointer"
              htmlFor="quality-ui"
              onClick={() => handleHelpClick("quality")}
            >
              画质
            </Label>
            <Select value={config.quality} onValueChange={(v) => handleSelectChange("quality", v)}>
              <SelectTrigger id="quality-ui" className="w-[180px] bg-black/50 border-white/20 text-white/70">
                <SelectValue placeholder="选择画质" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {QUALITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ---- 照亮天空 ---- */}
          <div className="form-option form-option--select">
            <Label
              className="sky-lighting-label cursor-pointer"
              htmlFor="sky-lighting"
              onClick={() => handleHelpClick("skyLighting")}
            >
              照亮天空
            </Label>
            <Select value={config.skyLighting} onValueChange={(v) => handleSelectChange("skyLighting", v)}>
              <SelectTrigger id="sky-lighting" className="w-[180px] bg-black/50 border-white/20 text-white/70">
                <SelectValue placeholder="选择照亮模式" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {SKY_LIGHTING_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ---- 缩放 ---- */}
          <div className="form-option form-option--select">
            <Label
              className="scaleFactor-label cursor-pointer"
              htmlFor="scaleFactor"
              onClick={() => handleHelpClick("scaleFactor")}
            >
              缩放
            </Label>
            <Select
              value={config.scaleFactor.toFixed(2)}
              onValueChange={(v) => handleSelectChange("scaleFactor", v)}
            >
              <SelectTrigger id="scaleFactor" className="w-[180px] bg-black/50 border-white/20 text-white/70">
                <SelectValue placeholder="选择缩放" />
              </SelectTrigger>
              <SelectContent className="bg-black/90 border-white/20">
                {SCALE_FACTOR_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-white/70 focus:text-white focus:bg-white/10">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* ---- 自定义背景 ---- */}
          <div className="form-option form-option--stacked">
            <label
              className="background-label"
              htmlFor="background-input"
              onClick={() => handleHelpClick("background")}
            >
              自定义背景
            </label>
            <div className="form-option__content">
              <input
                id="background-input"
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
                    const input = document.querySelector<HTMLInputElement>(".background-input");
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
            <Label
              className="word-shell-label cursor-pointer"
              htmlFor="word-shell"
              onClick={() => handleHelpClick("wordShell")}
            >
              文字烟花
            </Label>
            <Switch
              id="word-shell"
              checked={config.wordShell}
              onCheckedChange={(checked) => handleCheckboxChange("wordShell", checked)}
            />
          </div>

          {/* ---- 自动放烟花 ---- */}
          <div className="form-option form-option--checkbox">
            <Label
              className="auto-launch-label cursor-pointer"
              htmlFor="auto-launch"
              onClick={() => handleHelpClick("autoLaunch")}
            >
              自动放烟花
            </Label>
            <Switch
              id="auto-launch"
              checked={config.autoLaunch}
              onCheckedChange={(checked) => handleCheckboxChange("autoLaunch", checked)}
            />
          </div>

          {/* ---- 同时放更多的烟花 ---- */}
          <div
            className={`form-option form-option--checkbox form-option--finale-mode ${
              config.autoLaunch ? "opacity-100" : "opacity-[0.32]"
            }`}
          >
            <Label
              className="finale-mode-label cursor-pointer"
              htmlFor="finale-mode"
              onClick={() => handleHelpClick("finaleMode")}
            >
              同时放更多的烟花
            </Label>
            <Switch
              id="finale-mode"
              checked={config.finale}
              onCheckedChange={(checked) => handleCheckboxChange("finale", checked)}
            />
          </div>

          {/* ---- 隐藏控制按钮 ---- */}
          <div className="form-option form-option--checkbox">
            <Label
              className="hide-controls-label cursor-pointer"
              htmlFor="hide-controls"
              onClick={() => handleHelpClick("hideControls")}
            >
              隐藏控制按钮
            </Label>
            <Switch
              id="hide-controls"
              checked={config.hideControls}
              onCheckedChange={(checked) => handleCheckboxChange("hideControls", checked)}
            />
          </div>

          {/* ---- 全屏 ---- */}
          <div className="form-option form-option--checkbox form-option--fullscreen">
            <Label
              className="fullscreen-label cursor-pointer"
              htmlFor="fullscreen"
              onClick={() => handleHelpClick("fullscreen")}
            >
              全屏
            </Label>
            <Switch
              id="fullscreen"
              checked={fullscreen}
              onCheckedChange={onToggleFullscreen}
            />
          </div>

          {/* ---- 保留烟花的火花 ---- */}
          <div className="form-option form-option--checkbox">
            <Label
              className="long-exposure-label cursor-pointer"
              htmlFor="long-exposure"
              onClick={() => handleHelpClick("longExposure")}
            >
              保留烟花的火花
            </Label>
            <Switch
              id="long-exposure"
              checked={config.longExposure}
              onCheckedChange={(checked) => handleCheckboxChange("longExposure", checked)}
            />
          </div>
        </form>

        {/* ---- Credits ---- */}
        <div className="credits">
          <p className="copyright">
            Copyright&nbsp;&copy;&nbsp;2021 -{" "}
            <span className="copyright-year">{new Date().getFullYear()}</span>
            &nbsp;
            <a target="_blank" href="https://www.nianbroken.top/" rel="noreferrer">
              碎念_Nian
            </a>
            <br />
            All&nbsp;Rights&nbsp;Reserved
          </p>
        </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

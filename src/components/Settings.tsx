"use client";

import { useCallback, useState } from "react";
import { useStore } from "zustand";
import { motion, AnimatePresence } from "framer-motion";
import { useFireworksStore } from "@/stores/storeContext";
import { fireworksAppConfig } from "@/config/appConfig";
import { shellNames } from "@/fireworks/shells";
import { buildDefaultConfig, type FireworksConfig } from "@/stores/fireworksStore";
import type { HelpContent } from "@/types/app";
import { Icon } from "./Icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

const BACKGROUND_PRESETS = [
  { label: "星空", value: "linear-gradient(180deg, #0a0a2e 0%, #1a1a4e 50%, #0d0d3d 100%)" },
  { label: "暮色", value: "linear-gradient(180deg, #1a0533 0%, #2d1b4e 40%, #0f0a1e 100%)" },
  { label: "深海", value: "linear-gradient(180deg, #001428 0%, #002850 50%, #001428 100%)" },
  { label: "暗夜", value: "linear-gradient(180deg, #000000 0%, #0a0a0a 50%, #000000 100%)" },
  {
    label: "极光",
    value: "linear-gradient(135deg, #0a1628 0%, #1a3a5c 30%, #0d2847 60%, #061220 100%)",
  },
  { label: "紫霞", value: "linear-gradient(135deg, #1a0533 0%, #3d1a5c 40%, #1a0533 100%)" },
];

export interface SettingsProps {
  onConfigChange: (config: FireworksConfig) => void;
  onBackgroundApply: (value: string) => void;
  onBackgroundClear: () => void;
  onToggleFullscreen: () => void;
  onHelpOpen: (topic: keyof HelpContent) => void;
  onClose: () => void;
}

export function Settings({
  onConfigChange,
  onBackgroundApply,
  onBackgroundClear,
  onToggleFullscreen,
  onHelpOpen,
  onClose,
}: SettingsProps) {
  const store = useFireworksStore();
  const menuOpen = useStore(store, (s) => s.menuOpen);
  const config = useStore(store, (s) => s.config);
  const fullscreen = useStore(store, (s) => s.fullscreen);
  const background = useStore(store, (s) => s.background);

  const [backgroundInput, setBackgroundInput] = useState(
    background.configured ? background.value : "",
  );

  const updateConfig = useCallback(
    (patch: Partial<FireworksConfig>) => {
      store.setState((state) => ({
        config: { ...state.config, ...patch },
      }));
      onConfigChange(store.getState().config);
    },
    [store, onConfigChange],
  );

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

  const handleHelpClick = useCallback(
    (topic: keyof HelpContent) => {
      onHelpOpen(topic);
    },
    [onHelpOpen],
  );

  const handlePresetClick = useCallback(
    (value: string) => {
      setBackgroundInput(value);
      onBackgroundApply(value);
    },
    [onBackgroundApply],
  );

  const handleCustomBackgroundApply = useCallback(() => {
    if (backgroundInput.trim()) {
      onBackgroundApply(backgroundInput.trim());
    }
  }, [backgroundInput, onBackgroundApply]);

  const handleResetDefaults = useCallback(() => {
    const runtime = {
      isDesktop: window.innerWidth >= 840,
      isHeader: false,
      isHighEndDevice: navigator.hardwareConcurrency >= 8,
      defaultScaleFactor: 1,
      fullscreen: false,
    };
    const defaults = buildDefaultConfig(runtime);
    store.setState({ config: defaults });
    onConfigChange(defaults);
    onBackgroundClear();
    setBackgroundInput("");
  }, [store, onConfigChange, onBackgroundClear]);

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
            <div className="glass-panel menu__sheet">
              <button
                className="btn btn--bright close-menu-btn"
                type="button"
                aria-label="关闭设置"
                onClick={onClose}
              >
                <Icon name="icon-close" size={24} className="text-fg" />
              </button>
              <div className="menu__header">设置</div>
              <div className="menu__subheader">若想了解更多信息 请点击任意标签</div>

              <section className="menu__section">
                <div className="menu__section-title">烟花设置</div>

                <div className="form-option form-option--select">
                  <Label
                    className="shell-type-label form-option__label cursor-pointer"
                    onClick={() => handleHelpClick("shellType")}
                  >
                    烟花类型
                  </Label>
                  <Select
                    value={config.shell}
                    onValueChange={(v) => handleSelectChange("shell", v)}
                  >
                    <SelectTrigger className="bg-surface-inset border-soft text-fg-secondary focus:ring-ring w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-soft text-popover-foreground">
                      {shellNames.map((name) => (
                        <SelectItem
                          key={name}
                          value={name}
                          className="text-fg-secondary focus:bg-accent-subtle focus:text-accent-foreground"
                        >
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-option form-option--select">
                  <Label
                    className="shell-size-label form-option__label cursor-pointer"
                    onClick={() => handleHelpClick("shellSize")}
                  >
                    烟花大小
                  </Label>
                  <Select value={config.size} onValueChange={(v) => handleSelectChange("size", v)}>
                    <SelectTrigger className="bg-surface-inset border-soft text-fg-secondary focus:ring-ring w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-soft text-popover-foreground">
                      {SHELL_SIZE_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-fg-secondary focus:bg-accent-subtle focus:text-accent-foreground"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-option form-option--select">
                  <Label
                    className="quality-ui-label form-option__label cursor-pointer"
                    onClick={() => handleHelpClick("quality")}
                  >
                    画质
                  </Label>
                  <Select
                    value={config.quality}
                    onValueChange={(v) => handleSelectChange("quality", v)}
                  >
                    <SelectTrigger className="bg-surface-inset border-soft text-fg-secondary focus:ring-ring w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-soft text-popover-foreground">
                      {QUALITY_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-fg-secondary focus:bg-accent-subtle focus:text-accent-foreground"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </section>

              <section className="menu__section">
                <div className="menu__section-title">显示设置</div>

                <div className="form-option form-option--select">
                  <Label
                    className="sky-lighting-label form-option__label cursor-pointer"
                    onClick={() => handleHelpClick("skyLighting")}
                  >
                    照亮天空
                  </Label>
                  <Select
                    value={config.skyLighting}
                    onValueChange={(v) => handleSelectChange("skyLighting", v)}
                  >
                    <SelectTrigger className="bg-surface-inset border-soft text-fg-secondary focus:ring-ring w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-soft text-popover-foreground">
                      {SKY_LIGHTING_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-fg-secondary focus:bg-accent-subtle focus:text-accent-foreground"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-option form-option--select">
                  <Label
                    className="scaleFactor-label form-option__label cursor-pointer"
                    onClick={() => handleHelpClick("scaleFactor")}
                  >
                    缩放
                  </Label>
                  <Select
                    value={config.scaleFactor.toFixed(2)}
                    onValueChange={(v) => handleSelectChange("scaleFactor", v)}
                  >
                    <SelectTrigger className="bg-surface-inset border-soft text-fg-secondary focus:ring-ring w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-soft text-popover-foreground">
                      {SCALE_FACTOR_OPTIONS.map((opt) => (
                        <SelectItem
                          key={opt.value}
                          value={opt.value}
                          className="text-fg-secondary focus:bg-accent-subtle focus:text-accent-foreground"
                        >
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="form-option form-option--checkbox">
                  <Label
                    htmlFor="long-exposure"
                    className="long-exposure-label form-option__label cursor-pointer"
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
              </section>

              <section className="menu__section">
                <div className="menu__section-title">特效设置</div>

                <div className="form-option form-option--checkbox">
                  <Label
                    htmlFor="word-shell"
                    className="word-shell-label form-option__label cursor-pointer"
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

                <div className="form-option form-option--checkbox">
                  <Label
                    htmlFor="auto-launch"
                    className="auto-launch-label form-option__label cursor-pointer"
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

                <div
                  className={`form-option form-option--checkbox form-option--finale-mode ${config.autoLaunch ? "opacity-100" : "opacity-40"}`}
                >
                  <Label
                    htmlFor="finale-mode"
                    className="finale-mode-label form-option__label cursor-pointer"
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

                <div className="form-option form-option--checkbox">
                  <Label
                    htmlFor="hide-controls"
                    className="hide-controls-label form-option__label cursor-pointer"
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

                <div className="form-option form-option--checkbox">
                  <Label
                    htmlFor="fullscreen"
                    className="fullscreen-label form-option__label cursor-pointer"
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
              </section>

              <section className="menu__section">
                <div className="menu__section-title">背景设置</div>

                <div className="grid grid-cols-3 gap-2">
                  {BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="border-soft text-fg-secondary hover:border-hairline hover:text-fg h-12 rounded-md border text-xs transition-colors"
                      style={{ background: preset.value }}
                      onClick={() => handlePresetClick(preset.value)}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label className="text-fg-muted text-xs">自定义背景</Label>
                  <input
                    className="background-input"
                    type="text"
                    placeholder="图片 URL 或 CSS 渐变..."
                    value={backgroundInput}
                    onChange={(e) => setBackgroundInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomBackgroundApply();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-soft text-fg-secondary hover:bg-accent-subtle hover:text-fg flex-1"
                      onClick={handleCustomBackgroundApply}
                    >
                      应用
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="border-soft text-fg-secondary hover:bg-accent-subtle hover:text-fg flex-1"
                      onClick={() => {
                        onBackgroundClear();
                        setBackgroundInput("");
                      }}
                    >
                      清除
                    </Button>
                  </div>
                </div>
              </section>

              <div className="menu__footer">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-fg-muted hover:text-fg"
                  onClick={handleResetDefaults}
                >
                  恢复默认设置
                </Button>
                <div className="credits">
                  <p className="copyright">
                    Copyright&nbsp;&copy;&nbsp;2021 -{" "}
                    <span className="copyright-year">{new Date().getFullYear()}</span>
                    &nbsp;
                    <a target="_blank" href="https://www.nianbroken.top/" rel="noreferrer">
                      碎念_Nian
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

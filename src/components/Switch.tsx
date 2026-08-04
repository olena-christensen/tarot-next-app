"use client";

type SwitchProps = {
  checked: boolean;
  onChange: () => void;
  /**
   * Accessible name — the THING being toggled ("The Daily Whisper"), not the
   * action. State is carried by `aria-checked`, so an action-shaped label like
   * "Silence it" would contradict it.
   */
  label: string;
  /** State word shown inside the track when on / off. */
  onLabel: string;
  offLabel: string;
  disabled?: boolean;
};

/**
 * On/off switch for a settings row, with the state word inside the track.
 *
 * `role="switch"` rather than a checkbox: this commits immediately, there is no
 * Save. Intrinsic styles only — the row that uses it owns placement.
 *
 * BOTH labels are always rendered, stacked in one grid cell, with only the
 * active one visible. The track then always reserves the WIDER of the two, so
 * flipping the switch can't change its width and shove the row around — the
 * same overlap-stack trick the reader selection uses, and the reason it is
 * locale-proof without magic numbers. The inactive one is `aria-hidden`; the
 * accessible name comes from `label` + `aria-checked`.
 */
export const Switch = ({
  checked,
  onChange,
  label,
  onLabel,
  offLabel,
  disabled,
}: SwitchProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={onChange}
    className="switch"
    data-checked={checked ? "true" : "false"}
  >
    <span className="switch__knob" aria-hidden="true" />
    <span className="switch__labels" aria-hidden="true">
      <span className="switch__label switch__label--on">{onLabel}</span>
      <span className="switch__label switch__label--off">{offLabel}</span>
    </span>
  </button>
);

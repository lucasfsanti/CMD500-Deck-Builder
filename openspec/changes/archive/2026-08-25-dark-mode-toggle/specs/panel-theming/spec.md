## Purpose

Lets the user switch the full-tab view's appearance between a light theme and a dark theme, defaulting to their OS/browser preference and remembering whichever theme they pick by hand.

## ADDED Requirements

### Requirement: Theme toggle control
The full-tab view SHALL provide a control in the header that lets the user switch the panel's appearance between a light theme and a dark theme.

#### Scenario: User toggles from dark to light
- **WHEN** the user activates the toggle while the panel is showing the dark theme
- **THEN** the panel's appearance switches to the light theme immediately, without a page reload

#### Scenario: User toggles from light to dark
- **WHEN** the user activates the toggle while the panel is showing the light theme
- **THEN** the panel's appearance switches to the dark theme immediately, without a page reload

### Requirement: Default theme follows OS preference
When no manual theme preference has been stored yet, the full-tab view SHALL default to whichever theme matches the browser's `prefers-color-scheme` setting, falling back to the dark theme if that preference can't be determined.

#### Scenario: OS preference is light, no stored preference
- **WHEN** the panel opens for the first time, the browser reports a light `prefers-color-scheme`, and no theme preference has been stored before
- **THEN** the panel renders in the light theme

#### Scenario: OS preference is dark, no stored preference
- **WHEN** the panel opens for the first time, the browser reports a dark `prefers-color-scheme`, and no theme preference has been stored before
- **THEN** the panel renders in the dark theme

#### Scenario: OS preference unavailable, no stored preference
- **WHEN** the panel opens for the first time, the browser's `prefers-color-scheme` can't be determined, and no theme preference has been stored before
- **THEN** the panel renders in the dark theme

### Requirement: Manual theme choice persists and overrides OS preference
Once the user manually toggles the theme, that choice SHALL be persisted and SHALL take precedence over the OS preference on every subsequent open of the full-tab view, until the user toggles again.

#### Scenario: Persisted preference overrides OS default on reopen
- **WHEN** the user has manually selected the light theme, then closes and reopens the full-tab view while the browser's OS preference is dark
- **THEN** the panel opens in the light theme, not the OS-preferred dark theme

#### Scenario: Preference persists across separate tabs
- **WHEN** the user has previously set a manual theme preference, then opens the full-tab view for a different deck in a new tab
- **THEN** the new tab's panel also opens in the previously chosen theme

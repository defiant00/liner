# Liner

Want to customize your favorite languages without having to set up and tab through snippets? Liner lets you define regular expressions and replacement patterns that are automatically applied when you hit **Enter** in VS Code.

## Features

Liner lets you import as many pattern libraries as you like, and checks the current line against all imported patterns until it finds a match. If a match is found, the pattern defines how to manipulate the line, using both regex capture groups and custom Javascript. Patterns are defined per language, allowing for a standardized set of enhancements across languages.

Patterns can be single or multiline. A single line pattern will do the replacement and then move to the next line like a normal **Enter** press.
![Single Line Example](/images/singleline.gif)

A multiline pattern will place the cursor on the last line that only contains whitespace.
![Multiline Example](/images/multiline.gif)

## Usage

To trigger Liner:
* Hit **Enter** on a line.
  * If a match is found, Liner behaves the same regardless of where the cursor is.
  * If no match is found, normal text input occurs.
  * Standard VS Code multiple cursors and selections are supported.
* Select one or more lines and hit **Enter**.

Liner can be toggled through the `Toggle Liner` command, or by clicking on the status bar at the bottom.
![Status Bar Screenshot](/images/status_bar.png)

## Sample

The sample pattern library `defiant00/alpha-code` contains the following patterns for the Typescript language, meant to reduce the number of symbols you have to type:
Input | Output 
--- | ---
`for [var] in [start] to [finish]` | `for (let [var] = [start]; [var] < [finish]; var++) { }`
`if [condition]` | `if ([condition]) { }`
`[code] /` | `[code] { }`

As well, the following are replaced inline:
Input | Output
--- | ---
`and` | `&&`
`or` | `\|\|`
`eq` | `===`
`neq` | `!==`

## Extension Settings

This extension contributes the following settings:

* `liner.enabledByDefault` - Enable/disable whether Liner is active when first opening a file.
* `liner.patterns` - List of pattern libraries to load (comma or semicolon-delimited).

## Known Issues

Liner may conflict with other extensions that intercept individual **type** events.

## Release Notes

### 1.0.0

* Initial version

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
  * VS Code multiple cursors and selections are supported.
* Make a selection and hit **Enter**.

Liner can be toggled through the `Liner: Toggle` command, or by clicking on the status bar at the bottom.  
![Status Bar Screenshot](/images/status_bar.png)

## Commands

* `Liner: Toggle` - Toggle Liner for the current file.
* `Liner: Reload Patterns` - Reload all pattern libraries, useful when developing new patterns.
* `Liner: Set Pattern Library Location` - Display the pattern library location prompt.

## Sample Pattern Library

The sample pattern library `defiant00/alpha-code` contains the following patterns for the Javascript and Typescript languages, meant to reduce the number of symbols you have to type:
* `for [var] in [start] to [finish]` -> `for (let [var] = [start]; [var] < [finish]; var++) { }`
* `if [condition]` -> `if ([condition]) { }`
* `while [condition]` -> `while ([condition]) { }`
* `[code] /` -> `[code] { }`

As well, the following are replaced inline:
* `and` -> `&&`
* `or` -> `||`
* `eq` -> `===`
* `neq` -> `!==`

## Extension Settings

This extension contributes the following settings:

* `liner.enabledByDefault` - Enable/disable whether Liner is active when first opening a file.
* `liner.libraryLocation` - Pattern library location, or 'none' to only use the built-in libraries.
* `liner.patterns` - List of pattern libraries to load (comma or semicolon-delimited).

## Creating Pattern Libraries

### Example

This is a simple example that demonstrates a minimal pattern that turns `"g [name]"` into `"Hello [name]!"`.
```
exports.patterns = [
    {
        match: /^g (.*)$/,
        replacement: {
            plaintext: { value: (...m) => `Hello ${m[1]}!`, moveCursor: false }
        }
    }
];
```

### Syntax

A pattern library should export an array of patterns named `patterns` containing the following:
* `match` - the regex used to match the line.
* `replacement` - an object containing properties named for the supported language. For example, if you want a replacement behavior for Typescript and C#, your replacement object should have properties named `typescript` and `csharp`.
  * `_` can be used as a wildcard to match any name that is not explicitly defined.
  * Languages are objects with two properties:
    * `value` - A function that is used as the second argument for `string.replace` when processing the line with a regex.
    * `moveCursor` - Whether the cursor position should be moved after the text update.
      * `false` - the cursor will stay at the end of the input.
      * `true` - the cursor will be moved to the end of the last line in the output that only contains whitespace.

### Cursor Example

If you entered `"for x in 1 to 3"` using `defiant00/alpha-code`, the output would be (with `|` indicating the cursor):

**moveCursor false**
```
for (let x = 1; x < 3; x++) {

}
| <- (at the end)
```
**moveCursor true**
```
for (let x = 1; x < 3; x++) {
    | <- (moved up)
}
```
## Contributing

Bug fixes and new pattern libraries are both welcome, please send a pull request!

## Known Issues

Liner may conflict with other extensions that intercept individual **type** events.

## Release Notes

### 1.1.0

* Added `Liner: Reload Patterns` and `Liner: Set Pattern Library Location` commands

### 1.0.1

* Documentation cleanup and added images

### 1.0.0

* Initial version

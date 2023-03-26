# NOCTIS

NOCTIS is a small CSS toolkit intended for one purpose: creating Roll20 sheets.

Wrap your top level container in the "noctis" CSS class.

Grid system
-----------

Each row has a `row` class. You can create vertical columns with the `column` class. Add `locked` to prevent wrapping.

Each cell in the row or column has the `cell` class.

```
.row
  .cell
    p Content
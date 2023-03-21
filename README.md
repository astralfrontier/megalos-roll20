# MEGALOS Roll20

This is a toolkit for producing Roll20 character sheets using modern(ish) web development technologies.

- HTML is built from the [Pug](https://pugjs.org) templating language
- CSS is built from the [Sass](https://sass-lang.com) CSS superset
- Final CSS is minified via [PurgeCSS](https://purgecss.com), meaning you can use modern CSS frameworks

## Getting started

You can use this framework to create your own sheets. Just fork the repository and make your own changes.

Run `npm install` to install dependencies.

Edit `package.json` and set the following fields:

- `name` should be the short name of your game, e.g. `megalos`
- `author` should be in the form `Your Name <youremailaddress@domain.com>`
- `description` should be your Roll20 numeric ID

To build sheets, you'll want to run `npm start`. Your files will be placed in a directory called `dist`.

## Building Roll20 character sheets

Roll20's documentation for sheets starts here: https://wiki.roll20.net/Building_Character_Sheets

There are four files that will be used to build your sheet. All of them are found in the `src` directory:

- `sheet.pug` is the master Pug file for the HTML of your sheet. It can include other files via Pug include syntax.
- `sheet.sass` is the master SASS file.
- `sheet.md` is a Markdown file containing instructions for using your sheet.
- `variables.json` is a JSON file where you can store variables that are used by Pug.

You can use `npm` to install third party SASS/SCSS packages and include them in `sheet.sass`.

## Using sheets

If you push a tag starting with "v", e.g. "v1.0.0" to Github, a Github Action will create a release.
It will publish the `sheet.json`, the HTML file, and the CSS file, as part of that release.

You can copy the HTML and CSS into a game if you have a Pro account.

You can publish your sheets to Roll20's official library via Git: https://cybersphere.me/publishing-sheets-to-github/
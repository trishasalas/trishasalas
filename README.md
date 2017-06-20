# Trisha Salas WordPress Theme

### You have 3 gulp commands that you can use:
1. `gulp serve` - will run all of the gulp tasks, watch your files, and start a node server that does auto refreshing and CSS injection
2. `gulp watch` - everything in `gulp serve` except running the node server
3. `gulp` - a one-time command that will run your Sass, JS and image tasks

**CSS/Sass Tasks** – gulp will compile a compressed CSS and sourcemap file for you.

**JavaScript Tasks** - gulp will concatenate all of the JavaScript files located in `./assets/js` into a new file named `app.js`.

This project is based off of Automattic's `_s` project, based on the distribution zip
generated off of commit [`f6ddaaa21ef562fe85881f7e3cc5bdd1e592bb0e`](https://github.com/Automattic/_s/tree/f6ddaaa21ef562fe85881f7e3cc5bdd1e592bb0e).

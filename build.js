const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');
let css = fs.readFileSync('public/css/style.css', 'utf8');
let js = fs.readFileSync('public/js/game.js', 'utf8');

html = html.replace('<link rel="stylesheet" href="css/style.css">', `<style>\n${css}\n</style>`);
html = html.replace('<script src="js/game.js"></script>', ""); 
// The index.html has a hotbar at the bottom. We want the game script below all HTML actually.
// Wait, index.html has `<script src="js/game.js"></script>` before the hotbar style.
// Let's replace the closing </body> tag instead?
// Actually replace the script tag with the script block:
html = html.replace('<script src="js/game.js"></script>', `<script>\n${js}\n</script>`);

fs.writeFileSync('FortniteLite_Standalone.html', html);
console.log('Successfully compiled public/ files into FortniteLite_Standalone.html!');

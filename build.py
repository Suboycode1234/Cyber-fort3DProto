import os

html = open('public/index.html', 'r', encoding='utf-8').read()
css = open('public/css/style.css', 'r', encoding='utf-8').read()
js = open('public/js/game.js', 'r', encoding='utf-8').read()

html = html.replace('<link rel="stylesheet" href="css/style.css">', f'<style>\n{css}\n</style>')
html = html.replace('<script src="js/game.js"></script>', f'<script>\n{js}\n</script>')

open('FortniteLite_Standalone.html', 'w', encoding='utf-8').write(html)
print('Successfully compiled public/ files into FortniteLite_Standalone.html!')
